import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout.jsx';
import api from '../config/api.js';
import { Code, Settings, Copy, Check, ExternalLink, FileCode, Tag, Plus, Edit, Trash2, Globe, X, RefreshCw, BookOpen, AlertCircle, HelpCircle, Sliders, MousePointerClick } from 'lucide-react';

export default function Setup() {
  const { t } = useTranslation();
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
      alert(err.response?.data?.error || t('setup.addSiteError'));
    }
  };

  const handleDeleteWebsite = async (id) => {
    if (!confirm(t('setup.deleteSiteConfirm'))) return;
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
      alert(err.response?.data?.error || t('setup.saveError'));
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
      if (!code) { alert(t('setup.codeGenError')); return; }
      const mapperUrl = `${API_BASE}/api/track/mapper/${code}`;
      const snippet = `var s=document.createElement('script');s.src='${mapperUrl}';document.head.appendChild(s);`;
      await navigator.clipboard.writeText(snippet);
      alert(t('setup.codeCopied'));
    } catch (err) {
      alert(err.response?.data?.error || 'Помилка');
    }
  }, [API_BASE, t]);

  const handleConfigureVisualMapper = useCallback(async (website) => {
    if (!website.domain) {
      alert(t('setup.enterDomainFirst'));
      return;
    }
    if (!website.is_connected) {
      if (!confirm(t('setup.trackerNotConnectedConfirm'))) return;
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
if (updated.purchase_button_selector) parts.push(`${t('setup.leadButton')}: ${updated.purchase_button_selector}`);
                            if (updated.cart_button_selector) parts.push(`${t('setup.cartButton')}: ${updated.cart_button_selector}`);
            alert(parts.join('\n'));
          }
        } catch (e) { /* keep polling */ }
      }, 3000);
    } catch (err) {
      console.error('Failed to start configuration:', err);
      alert(err.response?.data?.error || t('setup.configStartError'));
      setConfiguringId(null);
    }
  }, [t]);

  const handleCheckWebsite = async (website) => {
    try {
      setCheckingId(website.id);
      
      // Для localhost не можна перевірити автоматично
      if (isLocalhost(website.domain)) {
        alert(t('setup.localhostCheckAlert'));
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
      const errorMessage = err.response?.data?.error || t('setup.checkError');
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
      <div className="max-w-none">
        {/* Header */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white/80 dark:bg-slate-900/70 px-5 py-4 backdrop-blur">
          <h1 className="font-display text-3xl font-bold text-slate-900 mb-1">
            {t('setup.title')}
          </h1>
          <p className="text-sm text-slate-600">
            {t('setup.subtitle')}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b-2 border-slate-200">
            <nav className="flex gap-1 overflow-x-auto">
              {[
                { id: 'websites', icon: Globe, label: t('setup.tabMySites'), active: 'border-violet-600 text-violet-600' },
                { id: 'code', icon: FileCode, label: t('setup.tabInstall'), active: 'border-violet-600 text-violet-600' },
                { id: 'gtm', icon: Tag, label: t('setup.tabGtm'), active: 'border-indigo-600 text-indigo-600' },
                { id: 'guide', icon: BookOpen, label: t('setup.tabGuide'), active: 'border-emerald-600 text-emerald-600' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 border-b-2 text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? `${tab.active} font-semibold`
                      : 'border-transparent text-slate-500 font-medium hover:text-slate-700'
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
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{t('setup.mySitesTitle')}</h2>
                <p className="text-slate-600">{t('setup.mySitesDesc')}</p>
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
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition-all flex items-center space-x-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-5 h-5 ${checkingId !== null ? 'animate-spin' : ''}`} />
                    <span>{t('setup.checkAll')}</span>
                  </button>
                )}
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 bg-violet-700 text-white font-semibold rounded-lg hover:bg-violet-800 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>{t('setup.addSite')}</span>
                </button>
              </div>
            </div>

            {/* Add Website Form */}
            {showAddForm && (
              <div className="mb-6 bg-slate-50 rounded-lg p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('setup.addNewSite')}</h3>
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    💡 <strong>{t('common.help')}:</strong> {t('setup.tipDomain')}
                  </p>
                </div>
                <form onSubmit={handleAddWebsite} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t('setup.siteName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newWebsite.name}
                      onChange={(e) => setNewWebsite({ ...newWebsite, name: e.target.value })}
                      placeholder={t('setup.siteNamePlaceholder')}
                      className="w-full px-4 py-2.5 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-500 transition-all text-slate-900 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t('setup.siteDomain')} <span className="text-slate-400">{t('setup.siteDomainOptional')}</span>
                    </label>
                    <input
                      type="text"
                      value={newWebsite.domain}
                      onChange={(e) => setNewWebsite({ ...newWebsite, domain: e.target.value })}
                      placeholder={t('setup.siteDomainPlaceholder')}
                      className="w-full px-4 py-2.5 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-500 transition-all text-slate-900 placeholder-slate-400"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      💡 {t('setup.siteDomainHint')}
                    </p>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewWebsite({ name: '', domain: '' });
                      }}
                      className="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-all"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-violet-700 text-white font-semibold rounded-lg hover:bg-violet-800 transition-colors"
                    >
                      {t('setup.add')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* API URL Warning */}
            {API_BASE.includes('localhost') && (
              <div className="mb-6 bg-amber-50 border-2 border-amber-300 dark:bg-slate-900 dark:border-slate-600 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">⚠️ {t('setup.apiWarningTitle')}</h3>
                    <p className="text-sm text-amber-800 dark:text-slate-200 mb-3">
                      {t('setup.apiWarningLocalhost')}
                    </p>
                    <p className="text-sm text-amber-800 dark:text-slate-200 mb-3">
                      {t('setup.apiWarningProduction')}
                    </p>
                    <div className="bg-red-50 border border-red-200 dark:bg-slate-800 dark:border-slate-600 rounded-lg p-3 mb-3">
                      <p className="text-sm text-red-800 dark:text-amber-200 font-semibold mb-1">🔒 {t('setup.httpsCritical')}</p>
                      <p className="text-xs text-red-700 dark:text-slate-300 mb-2">
                        {t('setup.httpsCriticalDesc')}
                      </p>
                      <div className="bg-white dark:bg-slate-900 rounded p-2 mt-2">
                        <p className="text-xs text-red-800 dark:text-slate-200 mb-1"><strong>{t('setup.httpsCorrect')}</strong> <code className="bg-green-100 dark:bg-emerald-900/40 dark:text-emerald-200 px-1 rounded">https://lehko.space</code></p>
                        <p className="text-xs text-red-700 dark:text-slate-300">❌ <strong>{t('setup.httpsWrong')}</strong> <code className="bg-red-100 dark:bg-rose-900/40 dark:text-rose-200 px-1 rounded">http://lehko.space</code></p>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-amber-200 dark:border-slate-600 mb-3">
                      <p className="text-xs text-amber-700 dark:text-slate-300 mb-2"><strong>{t('setup.apiExample')}</strong></p>
                      <code className="text-xs text-amber-800 dark:text-amber-200">https://lehko.space</code> або <code className="text-xs text-amber-800 dark:text-amber-200">https://api.yourdomain.com</code>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-slate-400">
                      💡 {t('setup.apiWhere')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Info Banner */}
            {websites.length > 0 && (
              <div className="mb-6 space-y-3">
                <div className="bg-blue-50 border border-blue-200 dark:bg-slate-900 dark:border-slate-600 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-800 dark:text-slate-100 mb-1">
                        {t('setup.howCheckWorks')}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-slate-300 mb-2">
                        {t('setup.howCheckWays')}
                      </p>
                      <ul className="text-xs text-blue-700 dark:text-slate-300 list-disc list-inside space-y-1 ml-2">
                        <li>{t('setup.verificationPing')}</li>
                        <li>{t('setup.htmlCheck')}</li>
                      </ul>
                      <p className="text-xs text-blue-700 dark:text-slate-300 mt-2">
                        💡 {t('setup.checkTip')}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-slate-300 mt-1">
                        🏷️ {t('setup.gtmTip')}
                      </p>
                      <div className="mt-3 pt-3 border-t border-blue-200 dark:border-slate-700">
                        <p className="text-xs text-blue-700 mb-1">
                          🧪 <a href={`${API_BASE}/tracker-test.html`} target="_blank" rel="noopener noreferrer" className="underline font-semibold">{t('setup.testPage')}</a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Statistics */}
                {websites.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <p className="text-2xl font-bold text-slate-800">
                        {websites.length}
                      </p>
                      <p className="text-sm text-slate-600">{t('setup.totalSites')}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <p className="text-2xl font-bold text-green-700">
                        {websites.filter(w => w.is_connected).length}
                      </p>
                      <p className="text-sm text-green-600">{t('setup.connected')}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                      <p className="text-2xl font-bold text-red-700">
                        {websites.filter(w => !w.is_connected && !isLocalhost(w.domain)).length}
                      </p>
                      <p className="text-sm text-red-600">{t('setup.notConnected')}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Help */}
            {websites.length > 0 && (
              <div className="mb-4 bg-blue-50 border border-blue-200 dark:bg-slate-900 dark:border-slate-600 rounded-xl p-4">
                <p className="text-sm text-blue-800 dark:text-slate-200">
                  {t('setup.quickHelp')}
                </p>
              </div>
            )}

            {/* Websites Table */}
            {loading ? (
              <div className="text-center py-12">
                <p className="text-slate-500">{t('common.loading')}</p>
              </div>
            ) : websites.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                <Globe className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500 mb-2">{t('setup.noSitesYet')}</p>
                <p className="text-sm text-slate-400 mb-4">
                  {t('setup.noSitesHint')}
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                      className="px-6 py-2.5 bg-violet-700 text-white font-semibold rounded-lg hover:bg-violet-800 transition-colors"
                >
                  {t('setup.addFirstSite')}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">{t('setup.tableSite')}</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">{t('setup.tableSiteId')}</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">{t('setup.tableStatus')}</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">{t('setup.tableCheck')}</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">{t('setup.tableActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {websites.map((website) => (
                      <tr key={website.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-semibold text-slate-800">{website.name}</p>
                            {website.domain && (
                              <p className="text-sm text-slate-500">{website.domain}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <code className="px-2 py-1 bg-violet-100 text-violet-700 rounded text-sm font-mono">
                              {website.id}
                            </code>
                            <button
                              onClick={() => copyToClipboard(String(website.id), `site-id-${website.id}`)}
                              className="p-1 text-slate-500 hover:text-slate-700"
                              title={t('setup.copyId')}
                            >
                              {copiedSection === `site-id-${website.id}` ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{t('setup.useForCode')}</p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col space-y-2">
                            <span
                              className={`inline-flex items-center space-x-2 px-3 py-1 rounded-lg font-medium text-sm ${
                                website.is_connected
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${website.is_connected ? 'bg-green-600' : 'bg-red-600'}`}></span>
                              <span>{website.is_connected ? '✅ ' + t('setup.connectedStatus') : '❌ ' + t('setup.notConnectedStatus')}</span>
                            </span>
                            {!website.is_connected && website.domain && !isLocalhost(website.domain) && (
                              <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 mt-2 border border-slate-200">
                                <p className="mb-2 font-semibold text-slate-700">💡 {t('setup.trackerNotFound')}</p>
                                <ol className="list-decimal list-inside space-y-1 ml-1">
                                  <li>{t('setup.trackerNotFound1')}</li>
                                  <li>{t('setup.trackerNotFound2')}</li>
                                  <li>{t('setup.trackerNotFound3')}</li>
                                  <li>{t('setup.trackerNotFound4')}</li>
                                </ol>
                                <div className="mt-2 pt-2 border-t border-slate-200 space-y-2">
                                  <p className="text-slate-600">
                                    📋 {t('setup.quickCheck')}
                                  </p>
                                  <p className="text-indigo-700 font-medium">
                                    🏷️ {t('setup.gtmNote')}
                                  </p>
                                </div>
                              </div>
                            )}
                            {website.is_connected && (
                              <div className="text-xs text-green-600 bg-green-50 rounded-lg p-3 mt-2 border border-green-200">
                                <p className="font-semibold mb-2">✓ {t('setup.trackerFound')}</p>
                                <div className="space-y-1 text-green-700">
                                  <p>✅ {t('setup.verificationActive')}</p>
                                  <p>✅ {t('setup.autoClicks')}</p>
                                  <p>✅ {t('setup.autoConversions')}</p>
                                </div>
                                <div className="mt-2 pt-2 border-t border-green-200">
                                  <p className="text-green-600">
                                    💡 {t('setup.guarantees')}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {isLocalhost(website.domain) ? (
                            <div className="flex flex-col space-y-1">
                              <span className="text-sm text-slate-500 italic">
                                {t('setup.localhostCheck')}
                              </span>
                              <span className="text-xs text-slate-400">
                                {t('setup.localhostUsePublic')}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col space-y-2">
                              <button
                                onClick={() => handleCheckWebsite(website)}
                                disabled={checkingId === website.id}
                                className="inline-flex items-center space-x-2 px-3 py-2 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-lg transition-all disabled:opacity-50"
                              >
                                <RefreshCw className={`w-4 h-4 ${checkingId === website.id ? 'animate-spin' : ''}`} />
                                <span>{checkingId === website.id ? t('setup.checking') : t('setup.checkNow')}</span>
                              </button>
                              {!website.is_connected && (
                                <div className="text-xs text-slate-500">
                                  <p className="mb-1">💡 {t('setup.checkMayTake')}</p>
                                  <p className="text-slate-400">
                                    {t('setup.checkHow')}
                                  </p>
                                </div>
                              )}
                              {website.is_connected && (
                                <div className="text-xs text-green-600 space-y-1">
                                  <p>✓ {t('setup.lastCheckJust')}</p>
                                  <p className="text-green-500">
                                    🔄 {t('setup.autoCheckEvery')}
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
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title={t('setup.quickCopyCode')}
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
                                  ? 'text-green-600 hover:bg-green-50'
                                  : 'text-amber-600 hover:bg-amber-50'
                              } ${configuringId === website.id ? 'animate-pulse' : ''}`}
                              title={(website.purchase_button_selector || website.cart_button_selector)
                                ? `${website.purchase_button_selector ? 'Лід: ' + website.purchase_button_selector : ''}${website.cart_button_selector ? (website.purchase_button_selector ? ' | ' : '') + 'Кошик: ' + website.cart_button_selector : ''} (клікніть щоб змінити)`
                                : t('setup.configureButtons')
                              }
                            >
                              <MousePointerClick className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => openEditWebsite(website)}
                              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title={t('setup.settingsUrlPrice')}
                            >
                              <Sliders className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => { setShowCodeModal(website); }}
                              className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                              title={t('setup.showCode')}
                            >
                              <Code className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteWebsite(website.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title={t('common.delete')}
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
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800">
                  {t('setup.trackingCodeFor')} {showCodeModal.name}
                </h3>
                <button
                  onClick={() => setShowCodeModal(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Info Box with Site Details */}
              <div className="mb-4 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl p-4 border-2 border-violet-200">
                <h4 className="font-semibold text-slate-800 mb-3">📋 {t('setup.siteInfo')}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">{t('setup.siteId')}</span>
                    <div className="flex items-center space-x-2">
                      <code className="px-2 py-1 bg-white text-violet-700 rounded font-mono font-semibold">
                        {showCodeModal?.id || 'N/A'}
                      </code>
                      {showCodeModal?.id && (
                        <button
                          onClick={() => copyToClipboard(String(showCodeModal.id), 'modal-site-id')}
                          className="p-1 text-slate-500 hover:text-slate-700"
                          title={t('setup.copyId')}
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
                    <span className="text-slate-600">{t('setup.apiUrl')}</span>
                    <code className="px-2 py-1 bg-white text-slate-800 rounded font-mono text-xs">
                      {API_BASE}
                    </code>
                  </div>
                  {showCodeModal?.domain && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">{t('setup.siteDomainLabel')}</span>
                      <code className="px-2 py-1 bg-white text-slate-800 rounded font-mono text-xs">
                        {showCodeModal.domain}
                      </code>
                    </div>
                  )}
                </div>
            {API_BASE.includes('localhost') && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800">
                  {t('setup.localhostInCode')}
                </p>
                <p className="text-xs text-red-700 mt-2">
                  {t('setup.httpsCriticalShort')}
                </p>
              </div>
            )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  ✅ {t('setup.readyCode')}
                </label>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 relative">
                  <button
                    onClick={() => {
                      copyToClipboard(modalCode, 'modal-code');
                    }}
                    className="absolute top-4 right-4 p-2 text-slate-600 hover:bg-white rounded-lg transition-colors"
                    title={t('setup.copyCode')}
                  >
                    {copiedSection === 'modal-code' ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                  <pre className="text-sm text-slate-800 overflow-x-auto">
                    <code>{modalCode}</code>
                  </pre>
                </div>
                {showCodeModal?.id && (
                  <p className="text-xs text-slate-500 mt-2">
                    ✅ {t('setup.siteIdInCode')} ({showCodeModal.id})
                    {!API_BASE.includes('localhost') && (
                      <span className="block mt-1">✅ {t('setup.apiInCode')} ({API_BASE})</span>
                    )}
                  </p>
                )}
              </div>

              {/* Detailed Instructions */}
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-blue-800 mb-3">📖 {t('setup.stepByStep')}</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                  <li>{t('setup.stepCopy')}</li>
                  <li>{t('setup.stepOpenHtml')}</li>
                  <li>{t('setup.stepFindHead')}</li>
                  <li>{t('setup.stepPaste')}</li>
                  {API_BASE.includes('localhost') && (
                    <li className="text-amber-700">{t('setup.stepReplaceLocalhost')}</li>
                  )}
                  <li>{t('setup.stepSave')}</li>
                  <li>{t('setup.stepVerify')}</li>
                </ol>
              </div>

              {/* Where to find info */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h4 className="font-semibold text-green-800 mb-2">💡 {t('setup.whereFindData')}</h4>
                <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                  <li>{t('setup.whereSiteId')}</li>
                  <li>{t('setup.whereApiUrl')} ({API_BASE})</li>
                  <li>{t('setup.whereConversions')}</li>
                </ul>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowCodeModal(null)}
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all"
                >
                  {t('setup.gotIt')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Website Modal (conversion URLs, price selector, static price) */}
        {editingWebsite && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-xl font-bold text-slate-800">{t('setup.settingsFor')} {editingWebsite.name}</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyConsoleCode(editingWebsite)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200"
                  >
                    <Code className="w-4 h-4" />
                    <span>{t('setup.consoleCode')}</span>
                  </button>
                  <button
                    onClick={() => setEditingWebsite(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleSaveWebsite} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t('setup.name')}</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t('setup.domain')}</label>
                  <input
                    type="text"
                    value={editForm.domain}
                    onChange={(e) => setEditForm((f) => ({ ...f, domain: e.target.value }))}
                    placeholder="example.com"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">{t('setup.successUrlLabel')}</label>
                  <textarea
                    value={editForm.conversion_urls.join('\n')}
                    onChange={(e) => setEditForm((f) => ({ ...f, conversion_urls: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) }))}
                    placeholder={t('setup.successUrlPlaceholder')}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
                  />
                  <p className="text-xs text-slate-500 mt-1">{t('setup.successUrlHint')}</p>
                </div>
                {/* Conversion Button Selector */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('setup.leadButton')}</label>
                  {editForm.purchase_button_selector ? (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-600 text-sm">&#10004;</span>
                      <code className="flex-1 px-3 py-1.5 bg-white rounded text-sm font-mono text-slate-700 truncate">
                        {editForm.purchase_button_selector}
                      </code>
                      <button
                        type="button"
                        onClick={() => setEditForm(f => ({ ...f, purchase_button_selector: '' }))}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                        title={t('setup.reset')}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 mb-2">{t('setup.leadButtonNotSet')}</p>
                  )}

                  {/* Manual CSS selector input */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-slate-600 mb-1">{t('setup.leadSelectorLabel')}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editForm.purchase_button_selector || ''}
                        onChange={(e) => setEditForm(f => ({ ...f, purchase_button_selector: e.target.value }))}
                        placeholder={t('setup.leadSelectorPlaceholder')}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm font-mono"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {t('setup.leadSelectorHint')}
                    </p>
                  </div>
                </div>

                {/* Cart Button Selector */}
                <div className="bg-slate-50 rounded-xl p-4 border border-orange-200">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('setup.cartButton')}</label>
                  {editForm.cart_button_selector ? (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-600 text-sm">&#10004;</span>
                      <code className="flex-1 px-3 py-1.5 bg-white rounded text-sm font-mono text-slate-700 truncate">
                        {editForm.cart_button_selector}
                      </code>
                      <button
                        type="button"
                        onClick={() => setEditForm(f => ({ ...f, cart_button_selector: '' }))}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                        title={t('setup.reset')}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 mb-2">{t('setup.cartButtonNotSet')}</p>
                  )}
                  <div className="mb-1">
                    <label className="block text-xs font-medium text-slate-600 mb-1">{t('setup.leadSelectorLabel')}</label>
                    <input
                      type="text"
                      value={editForm.cart_button_selector || ''}
                      onChange={(e) => setEditForm(f => ({ ...f, cart_button_selector: e.target.value }))}
                      placeholder={t('setup.cartSelectorPlaceholder')}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm font-mono"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      {t('setup.cartHint')}
                    </p>
                  </div>
                </div>

                {/* Код для консолі — першим; потім Visual Mapper */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('setup.visualMapperLabel')}</label>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyConsoleCode(editingWebsite)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-100 text-amber-700 font-medium rounded-lg hover:bg-amber-200 transition-colors text-sm"
                      title={t('setup.consoleCodeCopy')}
                    >
                      <Code className="w-4 h-4" />
                      <span>{t('setup.consoleCodeCopy')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfigureVisualMapper(editingWebsite)}
                      disabled={configuringId === editingWebsite?.id}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-100 text-violet-700 font-medium rounded-lg hover:bg-violet-200 transition-colors disabled:opacity-50 text-sm"
                    >
                      <MousePointerClick className="w-4 h-4" />
                      <span>{configuringId === editingWebsite?.id ? t('setup.waiting') : t('setup.visualMapperOpen')}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    {t('setup.visualMapperHint')}
                  </p>
                </div>

                {/* Price Settings */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">{t('setup.priceDetection')}</label>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">{t('setup.staticPrice')}</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editForm.static_price}
                        onChange={(e) => setEditForm((f) => ({ ...f, static_price: e.target.value }))}
                        placeholder={t('setup.staticPricePlaceholder')}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm"
                      />
                      <p className="text-xs text-slate-400 mt-1">{t('setup.staticPriceHint')}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">{t('setup.priceSelector')}</label>
                      <input
                        type="text"
                        value={editForm.price_selector}
                        onChange={(e) => setEditForm((f) => ({ ...f, price_selector: e.target.value }))}
                        placeholder={t('setup.priceSelectorPlaceholder')}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm"
                      />
                      <p className="text-xs text-slate-400 mt-1">{t('setup.priceSelectorHint')}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setEditingWebsite(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">{t('common.cancel')}</button>
                  <button type="submit" className="px-6 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700">{t('common.save')}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ═══ CODE TAB ═══ */}
        {activeTab === 'code' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                <FileCode className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{t('setup.installTitle')}</h2>
                <p className="text-slate-600">{t('setup.installSubtitle')}</p>
              </div>
            </div>

            {/* Auto magic banner */}
            <div className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border-2 border-emerald-300">
              <h3 className="text-lg font-semibold text-emerald-800 mb-2">{t('setup.autoTrackerTitle')}</h3>
              <p className="text-sm text-emerald-700 mb-3">{t('setup.autoTrackerIntro')}</p>
              <ul className="text-sm text-emerald-700 space-y-1.5">
                <li>✅ {t('setup.autoPropagation')}</li>
                <li>✅ {t('setup.autoCrossPages')}</li>
                <li>✅ {t('setup.autoFindsButtons')}</li>
                <li>✅ {t('setup.autoLead')}</li>
                <li>✅ {t('setup.autoSale')}</li>
                <li>✅ {t('setup.autoDeferred')}</li>
                <li>✅ {t('setup.autoAnyBuilder')}</li>
              </ul>
            </div>

            {/* How propagation works */}
            <div className="mb-6 bg-blue-50 rounded-xl p-5 border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">{t('setup.howPropagationWorks')}</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>1. {t('setup.guideFlowClick')} (<code className="bg-white px-1 rounded text-xs">?ref=XXX&click_id=YYY</code>)</p>
                <p>2. {t('setup.guideFlowCapture')}</p>
                <p>3. {t('setup.guideFlowSpread')}</p>
                <p>4. {t('setup.guideFlowSale')} (<code className="bg-white px-1 rounded text-xs">/thank-you?total=25000</code>)</p>
              </div>
            </div>

            {/* Step 1 */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">1</span>
                <h3 className="text-lg font-semibold text-slate-800">{t('setup.step1AddSite')}</h3>
              </div>
              <p className="text-sm text-slate-600 ml-[52px]">
                {t('setup.step1Prefix')}
                <button type="button" onClick={() => setActiveTab('websites')} className="text-violet-600 font-semibold hover:underline">{t('setup.tabMySites')}</button>
                {t('setup.step1Suffix')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">2</span>
                <h3 className="text-lg font-semibold text-slate-800">{t('setup.step2PasteCode')}</h3>
              </div>
              <p className="text-sm text-slate-600 ml-[52px] mb-3">
                {t('setup.step2Text')}
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
                  { name: 'Tilda', where: t('setup.tildaWhere') },
                  { name: 'Wix', where: t('setup.wixWhere') },
                  { name: 'WordPress', where: t('setup.wordpressWhere') },
                  { name: 'Shopify', where: t('setup.shopifyWhere') },
                  { name: 'Horoshop', where: t('setup.horoshopWhere') },
                  { name: 'Google Tag Manager', where: '' },
                ].map(p => (
                  <div key={p.name} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <p className="font-semibold text-sm text-slate-800">{p.name}</p>
                    {p.where ? (
                      <p className="text-xs text-slate-500 mt-1">{p.where}</p>
                    ) : (
                      <button type="button" onClick={() => setActiveTab('gtm')} className="text-xs text-indigo-600 mt-1 hover:underline">{t('setup.gtmSeparate')}</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Done */}
            <div className="mb-6 bg-green-50 rounded-xl p-5 border-2 border-green-300">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">✓</span>
                <h3 className="text-lg font-semibold text-green-800">{t('setup.doneTitle')}</h3>
              </div>
              <p className="text-sm text-green-700 ml-[52px] mb-2">
                {t('setup.doneIntro')}
              </p>
              <ul className="text-sm text-green-700 ml-[52px] space-y-1 list-disc list-inside mb-2">
                <li>{t('setup.doneList1')}</li>
                <li>{t('setup.doneList2')}</li>
                <li>{t('setup.doneList3')}</li>
                <li>{t('setup.doneList4')}</li>
              </ul>
              <p className="text-sm text-green-700 ml-[52px]">
                {t('setup.doneVerify')}{' '}
                <button type="button" onClick={() => setActiveTab('websites')} className="text-green-800 font-semibold hover:underline">{t('setup.tabMySites')}</button>.
              </p>
            </div>

            {/* Advanced (collapsed) */}
            <details className="bg-slate-50 rounded-xl border border-slate-200">
              <summary className="cursor-pointer p-4 font-semibold text-sm text-slate-700 hover:text-slate-900">
                {t('setup.advancedTitle')}
              </summary>
              <div className="px-4 pb-4 space-y-3 text-sm text-slate-600">
                <p>{t('setup.advancedVisual')} <MousePointerClick className="w-4 h-4 inline" /></p>
                <p>{t('setup.advancedSuccess')} <Sliders className="w-4 h-4 inline" /></p>
                <p>{t('setup.advancedPrice')}</p>
                <p>{t('setup.advancedApi')}</p>
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
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Tag className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{t('setup.gtmTitle')}</h2>
                <p className="text-slate-600">{t('setup.gtmSubtitle')}</p>
              </div>
            </div>

            {API_BASE.includes('localhost') && (
              <div className="mb-6 bg-amber-50 rounded-xl p-4 border-2 border-amber-400 text-sm">
                <h4 className="font-bold text-amber-800 mb-2">&#x26A0;&#xFE0F; {t('setup.gtmLocalhostTitle')}</h4>
                <p className="text-amber-700 mb-2">
                  {t('setup.gtmLocalhostDesc')}
                </p>
                <p className="text-amber-700">
                  <button type="button" onClick={() => setActiveTab('code')} className="text-amber-800 font-semibold hover:underline">{t('setup.gtmLocalhostTest')}</button>
                </p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                  <h3 className="font-semibold text-slate-800">{t('setup.gtmStep1')}</h3>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                  <h3 className="font-semibold text-slate-800">{t('setup.gtmStep2')}</h3>
                </div>

                {websites.length > 0 ? (
                  <div className="ml-11 space-y-4">
                    {websites.map(website => {
                      const wsGtmCode = getGtmCode(website.id);
                      const wsGtmKey = `gtm-code-${website.id}`;
                      return (
                        <div key={website.id} className="border border-indigo-200 rounded-xl overflow-hidden">
                          <div className="bg-indigo-50 px-4 py-2 flex items-center justify-between">
                            <span className="text-sm font-semibold text-indigo-700">
                              {website.name} <span className="text-xs opacity-70">({website.domain || `ID: ${website.id}`})</span>
                            </span>
                            <button
                              onClick={() => copyToClipboard(wsGtmCode, wsGtmKey)}
                              className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
                            >
                              {copiedSection === wsGtmKey ? <><Check className="w-3.5 h-3.5" /> {t('common.copied')}</> : <><Copy className="w-3.5 h-3.5" /> {t('common.copy')}</>}
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
                    <p className="text-xs text-slate-400 mt-3">{t('setup.gtmAddSiteHint')}</p>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                  <h3 className="font-semibold text-slate-800">{t('setup.gtmStep3')}</h3>
                </div>
                <p className="ml-11 text-sm text-slate-600">{t('setup.gtmStep3Desc')}</p>
              </div>
            </div>

            <div className="mt-6 bg-green-50 rounded-xl p-4 border border-green-200 text-sm text-green-800">
              <h4 className="font-semibold mb-2">&#x2705; {t('setup.gtmAdvantageTitle')}</h4>
              <p>{t('setup.gtmAdvantageDesc')}</p>
            </div>

            <div className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-200 text-sm text-blue-800">
              <p>{t('setup.gtmVerify')}{' '}
                <button type="button" onClick={() => setActiveTab('websites')} className="text-blue-800 font-semibold hover:underline">{t('setup.tabMySites')}</button>.</p>
            </div>
          </div>
        </div>
        )}

        {/* ═══ GUIDE TAB ═══ */}
        {activeTab === 'guide' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{t('setup.guideTitle')}</h2>
                <p className="text-slate-600">{t('setup.guideSubtitle')}</p>
              </div>
            </div>

            {/* Flow */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {[
                  { step: '1', icon: '🔗', titleKey: 'guideStep1', descKey: 'guideFlowClick' },
                  { step: '2', icon: '📡', titleKey: 'guideStep2', descKey: 'guideFlowCapture' },
                  { step: '3', icon: '🔄', titleKey: 'guideStep3', descKey: 'guideFlowSpread' },
                  { step: '4', icon: '🖱️', titleKey: 'guideStep4', descKey: 'guideFlowLead' },
                  { step: '5', icon: '💰', titleKey: 'guideStep5', descKey: 'guideFlowSale' },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <div className="text-xs font-bold text-violet-600 mb-1">{t('setup.stepLabel')} {item.step}</div>
                    <h4 className="font-semibold text-slate-800 mb-1">{t('setup.' + item.titleKey)}</h4>
                    <p className="text-xs text-slate-600">{t('setup.' + item.descKey)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* How confirmation works */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('setup.howSaleDetected')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                  <h4 className="font-semibold text-emerald-800 mb-2">1. {t('setup.saleMethod1')}</h4>
                  <p className="text-sm text-slate-600 mb-2">{t('setup.saleMethod1Desc')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['/thank-you', '/success', '/order-complete', '/confirmation'].map(u => (
                      <code key={u} className="text-xs bg-white px-2 py-0.5 rounded text-slate-600">{u}</code>
                    ))}
                  </div>
                  </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">2. {t('setup.saleMethod2')}</h4>
                  <p className="text-sm text-slate-600 mb-2">{t('setup.saleMethod2Desc')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Дякуємо за замовлення', 'Order confirmed', 'Оплата успішна'].map((phrase) => (
                      <span key={phrase} className="text-xs bg-white px-2 py-0.5 rounded text-slate-600 italic">&quot;{phrase}&quot;</span>
                    ))}
                  </div>
                </div>
                <div className="bg-violet-50 rounded-xl p-4 border border-violet-200">
                  <h4 className="font-semibold text-violet-800 mb-2">3. {t('setup.saleMethod3')}</h4>
                  <p className="text-sm text-slate-600">{t('setup.saleMethod3Desc')}</p>
                </div>
              </div>
            </div>

            {/* Verification */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">{t('setup.verifyTitle')}</h3>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-sm text-blue-800">
                {t('setup.verifyDesc')}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Support */}
        <div className="mt-8 bg-slate-50 rounded-xl p-6 border border-slate-200 text-center">
          <p className="text-slate-600 mb-2">
            {t('setup.supportNeedHelp')}
          </p>
          <a
            href="mailto:support@example.com"
            className="text-violet-600 hover:text-violet-700 font-medium inline-flex items-center"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            {t('setup.contactSupport')}
          </a>
        </div>
      </div>
    </Layout>
  );
}


