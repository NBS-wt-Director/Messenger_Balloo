import { app } from './app';
import { startCron } from './services/cron';
import { setupWebSocket } from './ws';
import http from 'http';

const PORT = Number(process.env.SERVER_PORT) || 3000;
const HOST = process.env.SERVER_HOST || '0.0.0.0';

// Запуск cron job для очистки истекших историй и опросов
startCron();

// Создаём HTTP сервер из Express app
const httpServer = http.createServer(app);

// Инициализируем WebSocket сервер
setupWebSocket(httpServer);

// Запускаем HTTP + WebSocket сервер
httpServer.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
  console.log(`WebSocket: ws://${HOST}:${PORT}/ws/`);
});

export default app;

