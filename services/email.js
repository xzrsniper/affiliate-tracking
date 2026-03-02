import nodemailer from 'nodemailer';

const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS || process.env.SENDPULSE_SMTP_USER || 'noreply@example.com';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'Lehko';

function getTransporter() {
  const host = process.env.SENDPULSE_SMTP_HOST || process.env.SMTP_HOST;
  const port = parseInt(process.env.SENDPULSE_SMTP_PORT || process.env.SMTP_PORT || '587', 10);
  const user = process.env.SENDPULSE_SMTP_USER || process.env.SMTP_USER;
  const pass = process.env.SENDPULSE_SMTP_PASS || process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('Email (SendPulse SMTP) not configured: missing SENDPULSE_SMTP_* or SMTP_* env vars.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: port === 465 ? 465 : 587,
    secure: port === 465,
    auth: { user, pass }
  });
}

/**
 * Send verification email with link to frontend /verify-email?token=...
 * @param {string} to - recipient email
 * @param {string} token - verification token
 * @param {string} [lang='uk'] - language for email body (uk | en)
 */
export async function sendVerificationEmail(to, token, lang = 'uk') {
  const transporter = getTransporter();
  if (!transporter) {
    console.error('Cannot send verification email: SMTP not configured');
    return { ok: false, error: 'Email not configured' };
  }

  const baseUrl = (process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
  const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;

  const texts = {
    uk: {
      subject: 'Підтвердіть вашу email адресу — Lehko',
      html: `
        <p>Вітаємо!</p>
        <p>Натисніть посилання нижче, щоб підтвердити вашу email адресу:</p>
        <p><a href="${verifyUrl}" style="color:#7c3aed;">${verifyUrl}</a></p>
        <p>Посилання дійсне 24 години.</p>
        <p>Якщо ви не реєструвались на Lehko, проігноруйте цей лист.</p>
        <p>— Lehko</p>
      `,
      text: `Підтвердіть email: ${verifyUrl}\n\nПосилання дійсне 24 години.`
    },
    en: {
      subject: 'Confirm your email address — Lehko',
      html: `
        <p>Hello!</p>
        <p>Click the link below to confirm your email address:</p>
        <p><a href="${verifyUrl}" style="color:#7c3aed;">${verifyUrl}</a></p>
        <p>This link is valid for 24 hours.</p>
        <p>If you did not sign up for Lehko, please ignore this email.</p>
        <p>— Lehko</p>
      `,
      text: `Confirm your email: ${verifyUrl}\n\nThis link is valid for 24 hours.`
    }
  };

  const content = texts[lang] || texts.uk;

  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject: content.subject,
      text: content.text,
      html: content.html
    });
    return { ok: true };
  } catch (err) {
    console.error('SendPulse/SMTP send error:', err);
    return { ok: false, error: err.message };
  }
}

/**
 * Send password change confirmation email with link to confirm.
 * @param {string} to - recipient email
 * @param {string} token - confirmation token
 * @param {string} [lang='uk'] - language (uk | en)
 */
export async function sendPasswordChangeConfirmationEmail(to, token, lang = 'uk') {
  const transporter = getTransporter();
  if (!transporter) {
    console.error('Cannot send password change email: SMTP not configured');
    return { ok: false, error: 'Email not configured' };
  }

  const baseUrl = (process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
  const confirmUrl = `${baseUrl}/confirm-password-change?token=${encodeURIComponent(token)}`;

  const texts = {
    uk: {
      subject: 'Підтвердіть зміну пароля — Lehko',
      html: `
        <p>Ви запросили зміну пароля.</p>
        <p>Натисніть посилання нижче, щоб підтвердити новий пароль:</p>
        <p><a href="${confirmUrl}" style="color:#7c3aed;">${confirmUrl}</a></p>
        <p>Посилання дійсне 1 годину.</p>
        <p>Якщо це були не ви, проігноруйте цей лист — пароль не зміниться.</p>
        <p>— Lehko</p>
      `,
      text: `Підтвердіть зміну пароля: ${confirmUrl}\n\nПосилання дійсне 1 годину.`
    },
    en: {
      subject: 'Confirm password change — Lehko',
      html: `
        <p>You requested a password change.</p>
        <p>Click the link below to confirm your new password:</p>
        <p><a href="${confirmUrl}" style="color:#7c3aed;">${confirmUrl}</a></p>
        <p>This link is valid for 1 hour.</p>
        <p>If this wasn't you, ignore this email — your password will not change.</p>
        <p>— Lehko</p>
      `,
      text: `Confirm password change: ${confirmUrl}\n\nThis link is valid for 1 hour.`
    }
  };

  const content = texts[lang] || texts.uk;

  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject: content.subject,
      text: content.text,
      html: content.html
    });
    return { ok: true };
  } catch (err) {
    console.error('SendPulse/SMTP send error:', err);
    return { ok: false, error: err.message };
  }
}
