'use strict';

const http = require('node:http');
const { parse } = require('node:url');
const { AccessToken } = require('livekit-server-sdk');

require('dotenv').config({ path: '../.env' });        // base config
require('dotenv').config({ path: '../.env.local' }); // overrides base (gitignored)

const PORT = 3001;
const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL } = process.env;

if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
  console.error(
    'Error: LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_URL must be set in ../.env.local'
  );
  process.exit(1);
}

const server = http.createServer(async (req, res) => {
  // Allow requests from the React dev server
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const { pathname, query } = parse(req.url || '/', true);

  if (pathname !== '/token') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Not found' }));
  }

  const room = String(query.room || 'greek-quiz-room');
  const identity = String(query.identity || `user-${Date.now()}`);

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity,
    ttl: '1h',
  });

  at.addGrant({
    roomJoin: true,
    room,
    canPublish: true,
    canSubscribe: true,
  });

  const token = await at.toJwt();

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ token, url: LIVEKIT_URL }));
});

server.listen(PORT, () => {
  console.log(`Token server running on http://localhost:${PORT}`);
  console.log(`Project URL: ${LIVEKIT_URL}`);
});
