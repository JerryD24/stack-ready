/**
 * Local dev server for Interview Prep Hub (Node.js)
 * Usage: node server.js [port]
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.argv[2], 10) || 8080;
const WEBSITE_DIR = __dirname;
const PREP_DIR = path.dirname(WEBSITE_DIR);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function send(res, status, body, type) {
  res.writeHead(status, {
    'Content-Type': type || 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  res.end(body);
}

function tryPrepFile(urlPath) {
  const name = path.basename(urlPath);
  if (!name || name.startsWith('.')) return null;
  const ext = path.extname(name).toLowerCase();
  if (!['.md', '.txt'].includes(ext)) return null;

  const contentFile = path.join(WEBSITE_DIR, 'content', name);
  if (fs.existsSync(contentFile)) return contentFile;

  const prepFile = path.join(PREP_DIR, name);
  if (fs.existsSync(prepFile)) return prepFile;

  return null;
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0].split('#')[0]);

  // Support GitHub Pages base path locally (e.g. /stack-ready/content/...)
  const basePrefixes = ['/stack-ready', '/StackReady'];
  for (const prefix of basePrefixes) {
    if (urlPath.startsWith(prefix + '/')) {
      urlPath = urlPath.slice(prefix.length);
      break;
    }
  }

  const prepFile = tryPrepFile(urlPath);
  if (prepFile) {
    return fs.readFile(prepFile, (err, data) => {
      if (err) return send(res, 404, 'Not found');
      send(res, 200, data, MIME[path.extname(prepFile)] || 'text/plain; charset=utf-8');
    });
  }

  // Also serve /content/filename directly
  if (urlPath.startsWith('/content/')) {
    const name = path.basename(urlPath);
    const contentFile = path.join(WEBSITE_DIR, 'content', name);
    if (fs.existsSync(contentFile)) {
      return fs.readFile(contentFile, (err, data) => {
        if (err) return send(res, 404, 'Not found');
        send(res, 200, data, MIME[path.extname(contentFile)] || 'text/plain; charset=utf-8');
      });
    }
  }

  let filePath = path.join(WEBSITE_DIR, urlPath === '/' ? 'index.html' : urlPath);
  if (!filePath.startsWith(WEBSITE_DIR)) return send(res, 403, 'Forbidden');

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) filePath = path.join(filePath, 'index.html');
    fs.readFile(filePath, (err2, data) => {
      if (err2) return send(res, 404, 'Not found: ' + urlPath);
      const ext = path.extname(filePath).toLowerCase();
      send(res, 200, data, MIME[ext] || 'application/octet-stream');
    });
  });
});

server.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('  StackReady — Local Server (Node.js)');
  console.log('='.repeat(60));
  console.log(`  Website:  http://localhost:${PORT}`);
  console.log(`  Prep dir: ${PREP_DIR}`);
  console.log('  Press Ctrl+C to stop');
  console.log('='.repeat(60));
});
