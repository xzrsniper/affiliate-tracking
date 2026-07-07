import { useEffect, useMemo } from 'react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../config/api.js';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';

const COLORS = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#0891b2'];

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function MiniBarChart({ data, dataKey, color, formatter }) {
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

export default function PublicReport() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex,nofollow';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
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

  if (loading) return <div className="min-h-screen bg-slate-50 p-8 text-slate-600">Loading report...</div>;
  if (error) return <div className="min-h-screen bg-slate-50 p-8 text-red-600">{error}</div>;

  const items = report?.items || [];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{report?.title || 'Public Report'}</h1>
              <p className="text-sm text-slate-500 mt-1">Powered by LehkoTrack</p>
            </div>
            <a href={downloadUrl} className="px-4 py-2 rounded-lg bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 transition-colors">
              Download Excel (CSV)
            </a>
          </div>
        </div>

        {report?.type === 'links_compare' && (() => {
          const totalClicks = items.reduce((s, i) => s + Number(i.clicks || 0), 0);
          const totalConv = items.reduce((s, i) => s + Number(i.conversions || 0), 0);
          const totalRevenue = items.reduce((s, i) => s + Number(i.total_revenue || 0), 0);
          const bestCR = items.reduce((best, i) => Math.max(best, Number(i.conversion_rate || 0)), 0);

          const chartData = items.map((i, idx) => ({
            name: (i.name || '').slice(0, 16) || `Link ${idx + 1}`,
            clicks: Number(i.clicks || 0),
            conversions: Number(i.conversions || 0),
            cr: Number(i.conversion_rate || 0),
            revenue: Number(i.total_revenue || 0),
          }));

          const maxClicks = Math.max(...chartData.map(d => d.clicks), 1);
          const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);
          const maxCr = Math.max(...chartData.map(d => d.cr), 1);

          return (
            <>
              {/* Summary stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Total clicks" value={totalClicks.toLocaleString()} />
                <StatCard label="Total conversions" value={totalConv.toLocaleString()} />
                <StatCard label="Best CR" value={`${bestCR}%`} />
                <StatCard label="Total revenue" value={totalRevenue.toLocaleString('uk-UA')} />
              </div>

              {/* Per-link mini cards with progress bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {chartData.map((d, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[idx % COLORS.length] }} />
                      <span className="font-semibold text-slate-800 text-sm truncate">{d.name}</span>
                    </div>
                    <div className="space-y-2 text-xs text-slate-600">
                      <div>
                        <div className="flex justify-between mb-1"><span>Clicks</span><span className="font-bold text-slate-900">{d.clicks.toLocaleString()}</span></div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="h-2 rounded-full" style={{ width: `${(d.clicks / maxClicks) * 100}%`, background: COLORS[idx % COLORS.length] }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1"><span>CR</span><span className="font-bold text-slate-900">{d.cr}%</span></div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="h-2 rounded-full" style={{ width: `${(d.cr / maxCr) * 100}%`, background: COLORS[idx % COLORS.length] }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1"><span>Revenue</span><span className="font-bold text-slate-900">{d.revenue.toLocaleString('uk-UA')}</span></div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="h-2 rounded-full" style={{ width: `${(d.revenue / maxRevenue) * 100}%`, background: COLORS[idx % COLORS.length] }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bar charts row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { title: 'Clicks', dataKey: 'clicks' },
                  { title: 'Conversions', dataKey: 'conversions' },
                  { title: 'Revenue', dataKey: 'revenue' },
                ].map(({ title, dataKey }) => (
                  <div key={title} className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{title}</p>
                    <MiniBarChart
                      data={chartData}
                      dataKey={dataKey}
                      formatter={(v) => v.toLocaleString('uk-UA')}
                    />
                  </div>
                ))}
              </div>

              {/* Detailed table */}
              <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600">
                      <th className="text-left px-3 py-2">Link</th>
                      <th className="text-right px-3 py-2">Clicks</th>
                      <th className="text-right px-3 py-2">Unique</th>
                      <th className="text-right px-3 py-2">Conversions</th>
                      <th className="text-right px-3 py-2">CR %</th>
                      <th className="text-right px-3 py-2">Total revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i, idx) => (
                      <tr key={i.id} className="border-t border-slate-100">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[idx % COLORS.length] }} />
                            <div>
                              <p className="font-semibold text-slate-900">{i.name}</p>
                              <p className="text-xs text-slate-500 break-all">{i.original_url}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">{i.clicks}</td>
                        <td className="px-3 py-2 text-right">{i.unique_clicks}</td>
                        <td className="px-3 py-2 text-right">{i.conversions}</td>
                        <td className="px-3 py-2 text-right">{i.conversion_rate}%</td>
                        <td className="px-3 py-2 text-right">{Number(i.total_revenue || 0).toLocaleString('uk-UA')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          );
        })()}

        {report?.type === 'affiliates_overview' && (() => {
          const totalConv = items.reduce((s, i) => s + Number(i.conversions || 0), 0);
          const totalPending = items.reduce((s, i) => s + Number(i.pending_conversions || 0), 0);
          const totalRevenue = items.reduce((s, i) => s + Number(i.approved_revenue || 0), 0);
          const totalEarnings = items.reduce((s, i) => s + Number(i.affiliate_earnings || 0), 0);

          const chartData = items.map((i, idx) => ({
            name: (i.email || '').split('@')[0].slice(0, 14),
            conversions: Number(i.conversions || 0),
            earnings: Number(i.affiliate_earnings || 0),
            revenue: Number(i.approved_revenue || 0),
          }));

          return (
            <>
              {/* Summary stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Total conversions" value={totalConv.toLocaleString()} />
                <StatCard label="Pending" value={totalPending.toLocaleString()} />
                <StatCard label="Approved revenue" value={totalRevenue.toLocaleString('uk-UA')} />
                <StatCard label="Total earnings" value={totalEarnings.toLocaleString('uk-UA')} />
              </div>

              {/* Bar charts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Conversions by affiliate</p>
                  <MiniBarChart
                    data={chartData}
                    dataKey="conversions"
                    formatter={(v) => v.toLocaleString()}
                  />
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Earnings by affiliate</p>
                  <MiniBarChart
                    data={chartData}
                    dataKey="earnings"
                    formatter={(v) => v.toLocaleString('uk-UA')}
                  />
                </div>
              </div>

              {/* Detailed table */}
              <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600">
                      <th className="text-left px-3 py-2">Affiliate</th>
                      <th className="text-right px-3 py-2">Conversions</th>
                      <th className="text-right px-3 py-2">Pending</th>
                      <th className="text-right px-3 py-2">Approved revenue</th>
                      <th className="text-right px-3 py-2">Earnings</th>
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
                        <td className="px-3 py-2 text-right">{Number(i.approved_revenue || 0).toLocaleString('uk-UA')}</td>
                        <td className="px-3 py-2 text-right">{Number(i.affiliate_earnings || 0).toLocaleString('uk-UA')}</td>
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
