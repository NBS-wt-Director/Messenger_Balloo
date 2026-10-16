// Стабильный идентификатор устройства (тик. 1792124252, мультиаккаунт).
// UUID живёт в localStorage; сервер связывает с ним подключённые аккаунты
// (account_device_links). Формат ограничен сервером: ^[A-Za-z0-9_-]{8,64}$.

const DEVICE_ID_KEY = 'balloo-device-id';

function randomUuid(): string {
  // crypto.randomUUID доступен в secure context (https/localhost); на
  // крайний случай — самописный v4-подобный id (серверу формат не важен).
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getDeviceId(): string {
  try {
    const stored = localStorage.getItem(DEVICE_ID_KEY);
    if (stored && /^[A-Za-z0-9_-]{8,64}$/.test(stored)) {
      return stored;
    }
    const fresh = randomUuid();
    localStorage.setItem(DEVICE_ID_KEY, fresh);
    return fresh;
  } catch {
    // localStorage недоступен (приватный режим) — хотя бы на сессику
    return randomUuid();
  }
}
