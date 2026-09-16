import crypto from 'crypto';
import { getEncryptionKey, getEncryptionKeyCandidates, getReportSecret } from './secrets.js';

const AT_REST_PREFIX = 'enc.v1.';
const REPORT_PREFIX = 'e1.';

export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token), 'utf8').digest('hex');
}

export function isEncryptedAtRest(value) {
  return String(value || '').startsWith(AT_REST_PREFIX);
}

export function timingSafeEqualString(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) {
    const dummy = Buffer.alloc(left.length);
    crypto.timingSafeEqual(left, dummy);
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}

function aesEncrypt(plaintext, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
}

function aesDecrypt(blob, key) {
  if (!blob || blob.length < 29) {
    throw new Error('Invalid ciphertext');
  }
  const iv = blob.subarray(0, 12);
  const tag = blob.subarray(12, 28);
  const data = blob.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export function encryptAtRest(plaintext) {
  if (plaintext == null || plaintext === '') return plaintext;
  const raw = String(plaintext);
  if (isEncryptedAtRest(raw)) return raw;
  return AT_REST_PREFIX + aesEncrypt(raw, getEncryptionKey()).toString('base64url');
}

export function decryptAtRest(value) {
  if (value == null || value === '') return value;
  const raw = String(value);
  if (!isEncryptedAtRest(raw)) return raw;
  const blob = Buffer.from(raw.slice(AT_REST_PREFIX.length), 'base64url');
  for (const key of getEncryptionKeyCandidates()) {
    try {
      return aesDecrypt(blob, key);
    } catch {
      // try next key (ENCRYPTION_KEY vs JWT_SECRET)
    }
  }
  return null;
}

function reportKey() {
  return crypto.scryptSync(getReportSecret(), 'lehko-report-v2', 32);
}

export function sealJsonPayload(payload) {
  const blob = aesEncrypt(JSON.stringify(payload), reportKey());
  return REPORT_PREFIX + blob.toString('base64url');
}

function openEncryptedJsonPayload(token) {
  const blob = Buffer.from(String(token).slice(REPORT_PREFIX.length), 'base64url');
  return JSON.parse(aesDecrypt(blob, reportKey()));
}

function hmacSecrets() {
  const secrets = [process.env.REPORT_SHARE_SECRET, process.env.JWT_SECRET]
    .map((s) => String(s || '').trim())
    .filter(Boolean);
  try {
    secrets.push(getReportSecret());
  } catch {
    // production without secrets is handled at startup
  }
  return [...new Set(secrets)];
}

function openLegacyHmacPayload(token) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) return null;
  const sigBuf = Buffer.from(sig);
  for (const secret of hmacSecrets()) {
    const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
    const expectedBuf = Buffer.from(expected);
    if (sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      try {
        return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function openJsonPayload(token) {
  const raw = String(token || '');
  if (!raw) return null;
  if (raw.startsWith(REPORT_PREFIX)) {
    try {
      return openEncryptedJsonPayload(raw);
    } catch {
      return null;
    }
  }
  return openLegacyHmacPayload(raw);
}

export async function encryptExistingGoogleTokens(User) {
  const { Op } = await import('sequelize');
  const users = await User.findAll({
    where: { google_sheets_refresh_token: { [Op.ne]: null } },
    attributes: ['id', 'google_sheets_refresh_token']
  });
  let count = 0;
  for (const user of users) {
    const raw = user.getDataValue('google_sheets_refresh_token');
    if (!raw || isEncryptedAtRest(raw)) continue;
    user.setDataValue('google_sheets_refresh_token', encryptAtRest(raw));
    await user.save();
    count += 1;
  }
  return count;
}
