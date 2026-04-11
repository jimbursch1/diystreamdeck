/**
 * preview.js — minimal layout preview server
 *
 * Serves public/ and buttons.json with zero auth and no keyboard control.
 * Use this to inspect your button layout without running the full server.
 *
 *   node preview.js
 *   → http://localhost:3000?edit
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT   = process.env.DIYSTREAMDECK_PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
};

http.createServer((req, res) => {
  const urlPath = new URL(req.url, `http://localhost`).pathname;

  // buttons.json lives one level up from public/
  if (urlPath === '/buttons.json') {
    fs.readFile(path.join(__dirname, 'buttons.json'), (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    });
    return;
  }

  // Serve static files from public/
  const filePath = path.join(PUBLIC, urlPath === '/' ? 'index.html' : urlPath);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`\nDIY Stream Deck — layout preview`);
  console.log(`  http://localhost:${PORT}?edit\n`);
});
