import jwt from 'jsonwebtoken';
import { getJwtSecret } from './secrets.js';

export const AUTH_COOKIE_NAME = 'lt_session';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const generateToken = (userId, extra = {}, expiresIn = JWT_EXPIRES_IN) => {
  return jwt.sign(
    { ...extra, userId },
    getJwtSecret(),
    { expiresIn }
  );
};

export const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

export function getRequestToken(req) {
  const header = req.headers.authorization;
  if (header && typeof header === 'string' && header.startsWith('Bearer ')) {
    const token = header.slice(7).trim();
    if (token) return token;
  }
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
  if (cookieToken) return String(cookieToken);
  return null;
}

export function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export function clearAuthCookie(res) {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/'
  });
}
