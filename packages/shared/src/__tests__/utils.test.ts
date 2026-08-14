import { describe, it, expect } from 'vitest';
import {
  timestampToDate,
  dateToTimestamp,
  nowTimestamp,
  formatRelativeTime,
} from '../utils/date';
import {
  slugify,
  truncate,
  formatBytes,
  maskEmail,
  maskPhone,
} from '../utils/strings';

describe('date utils', () => {
  describe('timestampToDate', () => {
    it('converts Unix timestamp to Date', () => {
      const ts = 1700000000; // 2023-11-14
      const date = timestampToDate(ts);
      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).toBe(ts * 1000);
    });
  });

  describe('dateToTimestamp', () => {
    it('converts Date to Unix timestamp', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const ts = dateToTimestamp(date);
      expect(ts).toBe(Math.floor(date.getTime() / 1000));
    });
  });

  describe('nowTimestamp', () => {
    it('returns current Unix timestamp in seconds', () => {
      const before = Math.floor(Date.now() / 1000);
      const ts = nowTimestamp();
      const after = Math.floor(Date.now() / 1000);
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(after);
    });
  });

  describe('formatRelativeTime', () => {
    it('returns "только что" for recent timestamp', () => {
      const ts = nowTimestamp();
      expect(formatRelativeTime(ts)).toBe('только что');
    });

    it('returns minutes for recent past', () => {
      const ts = nowTimestamp() - 120; // 2 min ago
      expect(formatRelativeTime(ts)).toBe('2 мин назад');
    });

    it('returns hours for past within a day', () => {
      const ts = nowTimestamp() - 7200; // 2 hours ago
      expect(formatRelativeTime(ts)).toBe('2 ч назад');
    });

    it('returns "вчера" for 1 day ago', () => {
      const ts = nowTimestamp() - 86400; // 1 day ago
      expect(formatRelativeTime(ts)).toBe('вчера');
    });
  });
});

describe('string utils', () => {
  describe('slugify', () => {
    it('slugifies Latin text', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('slugifies Cyrillic text', () => {
      expect(slugify('Привет мир')).toBe('privet-mir');
    });

    it('removes special characters', () => {
      expect(slugify('Hello!@#World')).toBe('hello-world');
    });

    it('handles leading/trailing hyphens', () => {
      expect(slugify('---hello---')).toBe('hello');
    });

    it('collapses multiple hyphens', () => {
      expect(slugify('hello   world')).toBe('hello-world');
    });

    it('returns empty string for empty input', () => {
      expect(slugify('')).toBe('');
    });
  });

  describe('truncate', () => {
    it('returns original string if shorter than maxLength', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('truncates and adds ellipsis', () => {
      expect(truncate('hello world', 8)).toBe('hello...');
    });

    it('uses custom suffix', () => {
      expect(truncate('hello world', 8, '[…]')).toBe('hello[…]');
    });
  });

  describe('formatBytes', () => {
    it('returns "0 Б" for 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 Б');
    });

    it('formats bytes', () => {
      expect(formatBytes(500)).toBe('500 Б');
    });

    it('formats kilobytes', () => {
      expect(formatBytes(1024)).toBe('1 КБ');
    });

    it('formats megabytes', () => {
      expect(formatBytes(1048576)).toBe('1 МБ');
    });

    it('formats gigabytes', () => {
      expect(formatBytes(1073741824)).toBe('1 ГБ');
    });
  });

  describe('maskEmail', () => {
    it('masks email correctly', () => {
      expect(maskEmail('ivan@example.com')).toBe('i***@example.com');
    });

    it('handles single char username', () => {
      expect(maskEmail('i@example.com')).toBe('i@example.com');
    });

    it('returns input for invalid email', () => {
      expect(maskEmail('invalid')).toBe('invalid');
    });
  });

  describe('maskPhone', () => {
    it('masks phone number', () => {
      expect(maskPhone('+7 (999) 123-45-67')).toBe('+7 (***) ***-**-4567');
    });

    it('returns input for too short number', () => {
      expect(maskPhone('123')).toBe('123');
    });
  });
});
