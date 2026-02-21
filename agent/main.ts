import {
  type JobContext,
  type JobProcess,
  WorkerOptions,
  cli,
  defineAgent,
  inference,
  voice,
} from '@livekit/agents';
import * as silero from '@livekit/agents-plugin-silero';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { type Difficulty, createQuizAgent } from './agent.js';

dotenv.config({ path: '../.env' });
dotenv.config({ path: '../.env.local' });

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

    const session = new voice.AgentSession({
      vad,
      stt: new inference.STT({ model: 'deepgram/nova-3', language: 'en' }),
      llm: new inference.LLM({ model: 'openai/gpt-4.1-mini' }),
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

    try {
      console.log('Starting session...');
      await session.start({
        agent: createQuizAgent(difficulty),
        room: ctx.room,
      });

      console.log('Session started. Connecting...');
      await ctx.connect();
      console.log(`Connected. Remote participants: ${ctx.room.remoteParticipants.size}`);

      console.log('Generating greeting...');
      const handle = session.generateReply({
        instructions:
          'You are Athena, goddess of wisdom. Greet the mortal dramatically and welcome them to this trial of ancient knowledge. Tell them their chosen difficulty and that 10 questions of wisdom await. Bid them press the "Begin the Trial" button when they are ready to start. Do NOT ask any questions yet — wait for them to signal they are ready.',
        allowInterruptions: false,
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
