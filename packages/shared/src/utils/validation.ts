// Validation schemas using Zod

import { z } from 'zod';

/**
 * Email validation schema
 */
export const emailSchema = z.string().email('Неверный формат email').min(5).max(255);

/**
 * Password validation schema:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 */
export const passwordSchema = z
  .string()
  .min(8, 'Пароль должен содержать минимум 8 символов')
  .max(128, 'Пароль слишком длинный')
  .regex(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву')
  .regex(/[a-z]/, 'Пароль должен содержать хотя бы одну строчную букву')
  .regex(/[0-9]/, 'Пароль должен содержать хотя бы одну цифру');

/**
 * Username validation schema:
 * - 3-30 characters
 * - Only lowercase letters, digits, underscores, hyphens
 */
export const usernameSchema = z
  .string()
  .min(3, 'Имя пользователя должно содержать минимум 3 символа')
  .max(30, 'Имя пользователя слишком длинное')
  .regex(/^[a-z0-9_-]+$/, 'Имя пользователя может содержать только строчные буквы, цифры, подчеркивания и дефисы');

/**
 * Display name validation schema
 */
export const displayNameSchema = z
  .string()
  .min(1, 'Имя не может быть пустым')
  .max(50, 'Имя слишком длинное');

/**
 * Bio validation schema
 */
export const bioSchema = z
  .string()
  .max(500, 'Биография слишком длинная (максимум 500 символов)')
  .optional()
  .or(z.literal(''));

/**
 * Registration input schema
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema,
});

/**
 * Login input schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Введите пароль'),
});

/**
 * Update profile input schema
 */
export const updateProfileSchema = z.object({
  displayName: displayNameSchema.optional(),
  bio: bioSchema,
  website: z.string().url('Неверный формат URL').optional().or(z.literal('')),
});
