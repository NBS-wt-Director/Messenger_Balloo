import { describe, it, expect } from 'vitest';
import { displayNameOf, initialsOf } from '../../utils/display';

describe('displayNameOf', () => {
  it('returns displayName when present', () => {
    expect(displayNameOf({ displayName: 'Иван Петров', username: 'ivan' })).toBe('Иван Петров');
  });

  it('falls back to username when displayName is null', () => {
    expect(displayNameOf({ displayName: null, username: 'vasya' })).toBe('vasya');
  });

  it('falls back to username when displayName is empty string', () => {
    expect(displayNameOf({ displayName: '', username: 'vasya' })).toBe('vasya');
  });

  it('falls back to username when displayName is whitespace', () => {
    expect(displayNameOf({ displayName: '   ', username: 'vasya' })).toBe('vasya');
  });

  it('returns fallback when both are null', () => {
    expect(displayNameOf({ displayName: null, username: null })).toBe('Пользователь');
  });

  it('returns fallback when both are empty', () => {
    expect(displayNameOf({ displayName: '', username: '' })).toBe('Пользователь');
  });

  it('returns fallback for undefined', () => {
    expect(displayNameOf(undefined)).toBe('Пользователь');
  });

  it('returns fallback for null', () => {
    expect(displayNameOf(null)).toBe('Пользователь');
  });
});

describe('initialsOf', () => {
  it('extracts initials from two-word name', () => {
    expect(initialsOf('Иван Петров')).toBe('ИП');
  });

  it('handles single word', () => {
    expect(initialsOf('mark')).toBe('M');
  });

  it('handles uppercase', () => {
    expect(initialsOf('Анна Мария')).toBe('АМ');
  });

  it('handles empty string', () => {
    expect(initialsOf('')).toBe('??');
  });

  it('handles null', () => {
    expect(initialsOf(null)).toBe('??');
  });

  it('handles undefined', () => {
    expect(initialsOf(undefined)).toBe('??');
  });

  it('handles whitespace-only', () => {
    expect(initialsOf('   ')).toBe('??');
  });

  it('handles three words (takes first 2)', () => {
    expect(initialsOf('А Б В')).toBe('АБ');
  });

  it('handles multiple spaces between words', () => {
    expect(initialsOf('Иван   Петров')).toBe('ИП');
  });
});
