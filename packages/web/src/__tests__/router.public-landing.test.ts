/**
 * Тикет 1790480787-01 (P38-0), вторая причина редиректа гостя на /login:
 * публичный маршрут '/' был затенён защищённой группой { path: '/', children:
 * [{ index: true → /chat }] }. В React Router ветка с index-ребром ранжируется
 * выше, чем простая ветка '/', поэтому на URL '/' рендерился ProtectedRoute.
 *
 * Тест проверяет разрешение пути без рендера: на '/' матчится ОДИН маршрут
 * (публичный лендинг), а не пара [защищённая группа, index-ребро].
 */
import { describe, it, expect } from 'vitest';
import { matchRoutes } from 'react-router-dom';
import { router } from '@/router';

describe('роутер: публичный / не должен затеняться защищённой группой', () => {
  it("'/' матчится только на публичный маршрут (ветка длиной 1, без index-ребра)", () => {
    const matches = matchRoutes(router.routes, '/');

    expect(matches).not.toBeNull();
    expect(matches).toHaveLength(1);
    expect(matches![matches!.length - 1].route.index).toBeFalsy();
    expect(matches![matches!.length - 1].pathname).toBe('/');
  });

  it('защищённые маршруты приложения на месте (регресс после удаления index-ребра)', () => {
    for (const p of ['/chat', '/settings', '/profile', '/contacts']) {
      const matches = matchRoutes(router.routes, p);
      expect(matches, `маршрут ${p} не матчится`).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('публичные юридические страницы и блог матчатся как публичные (ветка длиной 1)', () => {
    for (const p of ['/privacy', '/rules', '/cookies', '/blog', '/donat', '/for_kassa']) {
      const matches = matchRoutes(router.routes, p);
      expect(matches, `маршрут ${p} не матчится`).not.toBeNull();
      expect(matches, `маршрут ${p} ушёл в защищённую группу`).toHaveLength(1);
    }
  });

  it('несуществующий путь уходит в 404-fallback, а не в защищённую группу', () => {
    const matches = matchRoutes(router.routes, '/zzz-not-exist');
    expect(matches).not.toBeNull();
    expect(matches![matches!.length - 1].route.path).toBe('*');
  });
});
