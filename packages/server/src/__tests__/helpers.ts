// Mock emailService — prevents real email sending during tests
jest.mock('../services/emailService', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendResetPasswordEmail: jest.fn().mockResolvedValue(true),
}));

// Test helpers — register a user and get auth token
import { app } from '../app';
import jwt from 'jsonwebtoken';

const env = require('../config/env').env;

let counter = 0;

function uniqueEmail(): string {
  counter++;
  return `testuser${Date.now()}_${counter}@test.balloo.ru`;
}

function uniqueUsername(): string {
  counter++;
  return `testuser${Date.now()}_${counter}`;
}

export interface TestUser {
  id: string;
  email: string;
  username: string;
  password: string;
  accessToken: string;
  refreshToken: string;
}

// Извлечение JWT из httpOnly cookie ответа (после тикета №2 токены не в body)
function extractCookie(res: any, name: string): string {
  const cookies: string[] = res.headers['set-cookie'] || [];
  for (const c of cookies) {
    const [pair] = c.split(';');
    const [key, ...rest] = pair.split('=');
    if (key.trim() === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return '';
}

/**
 * Register a new user via API and return credentials
 */
export async function registerTestUser(overrides?: {
  email?: string;
  username?: string;
  password?: string;
}): Promise<TestUser> {
  const email = overrides?.email || uniqueEmail();
  const username = overrides?.username || uniqueUsername();
  const password = overrides?.password || 'Test1234';

  const res = await require('supertest')(app)
    .post('/api/auth/register')
    .send({ email, password, username });

  if (res.status !== 201) {
    throw new Error(`Registration failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return {
    id: res.body.user.id,
    email,
    username,
    password,
    accessToken: extractCookie(res, 'balloo-access-token'),
    refreshToken: extractCookie(res, 'balloo-refresh-token'),
  };
}

/**
 * Login an existing user and return tokens
 */
export async function loginTestUser(email: string, password: string): Promise<{
  accessToken: string;
  refreshToken: string;
  userId: string;
}> {
  const res = await require('supertest')(app)
    .post('/api/auth/login')
    .send({ email, password });

  if (res.status !== 200) {
    throw new Error(`Login failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return {
    accessToken: extractCookie(res, 'balloo-access-token'),
    refreshToken: extractCookie(res, 'balloo-refresh-token'),
    userId: res.body.user.id,
  };
}

/**
 * Generate a JWT access token for a user directly (without going through API)
 * Useful for creating admin users or testing with specific roles
 */
export function generateToken(userId: string, email: string, username?: string, role?: string): string {
  return jwt.sign(
    { userId, email, username, role, type: 'access' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: 900 }
  );
}

/**
 * Generate a JWT refresh token
 */
export function generateRefreshToken(userId: string, email: string, username?: string, role?: string): string {
  return jwt.sign(
    { userId, email, username, role, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: 2592000 }
  );
}

export { app };
