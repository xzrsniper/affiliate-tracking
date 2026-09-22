import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import { RefreshCw, TrendingUp } from 'lucide-react';

function formatCompact(value, locale) {
  const n = Number(value) || 0;
  if (n >= 1000000) {
    return `${(n / 1000000).toLocaleString(locale, { maximumFractionDigits: 1 })}m`;
  }
  if (n >= 1000) {
    const rounded = n / 1000;
    return `${rounded.toLocaleString(locale, { maximumFractionDigits: rounded >= 10 ? 0 : 1 })}k`;
  }
  return n.toLocaleString(locale);
}

function parseBucket(bucket) {
  // MySQL DATE_FORMAT → "YYYY-MM-DD HH:00:00"
  const normalized = String(bucket || '').replace(' ', 'T');
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function computeStability(dailyValues) {
  if (!dailyValues.length) return 'empty';
  if (dailyValues.length < 2) return 'stable';
  const mean = dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length;
  if (mean <= 0) return 'stable';
  const variance =
    dailyValues.reduce((sum, v) => sum + (v - mean) ** 2, 0) / dailyValues.length;
  const cv = Math.sqrt(variance) / mean;
  if (cv < 0.28) return 'stable';
  const first = dailyValues.slice(0, Math.ceil(dailyValues.length / 2));
  const second = dailyValues.slice(Math.floor(dailyValues.length / 2));
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  if (avg(second) > avg(first) * 1.12) return 'up';
  if (avg(second) < avg(first) * 0.88) return 'down';
  return 'volatile';
}

/**
 * Bento-modern clicks overview for the dashboard.
 * Expects hourly points: [{ time_bucket, clicks, unique }]
 */
export default function ClicksBentoChart({
  data = [],
  summary = null,
  loading = false,
  timeRange = '7d',
  onRefresh,
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('en') ? 'en-US' : 'uk-UA';
  const isHourly = timeRange === 'today';

  const { sparkData, barData, peakKey, dailyValues } = useMemo(() => {
    const points = (data || [])
      .map((row) => {
        const dt = parseBucket(row.time_bucket);
        if (!dt) return null;
        return {
          dt,
          clicks: Number(row.clicks || 0),
          unique: Number(row.unique || row.unique_clicks || 0),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.dt - b.dt);

    const spark = points.map((p, idx) => ({
      idx,
      clicks: p.clicks,
      label: p.dt.toLocaleString(locale, isHourly
        ? { hour: '2-digit', minute: '2-digit' }
        : { month: 'short', day: 'numeric', hour: '2-digit' }),
    }));

    if (isHourly) {
      const bars = points.map((p) => {
        const key = `${dayKey(p.dt)}-${p.dt.getHours()}`;
        return {
          key,
          label: p.dt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
          clicks: p.clicks,
          unique: p.unique,
        };
      });
      let peak = null;
      let peakVal = -1;
      for (const b of bars) {
        if (b.clicks > peakVal) {
          peakVal = b.clicks;
          peak = b.key;
        }
      }
      return {
        sparkData: spark,
        barData: bars,
        peakKey: peak,
        dailyValues: bars.map((b) => b.clicks),
      };
    }

    const byDay = new Map();
    for (const p of points) {
      const key = dayKey(p.dt);
      const cur = byDay.get(key) || { key, dt: p.dt, clicks: 0 };
      cur.clicks += p.clicks;
      byDay.set(key, cur);
    }

    let bars = Array.from(byDay.values())
      .sort((a, b) => a.dt - b.dt)
      .map((d) => ({
        key: d.key,
        label: d.dt.toLocaleDateString(locale, { weekday: 'short' }),
        clicks: d.clicks,
        dt: d.dt,
      }));

    // Long ranges: collapse to weeks so the bar chart stays readable
    if (bars.length > 42) {
      const byWeek = new Map();
      for (const b of bars) {
        const weekStart = new Date(b.dt);
        weekStart.setHours(0, 0, 0, 0);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const key = dayKey(weekStart);
        const cur = byWeek.get(key) || { key, dt: weekStart, clicks: 0 };
        cur.clicks += b.clicks;
        byWeek.set(key, cur);
      }
      bars = Array.from(byWeek.values())
        .sort((a, b) => a.dt - b.dt)
        .map((d) => ({
          key: d.key,
          label: d.dt.toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
          clicks: d.clicks,
        }));
    } else {
      bars = bars.map(({ key, label, clicks }) => ({ key, label, clicks }));
    }

    let peak = null;
    let peakVal = -1;
    for (const b of bars) {
      if (b.clicks > peakVal) {
        peakVal = b.clicks;
        peak = b.key;
      }
    }

    return {
      sparkData: spark,
      barData: bars,
      peakKey: peak,
      dailyValues: bars.map((b) => b.clicks),
    };
  }, [data, isHourly, locale]);

  const totalClicks = summary?.total_clicks ?? data.reduce((s, r) => s + Number(r.clicks || 0), 0);
  const uniqueClicks = summary?.unique_clicks ?? null;
  const avgPerDay = summary?.avg_per_day ?? (barData.length ? Math.round(totalClicks / barData.length) : 0);
  const uniqueChangePct = summary?.unique_change_pct;
  const stability = computeStability(dailyValues);

  const rangeLabel = (() => {
    switch (timeRange) {
      case 'today':
        return t('dashboard.bentoRangeToday');
      case '30d':
        return t('dashboard.bentoRange30d');
      case 'all':
        return t('dashboard.bentoRangeAll');
      case 'custom':
        return t('dashboard.bentoRangeCustom');
      case '7d':
      default:
        return t('dashboard.bentoRange7d');
    }
  })();

  const stabilityMeta = {
    stable: { label: t('dashboard.bentoStable'), className: 'bg-blue-100 text-blue-700' },
    up: { label: t('dashboard.bentoTrendingUp'), className: 'bg-emerald-100 text-emerald-700' },
    down: { label: t('dashboard.bentoTrendingDown'), className: 'bg-amber-100 text-amber-800' },
    volatile: { label: t('dashboard.bentoVolatile'), className: 'bg-slate-100 text-slate-600' },
    empty: { label: '—', className: 'bg-slate-100 text-slate-500' },
  }[stability];

  const hasData = totalClicks > 0 || (data && data.length > 0);

  return (
    <div className="mb-8 rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_20px_50px_rgba(20,24,40,0.06)] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
          {t('dashboard.bentoSectionTitle')}
        </p>
        {typeof onRefresh === 'function' && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            title={t('dashboard.refreshChart')}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex h-[280px] items-center justify-center rounded-3xl bg-slate-50">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      ) : !hasData ? (
        <div className="flex h-[280px] flex-col items-center justify-center rounded-3xl bg-slate-50 text-slate-400">
          <TrendingUp className="mb-3 h-10 w-10 opacity-40" />
          <p className="text-sm">{t('dashboard.noChartData')}</p>
          <p className="mt-1 text-xs">{t('dashboard.chartHint')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.15fr_0.85fr_0.85fr] lg:grid-rows-[150px_280px]">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-3xl bg-[#111827] p-5 text-white lg:row-span-2">
            <p className="mb-3 text-sm font-medium text-slate-400">
              {t('dashboard.bentoHeroTitle', { range: rangeLabel })}
            </p>
            <div className="text-[52px] font-bold leading-none tracking-[-0.05em]">
              {formatCompact(totalClicks, locale)}
            </div>
            <p className="mt-2 text-sm text-slate-400">{t('dashboard.bentoHeroSubtitle')}</p>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bentoSparkFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#34d399"
                    strokeWidth={3}
                    fill="url(#bentoSparkFill)"
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Unique */}
          <div className="rounded-3xl bg-emerald-50 p-5">
            <p className="mb-1.5 text-xs text-slate-500">{t('dashboard.uniqueClicks')}</p>
            <p className="text-[34px] font-bold leading-none tracking-[-0.04em] text-slate-900">
              {uniqueClicks == null ? '—' : Number(uniqueClicks).toLocaleString(locale)}
            </p>
            {uniqueChangePct == null ? (
              <span className="mt-3 inline-flex rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold text-slate-500">
                —
              </span>
            ) : (
              <span
                className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                  uniqueChangePct >= 0
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {uniqueChangePct >= 0 ? '↑' : '↓'}{' '}
                {Math.abs(uniqueChangePct).toLocaleString(locale, { maximumFractionDigits: 1 })}%
              </span>
            )}
          </div>

          {/* Average */}
          <div className="rounded-3xl bg-sky-50 p-5">
            <p className="mb-1.5 text-xs text-slate-500">{t('dashboard.bentoAvgPerDay')}</p>
            <p className="text-[34px] font-bold leading-none tracking-[-0.04em] text-slate-900">
              {Number(avgPerDay).toLocaleString(locale)}
            </p>
            <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${stabilityMeta.className}`}>
              {stabilityMeta.label}
            </span>
          </div>

          {/* By day / hour bars */}
          <div className="rounded-3xl border border-slate-100 bg-[#fafafa] p-5 lg:col-span-2">
            <p className="mb-3 text-xs text-slate-500">
              {isHourly ? t('dashboard.bentoByHour') : t('dashboard.bentoByDay')}
            </p>
            {barData.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-sm text-slate-400">
                {t('dashboard.noChartData')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={barData} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bentoBarBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                    <linearGradient id="bentoBarGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }}
                    tickLine={false}
                    axisLine={false}
                    interval={barData.length > 14 ? 'preserveStartEnd' : 0}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e5e7eb',
                      fontSize: 12,
                      boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                    }}
                    formatter={(value) => [
                      Number(value).toLocaleString(locale),
                      t('dashboard.totalClicks'),
                    ]}
                  />
                  <Bar dataKey="clicks" radius={[14, 14, 10, 10]} maxBarSize={48}>
                    {barData.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={entry.key === peakKey ? 'url(#bentoBarGreen)' : 'url(#bentoBarBlue)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
