/**
 * Affiliate Monthly Report Service
 *
 * On the 3rd of each month at 09:00 Kyiv time, sends every affiliate user
 * a branded email with their stats for the previous calendar month plus
 * a link to a freshly-generated Google Sheet with the full breakdown.
 */

import sequelize from '../config/database.js';
import { User } from '../models/index.js';
import { google } from 'googleapis';
import { sendMonthlyAffiliateReport } from './email.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns { start: Date, end: Date, label: string } for the previous month. */
export function previousMonthRange(now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-based, so this is already "previous" in UTC logic
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end   = new Date(Date.UTC(y, m, 1));   // exclusive upper bound
  const months = [
    'Січень','Лютий','Березень','Квітень','Травень','Червень',
    'Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'
  ];
  const prevMonthIndex = m === 0 ? 11 : m - 1;
  const prevYear = m === 0 ? y - 1 : y;
  const label = `${months[prevMonthIndex]} ${prevYear}`;
  return { start, end, label };
}

// ─── Stats query ─────────────────────────────────────────────────────────────

/**
 * Fetch all stats for one affiliate for [start, end).
 */
export async function getAffiliateMonthStats(userId, start, end) {
  const startStr = start.toISOString().slice(0, 19).replace('T', ' ');
  const endStr   = end.toISOString().slice(0, 19).replace('T', ' ');

  // Aggregate clicks per link
  const [clickRows] = await sequelize.query(`
    SELECT
      l.id           AS link_id,
      l.name         AS link_name,
      l.unique_code,
      l.original_url,
      COUNT(c.id)                              AS total_clicks,
      COUNT(DISTINCT c.visitor_fingerprint)    AS unique_clicks
    FROM links l
    LEFT JOIN clicks c
      ON c.link_id = l.id
      AND c.created_at >= ? AND c.created_at < ?
    WHERE l.user_id = ?
    GROUP BY l.id
    ORDER BY total_clicks DESC
  `, { replacements: [startStr, endStr, userId] });

  // Aggregate conversions per link
  const [convRows] = await sequelize.query(`
    SELECT
      l.id           AS link_id,
      l.name         AS link_name,
      l.unique_code,
      l.original_url,
      SUM(CASE WHEN cv.event_type = 'sale' THEN 1 ELSE 0 END)               AS sales_count,
      SUM(CASE WHEN cv.event_type = 'sale' THEN cv.order_value ELSE 0 END)  AS sales_revenue,
      SUM(CASE WHEN cv.event_type = 'lead' THEN 1 ELSE 0 END)               AS lead_count,
      SUM(CASE WHEN cv.event_type = 'lead' THEN cv.order_value ELSE 0 END)  AS lead_revenue
    FROM links l
    LEFT JOIN conversions cv
      ON cv.link_id = l.id
      AND cv.created_at >= ? AND cv.created_at < ?
    WHERE l.user_id = ?
    GROUP BY l.id
  `, { replacements: [startStr, endStr, userId] });

  // Merge by link_id
  const convMap = new Map(convRows.map(r => [r.link_id, r]));

  const links = clickRows.map(r => {
    const cv = convMap.get(r.link_id) || {};
    const commission = 0; // filled later with user percent
    return {
      link_id:       r.link_id,
      link_name:     r.link_name || r.unique_code,
      unique_code:   r.unique_code,
      original_url:  r.original_url,
      total_clicks:  Number(r.total_clicks || 0),
      unique_clicks: Number(r.unique_clicks || 0),
      sales_count:   Number(cv.sales_count || 0),
      sales_revenue: Number(cv.sales_revenue || 0),
      lead_count:    Number(cv.lead_count || 0),
      lead_revenue:  Number(cv.lead_revenue || 0),
    };
  });

  // Totals
  const totalClicks   = links.reduce((s, l) => s + l.total_clicks, 0);
  const uniqueClicks  = links.reduce((s, l) => s + l.unique_clicks, 0);
  const totalSales    = links.reduce((s, l) => s + l.sales_count, 0);
  const salesRevenue  = links.reduce((s, l) => s + l.sales_revenue, 0);
  const totalLeads    = links.reduce((s, l) => s + l.lead_count, 0);

  return { links, totalClicks, uniqueClicks, totalSales, salesRevenue, totalLeads };
}

// ─── Google Sheets ────────────────────────────────────────────────────────────

/**
 * Create a Google Sheet (via Service Account) with a detailed monthly report
 * for one affiliate. Returns the public URL of the sheet.
 */
async function createReportSheet(user, stats, monthLabel) {
  const saEmail = process.env.GOOGLE_SA_EMAIL;
  const saKey   = (process.env.GOOGLE_SA_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!saEmail || !saKey) {
    console.warn('[MonthlyReport] Google SA not configured — skipping sheet creation');
    return null;
  }

  const auth = new google.auth.JWT(saEmail, null, saKey, [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
  ]);

  const sheets = google.sheets({ version: 'v4', auth });
  const drive  = google.drive({ version: 'v3', auth });

  const commissionPct = parseFloat(user.affiliate_commission_percent ?? 0);
  const title = `LehkoTrack — ${user.email} — ${monthLabel}`;

  // Create spreadsheet
  const created = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
      sheets: [{ properties: { title: 'Звіт' } }]
    }
  });

  const spreadsheetId  = created.data.spreadsheetId;
  const spreadsheetUrl = created.data.spreadsheetUrl;

  // Make it publicly readable
  await drive.permissions.create({
    fileId: spreadsheetId,
    requestBody: { role: 'reader', type: 'anyone' }
  }).catch(() => {});

  // ── Build rows ──────────────────────────────────────────────────────────────
  const headerRow = [
    'Посилання', 'Код', 'Оригінальний URL',
    'Всього кліків', 'Унікальні кліки',
    'Продажі (кількість)', 'Продажі (сума, ₴)',
    'Ліди (кількість)', 'Ліди (сума, ₴)',
    `Заробіток (${commissionPct}%), ₴`
  ];

  const dataRows = stats.links.map(l => {
    const earnings = parseFloat(((l.sales_revenue * commissionPct) / 100).toFixed(2));
    return [
      l.link_name, l.unique_code, l.original_url,
      l.total_clicks, l.unique_clicks,
      l.sales_count, l.sales_revenue,
      l.lead_count, l.lead_revenue,
      earnings
    ];
  });

  const totalEarnings = parseFloat(((stats.salesRevenue * commissionPct) / 100).toFixed(2));
  const totalRow = [
    'РАЗОМ', '', '',
    stats.totalClicks, stats.uniqueClicks,
    stats.totalSales, stats.salesRevenue,
    stats.totalLeads, '',
    totalEarnings
  ];

  const values = [
    [`Звіт за ${monthLabel} — ${user.email}`],
    [],
    headerRow,
    ...dataRows,
    [],
    totalRow
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Звіт!A1',
    valueInputOption: 'RAW',
    requestBody: { values }
  });

  // ── Formatting ───────────────────────────────────────────────────────────────
  const topLinkRowIndex = stats.links.length > 0
    ? dataRows.indexOf(dataRows.reduce((best, r, i) =>
        dataRows[i][3] > dataRows[best][3] ? i : best, 0)) + 3  // 0-based sheet row (header at row 2)
    : -1;

  const requests = [];

  // Title row: merge + violet bg
  requests.push({
    mergeCells: {
      range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 10 },
      mergeType: 'MERGE_ALL'
    }
  });
  requests.push({
    repeatCell: {
      range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 0.486, green: 0.227, blue: 0.929 },
          textFormat: { bold: true, fontSize: 13, foregroundColor: { red: 1, green: 1, blue: 1 } },
          horizontalAlignment: 'CENTER'
        }
      },
      fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
    }
  });

  // Header row: dark bg + white bold
  requests.push({
    repeatCell: {
      range: { sheetId: 0, startRowIndex: 2, endRowIndex: 3 },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 0.122, green: 0.114, blue: 0.192 },
          textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
        }
      },
      fields: 'userEnteredFormat(backgroundColor,textFormat)'
    }
  });

  // Top link row: amber/gold highlight
  if (topLinkRowIndex >= 3) {
    requests.push({
      repeatCell: {
        range: { sheetId: 0, startRowIndex: topLinkRowIndex, endRowIndex: topLinkRowIndex + 1 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 1.0, green: 0.847, blue: 0.298 },
            textFormat: { bold: true }
          }
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat)'
      }
    });
  }

  // Total row: light violet bg + bold
  const totalRowIndex = 3 + dataRows.length + 1;
  requests.push({
    repeatCell: {
      range: { sheetId: 0, startRowIndex: totalRowIndex, endRowIndex: totalRowIndex + 1 },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 0.878, green: 0.824, blue: 0.988 },
          textFormat: { bold: true }
        }
      },
      fields: 'userEnteredFormat(backgroundColor,textFormat)'
    }
  });

  // Auto-resize columns
  requests.push({
    autoResizeDimensions: {
      dimensions: { sheetId: 0, dimension: 'COLUMNS', startIndex: 0, endIndex: 10 }
    }
  });

  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });

  return spreadsheetUrl;
}

// ─── Main send function ──────────────────────────────────────────────────────

/**
 * Generate report for one affiliate and send the email.
 */
export async function sendReportToAffiliate(user, monthLabel, start, end) {
  try {
    const stats = await getAffiliateMonthStats(user.id, start, end);
    const commissionPct = parseFloat(user.affiliate_commission_percent ?? 0);
    const totalEarnings = parseFloat(((stats.salesRevenue * commissionPct) / 100).toFixed(2));
    const balance = parseFloat(user.affiliate_balance ?? 0);
    const topLink = stats.links.find(l => l.total_clicks > 0) || null;

    // Create Google Sheet
    const sheetUrl = await createReportSheet(user, stats, monthLabel);

    // Send email
    const result = await sendMonthlyAffiliateReport({
      to: user.email,
      monthLabel,
      totalClicks:   stats.totalClicks,
      uniqueClicks:  stats.uniqueClicks,
      totalLeads:    stats.totalLeads,
      totalSales:    stats.totalSales,
      salesRevenue:  stats.salesRevenue,
      totalEarnings,
      balance,
      commissionPct,
      topLink,
      sheetUrl
    });

    console.log(`[MonthlyReport] Sent to ${user.email}: ${result.ok ? 'OK' : result.error}`);
    return result;
  } catch (err) {
    console.error(`[MonthlyReport] Error for ${user.email}:`, err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Send monthly reports to ALL affiliates.
 * Called by the cron job (and the manual trigger endpoint).
 */
export async function sendMonthlyReportsToAll(overrideDate) {
  const { start, end, label } = previousMonthRange(overrideDate);
  console.log(`[MonthlyReport] Starting batch for ${label} (${start.toISOString()} – ${end.toISOString()})`);

  const affiliates = await User.findAll({
    where: { role: 'affiliate' },
    attributes: ['id', 'email', 'affiliate_commission_percent', 'affiliate_balance']
  });

  console.log(`[MonthlyReport] Found ${affiliates.length} affiliate(s)`);
  const results = [];

  for (const user of affiliates) {
    const r = await sendReportToAffiliate(user, label, start, end);
    results.push({ email: user.email, ...r });
  }

  return results;
}
