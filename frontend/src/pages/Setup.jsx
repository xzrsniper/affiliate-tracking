import { useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import api from '../config/api.js';
import { Code, Settings, Copy, Check, ExternalLink, FileCode, Tag, Plus, Edit, Trash2, Globe, X, RefreshCw, BookOpen, AlertCircle, HelpCircle } from 'lucide-react';

export default function Setup() {
  const [copiedSection, setCopiedSection] = useState(null);
  const [activeTab, setActiveTab] = useState('websites'); // 'websites', 'code', 'gtm' або 'guide'
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWebsite, setNewWebsite] = useState({ name: '', domain: '' });
  const [editingWebsite, setEditingWebsite] = useState(null);
  const [showCodeModal, setShowCodeModal] = useState(null);
  const [checkingId, setCheckingId] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    if (activeTab === 'websites') {
      fetchWebsites();
    }
  }, [activeTab]);

  const fetchWebsites = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/websites');
      setWebsites(response.data.websites || []);
    } catch (err) {
      console.error('Failed to load websites:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWebsite = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/websites', newWebsite);
      setNewWebsite({ name: '', domain: '' });
      setShowAddForm(false);
      fetchWebsites();
    } catch (err) {
      console.error('Failed to add website:', err);
    }
  };

  const handleDeleteWebsite = async (id) => {
    if (!confirm('Ви впевнені, що хочете видалити цей сайт?')) return;
    try {
      await api.delete(`/api/websites/${id}`);
      fetchWebsites();
    } catch (err) {
      console.error('Failed to delete website:', err);
    }
  };


  const isLocalhost = (domain) => {
    if (!domain) return false;
    return /^(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(domain.replace(/^https?:\/\//i, ''));
  };

  const handleCheckWebsite = async (website) => {
    try {
      setCheckingId(website.id);
      
      // Для localhost не можна перевірити автоматично
      if (isLocalhost(website.domain)) {
        alert('Для localhost сайтів автоматична перевірка недоступна. Переконайтеся, що tracking код встановлено на сайті, і використайте публічний домен для перевірки.');
        setCheckingId(null);
        return;
      }
      
      const res = await api.get(`/api/websites/${website.id}/check`);
      // Update local state with new status
      setWebsites((prev) =>
        prev.map((w) =>
          w.id === website.id ? { ...w, is_connected: res.data.is_connected } : w
        )
      );
    } catch (err) {
      console.error('Failed to check website:', err);
      alert('Не вдалося перевірити сайт. Переконайтеся, що сайт доступний з інтернету.');
    } finally {
      setCheckingId(null);
    }
  };

  const trackerConfigCode = `<script>
  window.TRACKER_CONFIG = {
    BASE_URL: '${API_BASE}/api/track',
    CONVERSION_KEYWORDS: ['success', 'order', 'thank-you', 'thankyou', 'complete', 'purchase', 'confirmation'],
    DEBUG: false // Встановіть true для діагностики
  };
</script>
<script src="${API_BASE}/tracker.js"></script>`;

  const gtmCode = `<script>
(function() {
  'use strict';
  
  // Prevent duplicate initialization
  if (window._lehkoTrackerGTMInitialized) {
    return;
  }
  window._lehkoTrackerGTMInitialized = true;

  // ========== КОНФІГУРАЦІЯ ==========
  const BASE_URL = '${API_BASE}/api/track';
  const CONVERSION_KEYWORDS = ['order', 'thank-you', 'thankyou', 'success', 'confirmation', 'complete', 'purchase'];
  
  // Storage keys
  const STORAGE_REF_CODE = 'aff_ref_code';
  const STORAGE_VISITOR_ID = 'lehko_visitor_id';
  const REF_PARAM = 'ref';
  
  // Cookie settings
  function getRootDomain() {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length <= 2) return hostname;
    return '.' + parts.slice(-2).join('.');
  }
  
  const COOKIE_DOMAIN = getRootDomain();
  const COOKIE_PATH = '/';
  const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

  // ========== УТИЛІТИ ==========
  function setCookie(name, value, days) {
    try {
      const expires = new Date();
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
      const cookieString = name + '=' + encodeURIComponent(value) +
                          ';expires=' + expires.toUTCString() +
                          ';path=' + COOKIE_PATH + ';SameSite=Lax';
      if (COOKIE_DOMAIN && !COOKIE_DOMAIN.includes('localhost')) {
        document.cookie = cookieString + ';domain=' + COOKIE_DOMAIN;
      } else {
        document.cookie = cookieString;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function getCookie(name) {
    try {
      const nameEQ = name + '=';
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) {
          return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  function getURLParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  function generateVisitorId() {
    return 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function getVisitorId() {
    let visitorId = localStorage.getItem(STORAGE_VISITOR_ID);
    if (!visitorId) {
      visitorId = generateVisitorId();
      localStorage.setItem(STORAGE_VISITOR_ID, visitorId);
    }
    return visitorId;
  }

  // ========== ОСНОВНА ЛОГІКА ==========
  function captureReferral() {
    const refCode = getURLParameter(REF_PARAM);
    if (refCode) {
      setCookie(STORAGE_REF_CODE, refCode, 365);
      localStorage.setItem(STORAGE_REF_CODE, refCode);
    }
  }

  function trackPageView() {
    const refCode = getURLParameter(REF_PARAM) || getCookie(STORAGE_REF_CODE) || localStorage.getItem(STORAGE_REF_CODE);
    if (!refCode) return;

    const visitorId = getVisitorId();
    const url = BASE_URL + '/view/' + encodeURIComponent(refCode) + '?visitor_id=' + encodeURIComponent(visitorId);

    if (navigator.sendBeacon) {
      navigator.sendBeacon(url);
    } else {
      const img = new Image();
      img.src = url;
    }
  }

  function trackConversion() {
    const refCode = getCookie(STORAGE_REF_CODE) || localStorage.getItem(STORAGE_REF_CODE);
    if (!refCode) return;

    const currentPath = window.location.pathname.toLowerCase();
    const isConversionPage = CONVERSION_KEYWORDS.some(keyword => 
      currentPath.includes(keyword.toLowerCase())
    );

    if (!isConversionPage) return;

    const visitorId = getVisitorId();
    const url = BASE_URL + '/conversion?code=' + encodeURIComponent(refCode) + 
                '&visitor_id=' + encodeURIComponent(visitorId);

    if (navigator.sendBeacon) {
      navigator.sendBeacon(url);
    } else {
      const img = new Image();
      img.src = url;
    }
  }

  function sendVerificationPing() {
    const refCode = getURLParameter(REF_PARAM) || getCookie(STORAGE_REF_CODE) || localStorage.getItem(STORAGE_REF_CODE);
    if (!refCode) return;

    const domain = window.location.hostname;
    const url = BASE_URL.replace('/api/track', '') + '/api/track/verify?code=' + encodeURIComponent(refCode) + 
                '&domain=' + encodeURIComponent(domain) + '&version=gtm';

    if (navigator.sendBeacon) {
      navigator.sendBeacon(url);
    } else {
      const img = new Image();
      img.src = url;
    }
  }

  // ========== ІНІЦІАЛІЗАЦІЯ ==========
  function init() {
    try {
      captureReferral();
      trackPageView();
      sendVerificationPing();
      setTimeout(function() {
        trackConversion();
      }, 500);
    } catch (error) {
      console.error('[Lehko Tracker GTM] Error:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Verification ping кожні 5 хвилин
  setInterval(function() {
    sendVerificationPing();
  }, 5 * 60 * 1000);
})();
</script>`;

  const copyToClipboard = (text, sectionId) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            Налаштування Tracking
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Інструкції з встановлення tracking системи на ваш сайт
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('websites')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'websites'
                    ? 'border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Globe className="w-5 h-5 inline mr-2" />
                Мої сайти
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'code'
                    ? 'border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <FileCode className="w-5 h-5 inline mr-2" />
                Встановлення кодом
              </button>
              <button
                onClick={() => setActiveTab('gtm')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'gtm'
                    ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Tag className="w-5 h-5 inline mr-2" />
                Google Tag Manager
              </button>
              <button
                onClick={() => setActiveTab('guide')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'guide'
                    ? 'border-emerald-600 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <BookOpen className="w-5 h-5 inline mr-2" />
                Детальна інструкція
              </button>
            </nav>
          </div>
        </div>

        {/* Websites Tab */}
        {activeTab === 'websites' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Мої сайти</h2>
                <p className="text-slate-600 dark:text-slate-400">Управління сайтами та tracking кодом</p>
              </div>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Додати сайт</span>
              </button>
            </div>

            {/* Add Website Form */}
            {showAddForm && (
              <div className="mb-6 bg-slate-50 dark:bg-slate-700 rounded-xl p-6 border border-slate-200 dark:border-slate-600">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Додати новий сайт</h3>
                <form onSubmit={handleAddWebsite} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Назва сайту <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newWebsite.name}
                      onChange={(e) => setNewWebsite({ ...newWebsite, name: e.target.value })}
                      placeholder="Наприклад: Мій інтернет-магазин"
                      className="w-full px-4 py-3 bg-white dark:bg-slate-600 rounded-xl border-0 focus:ring-2 focus:ring-violet-500 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Домен сайту <span className="text-slate-400 dark:text-slate-500">(необов'язково)</span>
                    </label>
                    <input
                      type="text"
                      value={newWebsite.domain}
                      onChange={(e) => setNewWebsite({ ...newWebsite, domain: e.target.value })}
                      placeholder="example.com"
                      className="w-full px-4 py-3 bg-white dark:bg-slate-600 rounded-xl border-0 focus:ring-2 focus:ring-violet-500 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewWebsite({ name: '', domain: '' });
                      }}
                      className="px-6 py-3 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
                    >
                      Скасувати
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all"
                    >
                      Додати
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Websites Table */}
            {loading ? (
              <div className="text-center py-12">
                <p className="text-slate-500 dark:text-slate-400">Завантаження...</p>
              </div>
            ) : websites.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600">
                <p className="text-slate-500 dark:text-slate-400">Поки що немає доданих сайтів. Додайте перший сайт!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Сайт</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Статус підключення</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Перевірка</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {websites.map((website) => (
                      <tr key={website.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-white">{website.name}</p>
                            {website.domain && (
                              <p className="text-sm text-slate-500 dark:text-slate-400">{website.domain}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center space-x-2 px-3 py-1 rounded-lg font-medium text-sm ${
                              website.is_connected
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${website.is_connected ? 'bg-green-600' : 'bg-red-600'}`}></span>
                            <span>{website.is_connected ? 'Підключено' : 'Не підключено'}</span>
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {isLocalhost(website.domain) ? (
                            <div className="flex flex-col space-y-1">
                              <span className="text-sm text-slate-500 dark:text-slate-400 italic">
                                Localhost - перевірка недоступна
                              </span>
                              <span className="text-xs text-slate-400 dark:text-slate-500">
                                Використайте публічний домен для перевірки
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleCheckWebsite(website)}
                              disabled={checkingId === website.id}
                              className="inline-flex items-center space-x-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-all disabled:opacity-50"
                            >
                              <RefreshCw className={`w-4 h-4 ${checkingId === website.id ? 'animate-spin' : ''}`} />
                              <span>{checkingId === website.id ? 'Перевіряю...' : 'Перевірити'}</span>
                            </button>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setShowCodeModal(website)}
                              className="p-2 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-lg transition-colors"
                              title="Показати код"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteWebsite(website.id)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Видалити"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Code Modal */}
        {showCodeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                  Tracking код для: {showCodeModal.name}
                </h3>
                <button
                  onClick={() => setShowCodeModal(null)}
                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Готовий код для вставки:
                </label>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600 relative">
                  <button
                    onClick={() => {
                      copyToClipboard(trackerConfigCode, 'modal-code');
                    }}
                    className="absolute top-4 right-4 p-2 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-600 rounded-lg transition-colors"
                    title="Копіювати код"
                  >
                    {copiedSection === 'modal-code' ? (
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                  <pre className="text-sm text-slate-800 dark:text-slate-200 overflow-x-auto">
                    <code>{trackerConfigCode}</code>
                  </pre>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>💡 Інструкція:</strong> Скопіюйте код вище та вставте його в секцію <code className="bg-white dark:bg-slate-700 px-2 py-1 rounded">&lt;head&gt;</code> вашого HTML, 
                  перед закриваючим тегом <code className="bg-white dark:bg-slate-700 px-2 py-1 rounded">&lt;/head&gt;</code>
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowCodeModal(null)}
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all"
                >
                  Зрозуміло
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Method 1: Direct Code Installation */}
        {activeTab === 'code' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
              <FileCode className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Встановлення кодом</h2>
              <p className="text-slate-600 dark:text-slate-400">Найпростіший спосіб - додайте код безпосередньо в HTML</p>
            </div>
          </div>

          {/* Step 1 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3 flex items-center">
              <span className="w-8 h-8 bg-violet-600 dark:bg-violet-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
              Скопіюйте tracking код
            </h3>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600 relative">
              <button
                onClick={() => copyToClipboard(trackerConfigCode, 'code')}
                className="absolute top-4 right-4 p-2 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-600 rounded-lg transition-colors"
                title="Копіювати код"
              >
                {copiedSection === 'code' ? (
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
              <pre className="text-sm text-slate-800 dark:text-slate-200 overflow-x-auto">
                <code>{trackerConfigCode}</code>
              </pre>
            </div>
          </div>

          {/* Step 2 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3 flex items-center">
              <span className="w-8 h-8 bg-violet-600 dark:bg-violet-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
              Вставте код в ваш HTML
            </h3>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Важливо:</strong> Вставте код в секцію <code className="bg-white dark:bg-slate-700 px-2 py-1 rounded">&lt;head&gt;</code> вашого HTML, 
                перед закриваючим тегом <code className="bg-white dark:bg-slate-700 px-2 py-1 rounded">&lt;/head&gt;</code>
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
              <pre className="text-sm text-slate-800 dark:text-slate-200">
                <code>{`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ваш сайт</title>
  
  <!-- Вставте tracking код тут -->
  ${trackerConfigCode.split('\n').slice(0, 2).join('\n')}
  ...
</head>
<body>
  ...
</body>
</html>`}</code>
              </pre>
            </div>
          </div>

          {/* Step 3 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3 flex items-center">
              <span className="w-8 h-8 bg-violet-600 dark:bg-violet-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
              Перевірте встановлення
            </h3>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
              <p className="text-slate-700 dark:text-slate-300 mb-3">Відкрийте консоль браузера (F12) і перевірте:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
                <li>Переконайтеся, що немає помилок завантаження скрипта</li>
                <li>Якщо DEBUG: true, ви побачите повідомлення про tracking</li>
                <li>Перевірте, що <code className="bg-white dark:bg-slate-600 px-2 py-1 rounded">window.AffiliateTracker</code> доступний в консолі</li>
              </ul>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
              <strong>💡 Порада:</strong> Після встановлення, коли користувачі переходитимуть через ваше tracking посилання, 
              система автоматично відстежуватиме кліки та конверсії на сторінках з ключовими словами 
              (success, order, thank-you, тощо).
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>🔍 Автоматична перевірка:</strong> Трекер автоматично надсилає verification ping кожні 5 хвилин, 
              що дозволяє системі визначати його наявність та показувати статус "Підключено" в панелі управління. 
              Перевірте статус на сторінці "Мої сайти" через 5-10 хвилин після встановлення.
            </p>
          </div>
        </div>
        )}

        {/* Method 2: Google Tag Manager */}
        {activeTab === 'gtm' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
              <Tag className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Встановлення через Google Tag Manager</h2>
              <p className="text-slate-600 dark:text-slate-400">Ідеально для сайтів, які вже використовують GTM</p>
            </div>
          </div>

          {/* Step 1 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3 flex items-center">
              <span className="w-8 h-8 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
              Створіть новий Custom HTML тег
            </h3>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
              <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300">
                <li>Відкрийте Google Tag Manager</li>
                <li>Перейдіть в <strong>Tags</strong> → <strong>New</strong></li>
                <li>Оберіть тип тега: <strong>Custom HTML</strong></li>
                <li>Назвіть тег: <code className="bg-white dark:bg-slate-600 px-2 py-1 rounded">LehkoTrack</code></li>
              </ol>
            </div>
          </div>

          {/* Step 2 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3 flex items-center">
              <span className="w-8 h-8 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
              Вставте tracking код
            </h3>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600 relative mb-4">
              <button
                onClick={() => copyToClipboard(gtmCode, 'gtm')}
                className="absolute top-4 right-4 p-2 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-600 rounded-lg transition-colors"
                title="Копіювати код"
              >
                {copiedSection === 'gtm' ? (
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
              <pre className="text-sm text-slate-800 dark:text-slate-200 overflow-x-auto">
                <code>{gtmCode}</code>
              </pre>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Важливо:</strong> Вставте цей код в поле <strong>HTML</strong> вашого Custom HTML тега в GTM.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3 flex items-center">
              <span className="w-8 h-8 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
              Налаштуйте тригери та пріоритет
            </h3>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600 mb-3">
              <p className="text-slate-700 dark:text-slate-300 mb-3">Встановіть тригер для запуску тега:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
                <li>Оберіть <strong>All Pages</strong> для відстеження на всіх сторінках</li>
                <li>Рекомендується: <strong>Page View</strong> → <strong>All Pages</strong></li>
                <li><strong>Важливо:</strong> Встановіть тільки ОДИН тригер, щоб уникнути дублювання</li>
                <li><strong>Пріоритет:</strong> Встановіть <strong>High</strong> (високий), щоб тег завантажувався рано</li>
              </ul>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <p className="text-sm text-amber-800 dark:text-amber-300 flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <span><strong>Запобігання дублюванню:</strong> Переконайтеся, що тег налаштований на спрацювання <strong>тільки один раз</strong> на сторінку. Не додавайте кілька тригерів для одного тега. Якщо використовуєте GTM, НЕ вставляйте код також безпосередньо в HTML.</span>
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3 flex items-center">
              <span className="w-8 h-8 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">4</span>
              Збережіть та опублікуйте
            </h3>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
              <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300">
                <li>Натисніть <strong>Save</strong> для збереження тега</li>
                <li>Перевірте тег в режимі <strong>Preview</strong> (рекомендується)</li>
                <li>Якщо все працює, натисніть <strong>Submit</strong> для публікації</li>
              </ol>
            </div>
          </div>

          {/* Step 5 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3 flex items-center">
              <span className="w-8 h-8 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">5</span>
              Перевірте встановлення
            </h3>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
              <p className="text-slate-700 dark:text-slate-300 mb-3">Після публікації тега:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
                <li>Перейдіть на сторінку <strong>"Мої сайти"</strong> в панелі LehkoTrack</li>
                <li>Додайте ваш сайт (якщо ще не додано) з доменом</li>
                <li>Натисніть кнопку <strong>"Перевірити"</strong> біля вашого сайту</li>
                <li>Система автоматично визначить наявність трекера через verification ping</li>
                <li>Статус <strong>"Підключено"</strong> з'явиться протягом 5-10 хвилин після встановлення</li>
              </ul>
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-300">
                  <strong>✅ Автоматична перевірка:</strong> Трекер автоматично надсилає verification ping кожні 5 хвилин, 
                  що дозволяє системі надійно визначати його наявність на сайті.
                </p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
              <strong>💡 Переваги GTM:</strong> Ви можете легко оновлювати налаштування tracking без зміни коду сайту. 
              Також можете додати додаткові умови та правила для запуску tracking.
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>🔍 Автоматична перевірка:</strong> Трекер надсилає verification ping кожні 5 хвилин, що дозволяє системі 
              автоматично визначати його наявність та показувати статус "Підключено" в панелі управління.
            </p>
          </div>
        </div>
        )}

        {/* Detailed Guide Tab */}
        {activeTab === 'guide' && (
          <div className="space-y-6">
            {/* Introduction */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
              <div className="flex items-start space-x-4 mb-6">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                  <BookOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                    Детальна інструкція з встановлення
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    Покрокова інструкція для правильного встановлення tracking коду LehkoTrack на ваш сайт
                  </p>
                </div>
              </div>
            </div>

            {/* Preparation */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                <HelpCircle className="w-6 h-6 mr-2 text-violet-600 dark:text-violet-400" />
                Підготовка
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Що вам знадобиться:</h4>
                  <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                    <li><strong>Tracking код</strong> - отримайте його в панелі LehkoTrack (вкладка "Встановлення кодом")</li>
                    <li><strong>Доступ до коду вашого сайту</strong> - HTML шаблони або Google Tag Manager</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Method 1: Direct Installation */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                <FileCode className="w-6 h-6 mr-2 text-violet-600 dark:text-violet-400" />
                Спосіб 1: Пряме встановлення (рекомендовано)
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-3">Крок 1: Отримайте код</h4>
                  <p className="text-slate-700 dark:text-slate-300 mb-3">
                    У панелі LehkoTrack перейдіть на вкладку <strong>"Встановлення кодом"</strong> та скопіюйте готовий код.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-3">Крок 2: Вставте код на ваш сайт</h4>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
                    <p className="text-sm text-amber-800 dark:text-amber-300 flex items-start">
                      <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Важливо:</strong> Код повинен бути вставлений на <strong>ВСІ сторінки</strong> вашого сайту, включаючи головну, товари, кошик та сторінку підтвердження замовлення.</span>
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium text-slate-800 dark:text-white mb-2">Для статичних HTML сайтів:</h5>
                      <p className="text-slate-700 dark:text-slate-300 text-sm mb-2">
                        Вставте код безпосередньо перед закриваючим тегом <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">&lt;/head&gt;</code>:
                      </p>
                      <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                        <pre className="text-xs text-slate-800 dark:text-slate-200 overflow-x-auto">
                          <code>{`<!DOCTYPE html>
<html>
<head>
  <title>Мій сайт</title>
  <!-- Інші теги head -->
  
  <!-- LehkoTrack Tracking Code -->
  <script>
    window.TRACKER_CONFIG = {
      BASE_URL: '${API_BASE}/api/track',
      CONVERSION_KEYWORDS: ['success', 'order', 'thank-you', 'thankyou', 'complete', 'purchase', 'confirmation'],
      DEBUG: false
    };
  </script>
  <script src="${API_BASE}/tracker.js"></script>
  <!-- End LehkoTrack -->
</head>
<body>
  <!-- Вміст сайту -->
</body>
</html>`}</code>
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-slate-800 dark:text-white mb-2">Для WordPress:</h5>
                      <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                        <li>Встановіть плагін для вставки коду (наприклад, "Insert Headers and Footers")</li>
                        <li>Вставте код в розділ "Scripts in Header"</li>
                        <li>Або відредагуйте файл <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">header.php</code> вашої теми</li>
                      </ol>
                    </div>

                    <div>
                      <h5 className="font-medium text-slate-800 dark:text-white mb-2">Для інших CMS (Shopify, WooCommerce, тощо):</h5>
                      <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                        <li>Знайдіть налаштування "Custom Code" або "Tracking Scripts"</li>
                        <li>Вставте код в розділ для коду в <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">&lt;head&gt;</code></li>
                        <li>Збережіть зміни</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Method 2: GTM */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                <Tag className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" />
                Спосіб 2: Через Google Tag Manager
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-3">Крок 1: Створіть новий тег в GTM</h4>
                  <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                    <li>Увійдіть в Google Tag Manager</li>
                    <li>Виберіть ваш контейнер</li>
                    <li>Натисніть <strong>"Теги"</strong> → <strong>"Новий"</strong></li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-3">Крок 2: Налаштуйте тег</h4>
                  <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                    <li><strong>Назва тегу:</strong> <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">LehkoTrack - Tracking Code</code></li>
                    <li><strong>Тип тегу:</strong> <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">Custom HTML</code> (або "Пользовательский HTML")</li>
                    <li><strong>HTML код:</strong> Перейдіть на вкладку <strong>"Google Tag Manager"</strong> в панелі LehkoTrack та скопіюйте готовий код</li>
                    <li><strong>Триггер:</strong> <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">All Pages</code> (всі сторінки)</li>
                    <li><strong>Пріоритет:</strong> Встановіть <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">High</code> (високий) для раннього завантаження</li>
                  </ul>
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>💡 Важливо:</strong> Код автоматично надсилає verification ping кожні 5 хвилин, що дозволяє системі 
                      надійно визначати наявність трекера на вашому сайті та показувати статус "Підключено" в панелі управління.
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-3">Крок 3: Налаштуйте тригер (важливо!)</h4>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-3">
                    <p className="text-sm text-amber-800 dark:text-amber-300 flex items-start">
                      <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>Увага:</strong> Щоб уникнути дублювання тегів, встановіть тригер на <strong>"All Pages"</strong> (Всі сторінки) і переконайтеся, що тег налаштований на спрацювання <strong>тільки один раз</strong> на сторінку.</span>
                    </p>
                  </div>
                  <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                    <li><strong>Тригер:</strong> <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">All Pages</code> (всі сторінки)</li>
                    <li><strong>Тип запуску:</strong> <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">Once per page</code> (один раз на сторінку) - якщо доступно</li>
                    <li><strong>Умова:</strong> Не додавайте додаткові умови, які можуть призвести до подвійного спрацювання</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-3">Крок 4: Опублікуйте зміни</h4>
                  <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                    <li>Натисніть <strong>"Опублікувати"</strong> (Submit)</li>
                    <li>Введіть назву версії (наприклад: "Додано LehkoTrack")</li>
                    <li>Натисніть <strong>"Опублікувати"</strong></li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-3">Крок 5: Перевірте встановлення</h4>
                  <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                    <li>Перейдіть на сторінку <strong>"Налаштування"</strong> → вкладка <strong>"Мої сайти"</strong> в панелі LehkoTrack</li>
                    <li>Додайте ваш сайт з доменом (якщо ще не додано)</li>
                    <li>Натисніть кнопку <strong>"Перевірити"</strong> біля вашого сайту</li>
                    <li>Зачекайте 5-10 хвилин після встановлення (трекер надсилає verification ping кожні 5 хвилин)</li>
                    <li>Статус <strong>"Підключено"</strong> з'явиться автоматично після отримання першого verification ping</li>
                  </ol>
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-300">
                      <strong>✅ Автоматична перевірка:</strong> Система використовує verification ping для надійного визначення 
                      наявності трекера. Це працює як для прямого встановлення, так і для GTM.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                <Check className="w-6 h-6 mr-2 text-green-600 dark:text-green-400" />
                Перевірка встановлення
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-3">Метод 1: Автоматична перевірка через verification ping (рекомендовано)</h4>
                  <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                    <li>У панелі LehkoTrack перейдіть на сторінку <strong>"Налаштування"</strong> → вкладка <strong>"Мої сайти"</strong></li>
                    <li>Додайте ваш сайт з доменом (якщо ще не додано)</li>
                    <li>Натисніть кнопку <strong>"Перевірити"</strong> біля вашого сайту</li>
                    <li>Система автоматично перевірить наявність трекера двома способами:
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                        <li><strong>Verification ping</strong> - якщо трекер надіслав ping протягом останніх 10 хвилин (найнадійніший метод)</li>
                        <li><strong>HTML scraping</strong> - перевірка наявності коду в HTML сторінки (резервний метод)</li>
                      </ul>
                    </li>
                    <li>Статус оновиться автоматично після перевірки</li>
                  </ol>
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-300 mb-2">
                      <strong>✅ Зелений індикатор "Підключено"</strong> - трекер встановлено та працює<br/>
                      <strong>❌ Червоний індикатор "Не підключено"</strong> - трекер не знайдено, перевірте встановлення
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-300">
                      <strong>⏱️ Час очікування:</strong> Після встановлення трекера, verification ping надсилається кожні 5 хвилин. 
                      Статус може з'явитися протягом 5-10 хвилин після встановлення.
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-3">Метод 2: Ручна перевірка через браузер</h4>
                  <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                    <li>Відкрийте ваш сайт в браузері</li>
                    <li>Натисніть <strong>F12</strong> (або ПКМ → "Перевірити елемент")</li>
                    <li>Перейдіть на вкладку <strong>"Console"</strong></li>
                    <li>Введіть: <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">window.AffiliateTracker</code></li>
                    <li>Якщо бачите об'єкт - трекер встановлено ✅</li>
                    <li>Якщо <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">undefined</code> - трекер не встановлено ❌</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-3">Метод 3: Перевірка коду сторінки</h4>
                  <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                    <li>Відкрийте ваш сайт в браузері</li>
                    <li>Натисніть <strong>ПКМ</strong> → <strong>"Переглянути код сторінки"</strong> (або Ctrl+U)</li>
                    <li>Натисніть <strong>Ctrl+F</strong> для пошуку</li>
                    <li>Шукайте: <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">tracker.js</code> або <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">TRACKER_CONFIG</code></li>
                    <li>Якщо знайдено - трекер встановлено ✅</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-3">Метод 4: Перевірка через Network (мережа)</h4>
                  <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4">
                    <li>Відкрийте ваш сайт в браузері</li>
                    <li>Натисніть <strong>F12</strong> → вкладка <strong>"Network"</strong></li>
                    <li>Оновіть сторінку (F5) або зачекайте 5 хвилин</li>
                    <li>Шукайте запити до:
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                        <li><code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">/api/track/verify</code> - verification ping (надсилається кожні 5 хвилин)</li>
                        <li><code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">/api/track/view/</code> - відстеження переглядів сторінок</li>
                        <li><code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">/tracker.js</code> - завантаження скрипта (тільки для прямого встановлення)</li>
                      </ul>
                    </li>
                    <li>Якщо запити є - трекер працює ✅</li>
                    <li><strong>Для GTM:</strong> Перевірте наявність запитів до <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">/api/track/verify</code> - це підтвердить, що трекер встановлено через GTM</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Troubleshooting */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                <AlertCircle className="w-6 h-6 mr-2 text-red-600 dark:text-red-400" />
                Усунення проблем
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-3">Проблема 1: Трекер не знайдено після встановлення</h4>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-3">
                    <p className="text-sm text-red-800 dark:text-red-300 mb-2"><strong>Можливі причини:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-400 ml-4">
                      <li>Код вставлено не на всі сторінки</li>
                      <li>Код вставлено в неправильне місце</li>
                      <li>Кеш браузера (очистіть кеш: Ctrl+Shift+Delete)</li>
                      <li>CDN або кеш сервера (очистіть кеш CDN)</li>
                    </ul>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-sm"><strong>Рішення:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300 ml-4 text-sm">
                    <li>Перевірте, чи код є на сторінці (Ctrl+U → Ctrl+F → "tracker.js")</li>
                    <li>Переконайтеся, що код в <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">&lt;head&gt;</code>, а не в <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">&lt;body&gt;</code></li>
                    <li>Очистіть кеш браузера та CDN</li>
                    <li>Спробуйте в режимі інкогніто</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-3">Проблема 2: Трекер не відстежує конверсії</h4>
                  <p className="text-slate-700 dark:text-slate-300 text-sm mb-2"><strong>Рішення:</strong></p>
                  <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4 text-sm">
                    <li>Увімкніть режим DEBUG:
                      <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 mt-2 border border-slate-200 dark:border-slate-600">
                        <pre className="text-xs text-slate-800 dark:text-slate-200">
                          <code>{`window.TRACKER_CONFIG = {
  BASE_URL: '${API_BASE}/api/track',
  DEBUG: true  // Змініть на true
};`}</code>
                        </pre>
                      </div>
                    </li>
                    <li>Перевірте консоль браузера на сторінці підтвердження</li>
                    <li>Переконайтеся, що URL сторінки містить ключові слова: <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">thank-you</code>, <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">order-confirmation</code>, <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">success</code></li>
                    <li>Або використайте ручний виклик:
                      <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 mt-2 border border-slate-200 dark:border-slate-600">
                        <pre className="text-xs text-slate-800 dark:text-slate-200">
                          <code>{`window.AffiliateTracker.trackConversionManually(99.99, 'ORDER-12345');`}</code>
                        </pre>
                      </div>
                    </li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-3">Проблема 3: Тег спрацьовує двічі в GTM</h4>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-3">
                    <p className="text-sm text-red-800 dark:text-red-300 mb-2"><strong>Можливі причини:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-400 ml-4">
                      <li>Тег налаштований на кілька тригерів одночасно</li>
                      <li>Тег спрацьовує на одній події кілька разів</li>
                      <li>Код вставлено і в GTM, і безпосередньо на сайт</li>
                      <li>GTM контейнер підключений двічі</li>
                    </ul>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-sm mb-2"><strong>Рішення:</strong></p>
                  <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4 text-sm">
                    <li>Перевірте, що тег має тільки один тригер: <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">All Pages</code></li>
                    <li>Увімкніть режим Preview в GTM і перевірте, скільки разів спрацьовує тег</li>
                    <li>Переконайтеся, що код НЕ вставлено безпосередньо в HTML, якщо використовуєте GTM</li>
                    <li>Перевірте, що GTM контейнер підключений тільки один раз на сторінці</li>
                    <li>Якщо проблема залишається, використайте прямий спосіб встановлення замість GTM</li>
                  </ol>
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-300">
                      <strong>✅ Захист від дублювання:</strong> Трекер автоматично запобігає дублюванню навіть якщо спрацює кілька разів, але краще налаштувати GTM правильно.
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-3">Проблема 4: Помилки в консолі браузера</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-slate-700 dark:text-slate-300 text-sm mb-1"><strong>"Failed to fetch" або CORS error:</strong></p>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 ml-4 text-sm">
                        <li>Перевірте, чи правильний BASE_URL</li>
                        <li>Перевірте налаштування CORS на сервері</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-slate-700 dark:text-slate-300 text-sm mb-1"><strong>"tracker.js not found" (404):</strong></p>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 ml-4 text-sm">
                        <li>Перевірте правильність URL до tracker.js</li>
                        <li>Переконайтеся, що файл доступний</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-slate-700 dark:text-slate-300 text-sm mb-1"><strong>"TRACKER_CONFIG is not defined":</strong></p>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 ml-4 text-sm">
                        <li>Переконайтеся, що конфігурація вставлена ПЕРЕД tracker.js</li>
                        <li>Перевірте правильність синтаксису JavaScript</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 p-8">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                <Check className="w-6 h-6 mr-2 text-emerald-600 dark:text-emerald-400" />
                Чек-лист встановлення
              </h3>
              <div className="space-y-2">
                {[
                  'Отримав tracking код з панелі',
                  'Вставив код на всі сторінки сайту (або через GTM)',
                  'Перевірив наявність коду в коді сторінки',
                  'Перевірив через автоматичну перевірку в панелі',
                  'Перевірив консоль браузера на помилки',
                  'Протестував відстеження кліків',
                  'Протестував відстеження конверсій',
                  'Статус показує "Підключено" ✅'
                ].map((item, index) => (
                  <label key={index} className="flex items-center space-x-3 p-3 bg-white dark:bg-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500" />
                    <span className="text-slate-700 dark:text-slate-300">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-2xl border-2 border-violet-200 dark:border-violet-800 p-8">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center">
            <Settings className="w-6 h-6 mr-2 text-violet-600 dark:text-violet-400" />
            Додаткова інформація
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Ключові слова для конверсій</h4>
              <p className="text-slate-700 dark:text-slate-300 text-sm mb-2">
                Система автоматично визначає сторінки конверсій за наявністю цих слів в URL:
              </p>
              <div className="flex flex-wrap gap-2">
                {['success', 'order', 'thank-you', 'thankyou', 'complete', 'purchase', 'confirmation'].map((keyword) => (
                  <span key={keyword} className="px-3 py-1 bg-white dark:bg-slate-700 rounded-lg text-sm font-mono text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Налаштування ORDER_VALUE</h4>
              <p className="text-slate-700 dark:text-slate-300 text-sm mb-2">
                Для передачі суми замовлення, додайте на сторінку конверсії:
              </p>
              <div className="bg-white dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                <pre className="text-sm text-slate-800 dark:text-slate-200">
                  <code>{`<body data-order-value="99.99">
  <!-- або -->
  <div data-order-value="99.99">...</div>
</body>`}</code>
                </pre>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Ручне відстеження конверсій</h4>
              <p className="text-slate-700 dark:text-slate-300 text-sm mb-2">
                Якщо потрібно відстежити конверсію вручну:
              </p>
              <div className="bg-white dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                <pre className="text-sm text-slate-800 dark:text-slate-200">
                  <code>{`// В JavaScript коді
if (window.AffiliateTracker) {
  window.AffiliateTracker.trackConversionManually(99.99, 'ORDER-123');
}`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="mt-8 bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            Потрібна допомога з налаштуванням?
          </p>
          <a
            href="mailto:support@example.com"
            className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium inline-flex items-center"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Зв'яжіться з підтримкою
          </a>
        </div>
      </div>
    </Layout>
  );
}

