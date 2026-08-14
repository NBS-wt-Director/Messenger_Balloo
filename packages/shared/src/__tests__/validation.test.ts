import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  passwordSchema,
  usernameSchema,
  registerSchema,
  loginSchema,
  displayNameSchema,
  bioSchema,
} from '../utils/validation';

describe('emailSchema', () => {
  it('accepts valid email', () => {
    const result = emailSchema.safeParse('user@example.com');
    expect(result.success).toBe(true);
  });

  it('rejects email without @', () => {
    const result = emailSchema.safeParse('userexample.com');
    expect(result.success).toBe(false);
  });

  it('rejects email shorter than 5 chars', () => {
    const result = emailSchema.safeParse('a@b');
    expect(result.success).toBe(false);
  });

  it('rejects empty string', () => {
    const result = emailSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});

describe('passwordSchema', () => {
  it('accepts valid password', () => {
    const result = passwordSchema.safeParse('Password123');
    expect(result.success).toBe(true);
  });

  it('rejects password shorter than 8 chars', () => {
    const result = passwordSchema.safeParse('Pass1');
    expect(result.success).toBe(false);
  });

  it('rejects password without uppercase', () => {
    const result = passwordSchema.safeParse('password123');
    expect(result.success).toBe(false);
  });

  it('rejects password without lowercase', () => {
    const result = passwordSchema.safeParse('PASSWORD123');
    expect(result.success).toBe(false);
  });

  it('rejects password without digit', () => {
    const result = passwordSchema.safeParse('Password');
    expect(result.success).toBe(false);
  });
});

describe('usernameSchema', () => {
  it('accepts valid username', () => {
    expect(usernameSchema.safeParse('ivan_123').success).toBe(true);
  });

  it('accepts username with hyphen', () => {
    expect(usernameSchema.safeParse('ivan-test').success).toBe(true);
  });

  it('rejects username shorter than 3 chars', () => {
    expect(usernameSchema.safeParse('iv').success).toBe(false);
  });

  it('rejects username with uppercase', () => {
    expect(usernameSchema.safeParse('Ivan').success).toBe(false);
  });

  it('rejects username with spaces', () => {
    expect(usernameSchema.safeParse('ivan test').success).toBe(false);
  });

  it('rejects username with special chars', () => {
    expect(usernameSchema.safeParse('ivan!test').success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'Password123',
      username: 'user123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'invalid',
      password: 'Password123',
      username: 'user123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects weak password', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'weak',
      username: 'user123',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts valid login data', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'anypassword',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('displayNameSchema', () => {
  it('accepts valid display name', () => {
    expect(displayNameSchema.safeParse('Иван').success).toBe(true);
  });

  it('rejects empty name', () => {
    expect(displayNameSchema.safeParse('').success).toBe(false);
  });

  it('rejects name longer than 50 chars', () => {
    expect(displayNameSchema.safeParse('a'.repeat(51)).success).toBe(false);
  });
});

describe('bioSchema', () => {
  it('accepts valid bio', () => {
    expect(bioSchema.safeParse('Some bio text').success).toBe(true);
  });

  it('accepts empty string', () => {
    expect(bioSchema.safeParse('').success).toBe(true);
  });

  it('accepts undefined', () => {
    expect(bioSchema.safeParse(undefined).success).toBe(true);
  });

  it('rejects bio longer than 500 chars', () => {
    expect(bioSchema.safeParse('a'.repeat(501)).success).toBe(false);
  });
});
