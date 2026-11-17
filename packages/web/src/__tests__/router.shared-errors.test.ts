/**
 * Тикет 1794892002 — маршруты shared error-экранов.
 * Router — createHashRouter, поэтому curl к /503 вернёт index.html независимо
 * от регистрации маршрута (hash не уходит на сервер). Детерминированная
 * проверка «маршрут реально отдаётся» без GUI — matchRoutes по таблице
 * маршрутов: путь обязан матчиться на свою публичную ветку (длина 1),
 * а не проваливаться в 404-splat '*'.
 */
import { describe, it, expect } from 'vitest';
import { matchRoutes } from 'react-router-dom';
import { router } from '@/router';

const SHARED_ROUTES: [string, string][] = [
  ['/503', '/503'],
  ['/offline', '/offline'],
  ['/offline-guest', '/offline-guest'],
  ['/555', '/555'],
  ['/ban-appeal', '/ban-appeal'],
];

describe('роутер: маршруты shared error-экранов зарегистрированы', () => {
  for (const [path, expected] of SHARED_ROUTES) {
    it(`${path} матчится на свою публичную ветку, а не на 404`, () => {
      const matches = matchRoutes(router.routes, path);
      expect(matches, `маршрут ${path} не матчится`).not.toBeNull();
      const last = matches![matches!.length - 1];
      expect(last.route.path, `${path} ушёл в 404-splat`).not.toBe('*');
      expect(last.pathname).toBe(expected);
    });
  }
});
