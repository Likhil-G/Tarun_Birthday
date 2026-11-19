/**
 * THE TARUN TIMES — LOCAL DEVELOPMENT SERVER
 * 
 * Supports local testing of:
 * - Vercel Serverless Function: POST /api/submit (delegated to api/submit.js)
 * - Static file serving with proper MIME types
 * - Prevents the Python 501 Unsupported method ('POST') error
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const submitHandler = require('./api/submit.js');

const PORT = process.env.PORT || 8080;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // 1. Delegate /api/submit to Vercel Serverless Function handler
  if (pathname === '/api/submit') {
    // Add Vercel helper methods to res
    res.status = function(code) {
      this.statusCode = code;
      return this;
    };
    res.json = function(data) {
      this.writeHead(this.statusCode || 200, { 'Content-Type': 'application/json; charset=utf-8' });
      this.end(JSON.stringify(data));
      return this;
    };

    req.body = await parseBody(req);
    return submitHandler(req, res);
  }

  // 2. Health check endpoint
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({
      ok: true,
      service: 'The Tarun Times Local Dev Server',
      database: 'Supabase PostgreSQL via Vercel Functions',
      supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
    }));
  }

  // 3. Static File Serving
  if (req.method === 'GET' || req.method === 'HEAD') {
    let relativePath = pathname === '/' ? 'index.html' : pathname.slice(1);
    let filePath = path.join(__dirname, relativePath);

    // If file not in root, try tarun-birthday-website/
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, 'tarun-birthday-website', relativePath);
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('File Not Found');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stats.size,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
      });

      if (req.method === 'HEAD') {
        return res.end();
      }

      fs.createReadStream(filePath).pipe(res);
    });
    return;
  }

  res.writeHead(405, { 'Content-Type': 'text/plain' });
  res.end('Method Not Allowed');
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` The Tarun Times server is live on http://localhost:${PORT}`);
  console.log(` API Endpoint: POST http://localhost:${PORT}/api/submit`);
  console.log(` Supabase URL: ${process.env.SUPABASE_URL ? 'Configured' : 'Needs configuration in .env'}`);
  console.log(`=======================================================`);
});

module.exports = server;
