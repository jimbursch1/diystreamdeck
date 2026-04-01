const express = require('express');
const { keyboard, Key } = require('@nut-tree-fork/nut-js');
const crypto = require('crypto');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.DIYSTREAMDECK_PORT || 3000;
const TOKEN = process.env.DIYSTREAMDECK_TOKEN || crypto.randomBytes(16).toString('hex');

// F13-F24 key mapping for nut-js
const F_KEY_MAP = {
  f13: Key.F13, f14: Key.F14, f15: Key.F15, f16: Key.F16,
  f17: Key.F17, f18: Key.F18, f19: Key.F19, f20: Key.F20,
  f21: Key.F21, f22: Key.F22, f23: Key.F23, f24: Key.F24,
  f1:  Key.F1,  f2:  Key.F2,  f3:  Key.F3,  f4:  Key.F4,
  f5:  Key.F5,  f6:  Key.F6,  f7:  Key.F7,  f8:  Key.F8,
  f9:  Key.F9,  f10: Key.F10, f11: Key.F11, f12: Key.F12,
};

// Allowlist of Marlin-CLI commands permitted via /text
const COMMAND_ALLOWLIST = new Set([
  'tf thintraffic',
  'tf slowtraffic',
  'tf stoptraffic',
  'tf clearvehicles',
  'dv',
  'bow',
  'eow',
  'emote crossarms',
  'emote surrender',
  'emote laydown',
  'emote sit',
  'emote lean',
  'emote coffee',
  'emote notepad',
  'emote text',
  'emote wave',
  'emote point',
  'emote dance',
  'emote salute',
  'emote celebrate',
  'emote facepalm',
  'emote stop',
]);

app.use(express.json());

// Auth middleware — checks ?token= or Authorization: Bearer
function requireToken(req, res, next) {
  const query = req.query.token;
  const header = req.headers['authorization'];
  const bearer = header && header.startsWith('Bearer ') ? header.slice(7) : null;
  if (query === TOKEN || bearer === TOKEN) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// Static files served without auth (HTML/CSS/JS are not sensitive)
app.use(express.static(path.join(__dirname, 'public')));

// Serve buttons config — no auth needed
app.get('/buttons.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'buttons.json'));
});

// POST /key — send a single keypress (e.g. f13)
app.post('/key', requireToken, async (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: 'key required' });

  const nutKey = F_KEY_MAP[key.toLowerCase()];
  if (!nutKey) return res.status(400).json({ error: `Unknown key: ${key}` });

  console.log(`[key] ${key}`);
  try {
    await keyboard.pressKey(nutKey);
    await keyboard.releaseKey(nutKey);
    res.json({ ok: true });
  } catch (err) {
    console.error(`[key] error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// POST /text — open Marlin-CLI (F5), type command, press Enter
app.post('/text', requireToken, async (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: 'command required' });

  if (!COMMAND_ALLOWLIST.has(command.trim().toLowerCase())) {
    console.warn(`[text] blocked: ${command}`);
    return res.status(403).json({ error: `Command not allowed: ${command}` });
  }

  console.log(`[text] ${command}`);
  try {
    await keyboard.pressKey(Key.F5);
    await keyboard.releaseKey(Key.F5);
    await new Promise(r => setTimeout(r, 200));

    await keyboard.type(command);
    await new Promise(r => setTimeout(r, 200));

    await keyboard.pressKey(Key.Return);
    await keyboard.releaseKey(Key.Return);

    res.json({ ok: true });
  } catch (err) {
    console.error(`[text] error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Print local IP so user knows what to open on tablet
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
  console.log(`Open on tablet: http://${ip}:${PORT}?token=${TOKEN}`);
  console.log(`Local:          http://localhost:${PORT}?token=${TOKEN}`);
});
