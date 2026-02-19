import {
  type JobContext,
  type JobProcess,
  ServerOptions,
  cli,
  defineAgent,
  voice,
} from '@livekit/agents';
import * as livekit from '@livekit/agents-plugin-livekit';
import * as silero from '@livekit/agents-plugin-silero';
import { BackgroundVoiceCancellation } from '@livekit/noise-cancellation-node';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createQuizAgent } from './agent.js';

// Load API keys — .env.local overrides .env (both checked)
dotenv.config({ path: '../.env' });
dotenv.config({ path: '../.env.local' });

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    // Pre-load the VAD model so it's ready when a user joins
    proc.userData.vad = await silero.VAD.load();
  },

  entry: async (ctx: JobContext) => {
    const vad = ctx.proc.userData.vad as silero.VAD;

    const session = new voice.AgentSession({
      vad,
      stt: 'deepgram/nova-3:multi',
      llm: 'openai/gpt-4.1-mini',
      tts: 'cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc',
      turnDetection: new livekit.turnDetector.MultilingualModel(),
    });

    await session.start({
      agent: createQuizAgent(),
      room: ctx.room,
      inputOptions: {
        noiseCancellation: BackgroundVoiceCancellation(),
      },
    });

    await ctx.connect();

    // Kick off the greeting + first question
    session.generateReply({
      instructions:
        'Greet the user warmly, explain there are 5 Greek history questions, then ask Question 1 immediately.',
    });
  },
});

cli.runApp(new ServerOptions({ agent: fileURLToPath(import.meta.url) }));
