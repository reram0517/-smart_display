const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const host = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT) || 3000;
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

function proxyJwa(request, response) {
  const targetPath = new URL(request.url, 'http://localhost').searchParams.get('path');
  const isForecastPath = /^\/forecast\/3\/16\/\d+\/\d+\/(?:1hour\.html)?$/.test(targetPath);
  const isUvPath = /^\/indexes\/uv_index_ranking\/3\/16\/\d+\/\d+\/$/.test(targetPath);
  if (!targetPath || (!isForecastPath && !isUvPath)) {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Invalid forecast path');
    return;
  }
  https.get(`https://tenki.jp${targetPath}`, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': 'Mozilla/5.0 SmartDisplay/1.0'
    }
  }, (upstream) => {
    let body = '';
    upstream.setEncoding('utf8');
    upstream.on('data', (chunk) => { body += chunk; });
    upstream.on('end', () => {
      response.writeHead(upstream.statusCode || 502, {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/html; charset=utf-8'
      });
      response.end(body);
    });
  }).on('error', () => {
    response.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('JWA request failed');
  });
}

function proxyYahoo(request, response) {
  const targetPath = new URL(request.url, 'http://localhost').searchParams.get('path');
  if (targetPath !== '/weather/jp/13/4410.html') {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Invalid Yahoo weather path');
    return;
  }
  https.get(`https://weather.yahoo.co.jp${targetPath}`, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': 'Mozilla/5.0 SmartDisplay/1.0'
    }
  }, (upstream) => {
    let body = '';
    upstream.setEncoding('utf8');
    upstream.on('data', (chunk) => { body += chunk; });
    upstream.on('end', () => {
      response.writeHead(upstream.statusCode || 502, {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/html; charset=utf-8'
      });
      response.end(body);
    });
  }).on('error', () => {
    response.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Yahoo weather request failed');
  });
}

const server = http.createServer((request, response) => {
  if (request.url.startsWith('/api/jwa')) {
    proxyJwa(request, response);
    return;
  }
  if (request.url.startsWith('/api/yahoo')) {
    proxyYahoo(request, response);
    return;
  }
  const requestPath = decodeURIComponent(request.url.split('?')[0]);
  const relativePath = requestPath === '/' ? 'index.html' : requestPath.slice(1);
  const filePath = path.resolve(root, relativePath);

  if (!filePath.startsWith(root + path.sep)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(error.code === 'ENOENT' ? 'Not found' : 'Server error');
      return;
    }
    response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream' });
    response.end(content);
  });
});

server.listen(port, host, () => {
  console.log(`Webアプリ: http://localhost:${port}`);
  console.log(`LAN接続: http://<このPCのIPアドレス>:${port}`);
});