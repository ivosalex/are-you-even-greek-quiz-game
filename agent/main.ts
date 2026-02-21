import {
  type JobContext,
  type JobProcess,
  type APIConnectOptions,
  WorkerOptions,
  cli,
  defineAgent,
  inference,
  llm,
  voice,
} from '@livekit/agents';
import * as silero from '@livekit/agents-plugin-silero';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { type Difficulty, createQuizAgent } from './agent.js';

dotenv.config({ path: '../.env' });
dotenv.config({ path: '../.env.local' });

// ── Capturing LLM wrapper ─────────────────────────────────────────────────────
// Fires onDone(text) as soon as the LLM *finishes generating* (~1s after the
// request starts), well before TTS playout completes (~15-30s). This lets the
// frontend show the full Athena text the moment the user presses Skip.

class CapturingStream extends llm.LLMStream {
  private innerStream: llm.LLMStream;
  private onDone: (text: string) => void;

  constructor(
    capturingLLM: llm.LLM,
    innerStream: llm.LLMStream,
    onDone: (text: string) => void,
    opts: { chatCtx: llm.ChatContext; toolCtx?: llm.ToolContext; connOptions: APIConnectOptions },
  ) {
    super(capturingLLM, opts);
    this.innerStream = innerStream;
    this.onDone = onDone;
  }

  protected async run(): Promise<void> {
    let text = '';
    for await (const chunk of this.innerStream) {
      if (this.abortController.signal.aborted) break;
      const content = chunk.delta?.content;
      if (typeof content === 'string') text += content;
      this.queue.put(chunk);
    }
    this.onDone(text);
  }
}

class CapturingLLM extends llm.LLM {
  private inner: inference.LLM;
  private onTextComplete: (text: string) => void;

  constructor(inner: inference.LLM, onTextComplete: (text: string) => void) {
    super();
    this.inner = inner;
    this.onTextComplete = onTextComplete;
  }

  label(): string { return this.inner.label(); }
  get model(): string { return this.inner.model; }

  chat(opts: {
    chatCtx: llm.ChatContext;
    toolCtx?: llm.ToolContext;
    connOptions?: APIConnectOptions;
    parallelToolCalls?: boolean;
    toolChoice?: llm.ToolChoice;
    extraKwargs?: Record<string, unknown>;
  }): llm.LLMStream {
    const innerStream = this.inner.chat(opts);
    const connOptions: APIConnectOptions = opts.connOptions ?? {
      maxRetry: 0,
      retryIntervalMs: 2000,
      timeoutMs: 10000,
    };
    return new CapturingStream(this, innerStream, this.onTextComplete, {
      chatCtx: opts.chatCtx,
      toolCtx: opts.toolCtx,
      connOptions,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    console.log('Prewarming: loading Silero VAD...');
    proc.userData.vad = await silero.VAD.load();
    console.log('Prewarm complete.');
  },

  entry: async (ctx: JobContext) => {
    // ctx.job.room.name is populated from the job dispatch before ctx.connect()
    const roomName = ctx.job.room?.name ?? ctx.room.name ?? '';
    console.log(`\n=== JOB RECEIVED === room: ${roomName}`);

    const vad = ctx.proc.userData.vad as silero.VAD;

    // Room name format: greek-quiz-{difficulty}-{identity}
    // e.g. "greek-quiz-easy-mortal-1708521234" → parts[2] = "easy"
    let difficulty: Difficulty = 'medium';
    const d = roomName.split('-')[2];
    if (d === 'easy' || d === 'medium' || d === 'hard') difficulty = d as Difficulty;
    console.log(`Difficulty: ${difficulty}`);

    // Wrap the LLM so we can publish the full text the moment generation completes,
    // long before TTS finishes playing. Frontend stores it in fullTextRef and shows
    // it immediately if the user presses Skip.
    const capturingLLM = new CapturingLLM(
      new inference.LLM({ model: 'openai/gpt-4.1-mini' }),
      (text) => {
        const cleaned = text.replace(/\[Q:\d+:\d+\]/g, '').trim();
        if (!cleaned) return;
        console.log(`LLM done — publishing ${cleaned.length} chars via athena_full`);
        const data = new TextEncoder().encode(cleaned);
        ctx.room.localParticipant?.publishData(data, { topic: 'athena_full', reliable: true })
          .catch(() => {});
      },
    );

    const session = new voice.AgentSession({
      vad,
      stt: new inference.STT({ model: 'deepgram/nova-3', language: 'en' }),
      llm: capturingLLM,
      tts: new inference.TTS({
        model: 'elevenlabs/eleven_turbo_v2_5',
        voice: 'Xb7hH8MSUJpSbSDYk0k2',
      }),
    });

    // Log all errors so nothing is silently swallowed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = session as any;
    s.on('error', (ev: any) => console.error('SESSION ERROR:', ev));
    s.on('close', (ev: any) => console.log(`SESSION CLOSED. reason=${ev?.reason}`));
    s.on('agent_state_changed', (ev: any) => console.log(`Agent state: ${ev?.oldState} → ${ev?.newState}`));

    // Backup publish after TTS completes — in case the early publish was missed.
    // skippedRef will be false by this point, so frontend only uses fullTextRef.
    s.on('conversation_item_added', (ev: any) => {
      const item = ev?.item;
      if (!item || item?.role !== 'assistant') return;
      const text: string = item?.textContent ?? '';
      if (!text) return;
      const cleaned = text.replace(/\[Q:\d+:\d+\]/g, '').trim();
      if (!cleaned) return;
      const data = new TextEncoder().encode(cleaned);
      ctx.room.localParticipant?.publishData(data, { topic: 'athena_full', reliable: true })
        .catch(() => {});
    });

    try {
      console.log('Starting session...');
      await session.start({
        agent: createQuizAgent(difficulty, (current, total, isGameOver) => {
          const payload = JSON.stringify({ current, total, isGameOver });
          const data = new TextEncoder().encode(payload);
          ctx.room.localParticipant?.publishData(data, { topic: 'athena_score', reliable: true })
            .catch(() => {});
        }),
        room: ctx.room,
      });

      console.log('Session started. Connecting...');
      await ctx.connect();
      console.log(`Connected. Remote participants: ${ctx.room.remoteParticipants.size}`);

      console.log('Generating greeting...');
      const handle = session.generateReply({
        instructions:
          'You are Athena, goddess of wisdom. Greet the mortal dramatically and welcome them to this trial of ancient knowledge. Tell them their chosen difficulty and that 10 questions of wisdom await. Bid them press the "Begin the Trial" button when they are ready to start. Do NOT ask any questions yet — wait for them to signal they are ready.',
      });

      handle
        .waitForPlayout()
        .then(() => console.log('Greeting playout complete.'))
        .catch((err: any) => console.error('Greeting playout error:', err));

    } catch (err) {
      console.error('Agent entry fatal error:', err);
    }
  },
});

// No agentName = auto-dispatch to any room (simpler and reliable)
cli.runApp(new WorkerOptions({ agent: fileURLToPath(import.meta.url) }));
