'use strict';

const { AccessToken, AgentDispatchClient } = require('livekit-server-sdk');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL } = process.env;
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
    res.status(500).json({ error: 'Missing LiveKit environment variables' });
    return;
  }

  const identity = String(req.query.identity || `user-${Date.now()}`);
  const difficulty = ['easy', 'medium', 'hard'].includes(req.query.difficulty)
    ? req.query.difficulty
    : 'medium';
  const room = `quiz-${Date.now()}`;

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity,
    ttl: '1h',
  });
  at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true });
  const token = await at.toJwt();

  try {
    const agentDispatch = new AgentDispatchClient(
      LIVEKIT_URL,
      LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET,
    );
    await agentDispatch.createDispatch(room, 'athena-quiz', {
      metadata: JSON.stringify({ difficulty }),
    });
  } catch (err) {
    console.error('Agent dispatch failed:', err.message);
  }

  res.status(200).json({ token, url: LIVEKIT_URL });
};
