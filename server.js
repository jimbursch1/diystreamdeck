const express = require('express');
const { keyboard, Key, clipboard } = require('@nut-tree-fork/nut-js');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.DIYSTREAMDECK_PORT || 3000;

// Persistent token — stored in config.json next to server.js
// Priority: env var > config.json > generate new and save
const CONFIG_PATH = path.join(__dirname, 'config.json');

function loadOrCreateToken() {
  if (process.env.DIYSTREAMDECK_TOKEN) return process.env.DIYSTREAMDECK_TOKEN;
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      if (cfg.token) return cfg.token;
    } catch {}
  }
  const token = crypto.randomBytes(16).toString('hex');
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({ token }, null, 2));
  console.log(`⚡ New token generated and saved to config.json`);
  return token;
}

const TOKEN = loadOrCreateToken();

const sleep = ms => new Promise(r => setTimeout(r, ms));

// F13-F24 key mapping for nut-js
const F_KEY_MAP = {
  f13: Key.F13, f14: Key.F14, f15: Key.F15, f16: Key.F16,
  f17: Key.F17, f18: Key.F18, f19: Key.F19, f20: Key.F20,
  f21: Key.F21, f22: Key.F22, f23: Key.F23, f24: Key.F24,
  f1:  Key.F1,  f2:  Key.F2,  f3:  Key.F3,  f4:  Key.F4,
  f5:  Key.F5,  f6:  Key.F6,  f7:  Key.F7,  f8:  Key.F8,
  f9:  Key.F9,  f10: Key.F10, f11: Key.F11, f12: Key.F12,
};

// Allowlists derived from buttons.json — single source of truth.
// text/chat commands are lowercased; console commands preserve case (RPH is case-sensitive).
const BUTTONS_PATH = path.join(__dirname, 'buttons.json');
const _buttons = JSON.parse(fs.readFileSync(BUTTONS_PATH)).flatMap(p => p.buttons);
const COMMAND_ALLOWLIST = new Set(_buttons.filter(b => b.method === 'text' || b.method === 'paste').map(b => b.command.trim().toLowerCase()));
const CHAT_ALLOWLIST    = new Set(_buttons.filter(b => b.method === 'chat')   .map(b => b.command.trim().toLowerCase()));
const CONSOLE_ALLOWLIST = new Set(_buttons.filter(b => b.method === 'console').map(b => b.command.trim()));

// Type or paste a string depending on method ('type' | 'paste')
async function inputText(text, method) {
  if (method === 'paste') {
    await clipboard.setContent(text);
    await keyboard.pressKey(Key.LeftControl, Key.V);
    await keyboard.releaseKey(Key.LeftControl, Key.V);
  } else {
    await keyboard.type(text);
  }
}

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

// POST /text — open Marlin-CLI (F5), type/paste command, press Enter
// Optional body field: method: "paste" uses clipboard+Ctrl+V instead of keystroke-by-keystroke
app.post('/text', requireToken, async (req, res) => {
  const { command, method = 'type' } = req.body;
  if (!command) return res.status(400).json({ error: 'command required' });

  if (!COMMAND_ALLOWLIST.has(command.trim().toLowerCase())) {
    console.warn(`[text] blocked: ${command}`);
    return res.status(403).json({ error: `Command not allowed: ${command}` });
  }

  console.log(`[text] ${command} (method: ${method})`);
  try {
    await keyboard.pressKey(Key.F5);
    await keyboard.releaseKey(Key.F5);
    await sleep(200);

    await inputText(command, method);
    await sleep(200);

    await keyboard.pressKey(Key.Return);
    await keyboard.releaseKey(Key.Return);

    res.json({ ok: true });
  } catch (err) {
    console.error(`[text] error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// POST /chat — open in-game chat (T), type/paste command, press Enter
// Optional body field: method: "paste" uses clipboard+Ctrl+V instead of keystroke-by-keystroke
app.post('/chat', requireToken, async (req, res) => {
  const { command, method = 'type' } = req.body;
  if (!command) return res.status(400).json({ error: 'command required' });

  if (!CHAT_ALLOWLIST.has(command.trim().toLowerCase())) {
    console.warn(`[chat] blocked: ${command}`);
    return res.status(403).json({ error: `Command not allowed: ${command}` });
  }

  console.log(`[chat] ${command} (method: ${method})`);
  try {
    await keyboard.pressKey(Key.T);
    await keyboard.releaseKey(Key.T);
    await sleep(200);

    await inputText(command, method);
    await sleep(200);

    await keyboard.pressKey(Key.Return);
    await keyboard.releaseKey(Key.Return);

    res.json({ ok: true });
  } catch (err) {
    console.error(`[chat] error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// POST /console — open RPH console (F4), type/paste command, press Enter, close (F4)
// Optional body field: method: "paste" uses clipboard+Ctrl+V instead of keystroke-by-keystroke
app.post('/console', requireToken, async (req, res) => {
  const { command, method = 'type' } = req.body;
  if (!command) return res.status(400).json({ error: 'command required' });

  if (!CONSOLE_ALLOWLIST.has(command.trim())) {
    console.warn(`[console] blocked: ${command}`);
    return res.status(403).json({ error: `Command not allowed: ${command}` });
  }

  console.log(`[console] ${command} (method: ${method})`);
  try {
    await keyboard.pressKey(Key.F4);
    await keyboard.releaseKey(Key.F4);
    await sleep(200);

    await inputText(command, method);
    await sleep(200);

    await keyboard.pressKey(Key.Return);
    await keyboard.releaseKey(Key.Return);
    await sleep(200);

    await keyboard.pressKey(Key.F4);
    await keyboard.releaseKey(Key.F4);

    res.json({ ok: true });
  } catch (err) {
    console.error(`[console] error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Print local IP so user knows what to open on tablet.
// Prefers Tailscale IP (100.x.x.x) if present — stable across DHCP changes.
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  let fallback = null;
  for (const iface of Object.values(interfaces)) {
    for (const config of iface) {
      if (config.family !== 'IPv4' || config.internal) continue;
      // Tailscale range: 100.64.0.0/10
      if (config.address.startsWith('100.')) return config.address;
      if (!fallback) fallback = config.address;
    }
  }
  return fallback || 'localhost';
}

const server = app.listen(PORT, () => {
  const ip = getLocalIP();
  const host = os.hostname();
  const tabletUrl = `http://${ip}:${PORT}?token=${TOKEN}`;
  console.log(`DIY Stream Deck running.`);
  console.log(`Open on tablet (hostname): http://${host}:${PORT}?token=${TOKEN}`);
  console.log(`Open on tablet (IP):       ${tabletUrl}`);
  console.log(`Local:                     http://localhost:${PORT}?token=${TOKEN}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Is another instance already running?`);
    console.error(`Kill it with: taskkill /F /FI "PID ne 0" /FI "IMAGENAME eq node.exe"`);
    process.exit(1);
  } else {
    throw err;
  }
});
