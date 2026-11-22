// Тесты заголовка раздела для единой шапки (тик. 1795292000).
import { describe, it, expect } from 'vitest';
import { sectionTitleForPath } from '@/components/chrome/sectionTitles';

describe('sectionTitleForPath', () => {
  const cases: [string, string][] = [
    ['/chat', 'Чаты'],
    ['/chat/abc', 'Чаты'],
    ['/chat/abc/poll', 'Опрос'],
    ['/contacts', 'Контакты'],
    ['/stories', 'Истории'],
    ['/stories/create', 'Новая история'],
    ['/settings', 'Настройки'],
    ['/settings/privacy', 'Приватность'],
    ['/profile/bob', 'Профиль'],
    ['/channel/abc', 'Канал'],
    ['/channel/abc/settings', 'Настройки канала'],
    ['/unknown-route', 'Balloo'],
  ];

  for (const [path, title] of cases) {
    it(`${path} → ${title}`, () => {
      expect(sectionTitleForPath(path)).toBe(title);
    });
  }
});
