const http = require('http');
const fs = require('fs');
const path = require('path');
const dir = 'C:\\Users\\90782\\.openclaw\\workspace\\pipa-tuner';
const mime = { '.html': 'text/html;charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
const srv = http.createServer((req, res) => {
  let fp = path.join(dir, req.url === '/' ? 'index.html' : req.url);
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not Found: ' + req.url); return; }
    const ext = path.extname(fp).toLowerCase();
    res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain', 'Access-Control-Allow-Origin': '*' });
    res.end(data);
  });
});
srv.listen(8765, '0.0.0.0', () => console.log('Pipa Tuner server running on http://192.168.8.5:8765'));
process.on('SIGTERM', () => srv.close());
