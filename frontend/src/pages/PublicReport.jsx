import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../config/api.js';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const COLORS = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#0891b2'];

// ── Translation dictionary ──────────────────────────────────────────────────
const TRANSLATIONS = {
  uk: {
    loading: 'Завантаження звіту…',
    poweredBy: 'Powered by lehko.space',
    download: 'Завантажити Excel (CSV)',
    // link_single
    clicks: 'Кліки',
    unique: 'унікальних',
    sales: 'Продажі',
    leads: 'Ліди',
    cr: 'CR',
    salesRevenue: 'Дохід з продажів',
    linkInfo: 'Інфо про посилання',
    name: 'Назва',
    destination: 'URL призначення',
    created: 'Створено',
    perfOverview: 'Огляд ефективності',
    metric: 'Метрика',
    value: 'Значення',
    totalClicks: 'Всього кліків',
    uniqueClicks: 'Унікальних кліків',
    convRate: 'Конверсія',
    // links_compare
    bestCr: 'Найкращий CR',
    link: 'Посилання',
    conversions: 'Конверсії',
    convByLink: 'Конверсії по посиланнях',
    // conversions list
    conversionsTitle: 'Конверсії',
    salesLabel: 'Продажі',
    leadsLabel: 'Ліди',
    time: 'Час',
    amount: 'Сума',
    orderId: 'ID замовлення',
    show: '▼ показати',
    hide: '▲ приховати',
    // affiliates_overview
    totalConversions: 'Всього конверсій',
    pending: 'Очікують',
    approvedRevenue: 'Підтверджений дохід',
    totalEarnings: 'Заробіток',
    affiliate: 'Афілейт',
    convByAffiliate: 'Конверсії по афілейтах',
    earningsByAffiliate: 'Заробіток по афілейтах',
    // progress card labels
    clicksLabel: 'Кліки',
    crLabel: 'CR',
    salesRevenueLabel: 'Дохід з продажів',
  },
  en: {
    loading: 'Loading report…',
    poweredBy: 'Powered by lehko.space',
    download: 'Download Excel (CSV)',
    // link_single
    clicks: 'Clicks',
    unique: 'unique',
    sales: 'Sales',
    leads: 'Leads',
    cr: 'CR',
    salesRevenue: 'Sales revenue',
    linkInfo: 'Link info',
    name: 'Name',
    destination: 'Destination URL',
    created: 'Created',
    perfOverview: 'Performance overview',
    metric: 'Metric',
    value: 'Value',
    totalClicks: 'Total clicks',
    uniqueClicks: 'Unique clicks',
    convRate: 'Conversion rate',
    // links_compare
    bestCr: 'Best CR',
    link: 'Link',
    conversions: 'Conversions',
    convByLink: 'Conversions by link',
    // conversions list
    conversionsTitle: 'Conversions',
    salesLabel: 'Sales',
    leadsLabel: 'Leads',
    time: 'Time',
    amount: 'Amount',
    orderId: 'Order ID',
    show: '▼ show',
    hide: '▲ hide',
    // affiliates_overview
    totalConversions: 'Total conversions',
    pending: 'Pending',
    approvedRevenue: 'Approved revenue',
    totalEarnings: 'Total earnings',
    affiliate: 'Affiliate',
    convByAffiliate: 'Conversions by affiliate',
    earningsByAffiliate: 'Earnings by affiliate',
    // progress card labels
    clicksLabel: 'Clicks',
    crLabel: 'CR',
    salesRevenueLabel: 'Sales revenue',
  },
};

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function formatTime(dt, lang) {
  if (!dt) return '—';
  const locale = lang === 'uk' ? 'uk-UA' : 'en-US';
  return new Date(dt).toLocaleString(locale, {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function ConversionsList({ conversions, currency, lang, t }) {
  const [open, setOpen] = useState(false);
  const sales = conversions.filter((c) => c.event_type === 'sale');
  const leads = conversions.filter((c) => c.event_type === 'lead');
  const locale = lang === 'uk' ? 'uk-UA' : 'en-US';

  if (!conversions.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          {t.conversionsTitle}
          {sales.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {sales.length} {t.salesLabel.toLowerCase()}
            </span>
          )}
          {leads.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              {leads.length} {t.leadsLabel.toLowerCase()}
            </span>
          )}
        </span>
        <span className="text-slate-400 text-xs">{open ? t.hide : t.show}</span>
      </button>

      {open && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {[
            { label: t.salesLabel, items: sales, cls: 'text-emerald-700' },
            { label: t.leadsLabel, items: leads, cls: 'text-amber-600' },
          ]
            .filter(({ items }) => items.length > 0)
            .map(({ label, items, cls }) => (
              <div key={label}>
                <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">{label}</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400">
                      <th className="px-4 py-2 text-left">{t.time}</th>
                      <th className="px-4 py-2 text-right">{t.amount}</th>
                      <th className="px-4 py-2 text-left">{t.orderId}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((c) => (
                      <tr key={c.id} className="border-t border-slate-50 hover:bg-slate-50">
                        <td className="px-4 py-2.5 text-slate-600">{formatTime(c.created_at, lang)}</td>
                        <td className={`px-4 py-2.5 font-semibold text-right ${cls}`}>{c.amount.toLocaleString(locale)} {currency}</td>
                        <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{c.order_id || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function MiniBarChart({ data, dataKey, formatter }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
          formatter={formatter}
        />
        <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Language toggle ─────────────────────────────────────────────────────────
function LangToggle({ lang, setLang }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 gap-0.5">
      {['uk', 'en'].map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
            lang === l
              ? 'bg-white text-violet-700 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {l === 'uk' ? '🇺🇦 УКР' : '🇬🇧 ENG'}
        </button>
      ))}
    </div>
  );
}

export default function PublicReport() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);

  // Default to browser language, fall back to 'uk'
  const [lang, setLang] = useState(() => {
    const bl = (navigator.language || '').toLowerCase();
    return bl.startsWith('en') ? 'en' : 'uk';
  });

  const t = TRANSLATIONS[lang] || TRANSLATIONS.uk;
  const locale = lang === 'uk' ? 'uk-UA' : 'en-US';

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex,nofollow';
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/reports/public/${token}`);
        setReport(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load public report');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token]);

  const downloadUrl = useMemo(() => `/api/reports/public/${token}/export`, [token]);
  const currency = report?.currency || '₴';
  const fmtMoney = (v) => `${Number(v || 0).toLocaleString(locale)} ${currency}`;

  if (loading) return <div className="min-h-screen bg-slate-50 p-8 text-slate-600">{t.loading}</div>;
  if (error) return <div className="min-h-screen bg-slate-50 p-8 text-red-600">{error}</div>;

  const items = report?.items || [];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{report?.title || 'Public Report'}</h1>
              <p className="text-sm text-slate-500 mt-1">{t.poweredBy}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <LangToggle lang={lang} setLang={setLang} />
              <a
                href={downloadUrl}
                className="px-4 py-2 rounded-lg bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 transition-colors"
              >
                {t.download}
              </a>
            </div>
          </div>
        </div>

        {/* ── link_single ── */}
        {report?.type === 'link_single' && (() => {
          const link = report.link || {};
          const s = report.stats || {};
          const cr = Number(s.conversion_rate || 0);
          const salesRev = Number(s.sales_revenue || 0);
          const salesCount = Number(s.sales_count || 0);
          const leadCount = Number(s.lead_count || 0);
          const convList = report.conversions || [];

          const perfData = [
            { name: t.clicks,  value: Number(s.clicks || 0) },
            { name: t.unique,  value: Number(s.unique_clicks || 0) },
            { name: t.sales,   value: salesCount },
            { name: t.leads,   value: leadCount },
          ];

          return (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label={t.clicks} value={Number(s.clicks || 0).toLocaleString(locale)} sub={`${Number(s.unique_clicks || 0).toLocaleString(locale)} ${t.unique}`} />
                <StatCard label={t.sales} value={salesCount.toLocaleString(locale)} sub={leadCount > 0 ? `+ ${leadCount} ${t.leads.toLowerCase()}` : undefined} />
                <StatCard label={t.cr} value={`${cr}%`} />
                <StatCard label={t.salesRevenue} value={fmtMoney(salesRev)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.linkInfo}</p>
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">{t.name}</p>
                    <p className="font-semibold text-slate-900">{link.name || link.unique_code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">{t.destination}</p>
                    <a href={link.original_url} target="_blank" rel="noopener noreferrer" className="text-sm text-violet-600 hover:underline break-all">{link.original_url}</a>
                  </div>
                  {link.created_at && (
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">{t.created}</p>
                      <p className="text-sm text-slate-700">{new Date(link.created_at).toLocaleDateString(locale)}</p>
                    </div>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{t.perfOverview}</p>
                  <MiniBarChart data={perfData} dataKey="value" formatter={(v) => v.toLocaleString(locale)} />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs">
                      <th className="text-left px-4 py-3">{t.metric}</th>
                      <th className="text-right px-4 py-3">{t.value}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: t.totalClicks,  value: Number(s.clicks || 0).toLocaleString(locale) },
                      { label: t.uniqueClicks, value: Number(s.unique_clicks || 0).toLocaleString(locale) },
                      { label: t.convRate,     value: `${cr}%` },
                      { label: t.sales,        value: salesCount.toLocaleString(locale), color: 'text-emerald-700 font-bold' },
                      { label: t.salesRevenue, value: fmtMoney(salesRev), color: 'text-emerald-700 font-bold' },
                      ...(leadCount > 0 ? [
                        { label: t.leads, value: leadCount.toLocaleString(locale), color: 'text-amber-600 font-medium' },
                      ] : []),
                    ].map(({ label, value, color }) => (
                      <tr key={label} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-600">{label}</td>
                        <td className={`px-4 py-3 text-right ${color || 'font-semibold text-slate-900'}`}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ConversionsList conversions={convList} currency={currency} lang={lang} t={t} />
            </>
          );
        })()}

        {/* ── links_compare ── */}
        {report?.type === 'links_compare' && (() => {
          const totalClicks   = items.reduce((s, i) => s + Number(i.clicks || 0), 0);
          const totalSales    = items.reduce((s, i) => s + Number(i.sales_count || 0), 0);
          const totalLeads    = items.reduce((s, i) => s + Number(i.lead_count || 0), 0);
          const totalSalesRev = items.reduce((s, i) => s + Number(i.sales_revenue || 0), 0);
          const bestCR        = items.reduce((best, i) => Math.max(best, Number(i.conversion_rate || 0)), 0);

          const chartData = items.map((i, idx) => ({
            name:        (i.name || '').slice(0, 16) || `Link ${idx + 1}`,
            clicks:      Number(i.clicks || 0),
            conversions: Number(i.conversions || 0),
            cr:          Number(i.conversion_rate || 0),
            revenue:     Number(i.sales_revenue || 0),
            sales:       Number(i.sales_count || 0),
            leads:       Number(i.lead_count || 0),
          }));

          const maxClicks  = Math.max(...chartData.map(d => d.clicks), 1);
          const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);
          const maxCr      = Math.max(...chartData.map(d => d.cr), 1);

          return (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label={t.totalClicks}  value={totalClicks.toLocaleString(locale)} />
                <StatCard label={t.sales}        value={totalSales.toLocaleString(locale)} sub={`+ ${totalLeads} ${t.leads.toLowerCase()}`} />
                <StatCard label={t.bestCr}       value={`${bestCR}%`} />
                <StatCard label={t.salesRevenue} value={fmtMoney(totalSalesRev)} />
              </div>

              {/* Per-link mini cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {chartData.map((d, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[idx % COLORS.length] }} />
                      <span className="font-semibold text-slate-800 text-sm truncate">{d.name}</span>
                    </div>
                    <div className="space-y-2 text-xs text-slate-600">
                      <div>
                        <div className="flex justify-between mb-1"><span>{t.clicksLabel}</span><span className="font-bold text-slate-900">{d.clicks.toLocaleString(locale)}</span></div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="h-2 rounded-full" style={{ width: `${(d.clicks / maxClicks) * 100}%`, background: COLORS[idx % COLORS.length] }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1"><span>{t.crLabel}</span><span className="font-bold text-slate-900">{d.cr}%</span></div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="h-2 rounded-full" style={{ width: `${(d.cr / maxCr) * 100}%`, background: COLORS[idx % COLORS.length] }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1"><span>{t.salesRevenueLabel}</span><span className="font-bold text-slate-900">{fmtMoney(d.revenue)}</span></div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="h-2 rounded-full" style={{ width: `${(d.revenue / maxRevenue) * 100}%`, background: COLORS[idx % COLORS.length] }} />
                        </div>
                      </div>
                      {d.leads > 0 && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                          <span className="text-amber-700 font-medium">{d.leads} {t.leads.toLowerCase()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bar charts row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { title: t.clicks,      dataKey: 'clicks',      fmt: (v) => v.toLocaleString(locale) },
                  { title: t.conversions, dataKey: 'conversions', fmt: (v) => v.toLocaleString(locale) },
                  { title: t.salesRevenue,dataKey: 'revenue',     fmt: (v) => `${Number(v).toLocaleString(locale)} ${currency}` },
                ].map(({ title, dataKey, fmt }) => (
                  <div key={title} className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{title}</p>
                    <MiniBarChart data={chartData} dataKey={dataKey} formatter={fmt} />
                  </div>
                ))}
              </div>

              {/* Per-link conversions */}
              {items.some(i => (i.conversions_list || []).length > 0) && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.convByLink}</p>
                  {items.map((i, idx) => (
                    (i.conversions_list || []).length > 0 && (
                      <div key={i.id}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[idx % COLORS.length] }} />
                          <span className="text-sm font-semibold text-slate-700">{i.name}</span>
                        </div>
                        <ConversionsList conversions={i.conversions_list} currency={currency} lang={lang} t={t} />
                      </div>
                    )
                  ))}
                </div>
              )}

              {/* Detailed table */}
              <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs">
                      <th className="text-left px-3 py-3">{t.link}</th>
                      <th className="text-right px-3 py-3">{t.clicks}</th>
                      <th className="text-right px-3 py-3">{t.unique}</th>
                      <th className="text-right px-3 py-3">CR %</th>
                      <th className="text-right px-3 py-3">{t.sales}</th>
                      <th className="text-right px-3 py-3">{t.salesRevenue}</th>
                      <th className="text-right px-3 py-3">{t.leads}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i, idx) => (
                      <tr key={i.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[idx % COLORS.length] }} />
                            <div>
                              <p className="font-semibold text-slate-900">{i.name}</p>
                              <p className="text-xs text-slate-400 break-all">{i.original_url}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-medium">{i.clicks}</td>
                        <td className="px-3 py-3 text-right text-slate-500">{i.unique_clicks}</td>
                        <td className="px-3 py-3 text-right font-medium">{i.conversion_rate}%</td>
                        <td className="px-3 py-3 text-right">
                          {Number(i.sales_count || 0) > 0
                            ? <span className="font-bold text-emerald-700">{i.sales_count}</span>
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {Number(i.sales_revenue || 0) > 0
                            ? <span className="font-bold text-emerald-700">{fmtMoney(i.sales_revenue)}</span>
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {Number(i.lead_count || 0) > 0
                            ? <span className="font-medium text-amber-600">{i.lead_count}</span>
                            : <span className="text-slate-300">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          );
        })()}

        {/* ── affiliates_overview ── */}
        {report?.type === 'affiliates_overview' && (() => {
          const totalConv     = items.reduce((s, i) => s + Number(i.conversions || 0), 0);
          const totalPending  = items.reduce((s, i) => s + Number(i.pending_conversions || 0), 0);
          const totalRevenue  = items.reduce((s, i) => s + Number(i.approved_revenue || 0), 0);
          const totalEarnings = items.reduce((s, i) => s + Number(i.affiliate_earnings || 0), 0);

          const chartData = items.map((i) => ({
            name:        (i.email || '').split('@')[0].slice(0, 14),
            conversions: Number(i.conversions || 0),
            earnings:    Number(i.affiliate_earnings || 0),
            revenue:     Number(i.approved_revenue || 0),
          }));

          return (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label={t.totalConversions} value={totalConv.toLocaleString(locale)} />
                <StatCard label={t.pending}          value={totalPending.toLocaleString(locale)} />
                <StatCard label={t.approvedRevenue}  value={fmtMoney(totalRevenue)} />
                <StatCard label={t.totalEarnings}    value={fmtMoney(totalEarnings)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{t.convByAffiliate}</p>
                  <MiniBarChart data={chartData} dataKey="conversions" formatter={(v) => v.toLocaleString(locale)} />
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{t.earningsByAffiliate}</p>
                  <MiniBarChart data={chartData} dataKey="earnings" formatter={(v) => v.toLocaleString(locale)} />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600">
                      <th className="text-left px-3 py-2">{t.affiliate}</th>
                      <th className="text-right px-3 py-2">{t.conversions}</th>
                      <th className="text-right px-3 py-2">{t.pending}</th>
                      <th className="text-right px-3 py-2">{t.approvedRevenue}</th>
                      <th className="text-right px-3 py-2">{t.totalEarnings}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i, idx) => (
                      <tr key={i.user_id} className="border-t border-slate-100">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[idx % COLORS.length] }} />
                            <span>{i.email}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">{i.conversions}</td>
                        <td className="px-3 py-2 text-right">{i.pending_conversions}</td>
                        <td className="px-3 py-2 text-right">{fmtMoney(i.approved_revenue)}</td>
                        <td className="px-3 py-2 text-right">{fmtMoney(i.affiliate_earnings)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          );
        })()}

      </div>
    </div>
  );
}
