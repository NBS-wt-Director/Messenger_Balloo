// Часовой пояс и предполагаемый город пользователя для морзе-тикера подвала
// (тикет 1795677854, MVP1 — без IP-геолокации: только Intl).
//
// Формат правого тикера в режиме «нет уведомлений»: «UTC+5 Екатеринбург».

/** Карта IANA → русское название города (основные зоны РФ и ближнего зарубежья). */
const TZ_TO_CITY: Record<string, string> = {
  'Europe/Kaliningrad': 'Калининград',
  'Europe/Moscow': 'Москва',
  'Europe/Simferopol': 'Симферополь',
  'Europe/Volgograd': 'Волгоград',
  'Europe/Kirov': 'Киров',
  'Europe/Astrakhan': 'Астрахань',
  'Europe/Samara': 'Самара',
  'Europe/Saratov': 'Саратов',
  'Europe/Ulyanovsk': 'Ульяновск',
  'Asia/Yekaterinburg': 'Екатеринбург',
  'Asia/Omsk': 'Омск',
  'Asia/Novosibirsk': 'Новосибирск',
  'Asia/Barnaul': 'Барнаул',
  'Asia/Tomsk': 'Томск',
  'Asia/Krasnoyarsk': 'Красноярск',
  'Asia/Irkutsk': 'Иркутск',
  'Asia/Chita': 'Чита',
  'Asia/Yakutsk': 'Якутск',
  'Asia/Vladivostok': 'Владивосток',
  'Asia/Magadan': 'Магадан',
  'Asia/Kamchatka': 'Петропавловск-Камчатский',
  'Asia/Sakhalin': 'Южно-Сахалинск',
  'Europe/Minsk': 'Минск',
  'Europe/Kyiv': 'Киев',
  'Europe/Kiev': 'Киев',
  'Asia/Almaty': 'Алматы',
  'Asia/Tashkent': 'Ташкент',
  'Asia/Bishkek': 'Бишкек',
  'Asia/Dushanbe': 'Душанбе',
  'Asia/Yerevan': 'Ереван',
  'Asia/Tbilisi': 'Тбилиси',
  'Asia/Baku': 'Баку',
  'Europe/London': 'Лондон',
  'Europe/Berlin': 'Берлин',
  'Europe/Paris': 'Париж',
  'Asia/Shanghai': 'Шанхай',
  'Asia/Beijing': 'Пекин',
  'Asia/Kolkata': 'Дели',
  'America/New_York': 'Нью-Йорк',
};

/** Часовой пояс браузера (IANA), например `Asia/Yekaterinburg`. */
export function detectTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Смещение пояса в часах: `Asia/Yekaterinburg` → 5. */
export function tzOffsetHours(tz: string): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'longOffset',
    }).formatToParts(new Date());
    const name = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
    // «GMT+05:00» → +5 ; «GMT» → 0
    const match = name.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!match) return 0;
    const sign = match[1] === '-' ? -1 : 1;
    const hours = Number(match[2]);
    const minutes = Number(match[3] ?? 0);
    return sign * (hours + minutes / 60);
  } catch {
    return 0;
  }
}

/** `UTC+5 Екатеринбург` — строка для правого тикера. */
export function formatTimeZoneCity(tz: string = detectTimeZone()): string {
  const offset = tzOffsetHours(tz);
  const sign = offset < 0 ? '-' : '+';
  const abs = Math.abs(offset);
  const hours = Math.trunc(abs);
  const minutes = Math.round((abs - hours) * 60);
  const utc = `UTC${sign}${hours}${minutes ? `:${String(minutes).padStart(2, '0')}` : ''}`;
  const city = TZ_TO_CITY[tz] ?? tz;
  return `${utc} ${city}`;
}
