const express = require('express');
const { keyboard, Key } = require('@nut-tree-fork/nut-js');
keyboard.config.autoDelayMs = 50;
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const app = express();
const PORT = process.env.DIYSTREAMDECK_PORT || 3000;

// --- Auth token ---
// Set DIYSTREAMDECK_TOKEN env var to require a token on all requests.
// If not set, a random token is generated and printed at startup (copy it into your tablet URL).
const AUTH_TOKEN = process.env.DIYSTREAMDECK_TOKEN || crypto.randomBytes(16).toString('hex');

// --- Command allowlist for /text ---
// Only these exact commands are permitted through the text endpoint.
const ALLOWED_COMMANDS = new Set([
  'tf thintraffic',
  'tf slowtraffic',
  'tf stoptraffic',
  'tf clearvehicles',
  'dv',
  'bow',
  'eow',
]);

// F-key map
const F_KEY_MAP = {
  f13: Key.F13, f14: Key.F14, f15: Key.F15, f16: Key.F16,
  f17: Key.F17, f18: Key.F18, f19: Key.F19, f20: Key.F20,
  f21: Key.F21, f22: Key.F22, f23: Key.F23, f24: Key.F24,
  f1:  Key.F1,  f2:  Key.F2,  f3:  Key.F3,  f4:  Key.F4,
  f5:  Key.F5,  f6:  Key.F6,  f7:  Key.F7,  f8:  Key.F8,
  f9:  Key.F9,  f10: Key.F10, f11: Key.F11, f12: Key.F12,
};

app.use(express.json());

// --- Auth middleware ---
function requireToken(req, res, next) {
  // Allow token via query param (?token=...) or Authorization header (Bearer ...)
  const queryToken = req.query.token;
  const headerToken = (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
  const provided = queryToken || headerToken;

  if (!provided || provided !== AUTH_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Static files (tablet UI) — no auth needed for the page itself
app.use(express.static(path.join(__dirname, 'public')));

// Serve buttons config — no auth needed (not sensitive)
app.get('/buttons.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'buttons.json'));
});

// POST /key — send a single F-key press (auth required)
app.post('/key', requireToken, async (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: 'key required' });

  const nutKey = F_KEY_MAP[key.toLowerCase()];
  if (!nutKey) return res.status(400).json({ error: `Unknown key: ${key}` });

  try {
    await keyboard.pressKey(nutKey);
    await keyboard.releaseKey(nutKey);
    console.log(`[key] ${key}`);
    res.json({ ok: true });
  } catch (err) {
    console.error('Key error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /text — type a Marlin-CLI command (auth + allowlist required)
app.post('/text', requireToken, async (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: 'command required' });

  if (!ALLOWED_COMMANDS.has(command)) {
    console.warn(`[text] Blocked disallowed command: ${command}`);
    return res.status(403).json({ error: `Command not allowed: ${command}` });
  }

  try {
    await keyboard.pressKey(Key.F5);
    await keyboard.releaseKey(Key.F5);
    await new Promise(r => setTimeout(r, 200));
    await keyboard.type(command);
    await new Promise(r => setTimeout(r, 200));
    await keyboard.pressKey(Key.Return);
    await keyboard.releaseKey(Key.Return);
    console.log(`[text] ${command}`);
    res.json({ ok: true });
  } catch (err) {
    console.error('Text error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const config of iface) {
      if (config.family === 'IPv4' && !config.internal) {
        return config.address;
      }
    }
  }
  return 'localhost';
}

app.listen(PORT, () => {
  const ip = getLocalIP();
  console.log(`DIY Stream Deck running.`);
  console.log(`Open on tablet: http://${ip}:${PORT}?token=${AUTH_TOKEN}`);
  console.log(`Local:          http://localhost:${PORT}?token=${AUTH_TOKEN}`);
  if (!process.env.DIYSTREAMDECK_TOKEN) {
    console.log(`\n⚠  Token auto-generated (set DIYSTREAMDECK_TOKEN env var to make it permanent)`);
  }
});
