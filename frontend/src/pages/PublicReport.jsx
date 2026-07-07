import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../config/api.js';

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

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{report?.title || 'Public Report'}</h1>
              <p className="text-sm text-slate-500 mt-1">Powered by LehkoTrack</p>
            </div>
            <a href={downloadUrl} className="px-4 py-2 rounded-lg bg-violet-600 text-white font-semibold">
              Download Excel (CSV)
            </a>
          </div>
        </div>

        {report?.type === 'links_compare' && (
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
                {(report.items || []).map((i) => (
                  <tr key={i.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <p className="font-semibold text-slate-900">{i.name}</p>
                      <p className="text-xs text-slate-500 break-all">{i.original_url}</p>
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
        )}

        {report?.type === 'affiliates_overview' && (
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
                {(report.items || []).map((i) => (
                  <tr key={i.user_id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{i.email}</td>
                    <td className="px-3 py-2 text-right">{i.conversions}</td>
                    <td className="px-3 py-2 text-right">{i.pending_conversions}</td>
                    <td className="px-3 py-2 text-right">{Number(i.approved_revenue || 0).toLocaleString('uk-UA')}</td>
                    <td className="px-3 py-2 text-right">{Number(i.affiliate_earnings || 0).toLocaleString('uk-UA')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
