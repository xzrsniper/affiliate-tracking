import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, RefreshCw, X } from 'lucide-react';
import api from '../../config/api.js';

const RANGE_OPTIONS = [
  { value: '1', label: '1d' },
  { value: '3', label: '3d' },
  { value: '7', label: '7d' },
  { value: '14', label: '14d' },
  { value: '30', label: '30d' },
  { value: 'all', label: 'All' }
];

export default function AffiliatesTab() {
  const { i18n } = useTranslation();
  const isUk = i18n.language === 'uk';
  const [range, setRange] = useState('7');
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modStatus, setModStatus] = useState('pending');
  const [moderationItems, setModerationItems] = useState([]);
  const [modLoading, setModLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [edits, setEdits] = useState({});

  const money = (v) => `${Number(v || 0).toLocaleString(isUk ? 'uk-UA' : 'en-US')} ${isUk ? '₴' : '$'}`;

  const fetchOverview = async (nextRange = range) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/admin/affiliates/overview', { params: { range: nextRange } });
      setOverview(res.data);
      const nextEdits = {};
      (res.data?.affiliates || []).forEach((a) => {
        nextEdits[a.user_id] = {
          percent: String(a.commission_percent ?? 0),
          balance: String(a.affiliate_balance ?? 0)
        };
      });
      setEdits(nextEdits);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load affiliates stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchModeration = async (status = modStatus) => {
    setModLoading(true);
    try {
      const res = await api.get('/api/admin/affiliates/moderation', { params: { status } });
      setModerationItems(res.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load moderation queue');
      setModerationItems([]);
    } finally {
      setModLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [range]);

  useEffect(() => {
    fetchModeration();
  }, [modStatus]);

  const saveAffiliateSettings = async (affiliateId) => {
    const edit = edits[affiliateId];
    if (!edit) return;
    const commission = parseFloat(edit.percent);
    const balance = parseFloat(edit.balance);
    if (Number.isNaN(commission) || commission < 0 || commission > 100) return;
    if (Number.isNaN(balance) || balance < 0) return;
    setUpdating(true);
    setError('');
    try {
      await api.patch(`/api/admin/users/${affiliateId}/affiliate`, {
        role: 'affiliate',
        commission_percent: commission
      });
      await api.patch(`/api/admin/users/${affiliateId}/balance`, { balance });
      await fetchOverview(range);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update affiliate settings');
    } finally {
      setUpdating(false);
    }
  };

  const handleModeration = async (id, action) => {
    setUpdating(true);
    try {
      await api.post(`/api/admin/conversions/${id}/${action === 'approve' ? 'approve-lead' : 'reject-lead'}`);
      await Promise.all([fetchModeration(modStatus), fetchOverview(range)]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update conversion status');
    } finally {
      setUpdating(false);
    }
  };

  const statsCards = useMemo(() => {
    const s = overview?.summary || {};
    return [
      { label: 'Афілейти', value: s.affiliates || 0 },
      { label: 'Кліки', value: (s.clicks || 0).toLocaleString(isUk ? 'uk-UA' : 'en-US') },
      { label: 'Конверсії', value: (s.conversions || 0).toLocaleString(isUk ? 'uk-UA' : 'en-US') },
      { label: 'Pending', value: (s.pending_conversions || 0).toLocaleString(isUk ? 'uk-UA' : 'en-US') },
      { label: 'Підтв. дохід', value: money(s.approved_revenue) },
      { label: 'Заробіток афілейтів', value: money(s.affiliate_earnings) },
      { label: 'Баланс сумарно', value: money(s.balance_total) }
    ];
  }, [overview, i18n.language]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Афілейти</h1>
            <p className="text-sm text-slate-500">Статистика, баланс і модерація в одному табі.</p>
          </div>
          <div className="flex items-center gap-2">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm border ${range === opt.value ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-200'}`}
              >
                {opt.label}
              </button>
            ))}
            <button onClick={() => { fetchOverview(range); fetchModeration(modStatus); }} className="p-2 rounded-lg border border-slate-200">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-red-700 text-sm">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {statsCards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className="text-lg font-bold text-slate-900 mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-900">Список афілейтів</h2>
        </div>
        {loading ? (
          <p className="p-5 text-sm text-slate-500">Завантаження…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="text-left px-3 py-2">Email</th>
                <th className="text-right px-3 py-2">Лінки</th>
                <th className="text-right px-3 py-2">Кліки</th>
                <th className="text-right px-3 py-2">Конверсії</th>
                <th className="text-right px-3 py-2">Pending</th>
                <th className="text-right px-3 py-2">Підтв. дохід</th>
                <th className="text-right px-3 py-2">Комісія %</th>
                <th className="text-right px-3 py-2">Баланс</th>
                <th className="text-right px-3 py-2">Дії</th>
              </tr>
            </thead>
            <tbody>
              {(overview?.affiliates || []).map((a) => (
                <tr key={a.user_id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{a.email}</td>
                  <td className="px-3 py-2 text-right">{a.links}</td>
                  <td className="px-3 py-2 text-right">{a.clicks}</td>
                  <td className="px-3 py-2 text-right">{a.conversions}</td>
                  <td className="px-3 py-2 text-right">{a.pending_conversions}</td>
                  <td className="px-3 py-2 text-right">{money(a.approved_revenue)}</td>
                  <td className="px-3 py-2 text-right">
                    <input type="number" step="0.1" min="0" max="100" value={edits[a.user_id]?.percent ?? ''} onChange={(e) => setEdits((prev) => ({ ...prev, [a.user_id]: { ...(prev[a.user_id] || {}), percent: e.target.value } }))} className="w-20 text-right px-2 py-1 border border-slate-200 rounded-md" />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input type="number" step="0.01" min="0" value={edits[a.user_id]?.balance ?? ''} onChange={(e) => setEdits((prev) => ({ ...prev, [a.user_id]: { ...(prev[a.user_id] || {}), balance: e.target.value } }))} className="w-24 text-right px-2 py-1 border border-slate-200 rounded-md" />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => saveAffiliateSettings(a.user_id)} disabled={updating} className="px-3 py-1.5 text-xs rounded-lg bg-violet-600 text-white disabled:opacity-50">Зберегти</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Модерація покупок (афілейти)</h2>
          <select value={modStatus} onChange={(e) => setModStatus(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="pending">Очікують</option>
            <option value="approved">Підтверджені</option>
            <option value="rejected">Відхилені</option>
          </select>
        </div>
        {modLoading ? (
          <p className="p-5 text-sm text-slate-500">Завантаження…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="text-left px-3 py-2">Дата</th>
                <th className="text-left px-3 py-2">Афілейт</th>
                <th className="text-left px-3 py-2">Тип</th>
                <th className="text-left px-3 py-2">Лінк</th>
                <th className="text-right px-3 py-2">Сума</th>
                <th className="text-right px-3 py-2">Комісія</th>
                <th className="text-right px-3 py-2">Дії</th>
              </tr>
            </thead>
            <tbody>
              {moderationItems.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(item.created_at).toLocaleString(isUk ? 'uk-UA' : 'en-US')}</td>
                  <td className="px-3 py-2">{item.affiliate_email}</td>
                  <td className="px-3 py-2">{item.event_type === 'sale' ? 'Покупка' : 'Лід'}</td>
                  <td className="px-3 py-2">{item.link_name || item.link_code}</td>
                  <td className="px-3 py-2 text-right">{money(item.order_value)}</td>
                  <td className="px-3 py-2 text-right">{money(item.commission_amount)}</td>
                  <td className="px-3 py-2 text-right">
                    {modStatus === 'pending' ? (
                      <div className="inline-flex gap-2">
                        <button onClick={() => handleModeration(item.id, 'approve')} disabled={updating} className="p-1.5 rounded bg-green-600 text-white"><Check className="w-4 h-4" /></button>
                        <button onClick={() => handleModeration(item.id, 'reject')} disabled={updating} className="p-1.5 rounded bg-red-600 text-white"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {!moderationItems.length && (
                <tr>
                  <td className="px-3 py-6 text-slate-500 text-center" colSpan={7}>Немає записів</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
