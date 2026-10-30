// Read-only проверка WS-эндпоинта прода: без токена handshake должен вернуть 401.
// HTTP GET на /ws/ не апгрейдится и уходит в Express → 404, поэтому нужен WS-клиент.
const WebSocket = require('ws');

const ws = new WebSocket('wss://api.balloo.su/ws/');
const done = (status, note) => {
  console.log(`WS_STATUS=${status} ${note || ''}`.trim());
  process.exit(0);
};
ws.on('open', () => {
  console.log('WS_STATUS=101');
  ws.close();
  process.exit(0);
});
ws.on('unexpected-response', (_req, res) => done(res.statusCode, 'unexpected-response'));
ws.on('error', (e) => done('error', e.message));
setTimeout(() => done('timeout'), 8000);
