import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
  Search
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLink, setNewLink] = useState({ 
    original_url: '', 
    name: '', 
    source_type: '' 
  });
  const [creating, setCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState(null); // Store newly created link
  const [copied, setCopied] = useState(false); // Track if URL was copied
  const [copiedLinkId, setCopiedLinkId] = useState(null); // Track which link URL was copied
  const [editingLinkId, setEditingLinkId] = useState(null); // Track which link is being edited
  const [editForm, setEditForm] = useState({ original_url: '', name: '', source_type: '' });
  const [expandedLinkId, setExpandedLinkId] = useState(null); // Track which link is expanded
  const [searchQuery, setSearchQuery] = useState(''); // Search/filter links
  const [updating, setUpdating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null); // Track which link is being deleted
  const [successMessage, setSuccessMessage] = useState(''); // Success message
  const [lastUpdated, setLastUpdated] = useState(null); // Track last update time
  const [hasFetched, setHasFetched] = useState(true); // Data loads automatically
  const [chartData, setChartData] = useState([]); // Time-series data for chart
  const [chartLoading, setChartLoading] = useState(false);
  const isMountedRef = useRef(false); // Track if component is mounted

  // Auto-fetch links and chart on mount
  useEffect(() => {
    isMountedRef.current = true;
    fetchLinks(true);
    fetchChartData();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchChartData = async () => {
    try {
      setChartLoading(true);
      const response = await api.get('/api/links/clicks-chart');
      const raw = response.data.data || [];
      // Format for chart
      const formatted = raw.map(row => ({
        time: new Date(row.time_bucket).toLocaleString('uk-UA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
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

  const fetchLinks = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await api.get('/api/links/my-links');
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

  const handleCreateLink = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setCreatedLink(null);

    try {
      const response = await api.post('/api/links/create', newLink);
      const newLinkData = response.data.link;
      
      // Store the created link to show it
      setCreatedLink(newLinkData);
      
      setLinks([newLinkData, ...links]);
      setNewLink({ original_url: '', name: '', source_type: '' });
      setShowCreateForm(false);
      // Auto-refresh disabled - user can manually refresh if needed
      // Show popup instead of success message
      // createdLink state will show the popup
    } catch (err) {
      setError(err.response?.data?.error || 'Не вдалося створити посилання');
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
      setSuccessMessage('Посилання успішно оновлено!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Не вдалося оновити посилання');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteLink = async (id) => {
    try {
      await api.delete(`/api/links/${id}`);
      setLinks(links.filter((link) => link.id !== id));
      setDeleteConfirmId(null);
      setSuccessMessage('Посилання успішно видалено!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Не вдалося видалити посилання');
      setDeleteConfirmId(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Функція для перекладу типу джерела на українську
  const getSourceTypeLabel = (sourceType) => {
    const labels = {
      'social_media': 'Соцмережі',
      'email_marketing': 'E-mail маркетинг',
      'bloggers_influencers': 'Блогери / інфлюенсери',
      'search_ads': 'Пошукова реклама',
      'seo_traffic': 'SEO-трафік',
      'messengers': 'Месенджери',
      'own_website': 'Власний сайт / лендинг',
      'other': 'Інше'
    };
    return labels[sourceType] || sourceType || 'Не вказано';
  };

  // Calculate aggregated stats
  const totalClicks = links.reduce((sum, link) => sum + (link.stats?.total_clicks || 0), 0);
  const uniqueClicks = links.reduce((sum, link) => sum + (link.stats?.unique_clicks || 0), 0);
  const totalLeads = links.reduce((sum, link) => sum + (link.stats?.leads || 0), 0);
  const totalSales = links.reduce((sum, link) => sum + (link.stats?.sales || 0), 0);
  const salesRevenue = links.reduce((sum, link) => sum + (link.stats?.sales_revenue ?? 0), 0);

  const convRate = totalClicks > 0 ? ((totalSales / totalClicks) * 100).toFixed(1) : 0;

  const canCreateMoreLinks = links.length < (user?.link_limit || 3);
  const currentDate = new Date().toLocaleDateString('uk-UA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          Hello, {user?.email?.split('@')[0] || 'User'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400">{currentDate}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          icon={MousePointerClick}
          label="Всього кліків"
          value={totalClicks.toLocaleString()}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={Users}
          label="Унікальні кліки"
          value={uniqueClicks.toLocaleString()}
          bgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          icon={Target}
          label="Ліди (кнопка)"
          value={totalLeads.toLocaleString()}
          bgColor="bg-amber-100"
          iconColor="text-amber-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Продажі"
          value={totalSales.toLocaleString()}
          bgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          icon={DollarSign}
          label="Дохід"
          value={`${salesRevenue.toLocaleString()} ₴`}
          bgColor="bg-emerald-100"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Clicks Chart - Keitaro style */}
      <div className="mb-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Кліки за останні 7 днів</h3>
          <button
            onClick={fetchChartData}
            disabled={chartLoading}
            className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-lg transition-colors"
            title="Оновити графік"
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
                    {value === 'clicks' ? 'Всього кліків' : 'Унікальні кліки'}
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
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500">
            <TrendingUp className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">Поки що немає даних для графіку</p>
            <p className="text-xs mt-1">Графік з'явиться після перших кліків</p>
          </div>
        )}
      </div>

      {/* Quick Start Steps */}
      {links.length === 0 && !loading && (
        <div className="mb-8 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-violet-200 dark:border-violet-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Як почати відстежувати конверсії</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: 1, icon: Code, title: 'Встановіть трекер', desc: '1 рядок коду — решту робить сервіс', link: '/setup', linkText: 'Встановлення' },
              { step: 2, icon: Plus, title: 'Створіть посилання', desc: 'Унікальний URL для кожної кампанії', action: true },
              { step: 3, icon: Zap, title: 'Все автоматично', desc: 'Трекер сам знайде кнопки та відстежить продажі' },
            ].map(({ step, icon: Icon, title, desc, link: href, linkText, action }) => (
              <div key={step} className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">{step}</div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    <span className="font-semibold text-sm text-slate-800 dark:text-white">{title}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
                  {href && (
                    <Link to={href} className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium mt-1 inline-block">
                      {linkText} &rarr;
                    </Link>
                  )}
                  {action && (
                    <button onClick={() => setShowCreateForm(true)} className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium mt-1">
                      Створити &rarr;
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Area */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {canCreateMoreLinks ? (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Створити нове посилання</span>
            </button>
          ) : (
            <div className="flex items-center space-x-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700 font-medium">
                Ліміт посилань досягнуто ({links.length}/{user?.link_limit})
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {lastUpdated && (
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Оновлено: {lastUpdated.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          )}
          <button
            onClick={() => fetchLinks(true)}
            disabled={loading}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl transition-colors flex items-center space-x-2 text-sm font-medium disabled:opacity-50"
            title="Оновити статистику"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Оновлення...' : 'Оновити'}</span>
          </button>
        </div>
      </div>

      {/* Create Link Form */}
      {showCreateForm && canCreateMoreLinks && (
        <div className="mb-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Створити нове tracking посилання</h2>
          <form onSubmit={handleCreateLink} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Назва посилання <span className="text-slate-400 dark:text-slate-500">(необов'язково)</span>
              </label>
              <input
                type="text"
                value={newLink.name || ''}
                onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                placeholder="Наприклад: Facebook реклама, Email розсилка тощо"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-xl border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white dark:focus:bg-slate-600 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Тип джерела трафіку <span className="text-slate-400 dark:text-slate-500">(необов'язково)</span>
              </label>
              <select
                value={newLink.source_type || ''}
                onChange={(e) => setNewLink({ ...newLink, source_type: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-xl border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white dark:focus:bg-slate-600 transition-all text-slate-900 dark:text-white"
              >
                <option value="">Виберіть тип джерела</option>
                <option value="social_media">Соцмережі</option>
                <option value="email_marketing">E-mail маркетинг</option>
                <option value="bloggers_influencers">Блогери / інфлюенсери</option>
                <option value="search_ads">Пошукова реклама (Google, Bing, Yandex)</option>
                <option value="seo_traffic">SEO-трафік</option>
                <option value="messengers">Месенджери (Telegram, Viber, WhatsApp)</option>
                <option value="own_website">Власний сайт / лендинг</option>
                <option value="other">Інше</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Цільовий URL <span className="text-red-500">*</span>
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
                placeholder="https://example.com"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-xl border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white dark:focus:bg-slate-600 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
              {newLink.original_url && !newLink.original_url.match(/^https?:\/\/(.+\.|localhost|127\.0\.0\.1|\d+\.\d+\.\d+\.\d+)/i) && (
                <p className="mt-1 text-sm text-amber-600">Перевірте правильність URL</p>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewLink({ original_url: '', name: '', source_type: '' });
                }}
                className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-all"
              >
                Скасувати
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all disabled:opacity-50"
              >
                {creating ? 'Створення...' : 'Створити посилання'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Success Popup - Show Created Link */}
      {createdLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border-2 border-violet-200 dark:border-violet-800 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Tracking Link створено!</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Ваш готовий tracking URL:</p>
              </div>
            </div>
            <button
              onClick={() => setCreatedLink(null)}
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-violet-200 dark:border-violet-800">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
              Tracking URL (готовий до використання)
            </label>
            <div className="flex items-center space-x-2">
              <code className="flex-1 px-4 py-3 bg-white dark:bg-slate-700 rounded-lg text-sm font-mono text-slate-800 dark:text-slate-200 break-all border border-slate-200 dark:border-slate-600">
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
                    <span>Скопійовано!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span>Копіювати</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            {createdLink.name && (
              <div>
                <p className="text-slate-500 dark:text-slate-400 mb-1">Назва:</p>
                <p className="text-slate-800 dark:text-white font-semibold">{createdLink.name}</p>
              </div>
            )}
            {createdLink.source_type && (
              <div>
                <p className="text-slate-500 dark:text-slate-400 mb-1">Тип джерела:</p>
                <span className="inline-block px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-lg text-sm font-medium">
                  {getSourceTypeLabel(createdLink.source_type)}
                </span>
              </div>
            )}
            <div>
              <p className="text-slate-500 dark:text-slate-400 mb-1">Оригінальний URL:</p>
              <a
                href={createdLink.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium break-all"
              >
                {createdLink.original_url}
              </a>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 mb-1">Унікальний код:</p>
              <code className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-800 dark:text-slate-200 font-mono">
                {createdLink.unique_code}
              </code>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>💡 Порада:</strong> Скопіюйте tracking URL і використовуйте його замість оригінального посилання. 
              Всі кліки та конверсії будуть автоматично відслідковуватися!
            </p>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                setCreatedLink(null);
                fetchLinks(true); // Refresh to get updated stats
              }}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all"
            >
              Зрозуміло
            </button>
          </div>
        </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl flex items-center space-x-2">
          <Check className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Links Table - Keitaro style */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Завантаження...</p>
        </div>
      ) : links.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">Поки що немає посилань. Створіть перше!</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {links.length} {links.length === 1 ? 'посилання' : links.length < 5 ? 'посилання' : 'посилань'}
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук..."
                className="pl-8 pr-3 py-1.5 w-48 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-750">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-8"></th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Посилання</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Кліки</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Унікальні</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ліди</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Продажі</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">CR%</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Дохід</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-16">Дії</th>
                </tr>
              </thead>
              <tbody>
                {links
                  .filter(link => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      (link.name || '').toLowerCase().includes(q) ||
                      (link.original_url || '').toLowerCase().includes(q) ||
                      (link.unique_code || '').toLowerCase().includes(q) ||
                      (link.source_type || '').toLowerCase().includes(q)
                    );
                  })
                  .map((link) => {
                    const clicks = link.stats?.total_clicks || 0;
                    const unique = link.stats?.unique_clicks || 0;
                    const leads = link.stats?.leads || 0;
                    const sales = link.stats?.sales || 0;
                    const revenue = link.stats?.sales_revenue ?? 0;
                    const cr = clicks > 0 ? ((sales / clicks) * 100).toFixed(1) : '0.0';

                    return (
                      <React.Fragment key={link.id}>
                        {/* Main row */}
                        <tr
                          className={`border-b border-slate-100 dark:border-slate-700/50 cursor-pointer transition-colors ${
                            expandedLinkId === link.id
                              ? 'bg-violet-50/50 dark:bg-violet-900/10'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                          }`}
                          onClick={() => setExpandedLinkId(expandedLinkId === link.id ? null : link.id)}
                        >
                          {/* Status */}
                          <td className="px-4 py-2.5">
                            <div className={`w-2 h-2 rounded-full ${link.code_connected ? 'bg-green-500' : 'bg-red-400'}`} title={link.code_connected ? 'Код підключено' : 'Код не підключено'} />
                          </td>
                          {/* Name */}
                          <td className="px-3 py-2.5">
                            <div className="flex items-center space-x-2 min-w-0">
                              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${expandedLinkId === link.id ? 'rotate-180' : ''}`} />
                              <div className="min-w-0">
                                <p className="font-medium text-slate-800 dark:text-white truncate max-w-[280px]">
                                  {link.name || link.unique_code}
                                </p>
                                {link.source_type && (
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{getSourceTypeLabel(link.source_type)}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          {/* Clicks */}
                          <td className="px-3 py-2.5 text-right font-mono text-slate-700 dark:text-slate-200 tabular-nums">{clicks.toLocaleString()}</td>
                          {/* Unique */}
                          <td className="px-3 py-2.5 text-right font-mono text-slate-700 dark:text-slate-200 tabular-nums">{unique.toLocaleString()}</td>
                          {/* Leads */}
                          <td className={`px-3 py-2.5 text-right font-mono tabular-nums ${leads > 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>{leads}</td>
                          {/* Sales */}
                          <td className={`px-3 py-2.5 text-right font-mono tabular-nums ${sales > 0 ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>{sales}</td>
                          {/* CR */}
                          <td className={`px-3 py-2.5 text-right font-mono tabular-nums ${parseFloat(cr) > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>{cr}%</td>
                          {/* Revenue */}
                          <td className={`px-3 py-2.5 text-right font-mono tabular-nums whitespace-nowrap ${revenue > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>{revenue.toFixed(2)} ₴</td>
                          {/* Actions */}
                          <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-center space-x-0.5">
                              <button
                                onClick={() => {
                                  copyToClipboard(link.tracking_url);
                                  setCopiedLinkId(link.id);
                                  setTimeout(() => setCopiedLinkId(null), 2000);
                                }}
                                className={`p-1.5 rounded transition-colors ${copiedLinkId === link.id ? 'text-green-600 bg-green-50 dark:bg-green-900/30' : 'text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30'}`}
                                title={copiedLinkId === link.id ? 'Скопійовано!' : 'Копіювати tracking URL'}
                              >
                                {copiedLinkId === link.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleEditLink(link)}
                                className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded transition-colors"
                                title="Редагувати"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(link.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                title="Видалити"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded row */}
                        {expandedLinkId === link.id && (
                          <tr className="bg-slate-50/80 dark:bg-slate-700/20">
                            <td colSpan={9} className="px-4 py-3">
                              <div className="space-y-3">
                                {/* Tracking URL */}
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">Tracking URL:</span>
                                  <code className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 text-xs font-mono text-slate-700 dark:text-slate-300 break-all select-all">
                                    {link.tracking_url}
                                  </code>
                                  <button
                                    onClick={() => {
                                      copyToClipboard(link.tracking_url);
                                      setCopiedLinkId(link.id);
                                      setTimeout(() => setCopiedLinkId(null), 2000);
                                    }}
                                    className={`px-2.5 py-1.5 rounded text-xs font-medium transition-all whitespace-nowrap ${
                                      copiedLinkId === link.id
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-400'
                                    }`}
                                  >
                                    {copiedLinkId === link.id ? '✓ Скопійовано' : 'Копіювати'}
                                  </button>
                                </div>

                                {/* Meta info */}
                                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
                                  <div>
                                    <span className="text-slate-400">Оригінал: </span>
                                    <a href={link.original_url} target="_blank" rel="noopener noreferrer" className="text-violet-600 dark:text-violet-400 hover:underline break-all">{link.original_url}</a>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">Код: </span>
                                    <code className="text-slate-600 dark:text-slate-300 font-mono">{link.unique_code}</code>
                                  </div>
                                  {link.source_type && (
                                    <div>
                                      <span className="text-slate-400">Джерело: </span>
                                      <span className="text-slate-600 dark:text-slate-300">{getSourceTypeLabel(link.source_type)}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <div className={`w-1.5 h-1.5 rounded-full ${link.code_connected ? 'bg-green-500' : 'bg-red-400'}`} />
                                    {link.code_connected ? (
                                      <span className="text-green-600 dark:text-green-400">Код підключено</span>
                                    ) : (
                                      <Link to="/setup" className="text-red-500 dark:text-red-400 hover:underline">Код не підключено →</Link>
                                    )}
                                  </div>
                                </div>

                                {/* Edit Form */}
                                {editingLinkId === link.id && (
                                  <div className="bg-white dark:bg-slate-700/50 rounded-lg p-3 border border-slate-200 dark:border-slate-600 mt-2">
                                    <form onSubmit={(e) => { e.preventDefault(); handleUpdateLink(link.id); }} className="space-y-2.5">
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                                        <input
                                          type="text"
                                          value={editForm.name || ''}
                                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                          placeholder="Назва"
                                          className="px-3 py-1.5 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-violet-500"
                                        />
                                        <select
                                          value={editForm.source_type || ''}
                                          onChange={(e) => setEditForm({ ...editForm, source_type: e.target.value })}
                                          className="px-3 py-1.5 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-violet-500"
                                        >
                                          <option value="">Тип джерела</option>
                                          <option value="social_media">Соцмережі</option>
                                          <option value="email_marketing">E-mail маркетинг</option>
                                          <option value="bloggers_influencers">Блогери / інфлюенсери</option>
                                          <option value="search_ads">Пошукова реклама</option>
                                          <option value="seo_traffic">SEO-трафік</option>
                                          <option value="messengers">Месенджери</option>
                                          <option value="own_website">Власний сайт</option>
                                          <option value="other">Інше</option>
                                        </select>
                                        <input
                                          type="url" required
                                          value={editForm.original_url}
                                          onChange={(e) => setEditForm({ ...editForm, original_url: e.target.value })}
                                          placeholder="https://example.com"
                                          className="px-3 py-1.5 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-violet-500"
                                        />
                                      </div>
                                      <div className="flex justify-end gap-2">
                                        <button type="button" onClick={handleCancelEdit} disabled={updating} className="px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50">Скасувати</button>
                                        <button type="submit" disabled={updating} className="px-3 py-1.5 text-xs bg-violet-600 text-white font-medium rounded hover:bg-violet-700 disabled:opacity-50 flex items-center gap-1">
                                          {updating ? 'Збереження...' : <><Save className="w-3 h-3" /><span>Зберегти</span></>}
                                        </button>
                                      </div>
                                    </form>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
              </tbody>
              {/* Totals row */}
              <tfoot>
                <tr className="border-t-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 font-semibold">
                  <td className="px-4 py-2.5"></td>
                  <td className="px-3 py-2.5 text-xs uppercase text-slate-500 dark:text-slate-400 tracking-wider">Всього</td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-800 dark:text-white tabular-nums">{totalClicks.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-800 dark:text-white tabular-nums">{uniqueClicks.toLocaleString()}</td>
                  <td className={`px-3 py-2.5 text-right font-mono tabular-nums ${totalLeads > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>{totalLeads}</td>
                  <td className={`px-3 py-2.5 text-right font-mono tabular-nums ${totalSales > 0 ? 'text-green-600 dark:text-green-400' : 'text-slate-500'}`}>{totalSales}</td>
                  <td className={`px-3 py-2.5 text-right font-mono tabular-nums ${parseFloat(convRate) > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>{convRate}%</td>
                  <td className={`px-3 py-2.5 text-right font-mono tabular-nums whitespace-nowrap ${salesRevenue > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>{salesRevenue.toFixed(2)} ₴</td>
                  <td className="px-3 py-2.5"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Видалити посилання?</h3>
                <p className="text-slate-500 dark:text-slate-400">Цю дію неможливо скасувати</p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Ви впевнені, що хочете видалити це tracking посилання? Усі дані про кліки та конверсії будуть втрачені.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-6 py-3 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                Скасувати
              </button>
              <button
                onClick={() => handleDeleteLink(deleteConfirmId)}
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-all"
              >
                Видалити
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
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${bgColor} dark:opacity-80 rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor} dark:opacity-90`} />
        </div>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
    </div>
  );
}