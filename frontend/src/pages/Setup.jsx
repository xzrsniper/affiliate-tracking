import { useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import api from '../config/api.js';
import { Code, Settings, Copy, Check, ExternalLink, FileCode, Tag, Plus, Edit, Trash2, Globe, X, RefreshCw } from 'lucide-react';

export default function Setup() {
  const [copiedSection, setCopiedSection] = useState(null);
  const [activeTab, setActiveTab] = useState('websites'); // 'websites', 'code' або 'gtm'
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

  const toggleConnectionStatus = async (website) => {
    try {
      await api.put(`/api/websites/${website.id}`, {
        is_connected: !website.is_connected
      });
      fetchWebsites();
    } catch (err) {
      console.error('Failed to update website:', err);
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
        alert('Для localhost сайтів автоматична перевірка недоступна. Використайте кнопку "Встановити як підключено" для встановлення статусу вручну.');
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

  const handleSetConnected = async (website) => {
    try {
      await api.put(`/api/websites/${website.id}`, {
        is_connected: true
      });
      fetchWebsites();
    } catch (err) {
      console.error('Failed to update website:', err);
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

  const gtmCode = `<!-- Google Tag Manager -->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  
  // Завантажуємо tracker.js через GTM
  (function() {
    var script = document.createElement('script');
    script.src = '${API_BASE}/tracker.js';
    script.async = true;
    
    // Налаштування tracker
    window.TRACKER_CONFIG = {
      BASE_URL: '${API_BASE}/api/track',
      CONVERSION_KEYWORDS: ['success', 'order', 'thank-you', 'thankyou', 'complete', 'purchase', 'confirmation'],
      DEBUG: false
    };
    
    document.head.appendChild(script);
  })();
</script>
<!-- End Google Tag Manager -->`;

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
                            <div className="flex flex-col space-y-2">
                              <button
                                onClick={() => handleSetConnected(website)}
                                disabled={website.is_connected}
                                className="inline-flex items-center space-x-2 px-3 py-2 bg-violet-100 dark:bg-violet-900/30 hover:bg-violet-200 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-400 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                title="Для localhost сайтів встановіть статус вручну"
                              >
                                <Check className="w-4 h-4" />
                                <span>{website.is_connected ? 'Підключено' : 'Встановити як підключено'}</span>
                              </button>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Localhost - встановіть вручну</p>
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
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>💡 Порада:</strong> Після встановлення, коли користувачі переходитимуть через ваше tracking посилання, 
              система автоматично відстежуватиме кліки та конверсії на сторінках з ключовими словами 
              (success, order, thank-you, тощо).
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
                <li>Назвіть тег: <code className="bg-white dark:bg-slate-600 px-2 py-1 rounded">Affiliate Tracker</code></li>
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
              Налаштуйте тригери
            </h3>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
              <p className="text-slate-700 dark:text-slate-300 mb-3">Встановіть тригер для запуску тега:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
                <li>Оберіть <strong>All Pages</strong> для відстеження на всіх сторінках</li>
                <li>Або створіть власний тригер для конкретних сторінок</li>
                <li>Рекомендується: <strong>Page View</strong> → <strong>All Pages</strong></li>
              </ul>
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
                <li>Перевірте тег в режимі <strong>Preview</strong></li>
                <li>Якщо все працює, натисніть <strong>Submit</strong> для публікації</li>
              </ol>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>💡 Переваги GTM:</strong> Ви можете легко оновлювати налаштування tracking без зміни коду сайту. 
              Також можете додати додаткові умови та правила для запуску tracking.
            </p>
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

