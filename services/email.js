import nodemailer from 'nodemailer';

const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS || process.env.SENDPULSE_SMTP_USER || 'noreply@example.com';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'lehko.space';

function getPublicSiteUrl() {
  return (process.env.FRONTEND_URL || process.env.APP_URL || 'https://lehko.space').replace(/\/$/, '');
}

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
 * Branded HTML email wrapper for lehko.space (logo header + white card body).
 * @param {object} opts
 * @param {string} opts.title  - email heading text
 * @param {string} opts.body   - inner HTML (paragraphs, button, etc.)
 * @param {string} [opts.lang] - 'uk' | 'en'
 */
function brandedHtml({ title, body, lang = 'uk' }) {
  const siteUrl = getPublicSiteUrl();
  const logoUrl = `${siteUrl}/logo-on-dark.png`;
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
          <!-- Logo header (matches logo-on-dark black canvas) -->
          <tr>
            <td align="center" style="background-color:#000000;padding:28px 32px;">
              <a href="${siteUrl}" target="_blank" style="text-decoration:none;border:0;outline:none;">
                <img
                  src="${logoUrl}"
                  alt="lehko space"
                  width="112"
                  height="112"
                  style="display:block;border:0;outline:none;text-decoration:none;width:112px;height:112px;max-width:112px;"
                />
              </a>
            </td>
          </tr>
          <!-- Title -->
          <tr>
            <td align="center" style="padding:28px 32px 0 32px;">
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
      subject: 'Підтвердіть вашу email адресу — Lehko',
      title: 'Підтвердіть email адресу',
      body: `
        <p style="margin:0 0 16px 0;">Вітаємо! 👋</p>
        <p style="margin:0 0 16px 0;">Дякуємо за реєстрацію в <strong>Lehko</strong>. Для завершення реєстрації підтвердіть вашу email адресу, натиснувши кнопку нижче:</p>
        ${ctaButton(verifyUrl, 'Підтвердити email ✉️')}
        <p style="margin:0 0 8px 0;font-size:13px;color:#94a3b8;">Або скопіюйте посилання:</p>
        <p style="margin:0 0 16px 0;font-size:13px;word-break:break-all;"><a href="${verifyUrl}" style="color:#7c3aed;">${verifyUrl}</a></p>
        <p style="margin:0;font-size:13px;color:#94a3b8;">⏱ Посилання дійсне 24 години.</p>
      `,
      text: `Підтвердіть email: ${verifyUrl}\n\nПосилання дійсне 24 години.`
    },
    en: {
      subject: 'Confirm your email address — Lehko',
      title: 'Confirm your email',
      body: `
        <p style="margin:0 0 16px 0;">Hello! 👋</p>
        <p style="margin:0 0 16px 0;">Thanks for signing up for <strong>Lehko</strong>. To finish registration, please confirm your email address by clicking the button below:</p>
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
      subject: 'Підтвердіть зміну пароля — Lehko',
      title: 'Підтвердження зміни пароля',
      body: `
        <p style="margin:0 0 16px 0;">Ви запросили зміну пароля для вашого акаунта в <strong>Lehko</strong>.</p>
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
      subject: 'Confirm password change — Lehko',
      title: 'Confirm password change',
      body: `
        <p style="margin:0 0 16px 0;">You requested a password change for your <strong>Lehko</strong> account.</p>
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
      subject: 'Відновлення пароля — Lehko',
      title: 'Відновлення пароля',
      body: `
        <p style="margin:0 0 16px 0;">Ви (або хтось інший) запросили відновлення пароля для акаунта <strong>Lehko</strong>.</p>
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
      subject: 'Password reset — Lehko',
      title: 'Password reset',
      body: `
        <p style="margin:0 0 16px 0;">You (or someone else) requested a password reset for your <strong>Lehko</strong> account.</p>
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
 * Send a public link / comparison report email (branded summary + CTAs + optional CSV).
 *
 * @param {object} opts
 * @param {string} opts.to
 * @param {'uk'|'en'} [opts.lang]
 * @param {'link_single'|'links_compare'} opts.type
 * @param {string} opts.title
 * @param {string} [opts.periodLabel]
 * @param {string} opts.reportUrl
 * @param {string} opts.exportUrl
 * @param {Array<{label:string,value:string}>} opts.stats
 * @param {Array<Array<string|number>>} [opts.tableRows] - optional small HTML table rows [name, clicks, conv, revenue]
 * @param {{ filename: string, content: string, contentType?: string }|null} [opts.attachment]
 */
export async function sendPublicReportEmail(opts) {
  const transporter = getTransporter();
  if (!transporter) {
    console.error('Cannot send report email: SMTP not configured');
    return { ok: false, error: 'Email not configured' };
  }

  const {
    to,
    lang = 'uk',
    type,
    title,
    periodLabel = '',
    reportUrl,
    exportUrl,
    stats = [],
    tableRows = [],
    attachment = null
  } = opts;

  const isUk = lang !== 'en';
  const typeLabel = type === 'links_compare'
    ? (isUk ? 'Порівняння посилань' : 'Links comparison')
    : (isUk ? 'Звіт по посиланню' : 'Link report');

  const texts = {
    uk: {
      subject: `${title} — Lehko`,
      intro: `Ваш ${typeLabel.toLowerCase()} готовий.`,
      period: 'Період',
      openReport: 'Відкрити звіт',
      downloadCsv: 'Завантажити CSV',
      tableTitle: 'Короткий огляд',
      footerNote: 'Лист надіслано з вашого акаунта lehko.space.'
    },
    en: {
      subject: `${title} — Lehko`,
      intro: `Your ${typeLabel.toLowerCase()} is ready.`,
      period: 'Period',
      openReport: 'Open report',
      downloadCsv: 'Download CSV',
      tableTitle: 'Quick overview',
      footerNote: 'This email was sent from your lehko.space account.'
    }
  };
  const t = texts[isUk ? 'uk' : 'en'];

  const statCards = stats.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 8px 0;">
        ${stats.reduce((html, s, idx) => {
          const cell = `<td width="50%" style="padding:6px;vertical-align:top;">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;">
              <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">${s.label}</div>
              <div style="font-size:20px;font-weight:800;color:#1e293b;">${s.value}</div>
            </div>
          </td>`;
          if (idx % 2 === 0) return `${html}<tr>${cell}`;
          return `${html}${cell}</tr>`;
        }, '')}${stats.length % 2 === 1 ? '<td width="50%" style="padding:6px;"></td></tr>' : ''}
      </table>`
    : '';

  const tableBlock = tableRows.length
    ? `<div style="margin:16px 0 8px 0;">
        <p style="margin:0 0 8px 0;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">${t.tableTitle}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          <tr style="background:#f8fafc;">
            <th align="left" style="padding:10px 12px;font-size:11px;color:#64748b;text-transform:uppercase;">${isUk ? 'Посилання' : 'Link'}</th>
            <th align="right" style="padding:10px 12px;font-size:11px;color:#64748b;text-transform:uppercase;">${isUk ? 'Кліки' : 'Clicks'}</th>
            <th align="right" style="padding:10px 12px;font-size:11px;color:#64748b;text-transform:uppercase;">${isUk ? 'Конверсії' : 'Conv.'}</th>
            <th align="right" style="padding:10px 12px;font-size:11px;color:#64748b;text-transform:uppercase;">${isUk ? 'Дохід' : 'Revenue'}</th>
          </tr>
          ${tableRows.map((r) => `<tr>
            <td style="padding:10px 12px;border-top:1px solid #e2e8f0;font-size:13px;color:#1e293b;">${r[0]}</td>
            <td align="right" style="padding:10px 12px;border-top:1px solid #e2e8f0;font-size:13px;color:#334155;">${r[1]}</td>
            <td align="right" style="padding:10px 12px;border-top:1px solid #e2e8f0;font-size:13px;color:#334155;">${r[2]}</td>
            <td align="right" style="padding:10px 12px;border-top:1px solid #e2e8f0;font-size:13px;font-weight:700;color:#059669;">${r[3]}</td>
          </tr>`).join('')}
        </table>
      </div>`
    : '';

  const body = `
    <p style="margin:0 0 12px 0;">${t.intro}</p>
    ${periodLabel ? `<p style="margin:0 0 16px 0;font-size:13px;color:#64748b;"><strong>${t.period}:</strong> ${periodLabel}</p>` : ''}
    ${statCards}
    ${tableBlock}
    ${ctaButton(reportUrl, `${t.openReport} →`)}
    <p style="margin:0 0 8px 0;font-size:13px;">
      <a href="${exportUrl}" style="color:#7c3aed;font-weight:600;text-decoration:none;">${t.downloadCsv}</a>
    </p>
    <p style="margin:16px 0 0 0;font-size:12px;color:#94a3b8;text-align:center;">${t.footerNote}</p>
  `;

  const textLines = [
    title,
    periodLabel ? `${t.period}: ${periodLabel}` : '',
    ...stats.map((s) => `${s.label}: ${s.value}`),
    '',
    `${t.openReport}: ${reportUrl}`,
    `${t.downloadCsv}: ${exportUrl}`
  ].filter(Boolean);

  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject: t.subject,
      text: textLines.join('\n'),
      html: brandedHtml({ title, body, lang: isUk ? 'uk' : 'en' }),
      attachments: attachment
        ? [{
            filename: attachment.filename,
            content: attachment.content,
            contentType: attachment.contentType || 'text/csv; charset=utf-8'
          }]
        : undefined
    });
    return { ok: true };
  } catch (err) {
    console.error('Send report email error:', err);
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
