import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout.jsx';
import api from '../config/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  MousePointerClick,
  Users,
  TrendingUp,
  DollarSign,
  Plus,
  Copy,
  Trash2,
  ExternalLink,
  AlertCircle,
  Check,
  X,
  Edit,
  Save,
  ArrowRight,
  RefreshCw,
  Code,
  Zap,
  Target,
  ChevronDown,
  ChevronUp,
  Search,
  ShoppingCart,
  Clock
} from 'lucide-react';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLink, setNewLink] = useState({ 
    original_url: '', 
    name: '', 
    source_type: '',
    link_format: 'original'
  });
  const [creating, setCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState(null); // Store newly created link
  const [copied, setCopied] = useState(false); // Track if URL was copied
  const [copiedLinkId, setCopiedLinkId] = useState(null); // Track which link URL was copied
  const [editingLinkId, setEditingLinkId] = useState(null); // Track which link is being edited
  const [editForm, setEditForm] = useState({ original_url: '', name: '', source_type: '' });
  const [expandedLinkId, setExpandedLinkId] = useState(null); // Track which link is expanded
  const [searchQuery, setSearchQuery] = useState(''); // Search/filter links
  const [sourceFilter, setSourceFilter] = useState(''); // Filter by source type
  const [sortColumn, setSortColumn] = useState(''); // Sort column key
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'
  const [updating, setUpdating] = useState(false);
  const [selectedLinkIds, setSelectedLinkIds] = useState([]); // Bulk selection for table rows
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]); // IDs waiting for delete confirmation
  const [successMessage, setSuccessMessage] = useState(''); // Success message
  const [lastUpdated, setLastUpdated] = useState(null); // Track last update time
  const [hasFetched, setHasFetched] = useState(true); // Data loads automatically
  const [chartData, setChartData] = useState([]); // Time-series data for chart
  const [chartLoading, setChartLoading] = useState(false);
  const isMountedRef = useRef(false); // Track if component is mounted

  // Snapshot filter state
  const [snapshotDate, setSnapshotDate] = useState(''); // 'YYYY-MM-DD'
  const [snapshotHour, setSnapshotHour] = useState(''); // '00'..'23'
  const [activeSnapshot, setActiveSnapshot] = useState(''); // applied value 'YYYY-MM-DDTHH'
  const [timeRange, setTimeRange] = useState('7d');

  // Auto-fetch links and chart on mount
  useEffect(() => {
    isMountedRef.current = true;
    fetchLinks(true);
    fetchChartData(i18n.language, '', sourceFilter);
    return () => {
      isMountedRef.current = false;
    };
  }, [i18n.language]);

  useEffect(() => {
    if (!isMountedRef.current) return;
    fetchChartData(i18n.language, activeSnapshot, sourceFilter, timeRange);
  }, [sourceFilter]);

  useEffect(() => {
    if (!isMountedRef.current) return;
    if (timeRange === 'custom') {
      setActiveSnapshot('');
      return;
    }

    setActiveSnapshot('');
    fetchLinks(true, '', timeRange);
    fetchChartData(i18n.language, '', sourceFilter, timeRange);
  }, [timeRange]);

  useEffect(() => {
    if (!isMountedRef.current || activeSnapshot) return;

    const intervalId = window.setInterval(() => {
      if (document.hidden) return;
      fetchLinks(false, '', timeRange);
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [activeSnapshot, sourceFilter, i18n.language, timeRange]);

  useEffect(() => {
    setSelectedLinkIds((prev) => prev.filter((id) => links.some((link) => link.id === id)));
  }, [links]);

  const fetchChartData = async (lang, snapshot = '', selectedSource = '', range = timeRange) => {
    try {
      setChartLoading(true);
      const params = {};
      if (snapshot) params.snapshot = snapshot;
      if (!snapshot && range && range !== 'custom') params.range = range;
      if (selectedSource) params.source_type = selectedSource;
      const response = await api.get('/api/links/clicks-chart', { params });
      const raw = response.data.data || [];
      const locale = lang && lang.startsWith('en') ? 'en-US' : 'uk-UA';
      const formatted = raw.map(row => ({
        time: new Date(row.time_bucket).toLocaleString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        clicks: parseInt(row.clicks || 0),
        unique: parseInt(row.unique_clicks || 0)
      }));
      setChartData(formatted);
    } catch (err) {
      console.error('Chart data error:', err);
    } finally {
      setChartLoading(false);
    }
  };

  const fetchLinks = async (showLoading = true, snapshot = '', range = timeRange) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const params = snapshot ? { snapshot } : (range && range !== 'custom' ? { range } : {});
      const response = await api.get('/api/links/my-links', { params });
      setLinks(response.data.links || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load links');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Apply snapshot filter
  const handleApplySnapshot = () => {
    if (snapshotDate && snapshotHour !== '') {
      const snap = `${snapshotDate}T${snapshotHour.padStart(2, '0')}`;
      setActiveSnapshot(snap);
      setTimeRange('custom');
      fetchLinks(true, snap);
      fetchChartData(i18n.language, snap, sourceFilter);
    }
  };

  // Clear snapshot filter
  const handleClearSnapshot = () => {
    setSnapshotDate('');
    setSnapshotHour('');
    setActiveSnapshot('');
    setTimeRange('7d');
    fetchLinks(true, '', '7d');
    fetchChartData(i18n.language, '', sourceFilter, '7d');
  };

  const handleCreateLink = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setCreatedLink(null);

    try {
      const response = await api.post('/api/links/create', newLink);
      const newLinkData = response.data.link;
      // tracking_url is now computed server-side based on link_format
      setCreatedLink(newLinkData);
      
      setLinks([newLinkData, ...links]);
      setNewLink({ original_url: '', name: '', source_type: '', link_format: 'original' });
      setShowCreateForm(false);
      // Auto-refresh disabled - user can manually refresh if needed
      // Show popup instead of success message
      // createdLink state will show the popup
    } catch (err) {
      setError(err.response?.data?.error || t('dashboard.errorCreate'));
    } finally {
      setCreating(false);
    }
  };

  const handleEditLink = (link) => {
    setEditingLinkId(link.id);
    setEditForm({
      original_url: link.original_url,
      name: link.name || '',
      source_type: link.source_type || ''
    });
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingLinkId(null);
    setEditForm({ original_url: '', name: '', source_type: '' });
    setError('');
  };

  const handleUpdateLink = async (id) => {
    setUpdating(true);
    setError('');

    try {
      const response = await api.put(`/api/links/${id}`, editForm);
      const updatedLink = response.data.link;
      
      // Update the link in the list
      setLinks(links.map(link => 
        link.id === id ? { ...link, ...updatedLink } : link
      ));
      
      setEditingLinkId(null);
      setEditForm({ original_url: '', name: '', source_type: '' });
      setSuccessMessage(t('dashboard.successUpdate'));
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || t('dashboard.errorUpdate'));
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteLinks = async (ids) => {
    if (!ids.length) return;

    try {
      if (ids.length === 1) {
        await api.delete(`/api/links/${ids[0]}`);
      } else {
        await api.post('/api/links/bulk-delete', { ids });
      }

      setLinks((prev) => prev.filter((link) => !ids.includes(link.id)));
      setSelectedLinkIds((prev) => prev.filter((id) => !ids.includes(id)));
      setPendingDeleteIds([]);
      setSuccessMessage(ids.length === 1 ? t('dashboard.successDelete') : t('dashboard.successBulkDelete', { count: ids.length }));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || (ids.length === 1 ? t('dashboard.errorDelete') : t('dashboard.errorBulkDelete')));
      setPendingDeleteIds([]);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSourceTypeLabel = (sourceType) => {
    const keyMap = {
      'social_media': 'dashboard.sourceSocial',
      'email_marketing': 'dashboard.sourceEmail',
      'bloggers_influencers': 'dashboard.sourceBloggers',
      'search_ads': 'dashboard.sourceSearchAds',
      'seo_traffic': 'dashboard.sourceSeo',
      'messengers': 'dashboard.sourceMessengers',
      'own_website': 'dashboard.sourceOwnSite',
      'other': 'dashboard.sourceOther'
    };
    const key = keyMap[sourceType];
    return key ? t(key) : (sourceType || t('dashboard.notSpecified'));
  };

  const getSourceBadge = (sourceType) => {
    switch (sourceType) {
      case 'social_media': return 'bg-blue-100 text-blue-700';
      case 'email_marketing': return 'bg-green-100 text-green-700';
      case 'search_ads': return 'bg-amber-100 text-amber-700';
      case 'messengers': return 'bg-teal-100 text-teal-700';
      case 'bloggers_influencers': return 'bg-violet-100 text-violet-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const formatDuration = (seconds) => {
    const safeSeconds = Math.max(0, Math.round(Number(seconds) || 0));
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

  const sourceFilteredLinks = sourceFilter
    ? links.filter((link) => link.source_type === sourceFilter)
    : links;

  const filteredLinks = sourceFilteredLinks.filter((link) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (link.name || '').toLowerCase().includes(q) ||
      (link.original_url || '').toLowerCase().includes(q) ||
      (link.unique_code || '').toLowerCase().includes(q)
    );
  });

  const visibleSelectedIds = filteredLinks
    .map((link) => link.id)
    .filter((id) => selectedLinkIds.includes(id));
  const allVisibleSelected = filteredLinks.length > 0 && visibleSelectedIds.length === filteredLinks.length;

  const toggleLinkSelection = (id) => {
    setSelectedLinkIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredLinks.map((link) => link.id);
    if (allVisibleSelected) {
      setSelectedLinkIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }

    setSelectedLinkIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const openDeleteConfirmation = (ids) => {
    if (!ids.length) return;
    setPendingDeleteIds(ids);
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortColumn(column);
    setSortDirection('asc');
  };

  const sortedFilteredLinks = [...filteredLinks].sort((a, b) => {
    if (sortColumn !== 'source') return 0;

    const sourceA = getSourceTypeLabel(a.source_type).toLowerCase();
    const sourceB = getSourceTypeLabel(b.source_type).toLowerCase();
    if (sourceA < sourceB) return sortDirection === 'asc' ? -1 : 1;
    if (sourceA > sourceB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Calculate aggregated stats
  const totalClicks = sourceFilteredLinks.reduce((sum, link) => sum + (link.stats?.total_clicks || 0), 0);
  const uniqueClicks = sourceFilteredLinks.reduce((sum, link) => sum + (link.stats?.unique_clicks || 0), 0);
  const totalLeads = sourceFilteredLinks.reduce((sum, link) => sum + (link.stats?.leads || 0), 0);
  const totalSales = sourceFilteredLinks.reduce((sum, link) => sum + (link.stats?.sales || 0), 0);
  const totalCarts = sourceFilteredLinks.reduce((sum, link) => sum + (link.stats?.carts || 0), 0);
  const salesRevenue = sourceFilteredLinks.reduce((sum, link) => sum + (link.stats?.sales_revenue ?? 0), 0);

  const convRate = uniqueClicks > 0 ? ((totalSales / uniqueClicks) * 100).toFixed(1) : 0;

  const canCreateMoreLinks = links.length < (user?.link_limit || 3);
  const locale = t('dashboard.hello') === 'Hello' ? 'en-US' : 'uk-UA';
  const currentDate = new Date().toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Layout>
      {/* Header */}
      <div className="mb-5 rounded-xl border border-slate-200 bg-white/80 dark:bg-slate-900/70 px-5 py-4 backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900 mb-1">Dashboard</h1>
            <p className="text-sm text-slate-600">{currentDate}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchLinks(true, activeSnapshot, timeRange);
                fetchChartData(i18n.language, activeSnapshot, sourceFilter, timeRange);
              }}
              disabled={loading}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{t('common.refresh')}</span>
            </button>
            {canCreateMoreLinks && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-violet-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-violet-800 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{t('dashboard.createLink')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="mb-6 bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-semibold">{t('dashboard.snapshotFilter')}</span>
          </div>

          {[
            { key: 'all', label: 'All time' },
            { key: 'today', label: 'Today' },
            { key: '7d', label: '7 days' },
            { key: '30d', label: '30 days' },
            { key: 'custom', label: 'Custom' }
          ].map((period) => (
            <button
              key={period.key}
              onClick={() => setTimeRange(period.key)}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                timeRange === period.key
                  ? 'bg-violet-50 border-violet-300 text-violet-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {period.label}
            </button>
          ))}

          <div className="w-px h-5 bg-slate-200 mx-1" />

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-500 text-sm text-slate-900"
          >
            <option value="">All links</option>
            <option value="social_media">{t('dashboard.sourceSocial')}</option>
            <option value="email_marketing">{t('dashboard.sourceEmail')}</option>
            <option value="bloggers_influencers">{t('dashboard.sourceBloggers')}</option>
            <option value="search_ads">{t('dashboard.sourceSearchAds')}</option>
            <option value="seo_traffic">{t('dashboard.sourceSeo')}</option>
            <option value="messengers">{t('dashboard.sourceMessengers')}</option>
            <option value="own_website">{t('dashboard.sourceOwnSite')}</option>
            <option value="other">{t('dashboard.sourceOther')}</option>
          </select>

          {timeRange === 'custom' && (
            <>
              <input
                type="date"
                value={snapshotDate}
                onChange={(e) => setSnapshotDate(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className="px-3 py-2 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-500 text-sm text-slate-900"
              />
              <select
                value={snapshotHour}
                onChange={(e) => setSnapshotHour(e.target.value)}
                className="px-3 py-2 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-500 text-sm text-slate-900"
              >
                <option value="">{t('dashboard.snapshotHour')}</option>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={String(i).padStart(2, '0')}>
                    {String(i).padStart(2, '0')}:00
                  </option>
                ))}
              </select>

              <button
                onClick={handleApplySnapshot}
                disabled={!snapshotDate || snapshotHour === ''}
                className="px-4 py-2 bg-violet-700 hover:bg-violet-800 text-white text-sm font-semibold rounded-lg disabled:opacity-40 transition-colors"
              >
                {t('dashboard.snapshotApply')}
              </button>
            </>
          )}

          {activeSnapshot && (
            <button
              onClick={handleClearSnapshot}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
            >
              {t('dashboard.snapshotClear')}
            </button>
          )}

          {!activeSnapshot && timeRange === 'custom' && (
            <span className="text-xs text-slate-400 hidden sm:inline">
              {t('dashboard.snapshotHint')}
            </span>
          )}
        </div>

        {/* Active snapshot indicator */}
        {activeSnapshot && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm font-medium text-amber-700">
              {t('dashboard.snapshotActive')}: {activeSnapshot.replace('T', ' ')}:00
            </span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={MousePointerClick}
          label={t('dashboard.totalClicks')}
          value={totalClicks.toLocaleString()}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={Users}
          label={t('dashboard.uniqueClicks')}
          value={uniqueClicks.toLocaleString()}
          bgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          icon={ShoppingCart}
          label={t('dashboard.cart')}
          value={totalCarts.toLocaleString()}
          bgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
        <StatCard
          icon={Target}
          label={t('dashboard.leads')}
          value={totalLeads.toLocaleString()}
          bgColor="bg-amber-100"
          iconColor="text-amber-600"
        />
        <StatCard
          icon={TrendingUp}
          label={t('dashboard.sales')}
          value={totalSales.toLocaleString()}
          bgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          icon={DollarSign}
          label={t('dashboard.revenue')}
          value={`${salesRevenue.toLocaleString()} ₴`}
          bgColor="bg-emerald-100"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Clicks Chart - Keitaro style */}
      <div className="mb-8 bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">{t('dashboard.clicksChartTitle')}</h3>
          <button
            onClick={() => fetchChartData(i18n.language, activeSnapshot, sourceFilter, timeRange)}
            disabled={chartLoading}
            className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
            title={t('dashboard.refreshChart')}
          >
            <RefreshCw className={`w-4 h-4 ${chartLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {chartLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="inline-block w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '12px',
                  padding: '8px 12px'
                }}
                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="line"
                formatter={(value) => (
                  <span style={{ color: '#64748b', fontSize: '12px' }}>
                    {value === 'clicks' ? t('dashboard.totalClicks') : t('dashboard.uniqueClicks')}
                  </span>
                )}
              />
              <Area
                type="monotone"
                dataKey="clicks"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorClicks)"
                dot={false}
                activeDot={{ r: 4, fill: '#3b82f6' }}
              />
              <Area
                type="monotone"
                dataKey="unique"
                stroke="#a855f7"
                strokeWidth={2}
                fill="url(#colorUnique)"
                dot={false}
                activeDot={{ r: 4, fill: '#a855f7' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <TrendingUp className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">{t('dashboard.noChartData')}</p>
            <p className="text-xs mt-1">{t('dashboard.chartHint')}</p>
          </div>
        )}
      </div>

      {/* Quick Start Steps */}
      {links.length === 0 && !loading && (
        <div className="mb-8 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 p-6 dark:border-violet-900/60 dark:from-slate-900 dark:to-indigo-950/80">
          <h3 className="mb-4 text-lg font-bold text-slate-800 dark:text-slate-100">{t('dashboard.howToStartTitle')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: 1, icon: Code, title: t('dashboard.step1Title'), desc: t('dashboard.step1Desc'), link: '/setup', linkText: t('dashboard.step1Link') },
              { step: 2, icon: Plus, title: t('dashboard.step2Title'), desc: t('dashboard.step2Desc'), action: true },
              { step: 3, icon: Zap, title: t('dashboard.step3Title'), desc: t('dashboard.step3Desc') },
            ].map(({ step, icon: Icon, title, desc, link: href, linkText, action }) => (
              <div key={step} className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">{step}</div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-4 h-4 text-violet-600 dark:text-violet-300" />
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">{title}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-300">{desc}</p>
                  {href && (
                    <Link to={href} className="mt-1 inline-block text-xs font-medium text-violet-600 hover:underline dark:text-violet-300">
                      {linkText} &rarr;
                    </Link>
                  )}
                  {action && (
                    <button onClick={() => setShowCreateForm(true)} className="mt-1 text-xs font-medium text-violet-600 hover:underline dark:text-violet-300">
                      {t('dashboard.step2Action')} &rarr;
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action status */}
      {lastUpdated && (
        <div className="mb-4 flex items-center space-x-2 text-xs text-slate-500">
          <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></div>
          <span>{t('dashboard.updated')}: {lastUpdated.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )}

      {/* Create Link Form */}
      {showCreateForm && canCreateMoreLinks && (
        <div className="mb-6 bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4">{t('dashboard.createLinkTitle')}</h2>
          <form onSubmit={handleCreateLink} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('dashboard.linkNameLabel')} <span className="text-slate-400">{t('dashboard.linkNameOptional')}</span>
              </label>
              <input
                type="text"
                value={newLink.name || ''}
                onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                placeholder={t('dashboard.linkNamePlaceholder')}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all text-slate-900 placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('dashboard.sourceTypeLabel')} <span className="text-slate-400">{t('dashboard.linkNameOptional')}</span>
              </label>
              <select
                value={newLink.source_type || ''}
                onChange={(e) => setNewLink({ ...newLink, source_type: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all text-slate-900"
              >
                <option value="">{t('dashboard.selectSourceType')}</option>
                <option value="social_media">{t('dashboard.sourceSocial')}</option>
                <option value="email_marketing">{t('dashboard.sourceEmail')}</option>
                <option value="bloggers_influencers">{t('dashboard.sourceBloggers')}</option>
                <option value="search_ads">{t('dashboard.sourceSearchAds')}</option>
                <option value="seo_traffic">{t('dashboard.sourceSeo')}</option>
                <option value="messengers">{t('dashboard.sourceMessengers')}</option>
                <option value="own_website">{t('dashboard.sourceOwnSite')}</option>
                <option value="other">{t('dashboard.sourceOther')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('dashboard.targetUrlLabel')} <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                required
                value={newLink.original_url}
                onChange={(e) => {
                  let url = e.target.value.trim();
                  // Auto-add https:// if protocol is missing
                  if (url && !url.match(/^https?:\/\//i)) {
                    url = 'https://' + url;
                  }
                  setNewLink({ ...newLink, original_url: url });
                }}
                placeholder={t('dashboard.targetUrlPlaceholder')}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all text-slate-900 placeholder-slate-400"
              />
              {newLink.original_url && !newLink.original_url.match(/^https?:\/\/(.+\.|localhost|127\.0\.0\.1|\d+\.\d+\.\d+\.\d+)/i) && (
                <p className="mt-1 text-sm text-amber-600">{t('dashboard.checkUrl')}</p>
              )}
            </div>

            {/* Link format selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                {t('dashboard.linkFormatLabel')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Original-based format */}
                <button
                  type="button"
                  onClick={() => setNewLink({ ...newLink, link_format: 'original' })}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    newLink.link_format === 'original'
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      newLink.link_format === 'original' ? 'border-violet-500' : 'border-slate-300'
                    }`}>
                      {newLink.link_format === 'original' && <div className="w-2 h-2 rounded-full bg-violet-500"></div>}
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{t('dashboard.linkFormatOriginal')}</span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono break-all">
                    {newLink.original_url
                      ? (() => { try { const u = new URL(newLink.original_url); u.searchParams.set('ref', 'AbCdEfGh'); return u.toString(); } catch { return newLink.original_url + '?ref=AbCdEfGh'; } })()
                      : 'google.com/tovar1?ref=AbCdEfGh'}
                  </p>
                </button>

                {/* Lehko domain format */}
                <button
                  type="button"
                  onClick={() => setNewLink({ ...newLink, link_format: 'lehko' })}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    newLink.link_format === 'lehko'
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      newLink.link_format === 'lehko' ? 'border-violet-500' : 'border-slate-300'
                    }`}>
                      {newLink.link_format === 'lehko' && <div className="w-2 h-2 rounded-full bg-violet-500"></div>}
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{t('dashboard.linkFormatLehko')}</span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono break-all">
                    lehko.space/r/AbCdEfGh
                  </p>
                </button>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewLink({ original_url: '', name: '', source_type: '', link_format: 'original' });
                }}
                className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-all"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all disabled:opacity-50"
              >
                {creating ? t('dashboard.creating') : t('dashboard.createLinkBtn')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Success Popup - Show Created Link */}
      {createdLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border-2 border-violet-200 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{t('dashboard.linkCreatedTitle')}</h3>
                <p className="text-sm text-slate-500">{t('dashboard.linkCreatedDesc')}</p>
              </div>
            </div>
            <button
              onClick={() => setCreatedLink(null)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl p-4 border border-violet-200">
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
              {t('dashboard.trackingUrlLabel')}
            </label>
            <div className="flex items-center space-x-2">
              <code className="flex-1 px-4 py-3 bg-white rounded-lg text-sm font-mono text-slate-800 break-all border border-slate-200">
                {createdLink.tracking_url}
              </code>
              <button
                onClick={() => copyToClipboard(createdLink.tracking_url)}
                className={`px-4 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2 ${
                  copied
                    ? 'bg-green-100 text-green-700 border-2 border-green-300'
                    : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>{t('common.copied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span>{t('common.copy')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            {createdLink.name && (
              <div>
                <p className="text-slate-500 mb-1">{t('dashboard.name')}:</p>
                <p className="text-slate-800 font-semibold">{createdLink.name}</p>
              </div>
            )}
            {createdLink.source_type && (
              <div>
                <p className="text-slate-500 mb-1">{t('dashboard.sourceType')}:</p>
                <span className="inline-block px-3 py-1 bg-violet-100 text-violet-700 rounded-lg text-sm font-medium">
                  {getSourceTypeLabel(createdLink.source_type)}
                </span>
              </div>
            )}
            <div>
              <p className="text-slate-500 mb-1">{t('dashboard.originalUrl')}:</p>
              <a
                href={createdLink.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-600 hover:text-violet-700 font-medium break-all"
              >
                {createdLink.original_url}
              </a>
            </div>
            <div>
              <p className="text-slate-500 mb-1">{t('dashboard.uniqueCode')}:</p>
              <code className="px-2 py-1 bg-slate-100 rounded text-slate-800 font-mono">
                {createdLink.unique_code}
              </code>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡</strong> {t('dashboard.tip')}
            </p>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                setCreatedLink(null);
                fetchLinks(true, activeSnapshot, timeRange);
              }}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all"
            >
              {t('dashboard.gotIt')}
            </button>
          </div>
        </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center space-x-2">
          <Check className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Links Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-slate-500 text-sm">{t('common.loading')}</p>
        </div>
      ) : sourceFilteredLinks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500">{t('dashboard.noLinks')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <>
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                  <h3 className="text-2xl font-bold text-slate-900">Your Tracking Links</h3>
                  <div className="flex items-center gap-2">
                    {selectedLinkIds.length > 0 && (
                      <button
                        onClick={() => openDeleteConfirmation(selectedLinkIds)}
                        className="px-4 py-2 rounded-lg border border-red-300 bg-red-50 text-red-700 font-semibold hover:bg-red-100 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>{t('dashboard.deleteSelected')}</span>
                        <span className="text-red-500">({selectedLinkIds.length})</span>
                      </button>
                    )}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search links..."
                        className="pl-9 pr-3 py-2 w-52 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400"
                      />
                    </div>
                    {canCreateMoreLinks && (
                      <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="px-4 py-2 bg-violet-700 text-white rounded-lg font-semibold hover:bg-violet-800 transition-colors"
                      >
                        + New Link
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={allVisibleSelected}
                            onChange={toggleSelectAllVisible}
                            aria-label={t('dashboard.selectAll')}
                            className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                          />
                        </th>
                        <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-600 font-semibold">Link / URL</th>
                        <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-600 font-semibold">
                          <button
                            type="button"
                            onClick={() => handleSort('source')}
                            className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors"
                          >
                            <span>Source</span>
                            {sortColumn === 'source' ? (
                              <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            ) : (
                              <span className="text-slate-400">↕</span>
                            )}
                          </button>
                        </th>
                        <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-600 font-semibold">Clicks</th>
                        <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-600 font-semibold">Unique</th>
                        <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-600 font-semibold">Carts</th>
                        <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-600 font-semibold">{t('dashboard.tableAvgTime')}</th>
                        <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-600 font-semibold">{t('dashboard.tableBounceRate')}</th>
                        <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-600 font-semibold">{t('dashboard.tableAvgCheck')}</th>
                        <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-600 font-semibold">Revenue</th>
                        <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-600 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedFilteredLinks.map((link) => {
                        const clicks = link.stats?.total_clicks || 0;
                        const unique = link.stats?.unique_clicks || 0;
                        const carts = link.stats?.carts || 0;
                        const avgTime = link.stats?.avg_session_seconds || 0;
                        const bounceRate = link.stats?.bounce_rate || 0;
                        const averageCheck = link.stats?.average_check || 0;
                        const revenue = link.stats?.sales_revenue ?? 0;
                        return (
                          <tr key={link.id} className="border-b border-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/70">
                            <td className="px-4 py-4 align-top">
                              <input
                                type="checkbox"
                                checked={selectedLinkIds.includes(link.id)}
                                onChange={() => toggleLinkSelection(link.id)}
                                aria-label={`${t('dashboard.tableLink')}: ${link.name || link.unique_code}`}
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                              />
                            </td>
                            <td className="px-5 py-4">
                              <div className="font-semibold text-slate-900">{link.name || link.unique_code}</div>
                              <div className="text-violet-600 text-[13px] break-all">{link.tracking_url}</div>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getSourceBadge(link.source_type)}`}>
                                {getSourceTypeLabel(link.source_type)}
                              </span>
                            </td>
                            <td className="px-4 py-4 font-semibold text-slate-900">{clicks.toLocaleString()}</td>
                            <td className="px-4 py-4 font-semibold text-slate-900">{unique.toLocaleString()}</td>
                            <td className="px-4 py-4 font-semibold text-slate-900">{carts.toLocaleString()}</td>
                            <td className="px-4 py-4 font-semibold text-slate-900">{formatDuration(avgTime)}</td>
                            <td className="px-4 py-4 font-semibold text-slate-900">{formatPercent(bounceRate)}</td>
                            <td className="px-4 py-4 font-semibold text-slate-900">{averageCheck.toLocaleString()} ₴</td>
                            <td className="px-4 py-4 font-bold text-emerald-600">${revenue.toLocaleString()}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    copyToClipboard(link.tracking_url);
                                    setCopiedLinkId(link.id);
                                    setTimeout(() => setCopiedLinkId(null), 2000);
                                  }}
                                  className="px-3 py-1.5 rounded-lg border border-violet-300 text-violet-700 hover:bg-violet-50 text-sm"
                                >
                                  {copiedLinkId === link.id ? 'Copied' : 'Copy'}
                                </button>
                                <button
                                  onClick={() => handleEditLink(link)}
                                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => openDeleteConfirmation([link.id])}
                                  className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-sm"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center gap-4">
                    <span>Showing {filteredLinks.length} of {sourceFilteredLinks.length} links</span>
                    {selectedLinkIds.length > 0 && <span>{t('dashboard.selectedCount', { count: selectedLinkIds.length })}</span>}
                  </div>
                  <div className="flex gap-1">
                    <button className="w-7 h-7 rounded-md border border-slate-200 bg-violet-700 text-white text-xs">1</button>
                    <button className="w-7 h-7 rounded-md border border-slate-200 text-xs">2</button>
                    <button className="w-7 h-7 rounded-md border border-slate-200 text-xs">3</button>
                    <button className="w-7 h-7 rounded-md border border-slate-200 text-xs">→</button>
                  </div>
                </div>
          </>
        </div>
      )}

      {/* Edit Link Modal */}
      {editingLinkId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCancelEdit}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">{t('common.edit')} {t('dashboard.tableLink').toLowerCase()}</h3>
              <button type="button" onClick={handleCancelEdit} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateLink(editingLinkId); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('dashboard.name')}</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder={t('dashboard.name')}
                  className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('dashboard.sourceType')}</label>
                <select
                  value={editForm.source_type || ''}
                  onChange={(e) => setEditForm({ ...editForm, source_type: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                >
                  <option value="">{t('dashboard.sourceType')}</option>
                  <option value="social_media">{t('dashboard.sourceSocial')}</option>
                  <option value="email_marketing">{t('dashboard.sourceEmail')}</option>
                  <option value="bloggers_influencers">{t('dashboard.sourceBloggers')}</option>
                  <option value="search_ads">{t('dashboard.sourceSearchAdsShort')}</option>
                  <option value="seo_traffic">{t('dashboard.sourceSeo')}</option>
                  <option value="messengers">{t('dashboard.sourceMessengers')}</option>
                  <option value="own_website">{t('dashboard.sourceOwnSiteShort')}</option>
                  <option value="other">{t('dashboard.sourceOther')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL</label>
                <input
                  type="url"
                  required
                  value={editForm.original_url}
                  onChange={(e) => setEditForm({ ...editForm, original_url: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={handleCancelEdit} disabled={updating} className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-50 transition-all">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={updating} className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center gap-2 transition-all">
                  {updating ? t('common.refreshing') : <><Save className="w-4 h-4" /><span>{t('common.save')}</span></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {pendingDeleteIds.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  {pendingDeleteIds.length === 1 ? t('dashboard.deleteConfirmTitle') : t('dashboard.deleteBulkConfirmTitle')}
                </h3>
                <p className="text-slate-500">{t('dashboard.deleteConfirmDesc')}</p>
              </div>
            </div>
            <p className="text-slate-600 mb-6">
              {pendingDeleteIds.length === 1
                ? t('dashboard.deleteConfirmText')
                : t('dashboard.deleteBulkConfirmText', { count: pendingDeleteIds.length })}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setPendingDeleteIds([])}
                className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-all"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleDeleteLinks(pendingDeleteIds)}
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-all"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, bgColor, iconColor }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      </div>
      <p className="text-3xl font-bold text-slate-900 leading-none">{value}</p>
    </div>
  );
}
