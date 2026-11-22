// «Плоские» ссылки приглашения (тик. 1795369071): /join/CODE без «#» должен
// переехать в hash-маршрут #/join/CODE, иначе код теряется (роутер — hash).
import { describe, it, expect } from 'vitest';
import { rescueJoinPath } from '../../utils/joinPathRescue';

function fakeLocation(url: string) {
  const u = new URL(url);
  const state = { replaced: '' as string };
  const loc = {
    pathname: u.pathname,
    hash: u.hash,
    search: u.search,
    origin: u.origin,
    replace: (to: string) => {
      state.replaced = to;
    },
  } as unknown as Location;
  return { loc, state };
}

describe('rescueJoinPath', () => {
  it('переносит /join/CODE в #/join/CODE', () => {
    const { loc, state } = fakeLocation('https://balloo.su/join/abc123');
    expect(rescueJoinPath(loc)).toBe(true);
    expect(state.replaced).toBe('https://balloo.su/#/join/abc123');
  });

  it('сохраняет query-строку', () => {
    const { loc, state } = fakeLocation('https://balloo.su/join/abc123?ref=x');
    rescueJoinPath(loc);
    expect(state.replaced).toBe('https://balloo.su/#/join/abc123?ref=x');
  });

  it('ничего не делает для обычного пути', () => {
    const { loc, state } = fakeLocation('https://balloo.su/');
    expect(rescueJoinPath(loc)).toBe(false);
    expect(state.replaced).toBe('');
  });

  it('ничего не делает, если hash уже #/join/', () => {
    const { loc, state } = fakeLocation('https://balloo.su/join/abc123#/join/abc123');
    expect(rescueJoinPath(loc)).toBe(false);
    expect(state.replaced).toBe('');
  });

  it('не трогает /join/ с доп. сегментами', () => {
    const { loc } = fakeLocation('https://balloo.su/join/abc/extra');
    expect(rescueJoinPath(loc)).toBe(false);
  });
});
