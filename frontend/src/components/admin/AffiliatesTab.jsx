import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, RefreshCw, X, Globe, Percent, AlertCircle } from 'lucide-react';
import api from '../../config/api.js';

const PRESET_REASON_KEYS = [
  { value: 'no_payment', labelKey: 'admin.rejectReasonNoPayment' },
  { value: 'duplicate', labelKey: 'admin.rejectReasonDuplicate' },
  { value: 'not_picked_up', labelKey: 'admin.rejectReasonNotPickedUp' },
  { value: 'cancelled', labelKey: 'admin.rejectReasonCancelled' },
  { value: 'custom', labelKey: 'admin.rejectReasonCustom' },
];

function RejectModal({ item, onConfirm, onCancel }) {
  const { t, i18n } = useTranslation();
  const isUk = (i18n.language || '').startsWith('uk');
  const [selected, setSelected] = useState('no_payment');
  const [custom, setCustom] = useState('');
  const reason = selected === 'custom'
    ? custom.trim()
    : t(PRESET_REASON_KEYS.find((r) => r.value === selected)?.labelKey || 'admin.rejectReasonCustom');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <h2 className="font-bold text-slate-800">{t('admin.rejectReasonTitle')}</h2>
        </div>
        {item && (
          <p className="text-sm text-slate-500">
            {t('admin.orderLabel')} #{item.order_id || item.id} · {Number(item.order_value || 0).toLocaleString(isUk ? 'uk-UA' : 'en-US')} ₴
          </p>
        )}
        <div className="space-y-2">
          {PRESET_REASON_KEYS.map((r) => (
            <label key={r.value} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="reject_reason"
                value={r.value}
                checked={selected === r.value}
                onChange={() => setSelected(r.value)}
                className="accent-red-600"
              />
              <span className="text-sm text-slate-700">{t(r.labelKey)}</span>
            </label>
          ))}
        </div>
        {selected === 'custom' && (
          <input
            autoFocus
            type="text"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder={t('admin.rejectReasonPlaceholder')}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
        )}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            disabled={selected === 'custom' && !custom.trim()}
            onClick={() => onConfirm(reason || null)}
            className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            {t('admin.reject')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

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

function SiteCommissionsModal({ affiliate, onClose }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edits, setEdits] = useState({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!affiliate) return;
    setLoading(true);
    setError('');
    api.get(`/api/admin/users/${affiliate.user_id}/website-commissions`)
      .then((res) => {
        setData(res.data);
        const init = {};
        (res.data?.websites || []).forEach((w) => {
          init[w.id] = w.commission_percent !== null && w.commission_percent !== undefined
            ? String(w.commission_percent)
            : '';
        });
        setEdits(init);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Failed to load site commissions');
      })
      .finally(() => setLoading(false));
  }, [affiliate]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updates = (data?.websites || []).map((w) => ({
        website_id: w.id,
        commission_percent: edits[w.id] === '' ? null : parseFloat(edits[w.id])
      }));
      await api.patch(`/api/admin/users/${affiliate.user_id}/website-commissions`, { updates });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-violet-500" />
            <h2 className="font-bold text-slate-800">{t('admin.siteCommissionTitle')}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-slate-500">
          <span className="font-medium text-slate-700">{affiliate.email}</span>
          {' · '}{t('admin.globalCommission')}:{' '}
          <span className="font-semibold text-violet-700">{data?.global_commission ?? '?'}%</span>
        </p>
        <p className="text-xs text-slate-400">{t('admin.emptyUsesGlobal')}</p>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        )}

        {loading ? (
          <p className="text-sm text-slate-400 py-4 text-center">{t('common.loading')}</p>
        ) : (data?.websites || []).length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">{t('admin.noSitesForAffiliate')}</p>
        ) : (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {(data?.websites || []).map((w) => (
              <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{w.name || w.domain}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {w.domain || '—'}
                    {w.is_connected ? ' · connected' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={edits[w.id] ?? ''}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [w.id]: e.target.value }))}
                      placeholder={String(data?.global_commission ?? '')}
                      className="w-20 text-right px-2 py-1.5 pr-7 border border-slate-200 rounded-lg text-sm bg-white"
                    />
                    <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  </div>
                  {edits[w.id] === '' && (
                    <span className="text-xs text-slate-400 whitespace-nowrap">{t('admin.equalsGlobal')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading || (data?.websites || []).length === 0}
            className="flex-1 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50"
          >
            {saved ? t('admin.saved') : saving ? t('admin.saving') : t('common.save')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AffiliatesTab() {
  const { t, i18n } = useTranslation();
  const isUk = (i18n.language || '').startsWith('uk');
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
  const [siteCommAffiliate, setSiteCommAffiliate] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

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
    if (status === 'approved') return t('admin.approved');
    if (status === 'rejected') return t('admin.rejected');
    if (status === 'pending') return t('admin.pending');
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
      setError(t('admin.selectDate'));
      return;
    }
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setError(t('admin.invalidDateRange'));
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

  const handleModeration = async (id, action, rejectionReason = null) => {
    setUpdating(true);
    try {
      const endpoint = action === 'approve' ? 'approve-lead' : 'reject-lead';
      await api.post(
        `/api/admin/conversions/${id}/${endpoint}`,
        action === 'reject' ? { rejection_reason: rejectionReason } : undefined
      );
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
      alert(t('admin.publicReportCopied'));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create public report link');
    } finally {
      setSharing(false);
    }
  };

  const statsCards = useMemo(() => {
    const s = overview?.summary || {};
    return [
      { label: t('admin.statAffiliates'), value: s.affiliates || 0 },
      { label: t('dashboard.clicksShort'), value: (s.clicks || 0).toLocaleString(isUk ? 'uk-UA' : 'en-US') },
      { label: t('dashboard.conversionsShort'), value: (s.conversions || 0).toLocaleString(isUk ? 'uk-UA' : 'en-US') },
      { label: t('admin.pending'), value: (s.pending_conversions || 0).toLocaleString(isUk ? 'uk-UA' : 'en-US') },
      { label: t('admin.statApprovedRevenue'), value: money(s.approved_revenue) },
      { label: t('admin.statAffiliateEarnings'), value: money(s.affiliate_earnings) },
      { label: t('admin.statBalanceTotal'), value: money(s.balance_total) }
    ];
  }, [overview, i18n.language, t, isUk]);

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
            <h1 className="text-2xl font-bold text-slate-900">{t('admin.affiliatesPanelTitle')}</h1>
            <p className="text-sm text-slate-500">
              {t('admin.tabHint')}
              <span className="ml-2 text-violet-700 font-medium">
                {t('admin.periodLabel')} {periodLabel}
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
              {sharing ? t('admin.creating') : t('admin.shareReport')}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">{t('admin.from')}</label>
            <input
              type="date"
              value={dateFrom}
              max={dateTo || todayISO()}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">{t('admin.to')}</label>
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
            {t('admin.applyRange')}
          </button>
          {customActive && (
            <button
              type="button"
              onClick={() => { setCustomActive(false); setDateFrom(''); setDateTo(''); }}
              className="px-3 py-2 rounded-lg text-sm border border-slate-200 text-slate-600 bg-white"
            >
              {t('admin.reset')}
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
          <h2 className="font-bold text-slate-900">{t('admin.affiliatesList')}</h2>
        </div>
        {loading ? (
          <p className="p-5 text-sm text-slate-500">{t('common.loading')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="text-left px-3 py-2">Email</th>
                <th className="text-right px-3 py-2">{t('admin.linksCol')}</th>
                <th className="text-right px-3 py-2">{t('dashboard.clicksShort')}</th>
                <th className="text-right px-3 py-2">{t('dashboard.conversionsShort')}</th>
                <th className="text-right px-3 py-2">Pending</th>
                <th className="text-right px-3 py-2">{t('admin.statApprovedRevenue')}</th>
                <th className="text-right px-3 py-2">{t('admin.commissionPercent')}</th>
                <th className="text-right px-3 py-2">{t('admin.balance')}</th>
                <th className="text-right px-3 py-2">{t('admin.actionsCol')}</th>
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
                    <div className="inline-flex items-center gap-1.5">
                      <button onClick={() => saveAffiliateSettings(a.user_id)} disabled={updating} className="px-3 py-1.5 text-xs rounded-lg bg-violet-600 text-white disabled:opacity-50">{t('common.save')}</button>
                      <button
                        type="button"
                        onClick={() => setSiteCommAffiliate(a)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 flex items-center gap-1"
                        title={t('admin.siteCommissionTitle')}
                      >
                        <Globe className="w-3 h-3" />
                        {t('admin.sitesPercent')}
                      </button>
                    </div>
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
            <h2 className="font-bold text-slate-900">{t('admin.moderationTitle')}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{t('admin.moderationDesc')}</p>
          </div>
          <input
            value={affiliateSearch}
            onChange={(e) => setAffiliateSearch(e.target.value)}
            placeholder={t('admin.searchAffiliateEmail')}
            className="w-64 max-w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
          />
        </div>
        {modLoading ? (
          <p className="p-5 text-sm text-slate-500">{t('common.loading')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="text-left px-3 py-2">{t('admin.dateCol')}</th>
                <th className="text-left px-3 py-2">{t('admin.affiliateCol')}</th>
                <th className="text-left px-3 py-2">{t('admin.typeCol')}</th>
                <th className="text-left px-3 py-2">{t('admin.linkCol')}</th>
                <th className="text-right px-3 py-2">{t('admin.amountCol')}</th>
                <th className="text-right px-3 py-2">{t('admin.commissionCol')}</th>
                <th className="text-right px-3 py-2">{t('admin.actionsCol')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredPending.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(item.created_at).toLocaleString(isUk ? 'uk-UA' : 'en-US')}</td>
                  <td className="px-3 py-2">{item.affiliate_email}</td>
                  <td className="px-3 py-2">{item.event_type === 'sale' ? t('admin.purchase') : t('admin.lead')}</td>
                  <td className="px-3 py-2">{item.link_name || item.link_code}</td>
                  <td className="px-3 py-2 text-right">{money(item.order_value)}</td>
                  <td className="px-3 py-2 text-right">{money(item.commission_amount)}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-2">
                      <button onClick={() => handleModeration(item.id, 'approve')} disabled={updating} className="p-1.5 rounded bg-green-600 text-white" title={t('admin.approve')}><Check className="w-4 h-4" /></button>
                      <button onClick={() => setRejectTarget(item)} disabled={updating} className="p-1.5 rounded bg-red-600 text-white" title={t('admin.reject')}><X className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredPending.length && (
                <tr>
                  <td className="px-3 py-6 text-slate-500 text-center" colSpan={7}>{t('admin.noEntries')}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900">{t('admin.historyTitle')}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{t('admin.historyDesc')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={convEventFilter}
              onChange={(e) => setConvEventFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="all">{t('admin.allTypes')}</option>
              <option value="sale">{t('admin.salesPlural')}</option>
              <option value="lead">{t('dashboard.leads')}</option>
            </select>
            <select
              value={convStatusFilter}
              onChange={(e) => setConvStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="all">{t('admin.allStatuses')}</option>
              <option value="pending">{t('admin.pending')}</option>
              <option value="approved">{t('admin.approved')}</option>
              <option value="rejected">{t('admin.rejected')}</option>
            </select>
          </div>
        </div>
        {conversionsLoading ? (
          <p className="p-5 text-sm text-slate-500">{t('common.loading')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="text-left px-3 py-2">{t('admin.dateCol')}</th>
                <th className="text-left px-3 py-2">{t('admin.affiliateCol')}</th>
                <th className="text-left px-3 py-2">{t('admin.typeCol')}</th>
                <th className="text-left px-3 py-2">{t('admin.linkCol')}</th>
                <th className="text-left px-3 py-2">{t('dashboard.orderIdCol')}</th>
                <th className="text-right px-3 py-2">{t('admin.amountCol')}</th>
                <th className="text-right px-3 py-2">{t('admin.commissionCol')}</th>
                <th className="text-left px-3 py-2">{t('admin.statusCol')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredConversionsLog.map((item) => (
                <tr key={`log-${item.id}`} className="border-t border-slate-100">
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(item.created_at).toLocaleString(isUk ? 'uk-UA' : 'en-US')}</td>
                  <td className="px-3 py-2">{item.affiliate_email}</td>
                  <td className="px-3 py-2">{item.event_type === 'sale' ? t('admin.purchase') : t('admin.lead')}</td>
                  <td className="px-3 py-2">{item.link_name || item.link_code}</td>
                  <td className="px-3 py-2 text-slate-500">{item.order_id || '—'}</td>
                  <td className="px-3 py-2 text-right">{money(item.order_value)}</td>
                  <td className="px-3 py-2 text-right">{money(item.commission_amount)}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusClass(item.lead_status)}`}>
                      {statusLabel(item.lead_status)}
                    </span>
                    {item.lead_status === 'rejected' && item.rejection_reason && (
                      <p className="text-xs text-red-600 mt-0.5 max-w-[180px]">{item.rejection_reason}</p>
                    )}
                  </td>
                </tr>
              ))}
              {!filteredConversionsLog.length && (
                <tr>
                  <td className="px-3 py-6 text-slate-500 text-center" colSpan={8}>{t('admin.emptyLog')}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-900">{t('admin.approvalHistory')}</h2>
        </div>
        {historyLoading ? (
          <p className="p-5 text-sm text-slate-500">{t('common.loading')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="text-left px-3 py-2">{t('admin.dateCol')}</th>
                <th className="text-left px-3 py-2">{t('admin.affiliateCol')}</th>
                <th className="text-left px-3 py-2">{t('admin.typeCol')}</th>
                <th className="text-left px-3 py-2">{t('admin.linkCol')}</th>
                <th className="text-right px-3 py-2">{t('admin.amountCol')}</th>
                <th className="text-right px-3 py-2">{t('admin.commissionCol')}</th>
                <th className="text-left px-3 py-2">{t('admin.statusCol')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item) => (
                <tr key={`${item.id}-${item.lead_status}`} className="border-t border-slate-100">
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(item.created_at).toLocaleString(isUk ? 'uk-UA' : 'en-US')}</td>
                  <td className="px-3 py-2">{item.affiliate_email}</td>
                  <td className="px-3 py-2">{item.event_type === 'sale' ? t('admin.purchase') : t('admin.lead')}</td>
                  <td className="px-3 py-2">{item.link_name || item.link_code}</td>
                  <td className="px-3 py-2 text-right">{money(item.order_value)}</td>
                  <td className="px-3 py-2 text-right">{money(item.commission_amount)}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${item.lead_status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.lead_status === 'approved' ? t('admin.approved') : t('admin.rejected')}
                    </span>
                    {item.lead_status === 'rejected' && item.rejection_reason && (
                      <p className="text-xs text-red-600 mt-0.5 max-w-[180px]">{item.rejection_reason}</p>
                    )}
                  </td>
                </tr>
              ))}
              {!filteredHistory.length && (
                <tr>
                  <td className="px-3 py-6 text-slate-500 text-center" colSpan={7}>{t('admin.emptyHistory')}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {siteCommAffiliate && (
        <SiteCommissionsModal
          affiliate={siteCommAffiliate}
          onClose={() => setSiteCommAffiliate(null)}
        />
      )}

      {rejectTarget && (
        <RejectModal
          item={rejectTarget}
          onConfirm={async (reason) => {
            const id = rejectTarget.id;
            setRejectTarget(null);
            await handleModeration(id, 'reject', reason);
          }}
          onCancel={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
}
