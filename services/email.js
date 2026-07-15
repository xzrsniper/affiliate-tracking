import nodemailer from 'nodemailer';

const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS || process.env.SENDPULSE_SMTP_USER || 'noreply@example.com';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'lehko.space';

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
 * Branded HTML email wrapper matching the Lehko site style (violet/indigo gradient, rounded cards).
 * @param {object} opts
 * @param {string} opts.title  - email heading text
 * @param {string} opts.body   - inner HTML (paragraphs, button, etc.)
 * @param {string} [opts.lang] - 'uk' | 'en'
 */
function brandedHtml({ title, body, lang = 'uk' }) {
  const footerText = lang === 'en'
    ? 'You received this email because you have an account on <a href="https://lehko.space" style="color:#7c3aed;text-decoration:none;">lehko.space</a>. If you didn\'t request this, just ignore it.'
    : 'Ви отримали цей лист, тому що маєте акаунт на <a href="https://lehko.space" style="color:#7c3aed;text-decoration:none;">lehko.space</a>. Якщо ви не робили цей запит, просто проігноруйте цей лист.';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header gradient bar -->
          <tr>
            <td style="height:6px;background:linear-gradient(90deg,#7c3aed,#6366f1);"></td>
          </tr>
          <!-- Logo -->
          <tr>
            <td align="center" style="padding:32px 32px 0 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,#7c3aed,#6366f1);border-radius:14px;padding:10px 18px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:8px;">
                          <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="48" height="48" rx="10" fill="rgba(255,255,255,0.2)"/>
                            <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
                                  font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
                                  font-size="30" font-weight="800" fill="white">L</text>
                          </svg>
                        </td>
                        <td style="vertical-align:middle;">
                          <span style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">lehko.space</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Title -->
          <tr>
            <td align="center" style="padding:24px 32px 0 32px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#1e293b;line-height:1.3;">${title}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:20px 32px 32px 32px;font-size:15px;line-height:1.6;color:#475569;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:0 32px 28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="border-top:1px solid #e2e8f0;padding-top:20px;font-size:12px;color:#94a3b8;line-height:1.5;text-align:center;">
                  ${footerText}
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Reusable CTA button */
function ctaButton(url, text) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td align="center" style="background:linear-gradient(135deg,#7c3aed,#6366f1);border-radius:12px;">
      <a href="${url}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;">
        ${text}
      </a>
    </td>
  </tr>
</table>`;
}

/**
 * Send verification email with link to frontend /verify-email?token=...
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
      subject: 'Підтвердіть вашу email адресу — lehko.space',
      title: 'Підтвердіть email адресу',
      body: `
        <p style="margin:0 0 16px 0;">Вітаємо! 👋</p>
        <p style="margin:0 0 16px 0;">Дякуємо за реєстрацію на <strong>lehko.space</strong>. Для завершення реєстрації підтвердіть вашу email адресу, натиснувши кнопку нижче:</p>
        ${ctaButton(verifyUrl, 'Підтвердити email ✉️')}
        <p style="margin:0 0 8px 0;font-size:13px;color:#94a3b8;">Або скопіюйте посилання:</p>
        <p style="margin:0 0 16px 0;font-size:13px;word-break:break-all;"><a href="${verifyUrl}" style="color:#7c3aed;">${verifyUrl}</a></p>
        <p style="margin:0;font-size:13px;color:#94a3b8;">⏱ Посилання дійсне 24 години.</p>
      `,
      text: `Підтвердіть email: ${verifyUrl}\n\nПосилання дійсне 24 години.`
    },
    en: {
      subject: 'Confirm your email address — lehko.space',
      title: 'Confirm your email',
      body: `
        <p style="margin:0 0 16px 0;">Hello! 👋</p>
        <p style="margin:0 0 16px 0;">Thanks for signing up for <strong>lehko.space</strong>. To finish registration, please confirm your email address by clicking the button below:</p>
        ${ctaButton(verifyUrl, 'Confirm email ✉️')}
        <p style="margin:0 0 8px 0;font-size:13px;color:#94a3b8;">Or copy this link:</p>
        <p style="margin:0 0 16px 0;font-size:13px;word-break:break-all;"><a href="${verifyUrl}" style="color:#7c3aed;">${verifyUrl}</a></p>
        <p style="margin:0;font-size:13px;color:#94a3b8;">⏱ This link is valid for 24 hours.</p>
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
      html: brandedHtml({ title: content.title, body: content.body, lang })
    });
    return { ok: true };
  } catch (err) {
    console.error('SendPulse/SMTP send error:', err);
    return { ok: false, error: err.message };
  }
}

/**
 * Send password change confirmation email with link to confirm.
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
      subject: 'Підтвердіть зміну пароля — lehko.space',
      title: 'Підтвердження зміни пароля',
      body: `
        <p style="margin:0 0 16px 0;">Ви запросили зміну пароля для вашого акаунта на <strong>lehko.space</strong>.</p>
        <p style="margin:0 0 16px 0;">Натисніть кнопку нижче, щоб підтвердити новий пароль:</p>
        ${ctaButton(confirmUrl, 'Підтвердити зміну пароля 🔒')}
        <p style="margin:0 0 8px 0;font-size:13px;color:#94a3b8;">Або скопіюйте посилання:</p>
        <p style="margin:0 0 16px 0;font-size:13px;word-break:break-all;"><a href="${confirmUrl}" style="color:#7c3aed;">${confirmUrl}</a></p>
        <p style="margin:0 0 8px 0;font-size:13px;color:#94a3b8;">⏱ Посилання дійсне 1 годину.</p>
        <p style="margin:0;font-size:13px;color:#94a3b8;">Якщо це були не ви — просто проігноруйте цей лист. Пароль не зміниться.</p>
      `,
      text: `Підтвердіть зміну пароля: ${confirmUrl}\n\nПосилання дійсне 1 годину.`
    },
    en: {
      subject: 'Confirm password change — lehko.space',
      title: 'Confirm password change',
      body: `
        <p style="margin:0 0 16px 0;">You requested a password change for your <strong>lehko.space</strong> account.</p>
        <p style="margin:0 0 16px 0;">Click the button below to confirm your new password:</p>
        ${ctaButton(confirmUrl, 'Confirm password change 🔒')}
        <p style="margin:0 0 8px 0;font-size:13px;color:#94a3b8;">Or copy this link:</p>
        <p style="margin:0 0 16px 0;font-size:13px;word-break:break-all;"><a href="${confirmUrl}" style="color:#7c3aed;">${confirmUrl}</a></p>
        <p style="margin:0 0 8px 0;font-size:13px;color:#94a3b8;">⏱ This link is valid for 1 hour.</p>
        <p style="margin:0;font-size:13px;color:#94a3b8;">If this wasn't you, just ignore this email. Your password won't change.</p>
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
      html: brandedHtml({ title: content.title, body: content.body, lang })
    });
    return { ok: true };
  } catch (err) {
    console.error('SendPulse/SMTP send error:', err);
    return { ok: false, error: err.message };
  }
}

/**
 * Send password reset email with link to frontend /reset-password?token=...
 */
export async function sendPasswordResetEmail(to, token, lang = 'uk') {
  const transporter = getTransporter();
  if (!transporter) {
    console.error('Cannot send password reset email: SMTP not configured');
    return { ok: false, error: 'Email not configured' };
  }

  const baseUrl = (process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

  const texts = {
    uk: {
      subject: 'Відновлення пароля — lehko.space',
      title: 'Відновлення пароля',
      body: `
        <p style="margin:0 0 16px 0;">Ви (або хтось інший) запросили відновлення пароля для акаунта <strong>lehko.space</strong>.</p>
        <p style="margin:0 0 16px 0;">Натисніть кнопку нижче, щоб встановити новий пароль:</p>
        ${ctaButton(resetUrl, 'Встановити новий пароль 🔑')}
        <p style="margin:0 0 8px 0;font-size:13px;color:#94a3b8;">Або скопіюйте посилання:</p>
        <p style="margin:0 0 16px 0;font-size:13px;word-break:break-all;"><a href="${resetUrl}" style="color:#7c3aed;">${resetUrl}</a></p>
        <p style="margin:0 0 8px 0;font-size:13px;color:#94a3b8;">⏱ Посилання дійсне 1 годину.</p>
        <p style="margin:0;font-size:13px;color:#94a3b8;">Якщо ви не запитували відновлення пароля — просто проігноруйте цей лист.</p>
      `,
      text: `Відновлення пароля: ${resetUrl}\n\nПосилання дійсне 1 годину.`
    },
    en: {
      subject: 'Password reset — lehko.space',
      title: 'Password reset',
      body: `
        <p style="margin:0 0 16px 0;">You (or someone else) requested a password reset for your <strong>lehko.space</strong> account.</p>
        <p style="margin:0 0 16px 0;">Click the button below to set a new password:</p>
        ${ctaButton(resetUrl, 'Set new password 🔑')}
        <p style="margin:0 0 8px 0;font-size:13px;color:#94a3b8;">Or copy this link:</p>
        <p style="margin:0 0 16px 0;font-size:13px;word-break:break-all;"><a href="${resetUrl}" style="color:#7c3aed;">${resetUrl}</a></p>
        <p style="margin:0 0 8px 0;font-size:13px;color:#94a3b8;">⏱ This link is valid for 1 hour.</p>
        <p style="margin:0;font-size:13px;color:#94a3b8;">If you didn't request a password reset, just ignore this email.</p>
      `,
      text: `Password reset: ${resetUrl}\n\nThis link is valid for 1 hour.`
    }
  };

  const content = texts[lang] || texts.uk;

  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject: content.subject,
      text: content.text,
      html: brandedHtml({ title: content.title, body: content.body, lang })
    });
    return { ok: true };
  } catch (err) {
    console.error('SendPulse/SMTP send error:', err);
    return { ok: false, error: err.message };
  }
}

/**
 * Send the monthly affiliate performance report email.
 *
 * @param {object} opts
 * @param {string}  opts.to
 * @param {string}  opts.monthLabel       e.g. "Серпень 2026"
 * @param {number}  opts.totalClicks
 * @param {number}  opts.uniqueClicks
 * @param {number}  opts.totalLeads
 * @param {number}  opts.totalSales
 * @param {number}  opts.salesRevenue
 * @param {number}  opts.totalEarnings    commission earned this month
 * @param {number}  opts.balance          current account balance
 * @param {number}  opts.commissionPct
 * @param {object|null} opts.topLink      { link_name, total_clicks, unique_code }
 * @param {string|null} opts.sheetUrl     Google Sheets URL or null
 */
export async function sendMonthlyAffiliateReport(opts) {
  const transporter = getTransporter();
  if (!transporter) {
    console.error('Cannot send monthly report: SMTP not configured');
    return { ok: false, error: 'Email not configured' };
  }

  const {
    to, monthLabel,
    totalClicks, uniqueClicks,
    totalLeads, totalSales, salesRevenue,
    totalEarnings, balance, commissionPct,
    topLink, sheetUrl
  } = opts;

  const baseUrl = (process.env.FRONTEND_URL || process.env.APP_URL || 'https://lehko.space').replace(/\/$/, '');

  // ── Logo SVG (inline, no external image dependency) ────────────────────────
  const logoSvg = `
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="12" fill="url(#lg)"/>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stop-color="#7c3aed"/>
          <stop offset="1" stop-color="#6366f1"/>
        </linearGradient>
      </defs>
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
            font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
            font-size="26" font-weight="800" fill="white">L</text>
    </svg>`;

  // ── Stat card helper ────────────────────────────────────────────────────────
  const statCard = (iconChar, label, value, accent) => `
    <td width="50%" style="padding:6px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
        <tr>
          <td style="padding:16px;">
            <div style="width:36px;height:36px;border-radius:10px;background:${accent};
                        display:inline-flex;align-items:center;justify-content:center;
                        font-size:18px;margin-bottom:10px;">${iconChar}</div>
            <div style="font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;
                        letter-spacing:0.05em;margin-bottom:4px;">${label}</div>
            <div style="font-size:22px;font-weight:800;color:#1e293b;">${value}</div>
          </td>
        </tr>
      </table>
    </td>`;

  // ── Google Sheets button ────────────────────────────────────────────────────
  const sheetsBtn = sheetUrl ? `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 16px auto;">
      <tr>
        <td align="center" style="background:#ffffff;border:2px solid #16a34a;border-radius:12px;">
          <a href="${sheetUrl}" target="_blank"
             style="display:inline-flex;align-items:center;gap:10px;padding:13px 28px;
                    font-size:14px;font-weight:600;color:#16a34a;text-decoration:none;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;">
              <rect x="3" y="3" width="18" height="18" rx="3" fill="#16a34a"/>
              <line x1="3" y1="9" x2="21" y2="9" stroke="white" stroke-width="1.5"/>
              <line x1="3" y1="15" x2="21" y2="15" stroke="white" stroke-width="1.5"/>
              <line x1="9" y1="3" x2="9" y2="21" stroke="white" stroke-width="1.5"/>
              <line x1="15" y1="3" x2="15" y2="21" stroke="white" stroke-width="1.5"/>
            </svg>
            Детальний звіт у Google Таблицях →
          </a>
        </td>
      </tr>
    </table>` : '';

  // ── Top link card ────────────────────────────────────────────────────────────
  const topLinkBlock = topLink ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="margin:0 0 24px 0;">
      <tr>
        <td style="font-size:13px;font-weight:700;color:#475569;text-transform:uppercase;
                   letter-spacing:0.06em;padding-bottom:10px;">🔗 Топ посилання місяця</td>
      </tr>
      <tr>
        <td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="background:linear-gradient(135deg,#fef9c3,#fef08a);
                        border-radius:14px;border:1.5px solid #fbbf24;">
            <tr>
              <td style="padding:16px 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <div style="font-size:20px;margin-bottom:4px;">🥇</div>
                      <div style="font-size:15px;font-weight:700;color:#78350f;
                                  word-break:break-all;">${topLink.link_name}</div>
                      <div style="font-size:12px;color:#92400e;margin-top:2px;">
                        ${topLink.unique_code}
                      </div>
                    </td>
                    <td align="right" style="white-space:nowrap;vertical-align:top;">
                      <div style="display:inline-block;background:#7c3aed;color:#fff;
                                  border-radius:999px;padding:4px 14px;font-size:13px;
                                  font-weight:700;">${topLink.total_clicks} кліків</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>` : '';

  // ── Full HTML ────────────────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Звіт за ${monthLabel}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;
             font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="background:#f1f5f9;padding:40px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="max-width:520px;background:#ffffff;border-radius:20px;
                    overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.10);">

        <!-- Accent bar -->
        <tr><td style="height:6px;background:linear-gradient(90deg,#7c3aed,#6366f1);"></td></tr>

        <!-- Logo -->
        <tr>
          <td align="center" style="padding:32px 32px 8px 32px;">
            ${logoSvg}
          </td>
        </tr>

        <!-- Title -->
        <tr>
          <td align="center" style="padding:12px 32px 4px 32px;">
            <h1 style="margin:0;font-size:24px;font-weight:800;color:#1e293b;">
              Звіт за ${monthLabel} 📊
            </h1>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:6px 32px 28px 32px;">
            <p style="margin:0;font-size:14px;color:#64748b;">
              Ваша статистика за минулий місяць 👋
            </p>
          </td>
        </tr>

        <!-- Stat cards 2x2 -->
        <tr>
          <td style="padding:0 26px 8px 26px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                ${statCard('🖱', 'Кліки', `${totalClicks.toLocaleString('uk-UA')} <span style="font-size:13px;font-weight:500;color:#94a3b8;">всього</span><br><span style="font-size:14px;font-weight:700;">${uniqueClicks.toLocaleString('uk-UA')}</span> <span style="font-size:13px;color:#94a3b8;">унікальних</span>`, '#ede9fe')}
                ${statCard('🎯', 'Ліди', `${totalLeads.toLocaleString('uk-UA')}`, '#fff7ed')}
              </tr>
              <tr>
                ${statCard('✅', 'Продажі', `${totalSales.toLocaleString('uk-UA')} <span style="font-size:13px;color:#94a3b8;">× ${salesRevenue.toLocaleString('uk-UA')} ₴</span>`, '#f0fdf4')}
                ${statCard('📈', 'Заробіток', `${totalEarnings.toLocaleString('uk-UA')} ₴`, '#ecfdf5')}
              </tr>
            </table>
          </td>
        </tr>

        <!-- Balance banner -->
        <tr>
          <td style="padding:8px 26px 24px 26px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                   style="background:linear-gradient(135deg,#7c3aed,#6366f1);border-radius:14px;">
              <tr>
                <td style="padding:18px 20px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <div style="font-size:12px;color:rgba(255,255,255,0.75);
                                    text-transform:uppercase;letter-spacing:0.06em;
                                    margin-bottom:4px;">💳 Поточний баланс</div>
                        <div style="font-size:26px;font-weight:800;color:#ffffff;">
                          ${balance.toLocaleString('uk-UA')} ₴
                        </div>
                      </td>
                      <td align="right" style="vertical-align:middle;">
                        <div style="background:rgba(255,255,255,0.2);color:#fff;
                                    border-radius:999px;padding:6px 16px;font-size:13px;
                                    font-weight:700;">Комісія ${commissionPct}%</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Top link -->
        <tr>
          <td style="padding:0 26px 8px 26px;">
            ${topLinkBlock}
          </td>
        </tr>

        <!-- Buttons -->
        <tr>
          <td style="padding:0 26px 12px 26px;">
            ${sheetsBtn}
          </td>
        </tr>
        <tr>
          <td style="padding:0 26px 32px 26px;">
            ${ctaButton(`${baseUrl}/dashboard`, 'Перейти до дашборду →')}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:0 32px 28px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-top:1px solid #e2e8f0;padding-top:20px;font-size:12px;
                            color:#94a3b8;line-height:1.5;text-align:center;">
                  Ви отримали цей лист, тому що маєте акаунт афілейта на
                  <a href="https://lehko.space" style="color:#7c3aed;text-decoration:none;">lehko.space</a>.
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = `Звіт за ${monthLabel}\n\nКліки: ${totalClicks} (${uniqueClicks} унікальних)\nЛіди: ${totalLeads}\nПродажі: ${totalSales} (${salesRevenue} ₴)\nЗаробіток: ${totalEarnings} ₴\nБаланс: ${balance} ₴\n${sheetUrl ? `\nДетальний звіт: ${sheetUrl}\n` : ''}\nДашборд: ${baseUrl}/dashboard`;

  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject: `Ваш звіт за ${monthLabel} 📊 — lehko.space`,
      text,
      html
    });
    return { ok: true };
  } catch (err) {
    console.error('Monthly report send error:', err);
    return { ok: false, error: err.message };
  }
}

/**
 * Add subscriber to SendPulse address book via API.
 * Uses SendPulse REST API v2: https://sendpulse.com/integrations/api
 * Requires SENDPULSE_API_USER_ID and SENDPULSE_API_SECRET env vars.
 * @param {string} email
 * @param {object} [variables] - optional contact variables, e.g. { name: '...' }
 */
export async function addSubscriberToSendPulse(email, variables = {}) {
  const clientId = process.env.SENDPULSE_API_USER_ID;
  const clientSecret = process.env.SENDPULSE_API_SECRET;
  const addressBookId = process.env.SENDPULSE_ADDRESS_BOOK_ID;

  if (!clientId || !clientSecret || !addressBookId) {
    console.warn('SendPulse API not configured: missing SENDPULSE_API_USER_ID, SENDPULSE_API_SECRET, or SENDPULSE_ADDRESS_BOOK_ID');
    return { ok: false, error: 'SendPulse API not configured' };
  }

  try {
    // 1. Get access token
    const tokenRes = await fetch('https://api.sendpulse.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('SendPulse token error:', errText);
      return { ok: false, error: 'Failed to get SendPulse token' };
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Add subscriber to address book
    const addRes = await fetch(`https://api.sendpulse.com/addressbooks/${addressBookId}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        emails: [
          {
            email,
            variables: variables
          }
        ]
      })
    });

    if (!addRes.ok) {
      const errText = await addRes.text();
      console.error('SendPulse add subscriber error:', errText);
      return { ok: false, error: 'Failed to add subscriber' };
    }

    const result = await addRes.json();
    console.log('✅ SendPulse: subscriber added:', email, result);
    return { ok: true, result };
  } catch (err) {
    console.error('SendPulse API error:', err);
    return { ok: false, error: err.message };
  }
}
