#!/usr/bin/env node
// Zero-dependency static server for the demo site. Plain Node, nothing to install.
// Serves the whole harness/ directory so /site/index.html can reach /tokens/tokens.css.
// usage: node scripts/serve.js [port]

const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.argv[2]) || 4173;
const root = path.join(__dirname, '..');

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json' };

http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/site/index.html';
  const filePath = path.join(root, reqPath);

  if (!filePath.startsWith(root)) { res.writeHead(403); res.end('forbidden'); return; }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found: ' + reqPath); return; }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, () => {
  console.log(`Serving ${root} at http://localhost:${port}/site/index.html`);
});
