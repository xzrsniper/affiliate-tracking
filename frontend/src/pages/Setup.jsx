import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout.jsx';
import api from '../config/api.js';
import { Code, Settings, Copy, Check, ExternalLink, FileCode, Tag, Plus, Edit, Trash2, Globe, X, RefreshCw, BookOpen, AlertCircle, HelpCircle, Sliders, MousePointerClick } from 'lucide-react';

export default function Setup() {
  const [copiedSection, setCopiedSection] = useState(null);
  const [activeTab, setActiveTab] = useState('websites');
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWebsite, setNewWebsite] = useState({ name: '', domain: '' });
  const [editingWebsite, setEditingWebsite] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', domain: '', conversion_urls: [], price_selector: '', static_price: '', purchase_button_selector: '', cart_button_selector: '' });
  const [showCodeModal, setShowCodeModal] = useState(null);
  const [checkingId, setCheckingId] = useState(null);
  const [configuringId, setConfiguringId] = useState(null);
  const pollRef = useRef(null);

  // Determine API base URL - use production URL if available, otherwise current origin
  // CRITICAL: Always use HTTPS for production to prevent Mixed Content errors
  // CRITICAL: Netlify/Vercel domains are NOT API URLs - they're frontend domains
  const getApiBase = () => {
    // Check environment variable first
    if (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('localhost')) {
      let url = import.meta.env.VITE_API_URL;
      // Force HTTPS if not localhost
      if (!url.includes('localhost') && url.startsWith('http://')) {
        url = url.replace('http://', 'https://');
      }
      return url;
    }
    // Use current origin ONLY if it's NOT a frontend hosting domain (Netlify, Vercel, etc.)
    if (typeof window !== 'undefined' && window.location.origin !== 'http://localhost:5173') {
      let origin = window.location.origin;
      // CRITICAL: Netlify/Vercel/GitHub Pages domains are frontend, NOT API!
      // If origin is a frontend hosting domain, don't use it as API URL
      const isFrontendHosting = origin.includes('netlify.app') || 
                                origin.includes('vercel.app') || 
                                origin.includes('github.io') ||
                                origin.includes('pages.dev');
      
      if (isFrontendHosting) {
        // Don't use frontend domain as API - return localhost as fallback (user must replace)
        console.warn('[Lehko Track] Frontend hosting detected:', origin, '- API URL must be set manually!');
        return 'http://localhost:3000'; // Force user to replace
      }
      
      // Force HTTPS for production
      if (!origin.includes('localhost') && origin.startsWith('http://')) {
        origin = origin.replace('http://', 'https://');
      }
      return origin;
    }
    // Fallback to localhost for development (HTTP is OK for localhost)
    return import.meta.env.VITE_API_URL || 'http://localhost:3000';
  };
  const API_BASE = getApiBase();

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
      const response = await api.post('/api/websites', newWebsite);
      const addedWebsite = response.data.website;
      setNewWebsite({ name: '', domain: '' });
      setShowAddForm(false);
      await fetchWebsites();
      
      // Auto-check if domain is provided and not localhost
      if (addedWebsite?.domain && !isLocalhost(addedWebsite.domain)) {
        // Wait a bit for the website to be saved, then check
        setTimeout(async () => {
          try {
            await handleCheckWebsite(addedWebsite);
          } catch (err) {
            // Ignore errors in auto-check
          }
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to add website:', err);
      alert(err.response?.data?.error || 'Не вдалося додати сайт. Спробуйте ще раз.');
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

  const openEditWebsite = (website) => {
    let urls = [];
    try {
      if (website.conversion_urls) urls = typeof website.conversion_urls === 'string' ? JSON.parse(website.conversion_urls) : website.conversion_urls;
      if (!Array.isArray(urls)) urls = [];
    } catch (e) {}
    setEditForm({
      name: website.name || '',
      domain: website.domain || '',
      conversion_urls: urls,
      price_selector: website.price_selector || '',
      static_price: website.static_price != null ? String(website.static_price) : '',
      purchase_button_selector: website.purchase_button_selector || '',
      cart_button_selector: website.cart_button_selector || ''
    });
    setEditingWebsite(website);
  };

  const handleSaveWebsite = async (e) => {
    e.preventDefault();
    if (!editingWebsite) return;
    try {
      await api.put(`/api/websites/${editingWebsite.id}`, {
        name: editForm.name,
        domain: editForm.domain,
        conversion_urls: editForm.conversion_urls,
        price_selector: editForm.price_selector || null,
        static_price: editForm.static_price === '' ? null : parseFloat(editForm.static_price),
        purchase_button_selector: editForm.purchase_button_selector || null,
        cart_button_selector: editForm.cart_button_selector || null
      });
      setEditingWebsite(null);
      fetchWebsites();
    } catch (err) {
      console.error('Failed to update website:', err);
      alert(err.response?.data?.error || 'Не вдалося зберегти.');
    }
  };


  const isLocalhost = (domain) => {
    if (!domain) return false;
    return /^(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(domain.replace(/^https?:\/\//i, ''));
  };

  const handleCopyConsoleCode = useCallback(async (website) => {
    if (!website?.id) return;
    try {
      const res = await api.post(`/api/websites/${website.id}/configure-session`);
      const configUrl = res.data.configUrl || '';
      const codeMatch = configUrl.match(/lehko_cfg=([^&]+)/);
      const code = codeMatch ? codeMatch[1] : '';
      if (!code) { alert('Помилка генерації коду'); return; }
      const mapperUrl = `${API_BASE}/api/track/mapper/${code}`;
      const snippet = `var s=document.createElement('script');s.src='${mapperUrl}';document.head.appendChild(s);`;
      await navigator.clipboard.writeText(snippet);
      alert('Код скопійовано! 🎯\n\n1. Відкрийте сайт клієнта\n2. F12 → Console\n3. Вставте код (Ctrl+V) → Enter\n4. Оберіть кнопку ліду. Код дійсний 10 хв.');
    } catch (err) {
      alert(err.response?.data?.error || 'Помилка');
    }
  }, [API_BASE]);

  const handleConfigureVisualMapper = useCallback(async (website) => {
    if (!website.domain) {
      alert('Спочатку вкажіть домен сайту.');
      return;
    }
    if (!website.is_connected) {
      if (!confirm('Трекер ще не підключено на цьому сайті. Visual Mapper потребує встановленого pixel.js. Продовжити?')) return;
    }
    try {
      setConfiguringId(website.id);
      const res = await api.post(`/api/websites/${website.id}/configure-session`);
      const { configUrl } = res.data;
      window.open(configUrl, '_blank');

      // Poll for selector changes every 3s for up to 5 minutes
      let elapsed = 0;
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        elapsed += 3000;
        if (elapsed > 300000) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setConfiguringId(null);
          return;
        }
        try {
          const check = await api.get('/api/websites');
          const updated = (check.data.websites || []).find(w => w.id === website.id);
          if (updated && (updated.purchase_button_selector || updated.cart_button_selector)) {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setConfiguringId(null);
            setWebsites(prev => prev.map(w => w.id === website.id ? { ...w, ...updated } : w));
            const parts = [];
            if (updated.purchase_button_selector) parts.push(`Кнопка ліду: ${updated.purchase_button_selector}`);
            if (updated.cart_button_selector) parts.push(`Кнопка корзини: ${updated.cart_button_selector}`);
            alert(parts.join('\n'));
          }
        } catch (e) { /* keep polling */ }
      }, 3000);
    } catch (err) {
      console.error('Failed to start configuration:', err);
      alert(err.response?.data?.error || 'Не вдалося почати налаштування');
      setConfiguringId(null);
    }
  }, []);

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
      
      // Show success message
      if (res.data.is_connected) {
        // Status updated successfully
      } else {
        // Show helpful message if not connected
        console.log('Трекер не знайдено. Переконайтеся, що код встановлено правильно.');
      }
    } catch (err) {
      console.error('Failed to check website:', err);
      const errorMessage = err.response?.data?.error || 'Не вдалося перевірити сайт. Переконайтеся, що сайт доступний з інтернету.';
      alert(errorMessage);
    } finally {
      setCheckingId(null);
    }
  };

  // Universal tracker with Confidence Score system
  // CRITICAL: Ensure HTTPS for production URLs to prevent Mixed Content errors
  // For sites without backend (Netlify, Vercel), use default API server
  const getUniversalCode = (siteId) => {
    let apiUrl = API_BASE;
    
    // If API_BASE is localhost or frontend hosting domain, use default API server for sites without backend
    const isFrontendHosting = API_BASE.includes('netlify.app') || 
                              API_BASE.includes('vercel.app') || 
                              API_BASE.includes('github.io') ||
                              API_BASE.includes('pages.dev');
    
    // For sites without backend (frontend hosting), default to lehko.space
    // This is the shared API server that works for all sites without their own backend
    if (isFrontendHosting) {
      apiUrl = 'https://lehko.space';
    } else if (API_BASE.includes('localhost')) {
      // Keep localhost for local development - user should replace for production
      apiUrl = API_BASE;
    }
    
    // Force HTTPS if not localhost (prevent Mixed Content)
    if (!apiUrl.includes('localhost') && apiUrl.startsWith('http://')) {
      apiUrl = apiUrl.replace('http://', 'https://');
    }
    return `<script src="${apiUrl}/pixel.js" data-site="${siteId || 'YOUR_SITE_ID'}" async></script>`;
  };
  const universalCode = getUniversalCode(null);
  const trackerConfigCode = universalCode;
  const modalCode = showCodeModal ? getUniversalCode(showCodeModal.id) : universalCode;

  // Зберігач ref: один рядок для сторінок без повного трекера (щоб ref потрапляв на сторінку подяки через URL)
  const refSaverSnippet = `<script>(function(){var m=location.search.match(/[?&]ref=([^&]+)/);if(m)try{localStorage.setItem('aff_ref_code',decodeURIComponent(m[1]));}catch(e){}})();<\/script>`;

  // GTM code generator — uses __lehkoConfig for reliable config passing (no document.currentScript issues)
  const getGtmCode = (siteId) => {
    let apiUrl = API_BASE;
    const isFrontendHosting = API_BASE.includes('netlify.app') || 
                              API_BASE.includes('vercel.app') || 
                              API_BASE.includes('github.io') ||
                              API_BASE.includes('pages.dev');
    if (isFrontendHosting) {
      apiUrl = 'https://lehko.space';
    }
    if (!apiUrl.includes('localhost') && apiUrl.startsWith('http://')) {
      apiUrl = apiUrl.replace('http://', 'https://');
    }
    const sid = siteId || 'YOUR_SITE_ID';
    return `<script>
window.__lehkoConfig = {
  siteId: '${sid}',
  baseUrl: '${apiUrl}'
};
(function() {
  var s = document.createElement('script');
  s.src = '${apiUrl}/pixel.js';
  s.setAttribute('data-site', '${sid}');
  s.async = true;
  document.head.appendChild(s);
})();
</script>`;
  };

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
            <nav className="flex space-x-6 overflow-x-auto">
              {[
                { id: 'websites', icon: Globe, label: 'Мої сайти', active: 'border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400' },
                { id: 'code', icon: FileCode, label: 'Встановлення', active: 'border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400' },
                { id: 'gtm', icon: Tag, label: 'Google Tag Manager', active: 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400' },
                { id: 'guide', icon: BookOpen, label: 'Як це працює', active: 'border-emerald-600 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? tab.active
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4 inline mr-1.5" />
                  {tab.label}
                </button>
              ))}
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
              <div className="flex items-center space-x-3">
                {websites.length > 0 && websites.some(w => w.domain && !isLocalhost(w.domain)) && (
                  <button
                    onClick={async () => {
                      const sitesToCheck = websites.filter(w => w.domain && !isLocalhost(w.domain));
                      for (const site of sitesToCheck) {
                        try {
                          await handleCheckWebsite(site);
                          // Small delay between checks to avoid overwhelming the server
                          await new Promise(resolve => setTimeout(resolve, 500));
                        } catch (err) {
                          // Continue with next site
                        }
                      }
                    }}
                    disabled={checkingId !== null}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-all flex items-center space-x-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-5 h-5 ${checkingId !== null ? 'animate-spin' : ''}`} />
                    <span>Перевірити всі</span>
                  </button>
                )}
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Додати сайт</span>
                </button>
              </div>
            </div>

            {/* Add Website Form */}
            {showAddForm && (
              <div className="mb-6 bg-slate-50 dark:bg-slate-700 rounded-xl p-6 border border-slate-200 dark:border-slate-600">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Додати новий сайт</h3>
                <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    💡 <strong>Порада:</strong> Якщо ви вкажете домен сайту, система автоматично перевірить чи встановлено трекер. 
                    Це допоможе вам швидко зрозуміти чи все працює правильно.
                  </p>
                </div>
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
                      Домен сайту <span className="text-slate-400 dark:text-slate-500">(необов'язково, але рекомендується)</span>
                    </label>
                    <input
                      type="text"
                      value={newWebsite.domain}
                      onChange={(e) => setNewWebsite({ ...newWebsite, domain: e.target.value })}
                      placeholder="example.com"
                      className="w-full px-4 py-3 bg-white dark:bg-slate-600 rounded-xl border-0 focus:ring-2 focus:ring-violet-500 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      💡 Якщо вказати домен, система автоматично перевірить чи встановлено трекер на сайті
                    </p>
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

            {/* API URL Warning */}
            {API_BASE.includes('localhost') && (
              <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-800 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-300 mb-2">⚠️ Важливо про API URL</h3>
                    <p className="text-sm text-amber-800 dark:text-amber-300 mb-3">
                      Зараз використовується <code className="bg-white dark:bg-slate-600 px-2 py-1 rounded font-mono">localhost:3000</code> — це для локальної розробки.
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-300 mb-3">
                      <strong>Для продакшн-сайтів</strong> (Netlify, Vercel, ваш домен) вам потрібно замінити <code className="bg-white dark:bg-slate-600 px-2 py-1 rounded">localhost:3000</code> на ваш продакшн-URL API.
                    </p>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-3">
                      <p className="text-sm text-red-800 dark:text-red-300 font-semibold mb-1">🔒 Критично важливо про HTTPS:</p>
                      <p className="text-xs text-red-700 dark:text-red-400 mb-2">
                        Якщо ваш сайт завантажується через HTTPS (https://), API URL <strong>також має бути HTTPS</strong>. 
                        Використання HTTP викличе помилку <strong>"Mixed Content"</strong> і браузер заблокує завантаження скрипта.
                      </p>
                      <div className="bg-white dark:bg-slate-700 rounded p-2 mt-2">
                        <p className="text-xs text-red-800 dark:text-red-300 mb-1"><strong>Приклади:</strong></p>
                        <p className="text-xs text-green-700 dark:text-green-400">✅ <strong>Правильно:</strong> <code className="bg-green-100 dark:bg-green-900/30 px-1 rounded">https://lehko.space</code></p>
                        <p className="text-xs text-red-700 dark:text-red-400">❌ <strong>Неправильно:</strong> <code className="bg-red-100 dark:bg-red-900/30 px-1 rounded">http://lehko.space</code> (без 's' після http)</p>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-700 rounded-lg p-3 border border-amber-200 dark:border-amber-800 mb-3">
                      <p className="text-xs text-amber-700 dark:text-amber-400 mb-2"><strong>Приклад правильного URL:</strong></p>
                      <code className="text-xs text-amber-800 dark:text-amber-300">https://lehko.space</code> або <code className="text-xs text-amber-800 dark:text-amber-300">https://api.yourdomain.com</code>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      💡 <strong>Де знайти ваш API URL?</strong> Це адреса, де розгорнуто ваш бекенд (API сервер). 
                      Якщо ви використовуєте наш сервіс, це зазвичай <code className="bg-white dark:bg-slate-600 px-1 rounded">https://lehko.space</code> або ваш домен.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Info Banner */}
            {websites.length > 0 && (
              <div className="mb-6 space-y-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
                        Як працює перевірка встановлення трекера?
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mb-2">
                        Система автоматично перевіряє наявність трекера двома способами:
                      </p>
                      <ul className="text-xs text-blue-700 dark:text-blue-400 list-disc list-inside space-y-1 ml-2">
                        <li><strong>Verification ping</strong> - трекер надсилає ping кожні 5 хвилин (найнадійніший метод)</li>
                        <li><strong>HTML перевірка</strong> - система шукає індикатори трекера в коді сторінки</li>
                      </ul>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
                        💡 <strong>Порада:</strong> Після встановлення трекера, зачекайте 5-10 хвилин та натисніть "Перевірити" для оновлення статусу.
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                        🏷️ <strong>GTM:</strong> Якщо код стоїть через Google Tag Manager, HTML-перевірка часто не бачить трекер (його додає GTM динамічно). Відкрийте ваш сайт у браузері, зачекайте 1–2 хв і натисніть «Перевірити» — статус оновиться після verification ping. У коді в GTM має бути URL вашого API (не localhost).
                      </p>
                      <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-700 dark:text-blue-400 mb-1">
                          🧪 <strong>Тестування:</strong> Відкрийте <a href={`${API_BASE}/tracker-test.html`} target="_blank" rel="noopener noreferrer" className="underline font-semibold">тестову сторінку</a> для детальної перевірки роботи трекера.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Statistics */}
                {websites.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">
                        {websites.length}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Всього сайтів</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                      <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                        {websites.filter(w => w.is_connected).length}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">Підключено</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                      <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                        {websites.filter(w => !w.is_connected && !isLocalhost(w.domain)).length}
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400">Не підключено</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Help */}
            {websites.length > 0 && (
              <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>💡 Швидкий доступ:</strong> Для швидкого копіювання коду з вже підставленими значеннями (ID сайту та API URL) 
                  натисніть кнопку <Copy className="w-4 h-4 inline mx-1" /> (зелена іконка копіювання) в колонці "Дії" біля вашого сайту. 
                  Або натисніть кнопку <Code className="w-4 h-4 inline mx-1" /> (фіолетова іконка коду) для детального перегляду з інструкціями.
                </p>
              </div>
            )}

            {/* Websites Table */}
            {loading ? (
              <div className="text-center py-12">
                <p className="text-slate-500 dark:text-slate-400">Завантаження...</p>
              </div>
            ) : websites.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600">
                <Globe className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400 mb-2">Поки що немає доданих сайтів</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">
                  Додайте сайт, щоб почати відстежувати встановлення трекера
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all"
                >
                  Додати перший сайт
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Сайт</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">ID сайту</th>
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
                          <div className="flex items-center space-x-2">
                            <code className="px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded text-sm font-mono">
                              {website.id}
                            </code>
                            <button
                              onClick={() => copyToClipboard(String(website.id), `site-id-${website.id}`)}
                              className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                              title="Копіювати ID"
                            >
                              {copiedSection === `site-id-${website.id}` ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Використовуйте для коду</p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col space-y-2">
                            <span
                              className={`inline-flex items-center space-x-2 px-3 py-1 rounded-lg font-medium text-sm ${
                                website.is_connected
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${website.is_connected ? 'bg-green-600' : 'bg-red-600'}`}></span>
                              <span>{website.is_connected ? '✅ Підключено' : '❌ Не підключено'}</span>
                            </span>
                            {!website.is_connected && website.domain && !isLocalhost(website.domain) && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 mt-2 border border-slate-200 dark:border-slate-600">
                                <p className="mb-2 font-semibold text-slate-700 dark:text-slate-300">💡 Трекер не знайдено. Що робити:</p>
                                <ol className="list-decimal list-inside space-y-1 ml-1">
                                  <li>Переконайтеся, що код встановлено на <strong>всіх</strong> сторінках сайту</li>
                                  <li>У коді має бути <strong>URL вашого API</strong> (напр. <code className="bg-white dark:bg-slate-600 px-1 rounded">https://lehko.space</code>), а не <code className="bg-white dark:bg-slate-600 px-1 rounded">localhost</code> — інакше на Netlify/іншому хостингу скрипт не завантажиться</li>
                                  <li>Очистіть кеш браузера та CDN (якщо використовується)</li>
                                  <li>Зачекайте 5–10 хвилин після встановлення або відкрийте сайт у браузері, зачекайте 1–2 хв і натисніть «Перевірити зараз» знову</li>
                                </ol>
                                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600 space-y-2">
                                  <p className="text-slate-600 dark:text-slate-300">
                                    📋 <strong>Швидка перевірка:</strong> Відкрийте сайт → F12 → Console, введіть <code className="bg-white dark:bg-slate-600 px-1 rounded">window.LehkoTrack</code> — має з'явитися об'єкт. Якщо ні — скрипт не завантажився (перевірте вкладку Network: запит на <code className="bg-white dark:bg-slate-600 px-1 rounded">pixel.js</code> має бути 200).
                                  </p>
                                  <p className="text-indigo-700 dark:text-indigo-300 font-medium">
                                    🏷️ <strong>Якщо підключили через GTM:</strong> Перевірка по HTML часто не бачить трекер (його додає GTM динамічно). Відкрийте ваш сайт у браузері, почекайте 1–2 хвилини і натисніть «Перевірити зараз» — статус оновиться після verification ping. Переконайтеся, що в GTM у коді не localhost, а ваш продакшн-домен API.
                                  </p>
                                </div>
                              </div>
                            )}
                            {website.is_connected && (
                              <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mt-2 border border-green-200 dark:border-green-800">
                                <p className="font-semibold mb-2">✓ Трекер успішно знайдено та працює!</p>
                                <div className="space-y-1 text-green-700 dark:text-green-300">
                                  <p>✅ Verification ping активний</p>
                                  <p>✅ Автоматичне відстеження кліків</p>
                                  <p>✅ Автоматичне відстеження конверсій</p>
                                </div>
                                <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                                  <p className="text-green-600 dark:text-green-400">
                                    💡 <strong>Гарантії:</strong> Трекер надсилає verification ping кожні 5 хвилин. 
                                    Система автоматично відстежує всі кліки та конверсії з вашого сайту.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
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
                            <div className="flex flex-col space-y-2">
                              <button
                                onClick={() => handleCheckWebsite(website)}
                                disabled={checkingId === website.id}
                                className="inline-flex items-center space-x-2 px-3 py-2 bg-violet-100 dark:bg-violet-900/30 hover:bg-violet-200 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-400 rounded-lg transition-all disabled:opacity-50"
                              >
                                <RefreshCw className={`w-4 h-4 ${checkingId === website.id ? 'animate-spin' : ''}`} />
                                <span>{checkingId === website.id ? 'Перевіряю...' : 'Перевірити зараз'}</span>
                              </button>
                              {!website.is_connected && (
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  <p className="mb-1">💡 Перевірка може зайняти до 10 секунд</p>
                                  <p className="text-slate-400 dark:text-slate-500">
                                    Система перевіряє HTML код сторінки та verification pings
                                  </p>
                                </div>
                              )}
                              {website.is_connected && (
                                <div className="text-xs text-green-600 dark:text-green-400 space-y-1">
                                  <p>✓ Остання перевірка: щойно</p>
                                  <p className="text-green-500 dark:text-green-500">
                                    🔄 Автоматична перевірка кожні 5 хв
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                const readyCode = getUniversalCode(website.id);
                                copyToClipboard(readyCode, `quick-copy-${website.id}`);
                              }}
                              className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                              title="Швидко скопіювати код"
                            >
                              {copiedSection === `quick-copy-${website.id}` ? (
                                <Check className="w-5 h-5" />
                              ) : (
                                <Copy className="w-5 h-5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleConfigureVisualMapper(website)}
                              disabled={configuringId === website.id}
                              className={`p-2 rounded-lg transition-colors ${
                                (website.purchase_button_selector || website.cart_button_selector)
                                  ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
                                  : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                              } ${configuringId === website.id ? 'animate-pulse' : ''}`}
                              title={(website.purchase_button_selector || website.cart_button_selector)
                                ? `${website.purchase_button_selector ? 'Лід: ' + website.purchase_button_selector : ''}${website.cart_button_selector ? (website.purchase_button_selector ? ' | ' : '') + 'Кошик: ' + website.cart_button_selector : ''} (клікніть щоб змінити)`
                                : 'Налаштувати кнопки (Visual Mapper)'
                              }
                            >
                              <MousePointerClick className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => openEditWebsite(website)}
                              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                              title="Налаштування (URL успіху, ціна)"
                            >
                              <Sliders className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => { setShowCodeModal(website); }}
                              className="p-2 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-lg transition-colors"
                              title="Показати детальний код з інструкціями"
                            >
                              <Code className="w-5 h-5" />
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
              
              {/* Info Box with Site Details */}
              <div className="mb-4 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-xl p-4 border-2 border-violet-200 dark:border-violet-800">
                <h4 className="font-semibold text-slate-800 dark:text-white mb-3">📋 Інформація про ваш сайт:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">ID сайту:</span>
                    <div className="flex items-center space-x-2">
                      <code className="px-2 py-1 bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-400 rounded font-mono font-semibold">
                        {showCodeModal?.id || 'N/A'}
                      </code>
                      {showCodeModal?.id && (
                        <button
                          onClick={() => copyToClipboard(String(showCodeModal.id), 'modal-site-id')}
                          className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                          title="Копіювати ID"
                        >
                          {copiedSection === 'modal-site-id' ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">API URL:</span>
                    <code className="px-2 py-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded font-mono text-xs">
                      {API_BASE}
                    </code>
                  </div>
                  {showCodeModal?.domain && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Домен сайту:</span>
                      <code className="px-2 py-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded font-mono text-xs">
                        {showCodeModal.domain}
                      </code>
                    </div>
                  )}
                </div>
            {API_BASE.includes('localhost') && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  <strong>⚠️ Увага:</strong> У коді використовується <code className="bg-white dark:bg-slate-600 px-1 rounded">localhost:3000</code>. 
                  Для продакшн-сайтів (Netlify, Vercel тощо) замініть на ваш продакшн-URL API (наприклад: <code className="bg-white dark:bg-slate-600 px-1 rounded">https://lehko.space</code>).
                </p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-2">
                  <strong>🔒 Критично:</strong> Використовуйте <strong>HTTPS</strong> (не HTTP) для продакшн-сайтів, інакше браузер заблокує скрипт з помилкою "Mixed Content".
                </p>
              </div>
            )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  ✅ Готовий код для вставки (всі значення вже підставлені):
                </label>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600 relative">
                  <button
                    onClick={() => {
                      copyToClipboard(modalCode, 'modal-code');
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
                    <code>{modalCode}</code>
                  </pre>
                </div>
                {showCodeModal?.id && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    ✅ ID сайту ({showCodeModal.id}) вже підставлено в код
                    {!API_BASE.includes('localhost') && (
                      <span className="block mt-1">✅ API URL ({API_BASE}) вже підставлено в код</span>
                    )}
                  </p>
                )}
              </div>

              {/* Detailed Instructions */}
              <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">📖 Покрокова інструкція:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-300">
                  <li>
                    <strong>Скопіюйте код вище</strong> (кнопка з іконкою копіювання справа вгорі)
                  </li>
                  <li>
                    <strong>Відкрийте файл HTML</strong> головної сторінки (або адмін-панель CMS)
                  </li>
                  <li>
                    <strong>Знайдіть секцію <code className="bg-white dark:bg-slate-700 px-1 rounded">&lt;head&gt;</code></strong> (зазвичай на початку файлу)
                  </li>
                  <li>
                    <strong>Вставте скопійований код</strong> — трекер автоматично розповсюдить tracking ID на інші сторінки через cookies та декорування посилань
                  </li>
                  {API_BASE.includes('localhost') && (
                    <li className="text-amber-700 dark:text-amber-300">
                      <strong>⚠️ Важливо:</strong> Замініть <code className="bg-white dark:bg-slate-600 px-1 rounded">localhost:3000</code> на ваш продакшн-URL API 
                      (наприклад: <code className="bg-white dark:bg-slate-600 px-1 rounded">https://lehko.space</code>)
                    </li>
                  )}
                  <li>
                    <strong>Збережіть файл</strong> та опублікуйте зміни на сайті
                  </li>
                  <li>
                    <strong>Перевірте встановлення:</strong> Натисніть кнопку "Перевірити зараз" в таблиці сайтів через 5-10 хвилин після встановлення
                  </li>
                </ol>
              </div>

              {/* Where to find info */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">💡 Де знайти всі дані:</h4>
                <ul className="text-sm text-green-800 dark:text-green-300 space-y-1 list-disc list-inside">
                  <li>
                    <strong>ID сайту:</strong> Показано вище в інформаційному блоці ({showCodeModal?.id || 'N/A'}) або в колонці "ID сайту" в таблиці
                  </li>
                  <li>
                    <strong>API URL:</strong> Показано вище ({API_BASE})
                    {API_BASE.includes('localhost') && (
                      <span className="block mt-1 text-amber-700 dark:text-amber-300">
                        ⚠️ Для продакшн-сайтів використовуйте ваш продакшн-домен (наприклад: https://lehko.space)
                      </span>
                    )}
                  </li>
                  <li>
                    <strong>Налаштування конверсій:</strong> Кнопка "Налаштування" (⚙️) в таблиці сайтів — там можна налаштувати URL успіху та ціну
                  </li>
                </ul>
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

        {/* Edit Website Modal (conversion URLs, price selector, static price) */}
        {editingWebsite && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Налаштування: {editingWebsite.name}</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyConsoleCode(editingWebsite)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60"
                  >
                    <Code className="w-4 h-4" />
                    <span>Код для консолі</span>
                  </button>
                  <button
                    onClick={() => setEditingWebsite(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleSaveWebsite} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Назва</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Домен</label>
                  <input
                    type="text"
                    value={editForm.domain}
                    onChange={(e) => setEditForm((f) => ({ ...f, domain: e.target.value }))}
                    placeholder="example.com"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">URL сторінки успіху (по одному на рядок)</label>
                  <textarea
                    value={editForm.conversion_urls.join('\n')}
                    onChange={(e) => setEditForm((f) => ({ ...f, conversion_urls: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) }))}
                    placeholder="/thanks\n/success\n/order-complete"
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Для Universal трекера: якщо поточний URL містить один з цих шляхів — зараховується конверсія.</p>
                </div>
                {/* Conversion Button Selector */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Кнопка ліду (оформлення замовлення)</label>
                  {editForm.purchase_button_selector ? (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-600 dark:text-green-400 text-sm">&#10004;</span>
                      <code className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-600 rounded text-sm font-mono text-slate-700 dark:text-slate-300 truncate">
                        {editForm.purchase_button_selector}
                      </code>
                      <button
                        type="button"
                        onClick={() => setEditForm(f => ({ ...f, purchase_button_selector: '' }))}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                        title="Скинути"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Не налаштовано. Використовується автоматичний пошук за текстом кнопки.</p>
                  )}

                  {/* Manual CSS selector input */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">CSS-селектор кнопки (вручну)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editForm.purchase_button_selector || ''}
                        onChange={(e) => setEditForm(f => ({ ...f, purchase_button_selector: e.target.value }))}
                        placeholder="Напр. .btn-checkout, #order-button, a.buy-btn"
                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm font-mono"
                      />
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Як знайти: відкрийте сайт → ПКМ на кнопку → «Перевірити» → скопіюйте class або id елемента.
                    </p>
                  </div>
                </div>

                {/* Cart Button Selector */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Кнопка корзини (додати в кошик)</label>
                  {editForm.cart_button_selector ? (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-600 dark:text-green-400 text-sm">&#10004;</span>
                      <code className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-600 rounded text-sm font-mono text-slate-700 dark:text-slate-300 truncate">
                        {editForm.cart_button_selector}
                      </code>
                      <button
                        type="button"
                        onClick={() => setEditForm(f => ({ ...f, cart_button_selector: '' }))}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                        title="Скинути"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Не налаштовано. Оберіть кнопку через Visual Mapper або вкажіть CSS-селектор вручну.</p>
                  )}
                  <div className="mb-1">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">CSS-селектор кнопки (вручну)</label>
                    <input
                      type="text"
                      value={editForm.cart_button_selector || ''}
                      onChange={(e) => setEditForm(f => ({ ...f, cart_button_selector: e.target.value }))}
                      placeholder="Напр. .add-to-cart, #btn-cart, button.cart-btn"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm font-mono"
                    />
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Кнопка «Додати в кошик» — кожен клік рахується як подія «Кошик».
                    </p>
                  </div>
                </div>

                  {/* Код для консолі — першим; потім Visual Mapper */}
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyConsoleCode(editingWebsite)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors text-sm"
                      title="Скопіювати код для консолі (F12 → Console)"
                    >
                      <Code className="w-4 h-4" />
                      <span>Код для консолі — скопіювати (F12 → Console)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfigureVisualMapper(editingWebsite)}
                      disabled={configuringId === editingWebsite?.id}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-medium rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors disabled:opacity-50 text-sm"
                    >
                      <MousePointerClick className="w-4 h-4" />
                      <span>{configuringId === editingWebsite?.id ? 'Очікую...' : 'Visual Mapper — відкрити сайт'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                    <strong>Visual Mapper</strong> відкриє сайт у новій вкладці. <strong>Код для консолі</strong> — якщо не відкривається: скопіюйте код, на сайті клієнта F12 → Console → вставте код.
                  </p>
                </div>

                {/* Price Settings */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Визначення ціни</label>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Фіксована ціна (грн)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editForm.static_price}
                        onChange={(e) => setEditForm((f) => ({ ...f, static_price: e.target.value }))}
                        placeholder="Напр. 500 — кожен клік = 500 грн"
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"
                      />
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Якщо вказано — завжди використовується ця ціна, інші методи ігноруються.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">CSS-селектор елемента з ціною</label>
                      <input
                        type="text"
                        value={editForm.price_selector}
                        onChange={(e) => setEditForm((f) => ({ ...f, price_selector: e.target.value }))}
                        placeholder=".product-price або #total-sum"
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"
                      />
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Трекер зчитає число з цього елемента. Якщо не вказано — автопошук ціни біля кнопки (&#x20b4;, $, грн).</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setEditingWebsite(null)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Скасувати</button>
                  <button type="submit" className="px-6 py-2 bg-violet-600 dark:bg-violet-500 text-white font-semibold rounded-lg hover:bg-violet-700 dark:hover:bg-violet-600">Зберегти</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ═══ CODE TAB ═══ */}
        {activeTab === 'code' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
                <FileCode className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Встановлення трекера</h2>
                <p className="text-slate-600 dark:text-slate-400">Два кроки — і все працює автоматично</p>
              </div>
            </div>

            {/* Auto magic banner */}
            <div className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-6 border-2 border-emerald-300 dark:border-emerald-800">
              <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-300 mb-2">Повністю автоматичний трекер v4.0</h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-3">Вам потрібно тільки <strong>додати сайт</strong> та <strong>вставити один рядок коду</strong>. Решту трекер робить сам:</p>
              <ul className="text-sm text-emerald-700 dark:text-emerald-400 space-y-1.5">
                <li>✅ <strong>Авто-розповсюдження</strong> — ID зберігається в cookies та автоматично додається до всіх посилань на сайті</li>
                <li>✅ <strong>Працює між сторінками</strong> — навіть якщо код стоїть на одній сторінці, ref та click_id передаються на всі інші</li>
                <li>✅ Сам знаходить кнопки «Купити», «Замовити», «Оплатити» (ігнорує «Додати в кошик»)</li>
                <li>✅ Клік на кнопку покупки = <strong>лід</strong></li>
                <li>✅ Сторінка подяки (/thank-you, /success) = <strong>продаж</strong> (автоматично читає суму з URL)</li>
                <li>✅ <strong>Відкладена конверсія</strong> — якщо користувач повернувся зі сторінки подяки, продаж зараховується</li>
                <li>✅ Працює з будь-яким конструктором: Tilda, Wix, WordPress, Shopify, Horoshop</li>
              </ul>
            </div>

            {/* How propagation works */}
            <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">Як працює авто-розповсюдження?</h3>
              <div className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <p>1. Відвідувач переходить на сайт через tracking-посилання (<code className="bg-white dark:bg-slate-700 px-1 rounded text-xs">?ref=XXX&click_id=YYY</code>)</p>
                <p>2. Трекер зберігає <code className="bg-white dark:bg-slate-700 px-1 rounded text-xs">ref</code> в <strong>cookies</strong> та <strong>localStorage</strong> (доступні на всьому домені)</p>
                <p>3. Трекер <strong>автоматично додає ref до всіх посилань</strong> на сторінці — при переході на іншу сторінку ref буде в URL</p>
                <p>4. На сторінці подяки (<code className="bg-white dark:bg-slate-700 px-1 rounded text-xs">/thank-you?total=25000</code>) продаж зараховується автоматично</p>
              </div>
            </div>

            {/* Step 1 */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">1</span>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Додайте сайт</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 ml-[52px]">
                У вкладці <button onClick={() => setActiveTab('websites')} className="text-violet-600 dark:text-violet-400 font-semibold hover:underline">Мої сайти</button> натисніть «Додати сайт» → вкажіть назву та домен. Ви отримаєте <strong>ID сайту</strong>.
              </p>
            </div>

            {/* Step 2 */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">2</span>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Вставте код на сайт</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 ml-[52px] mb-3">
                Скопіюйте та вставте в будь-яку сторінку вашого сайту (секція <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">&lt;head&gt;</code>). Трекер <strong>автоматично розповсюдить</strong> tracking ID на всі інші сторінки через cookies та декорування посилань:
              </p>
              <div className="ml-[52px] bg-slate-900 rounded-xl p-4 relative">
                <button
                  onClick={() => copyToClipboard(universalCode, 'install-code')}
                  className="absolute top-3 right-3 p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  {copiedSection === 'install-code' ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
                <pre className="text-sm text-green-400 overflow-x-auto"><code>{universalCode}</code></pre>
              </div>
              <div className="ml-[52px] mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { name: 'Tilda', where: 'Налаштування сайту → Ще → HTML-код для вставки в head' },
                  { name: 'Wix', where: 'Налаштування → Відстеження і аналітика → Custom Code → head' },
                  { name: 'WordPress', where: 'Appearance → Theme Editor → header.php, перед </head>' },
                  { name: 'Shopify', where: 'Online Store → Themes → Edit code → theme.liquid → перед </head>' },
                  { name: 'Horoshop', where: 'Налаштування → SEO → Додатковий код у <head>' },
                  { name: 'Google Tag Manager', where: '' },
                ].map(p => (
                  <div key={p.name} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                    <p className="font-semibold text-sm text-slate-800 dark:text-white">{p.name}</p>
                    {p.where ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{p.where}</p>
                    ) : (
                      <button onClick={() => setActiveTab('gtm')} className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 hover:underline">Окрема інструкція →</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Done */}
            <div className="mb-6 bg-green-50 dark:bg-green-900/10 rounded-xl p-5 border-2 border-green-300 dark:border-green-800">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">✓</span>
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">Готово!</h3>
              </div>
              <p className="text-sm text-green-700 dark:text-green-400 ml-[52px] mb-2">
                Більше нічого налаштовувати не потрібно. Трекер автоматично:
              </p>
              <ul className="text-sm text-green-700 dark:text-green-400 ml-[52px] space-y-1 list-disc list-inside mb-2">
                <li>Збереже tracking ID в cookies (доступні на <strong>всіх</strong> сторінках домену)</li>
                <li>Додасть ref та click_id до всіх посилань на сторінці</li>
                <li>Визначить сторінку подяки і зарахує продаж</li>
                <li>Якщо користувач повернеться на сторінку з трекером — відкладена конверсія зарахується</li>
              </ul>
              <p className="text-sm text-green-700 dark:text-green-400 ml-[52px]">
                Перевірте статус підключення через 1–2 хвилини у вкладці <button onClick={() => setActiveTab('websites')} className="text-green-800 dark:text-green-300 font-semibold hover:underline">Мої сайти</button>.
              </p>
            </div>

            {/* Advanced (collapsed) */}
            <details className="bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
              <summary className="cursor-pointer p-4 font-semibold text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                Додаткові налаштування (для досвідчених)
              </summary>
              <div className="px-4 pb-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <p><strong>Visual Mapper</strong> — вручну вказати кнопку ліду (оформлення замовлення), якщо автодетект не спрацював. Натисніть <MousePointerClick className="w-4 h-4 inline" /> у таблиці сайтів.</p>
                <p><strong>Success URL</strong> — вказати URL сторінки подяки вручну (якщо є). Іконка <Sliders className="w-4 h-4 inline" /> → «URL сторінки успіху».</p>
                <p><strong>Фіксована ціна</strong> — задати ціну вручну, якщо автоматичне зчитування не працює.</p>
                <p><strong>JS API</strong> — викликати після оплати з коду:</p>
                <div className="bg-slate-900 rounded-lg p-3">
                  <pre className="text-xs text-green-400 overflow-x-auto"><code>{`window.LehkoTrack.trackPurchase({ amount: 500, orderId: 'ORDER-123' });`}</code></pre>
                </div>
              </div>
            </details>
          </div>
        </div>
        )}

        {/* ═══ GTM TAB ═══ */}
        {activeTab === 'gtm' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                <Tag className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Google Tag Manager</h2>
                <p className="text-slate-600 dark:text-slate-400">Встановіть трекер через GTM — код вже готовий, просто скопіюйте</p>
              </div>
            </div>

            {API_BASE.includes('localhost') && (
              <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border-2 border-amber-400 dark:border-amber-700 text-sm">
                <h4 className="font-bold text-amber-800 dark:text-amber-300 mb-2">&#x26A0;&#xFE0F; GTM + localhost: обмеження</h4>
                <p className="text-amber-700 dark:text-amber-400 mb-2">
                  Якщо ваш сайт працює через <strong>HTTPS</strong> (Netlify, Vercel, будь-який хостинг), 
                  браузер <strong>заблокує</strong> будь-які запити до <code className="bg-white dark:bg-slate-700 px-1 rounded">http://localhost</code> (Mixed Content).
                </p>
                <p className="text-amber-800 dark:text-amber-300 font-semibold mb-2">
                  GTM працюватиме коли бекенд буде на HTTPS (наприклад <code className="bg-white dark:bg-slate-700 px-1 rounded">https://lehko.space</code>).
                </p>
                <p className="text-amber-700 dark:text-amber-400">
                  Для локального тестування: <button onClick={() => setActiveTab('code')} className="text-amber-800 dark:text-amber-300 font-semibold hover:underline">пряма вставка коду</button> + відкривайте сайт через <code className="bg-white dark:bg-slate-700 px-1 rounded">http://</code> (не https).
                </p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                  <h3 className="font-semibold text-slate-800 dark:text-white">Відкрийте GTM → Tags → New → Custom HTML</h3>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                  <h3 className="font-semibold text-slate-800 dark:text-white">Скопіюйте готовий код для вашого сайту</h3>
                </div>

                {websites.length > 0 ? (
                  <div className="ml-11 space-y-4">
                    {websites.map(website => {
                      const wsGtmCode = getGtmCode(website.id);
                      const wsGtmKey = `gtm-code-${website.id}`;
                      return (
                        <div key={website.id} className="border border-indigo-200 dark:border-indigo-800 rounded-xl overflow-hidden">
                          <div className="bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 flex items-center justify-between">
                            <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                              {website.name} <span className="text-xs opacity-70">({website.domain || `ID: ${website.id}`})</span>
                            </span>
                            <button
                              onClick={() => copyToClipboard(wsGtmCode, wsGtmKey)}
                              className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
                            >
                              {copiedSection === wsGtmKey ? <><Check className="w-3.5 h-3.5" /> Скопійовано</> : <><Copy className="w-3.5 h-3.5" /> Копіювати</>}
                            </button>
                          </div>
                          <div className="bg-slate-900 p-4">
                            <pre className="text-sm text-green-400 overflow-x-auto whitespace-pre-wrap"><code>{wsGtmCode}</code></pre>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="ml-11 bg-slate-900 rounded-xl p-4">
                    <pre className="text-sm text-green-400 overflow-x-auto whitespace-pre-wrap"><code>{getGtmCode(null)}</code></pre>
                    <p className="text-xs text-slate-400 mt-3">Додайте сайт у вкладці «Мої сайти», щоб отримати код з вашим ID.</p>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                  <h3 className="font-semibold text-slate-800 dark:text-white">Тригер: All Pages → Save → Submit → Publish</h3>
                </div>
                <p className="ml-11 text-sm text-slate-600 dark:text-slate-400">Оберіть тригер <strong>«All Pages»</strong>, збережіть тег, натисніть <strong>Submit</strong> і <strong>Publish</strong>.</p>
              </div>
            </div>

            <div className="mt-6 bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800 text-sm text-green-800 dark:text-green-300">
              <h4 className="font-semibold mb-2">&#x2705; Перевага GTM: код автоматично на ВСІХ сторінках</h4>
              <p>GTM ставить трекер на кожну сторінку сайту (тригер «All Pages»). Вам не потрібно вставляти код в кожен HTML-файл окремо.</p>
            </div>

            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300">
              <p>Після публікації зачекайте 1–2 хв та перевірте статус у вкладці <button onClick={() => setActiveTab('websites')} className="text-blue-800 dark:text-blue-300 font-semibold hover:underline">Мої сайти</button>.</p>
            </div>
          </div>
        </div>
        )}

        {/* ═══ GUIDE TAB ═══ */}
        {activeTab === 'guide' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Як працює трекер</h2>
                <p className="text-slate-600 dark:text-slate-400">Від кліку до продажу — все автоматично</p>
              </div>
            </div>

            {/* Flow */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {[
                  { step: '1', icon: '🔗', title: 'Клік', desc: 'Відвідувач клікає на tracking-посилання' },
                  { step: '2', icon: '📡', title: 'Захоплення', desc: 'Трекер зберігає ref в cookies + localStorage + додає до всіх посилань' },
                  { step: '3', icon: '🔄', title: 'Авто-розповсюдження', desc: 'При переході на інші сторінки ref передається через URL та cookies' },
                  { step: '4', icon: '🖱️', title: 'Лід', desc: 'Клік на «Купити» → лід. Починається моніторинг' },
                  { step: '5', icon: '💰', title: 'Продаж', desc: 'Сторінка подяки або підтвердження → продаж зараховано!' },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600 text-center">
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <div className="text-xs font-bold text-violet-600 dark:text-violet-400 mb-1">Крок {item.step}</div>
                    <h4 className="font-semibold text-slate-800 dark:text-white mb-1">{item.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* How confirmation works */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Як визначається продаж (3 способи)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                  <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">1. Сторінка подяки</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Якщо URL містить ключові слова:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['/thank-you', '/success', '/order-complete', '/confirmation'].map(u => (
                      <code key={u} className="text-xs bg-white dark:bg-slate-600 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">{u}</code>
                    ))}
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-2">Автоматично читає <code className="bg-white dark:bg-slate-700 px-1 rounded">?total=</code> та <code className="bg-white dark:bg-slate-700 px-1 rounded">?order=</code> з URL</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">2. DOM-сигнали</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Поява тексту на сторінці (popup/modal):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Дякуємо за замовлення', 'Order confirmed', 'Оплата успішна'].map(t => (
                      <span key={t} className="text-xs bg-white dark:bg-slate-600 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 italic">"{t}"</span>
                    ))}
                  </div>
                </div>
                <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4 border border-violet-200 dark:border-violet-800">
                  <h4 className="font-semibold text-violet-800 dark:text-violet-300 mb-2">3. Відкладена конверсія</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Якщо користувач перейшов на сторінку подяки (без трекера), а потім повернувся — трекер зарахує продаж через <code className="bg-white dark:bg-slate-700 px-1 rounded text-xs">document.referrer</code>
                  </p>
                </div>
              </div>
            </div>

            {/* For client */}
            <div className="mb-8 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
              <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-3">Що сказати клієнту (власнику сайту)</h3>
              <div className="bg-white dark:bg-slate-700 rounded-lg p-4 text-sm text-slate-600 dark:text-slate-400 italic">
                «Встав один рядок коду на головну сторінку сайту. Більше нічого робити не потрібно — наша система сама розповсюдить tracking ID на всі сторінки через cookies та посилання, знайде кнопки покупки і відстежить замовлення автоматично.»
              </div>
            </div>

            {/* Verification */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">Перевірка підключення</h3>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300">
                <p className="mb-2">Трекер надсилає verification ping кожні 5 хвилин. Після встановлення:</p>
                <ul className="space-y-1 list-disc list-inside ml-2">
                  <li>Зачекайте 1–2 хв та натисніть «Перевірити» у таблиці сайтів</li>
                  <li>Або відкрийте сайт → F12 → Console → <code className="bg-white dark:bg-slate-700 px-1 rounded">window.LehkoTrack</code> → <code className="bg-white dark:bg-slate-700 px-1 rounded">version: "4.0"</code></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        )}

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

