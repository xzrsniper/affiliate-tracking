import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { hashToken } from './crypto.js';

export const BCRYPT_ROUNDS = 12;
export const MIN_PASSWORD_LENGTH = 8;

export function hashPassword(password) {
  return bcrypt.hash(String(password), BCRYPT_ROUNDS);
}

export function verifyPassword(password, passwordHash) {
  const hash = String(passwordHash || '');
  if (!hash) return Promise.resolve(false);
  return bcrypt.compare(String(password), hash);
}

export function validateNewPassword(password) {
  if (!password) return 'Password is required';
  if (String(password).length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
}

export async function findUserBySecretToken(User, field, rawToken) {
  const token = String(rawToken || '');
  if (!token) return null;
  const hashed = hashToken(token);
  return User.findOne({
    where: {
      [Op.or]: [{ [field]: hashed }, { [field]: token }]
    }
  });
}

export const SENSITIVE_USER_ATTRIBUTES = [
  'password_hash',
  'pending_password_hash',
  'email_verification_token',
  'password_change_token',
  'password_reset_token',
  'google_sheets_refresh_token'
];
