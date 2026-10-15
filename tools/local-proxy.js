/*
 * Proxy CORS cục bộ cho demo_ioc.html khi mở trực tiếp bằng file://
 * Chạy: node local-proxy.js
 * Sau đó mở demo_ioc.html như bình thường (double-click) — trang sẽ tự gọi
 * http://localhost:8787/api/ioc/... và proxy này chuyển tiếp sang API thật,
 * kèm header CORS để trình duyệt không chặn.
 */
const http = require('http');
const https = require('https');

const PORT = 8787;
const TARGET_HOST = 'administrator.lifetex.vn';
const TARGET_PORT = 324;
const PREFIX = '/api/ioc/';
const TARGET_PREFIX = '/api/v1/ioc/';

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (!req.url.startsWith(PREFIX)) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Chỉ hỗ trợ đường dẫn bắt đầu bằng ${PREFIX}` }));
    return;
  }

  const targetPath = TARGET_PREFIX + req.url.slice(PREFIX.length);

  const upstreamReq = https.request(
    {
      host: TARGET_HOST,
      port: TARGET_PORT,
      path: targetPath,
      method: req.method,
      headers: { host: TARGET_HOST }
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode, {
        'Content-Type': upstreamRes.headers['content-type'] || 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      upstreamRes.pipe(res);
    }
  );

  upstreamReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ error: 'Không gọi được API thật', detail: err.message }));
  });

  upstreamReq.end();
});

server.listen(PORT, () => {
  console.log(`Local proxy đang chạy tại http://localhost:${PORT}${PREFIX}`);
  console.log(`Chuyển tiếp sang https://${TARGET_HOST}:${TARGET_PORT}${TARGET_PREFIX}`);
  console.log('Giữ cửa sổ này mở, rồi mở demo_ioc.html như bình thường.');
});
