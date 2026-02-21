import {
  AutoSubscribe,
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
    console.log('Job received — connecting to room...');
    await ctx.connect(undefined, AutoSubscribe.AUDIO_ONLY);
    console.log('Connected. Waiting for participant...');
    await ctx.waitForParticipant();
    console.log('Participant joined. Starting session...');

    const vad = ctx.proc.userData.vad as silero.VAD;

    // Read difficulty from dispatch metadata
    let difficulty: Difficulty = 'medium';
    try {
      const meta = ctx.job.metadata ? JSON.parse(ctx.job.metadata) as { difficulty?: string } : {};
      if (meta.difficulty === 'easy' || meta.difficulty === 'hard') {
        difficulty = meta.difficulty;
      }
    } catch { /* keep default */ }
    console.log(`Difficulty: ${difficulty}`);

    const session = new voice.AgentSession({
      vad,
      stt: new inference.STT({ model: 'deepgram/nova-3', language: 'multi' }),
      llm: new inference.LLM({ model: 'openai/gpt-4.1-mini' }),
      // ElevenLabs Alice — British female voice with classical gravitas
      tts: new inference.TTS({
        model: 'elevenlabs/eleven_turbo_v2_5',
        voice: 'Xb7hH8MSUJpSbSDYk0k2',
      }),
    });

    await session.start({
      agent: createQuizAgent(difficulty),
      room: ctx.room,
    });

    console.log('Session started. Generating greeting...');
    session.generateReply({
      instructions:
        'You are Athena. Greet the mortal dramatically as the goddess of wisdom. Tell them which difficulty they have chosen and that 10 questions await. Then ask Question 1 immediately.',
    });
  },
});

cli.runApp(new WorkerOptions({ agent: fileURLToPath(import.meta.url), agentName: 'athena-quiz' }));
