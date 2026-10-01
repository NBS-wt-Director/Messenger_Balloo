// Логирование клиентских ошибок на сервере (правка владельца к В-1..В-8: «сохранение в логах»).
// POST /api/client-errors c { code, path, message, userAgent, ts }.
// Fire-and-forget: ошибка отправки не должна ломать страницу ошибки.

const LOG_ENDPOINT = '/api/client-errors';
const MAX_QUEUE = 32;
const queue: Array<{ code: string; payload: string }> = [];

function flush(): void {
  if (queue.length === 0) return;
  const items = queue.splice(0, MAX_QUEUE);
  for (const item of items) {
    fetch(LOG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: item.payload,
      keepalive: true,
    }).catch(() => {
      // Сервер недоступен — ошибка и так отображается на экране.
    });
  }
}

/** Отправить ошибку на сервер. Дедупликация в рамках сессии. */
export function logError(code: number | string, message?: string): void {
  const key = `${code}:${message ?? ''}`;
  if (queue.some((q) => q.code === key)) return;
  queue.push({
    code: key,
    payload: JSON.stringify({
      code,
      path: window.location.pathname,
      message,
      ts: Date.now(),
      userAgent: navigator.userAgent,
    }),
  });
  flush();
}
