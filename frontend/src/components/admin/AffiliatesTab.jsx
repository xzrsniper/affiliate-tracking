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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AffiliatesTab() {
  const { i18n } = useTranslation();
  const isUk = i18n.language === 'uk';
  const [range, setRange] = useState('7');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [customActive, setCustomActive] = useState(false);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [moderationItems, setModerationItems] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [modLoading, setModLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [conversionsLog, setConversionsLog] = useState([]);
  const [conversionsLoading, setConversionsLoading] = useState(false);
  const [convStatusFilter, setConvStatusFilter] = useState('all');
  const [convEventFilter, setConvEventFilter] = useState('all');
  const [affiliateSearch, setAffiliateSearch] = useState('');
  const [sharing, setSharing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [edits, setEdits] = useState({});

  const money = (v) => `${Number(v || 0).toLocaleString(isUk ? 'uk-UA' : 'en-US')} ${isUk ? '₴' : '$'}`;

  const periodParams = useMemo(() => {
    if (customActive && (dateFrom || dateTo)) {
      const params = {};
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      return params;
    }
    return { range };
  }, [customActive, dateFrom, dateTo, range]);

  const periodLabel = useMemo(() => {
    if (customActive && (dateFrom || dateTo)) {
      return `${dateFrom || '…'} → ${dateTo || '…'}`;
    }
    return RANGE_OPTIONS.find((o) => o.value === range)?.label || range;
  }, [customActive, dateFrom, dateTo, range]);

  const statusLabel = (status) => {
    if (status === 'approved') return isUk ? 'Підтверджено' : 'Approved';
    if (status === 'rejected') return isUk ? 'Відхилено' : 'Rejected';
    if (status === 'pending') return 'Pending';
    return status || '—';
  };

  const statusClass = (status) => {
    if (status === 'approved') return 'bg-green-100 text-green-700';
    if (status === 'rejected') return 'bg-red-100 text-red-700';
    return 'bg-amber-100 text-amber-700';
  };

  const fetchOverview = async (params = periodParams) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/admin/affiliates/overview', { params });
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

  const fetchModeration = async () => {
    setModLoading(true);
    try {
      const res = await api.get('/api/admin/affiliates/moderation', { params: { status: 'pending' } });
      setModerationItems(res.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load moderation queue');
      setModerationItems([]);
    } finally {
      setModLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const [approved, rejected] = await Promise.all([
        api.get('/api/admin/affiliates/moderation', { params: { status: 'approved' } }),
        api.get('/api/admin/affiliates/moderation', { params: { status: 'rejected' } })
      ]);
      const merged = [...(approved.data?.items || []), ...(rejected.data?.items || [])]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setHistoryItems(merged);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load moderation history');
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchConversionsLog = async (params = periodParams) => {
    setConversionsLoading(true);
    try {
      const res = await api.get('/api/admin/affiliates/conversions', {
        params: {
          status: convStatusFilter,
          event_type: convEventFilter,
          limit: 500,
          ...params
        }
      });
      setConversionsLog(res.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load conversions log');
      setConversionsLog([]);
    } finally {
      setConversionsLoading(false);
    }
  };

  const applyPreset = (value) => {
    setRange(value);
    setCustomActive(false);
  };

  const applyCustomRange = () => {
    if (!dateFrom && !dateTo) {
      setError(isUk ? 'Оберіть хоча б одну дату' : 'Select at least one date');
      return;
    }
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setError(isUk ? 'Дата «від» не може бути пізніше за «до»' : 'Start date cannot be after end date');
      return;
    }
    setError('');
    setCustomActive(true);
  };

  useEffect(() => {
    fetchOverview(periodParams);
    fetchConversionsLog(periodParams);
  }, [periodParams, convStatusFilter, convEventFilter]);

  useEffect(() => {
    fetchModeration();
    fetchHistory();
  }, []);

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
      await fetchOverview(periodParams);
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
      await Promise.all([
        fetchModeration(),
        fetchHistory(),
        fetchConversionsLog(periodParams),
        fetchOverview(periodParams)
      ]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update conversion status');
    } finally {
      setUpdating(false);
    }
  };

  const handleShareOverview = async () => {
    setSharing(true);
    try {
      const res = await api.post('/api/reports/share', {
        type: 'affiliates_overview',
        range: customActive ? 'all' : range,
        ...(customActive ? { from: dateFrom || undefined, to: dateTo || undefined } : {})
      });
      await navigator.clipboard.writeText(res.data.url);
      setError('');
      alert('Публічне посилання на звіт скопійовано');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create public report link');
    } finally {
      setSharing(false);
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

  const searchTerm = affiliateSearch.trim().toLowerCase();
  const filteredPending = moderationItems.filter((item) => {
    if (!searchTerm) return true;
    return String(item.affiliate_email || '').toLowerCase().includes(searchTerm);
  });
  const filteredHistory = historyItems.filter((item) => {
    if (!searchTerm) return true;
    return String(item.affiliate_email || '').toLowerCase().includes(searchTerm);
  });
  const filteredConversionsLog = conversionsLog.filter((item) => {
    if (!searchTerm) return true;
    return String(item.affiliate_email || '').toLowerCase().includes(searchTerm)
      || String(item.order_id || '').toLowerCase().includes(searchTerm)
      || String(item.link_name || '').toLowerCase().includes(searchTerm)
      || String(item.link_code || '').toLowerCase().includes(searchTerm);
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Афілейти</h1>
            <p className="text-sm text-slate-500">
              {isUk ? 'Статистика, баланс і модерація в одному табі.' : 'Stats, balance and moderation in one tab.'}
              <span className="ml-2 text-violet-700 font-medium">
                {isUk ? 'Період:' : 'Period:'} {periodLabel}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => applyPreset(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm border ${!customActive && range === opt.value ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-200'}`}
              >
                {opt.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => { fetchOverview(periodParams); fetchModeration(); fetchHistory(); fetchConversionsLog(periodParams); }}
              className="p-2 rounded-lg border border-slate-200"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={handleShareOverview} disabled={sharing} className="px-3 py-1.5 rounded-lg border border-violet-300 bg-violet-50 text-violet-700 text-sm font-semibold disabled:opacity-50">
              {sharing ? (isUk ? 'Створення...' : 'Creating...') : (isUk ? 'Поділитись звітом' : 'Share report')}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">{isUk ? 'Від' : 'From'}</label>
            <input
              type="date"
              value={dateFrom}
              max={dateTo || todayISO()}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">{isUk ? 'До' : 'To'}</label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              max={todayISO()}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            />
          </div>
          <button
            type="button"
            onClick={applyCustomRange}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border ${customActive ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-violet-700 border-violet-300 hover:bg-violet-50'}`}
          >
            {isUk ? 'Застосувати період' : 'Apply range'}
          </button>
          {customActive && (
            <button
              type="button"
              onClick={() => { setCustomActive(false); setDateFrom(''); setDateTo(''); }}
              className="px-3 py-2 rounded-lg text-sm border border-slate-200 text-slate-600 bg-white"
            >
              {isUk ? 'Скинути' : 'Reset'}
            </button>
          )}
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
          <div>
            <h2 className="font-bold text-slate-900">Модерація покупок (усі афілейти)</h2>
            <p className="text-xs text-slate-500 mt-0.5">Черга на підтвердження + історія рішень</p>
          </div>
          <input
            value={affiliateSearch}
            onChange={(e) => setAffiliateSearch(e.target.value)}
            placeholder="Пошук по email афілейта..."
            className="w-64 max-w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
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
              {filteredPending.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(item.created_at).toLocaleString(isUk ? 'uk-UA' : 'en-US')}</td>
                  <td className="px-3 py-2">{item.affiliate_email}</td>
                  <td className="px-3 py-2">{item.event_type === 'sale' ? 'Покупка' : 'Лід'}</td>
                  <td className="px-3 py-2">{item.link_name || item.link_code}</td>
                  <td className="px-3 py-2 text-right">{money(item.order_value)}</td>
                  <td className="px-3 py-2 text-right">{money(item.commission_amount)}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-2">
                      <button onClick={() => handleModeration(item.id, 'approve')} disabled={updating} className="p-1.5 rounded bg-green-600 text-white"><Check className="w-4 h-4" /></button>
                      <button onClick={() => handleModeration(item.id, 'reject')} disabled={updating} className="p-1.5 rounded bg-red-600 text-white"><X className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredPending.length && (
                <tr>
                  <td className="px-3 py-6 text-slate-500 text-center" colSpan={7}>Немає записів</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900">Історія лідів / покупок</h2>
            <p className="text-xs text-slate-500 mt-0.5">Повний лог конверсій по всіх афілейтах</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={convEventFilter}
              onChange={(e) => setConvEventFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="all">Усі типи</option>
              <option value="sale">Покупки</option>
              <option value="lead">Ліди</option>
            </select>
            <select
              value={convStatusFilter}
              onChange={(e) => setConvStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="all">Усі статуси</option>
              <option value="pending">Pending</option>
              <option value="approved">Підтверджено</option>
              <option value="rejected">Відхилено</option>
            </select>
          </div>
        </div>
        {conversionsLoading ? (
          <p className="p-5 text-sm text-slate-500">Завантаження…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="text-left px-3 py-2">Дата</th>
                <th className="text-left px-3 py-2">Афілейт</th>
                <th className="text-left px-3 py-2">Тип</th>
                <th className="text-left px-3 py-2">Лінк</th>
                <th className="text-left px-3 py-2">Order ID</th>
                <th className="text-right px-3 py-2">Сума</th>
                <th className="text-right px-3 py-2">Комісія</th>
                <th className="text-left px-3 py-2">Статус</th>
              </tr>
            </thead>
            <tbody>
              {filteredConversionsLog.map((item) => (
                <tr key={`log-${item.id}`} className="border-t border-slate-100">
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(item.created_at).toLocaleString(isUk ? 'uk-UA' : 'en-US')}</td>
                  <td className="px-3 py-2">{item.affiliate_email}</td>
                  <td className="px-3 py-2">{item.event_type === 'sale' ? (isUk ? 'Покупка' : 'Sale') : (isUk ? 'Лід' : 'Lead')}</td>
                  <td className="px-3 py-2">{item.link_name || item.link_code}</td>
                  <td className="px-3 py-2 text-slate-500">{item.order_id || '—'}</td>
                  <td className="px-3 py-2 text-right">{money(item.order_value)}</td>
                  <td className="px-3 py-2 text-right">{money(item.commission_amount)}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusClass(item.lead_status)}`}>
                      {statusLabel(item.lead_status)}
                    </span>
                  </td>
                </tr>
              ))}
              {!filteredConversionsLog.length && (
                <tr>
                  <td className="px-3 py-6 text-slate-500 text-center" colSpan={8}>Лог порожній</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-900">Історія підтверджень / відхилень</h2>
        </div>
        {historyLoading ? (
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
                <th className="text-left px-3 py-2">Статус</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item) => (
                <tr key={`${item.id}-${item.lead_status}`} className="border-t border-slate-100">
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(item.created_at).toLocaleString(isUk ? 'uk-UA' : 'en-US')}</td>
                  <td className="px-3 py-2">{item.affiliate_email}</td>
                  <td className="px-3 py-2">{item.event_type === 'sale' ? 'Покупка' : 'Лід'}</td>
                  <td className="px-3 py-2">{item.link_name || item.link_code}</td>
                  <td className="px-3 py-2 text-right">{money(item.order_value)}</td>
                  <td className="px-3 py-2 text-right">{money(item.commission_amount)}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${item.lead_status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.lead_status === 'approved' ? 'Підтверджено' : 'Відхилено'}
                    </span>
                  </td>
                </tr>
              ))}
              {!filteredHistory.length && (
                <tr>
                  <td className="px-3 py-6 text-slate-500 text-center" colSpan={7}>Історія порожня</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
