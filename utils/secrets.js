import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

function env(name) {
  return String(process.env[name] || '').trim();
}

const WEAK_JWT_SECRETS = new Set([
  'your-super-secret-jwt-key-change-this-in-production',
  'change-me-to-random-64-char-string',
  'CHANGE_ME_GENERATE_RANDOM_64_CHARS',
  'lehko-report-secret',
  'secret',
  'jwt-secret'
]);

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export function getJwtSecret() {
  const secret = env('JWT_SECRET');
  if (secret) return secret;
  if (isProduction()) {
    throw new Error('JWT_SECRET must be set in production');
  }
  return 'dev-only-jwt-secret-not-for-production';
}

export function getReportSecret() {
  const secret = env('REPORT_SHARE_SECRET') || env('JWT_SECRET');
  if (secret) return secret;
  if (isProduction()) {
    throw new Error('REPORT_SHARE_SECRET or JWT_SECRET must be set in production');
  }
  return 'dev-only-report-secret-not-for-production';
}

export function getEncryptionMaterial() {
  return env('ENCRYPTION_KEY') || env('JWT_SECRET');
}

/** 32-byte AES-256 key derived from ENCRYPTION_KEY or JWT_SECRET. */
function keyFromMaterial(material) {
  if (/^[0-9a-f]{64}$/i.test(material)) {
    return Buffer.from(material, 'hex');
  }
  return crypto.scryptSync(material, 'lehko-enc-v1', 32);
}

export function getEncryptionKey() {
  const material = getEncryptionMaterial();
  if (!material) {
    if (isProduction()) {
      throw new Error('ENCRYPTION_KEY or JWT_SECRET must be set in production');
    }
    return crypto.scryptSync('dev-only-encryption-key', 'lehko-enc-v1', 32);
  }
  return keyFromMaterial(material);
}

export function getEncryptionKeyCandidates() {
  const seen = new Set();
  const keys = [];
  const add = (material) => {
    const value = String(material || '').trim();
    if (!value) return;
    const key = keyFromMaterial(value);
    const id = key.toString('hex');
    if (seen.has(id)) return;
    seen.add(id);
    keys.push(key);
  };
  add(env('ENCRYPTION_KEY'));
  add(env('JWT_SECRET'));
  if (keys.length === 0) keys.push(getEncryptionKey());
  return keys;
}

export function getBlogViewSalt() {
  return env('BLOG_VIEW_SALT') || getJwtSecret();
}

export function assertProductionSecrets() {
  if (!isProduction()) return;

  const jwtSecret = env('JWT_SECRET');
  if (!jwtSecret) {
    throw new Error('JWT_SECRET must be set in production');
  }
  if (WEAK_JWT_SECRETS.has(jwtSecret) || jwtSecret.length < 24) {
    console.warn('⚠️  JWT_SECRET looks weak. Generate a long random value and restart.');
  }
  if (!env('DB_PASSWORD')) {
    throw new Error('DB_PASSWORD must be set in production');
  }
  if (!env('ENCRYPTION_KEY')) {
    console.warn('⚠️  ENCRYPTION_KEY is not set; deriving AES key from JWT_SECRET.');
  }
  if (!env('REPORT_SHARE_SECRET')) {
    console.warn('⚠️  REPORT_SHARE_SECRET is not set; using JWT_SECRET for report tokens.');
  }
}
