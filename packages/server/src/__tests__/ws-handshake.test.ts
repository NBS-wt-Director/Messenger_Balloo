/**
 * Регрессия на два бага WS-авторизации, из-за которых WebSocket на проде
 * был нерабочим целиком (502 от nginx).
 *
 * 1. verifyClient читал info.url, которого в ws нет (в info только
 *    { origin, secure, req }). TypeError бросался синхронно в обработчике
 *    'upgrade' и ронял процесс целиком: curl → "Empty reply from server",
 *    nginx → 502 вместо отказа в авторизации.
 * 2. Данные пользователя клались на req, а connection-хендлер читал их с
 *    сокета — клиент с валидным токеном получал ws.close(1008) и не попадал
 *    в roomManager.
 */
import http from 'http';
import jwt from 'jsonwebtoken';
import WebSocket from 'ws';
import { AddressInfo } from 'net';
import { setupWebSocket } from '../ws';

const JWT_SECRET = process.env.JWT_ACCESS_SECRET as string;

let server: http.Server;
let port: number;

beforeAll(
  () =>
    new Promise<void>((resolve) => {
      server = http.createServer((_req, res) => res.end('ok'));
      setupWebSocket(server);
      server.listen(0, '127.0.0.1', () => {
        port = (server.address() as AddressInfo).port;
        resolve();
      });
    })
);

afterAll(
  () =>
    new Promise<void>((resolve) => {
      server.close(() => resolve());
    })
);

/** Один handshake. Возвращает HTTP-код отказа или 101 при успешном апгрейде. */
function handshake(path: string): Promise<{ upgraded: boolean; status: number | null }> {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/${path}`);
    const timer = setTimeout(() => {
      ws.terminate();
      resolve({ upgraded: false, status: null });
    }, 5000);

    ws.on('open', () => {
      clearTimeout(timer);
      ws.close();
      resolve({ upgraded: true, status: 101 });
    });

    ws.on('unexpected-response', (_req, res) => {
      clearTimeout(timer);
      resolve({ upgraded: false, status: res.statusCode ?? null });
    });

    ws.on('error', () => {
      clearTimeout(timer);
      resolve({ upgraded: false, status: null });
    });
  });
}

function signToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: 900 });
}

describe('WebSocket handshake auth', () => {
  it('отклоняет подключение без токена ответом 401', async () => {
    const res = await handshake('ws/');
    expect(res.status).toBe(401);
  });

  it('отклоняет не разобраный токен ответом 401', async () => {
    const res = await handshake('ws/?token=not-a-jwt');
    expect(res.status).toBe(401);
  });

  it('отклоняет чужой тип токена ответом 401', async () => {
    const token = signToken({ userId: 'u1', email: 'a@b.c', type: 'refresh' });
    const res = await handshake(`ws/?token=${token}`);
    expect(res.status).toBe(401);
  });

  it('пропускает подключение с валидным access-токеном', async () => {
    const token = signToken({
      userId: 'u-test',
      email: 'test@test.balloo.su',
      username: 'testuser',
      role: 'user',
      type: 'access',
    });
    const res = await handshake(`ws/?token=${token}`);
    expect(res.upgraded).toBe(true);
  });

  it('оставляет процесс живым после отказов handshake', async () => {
    await handshake('ws/');
    await handshake('ws/?token=broken');

    const alive = await new Promise<boolean>((resolve) => {
      http
        .get(`http://127.0.0.1:${port}/`, (res) => {
          res.resume();
          resolve(true);
        })
        .on('error', () => resolve(false));
    });

    expect(alive).toBe(true);
  });
});
