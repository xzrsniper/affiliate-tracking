import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext.jsx';
import api from '../config/api.js';
import Logo from '../components/Logo.jsx';
import SiteEditableText from '../components/SiteEditableText.jsx';
import { MessageCircle, Eye, Clock, ArrowRight, Sun, Moon } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

function formatDate(d, locale) {
  if (!d) return '';
  return new Date(d).toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function readingTime(text) {
  if (!text) return 0;
  const words = text.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function Blog() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isUk = i18n.language === 'uk';
  const [sort, setSort] = useState('latest');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pageContent, setPageContent] = useState({});

  const loadPageContent = useCallback(async () => {
    try {
      const res = await api.get('/api/page-content/blog');
      if (res.data?.content) setPageContent(res.data.content);
    } catch {
      setPageContent({});
    }
  }, []);

  useEffect(() => {
    loadPageContent();
  }, [loadPageContent]);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.page === 'blog') loadPageContent();
    };
    window.addEventListener('lehko-page-content-refresh', handler);
    return () => window.removeEventListener('lehko-page-content-refresh', handler);
  }, [loadPageContent]);

  const contentText = (section, key, fallback) => pageContent?.[section]?.[key]?.content || fallback;

  useEffect(() => {
    const seoTitle = contentText('seo', 'title', t('blog.title'));
    const seoDescription = contentText('seo', 'description', t('blog.ctaText'));
    document.title = seoTitle;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute('content', seoDescription);
  }, [pageContent, t]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/api/blog', { params: { sort: sort === 'popular' ? 'popular' : 'latest' } });
        if (!cancelled && res.data?.success) setPosts(res.data.posts || []);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.error || t('blog.errorLoad'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sort, t]);

  const popularPosts = [...posts].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 5);
  const latestPosts = [...posts].slice(0, 5);

  const imageSrc = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE.replace(/\/$/, '')}${url.startsWith('/') ? url : '/' + url}`;
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <nav className="sticky top-0 z-50 border-b border-[#d6deea] bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex h-[68px] w-full max-w-[1240px] items-center justify-between px-4 sm:px-8">
          <Link to="/"><Logo size="md" showText={true} /></Link>
          <div className="flex items-center gap-2">
            <button onClick={() => i18n.changeLanguage(isUk ? 'en' : 'uk')} className="rounded-lg px-2 py-1 text-sm font-medium text-slate-600 dark:text-slate-300">
              {isUk ? 'EN' : 'УКР'}
            </button>
            <button onClick={toggleTheme} className="rounded-lg p-2 text-slate-600 dark:text-slate-300" title={theme === 'dark' ? t('common.lightTheme') : t('common.darkTheme')}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/login" className="rounded-[10px] bg-[#6d5cf6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5d4af0]">
              {t('home.startFree')}
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1240px] px-4 py-8 sm:px-8">
        <h1 className="mb-8 text-3xl font-bold text-slate-900 dark:text-slate-100">
          <SiteEditableText page="blog" section="hero" fieldKey="title" value={contentText('hero', 'title', t('blog.title'))} as="span" />
        </h1>

        {loading && <p className="text-slate-500">{t('common.loading')}</p>}
        {error && <p className="text-red-600 dark:text-red-400">{error}</p>}

        {!loading && !error && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Main feed — 2/3 */}
            <div className="lg:col-span-2 space-y-6">
              {posts.length === 0 ? (
                <p className="text-slate-500">{t('blog.noPosts')}</p>
              ) : (
                posts.map((post) => (
                  <article key={post.id} className="border-b border-dashed border-slate-200 dark:border-slate-700 pb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {post.featured_image && (
                        <Link to={`/blog/${post.slug}`} className="block shrink-0 w-full sm:w-48 h-32 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700">
                          <img src={imageSrc(post.featured_image)} alt="" className="w-full h-full object-cover" />
                        </Link>
                      )}
                      <div className="min-w-0 flex-1">
                        <Link to={`/blog/${post.slug}`} className="text-lg font-bold text-violet-600 dark:text-violet-400 hover:underline">
                          {post.title}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          {post.author_name && <span>{post.author_name}</span>}
                          <span>{formatDate(post.published_at || post.created_at, isUk ? 'uk' : 'en')}</span>
                          <span className="inline-flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> 0</span>
                          <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {(post.view_count || 0).toLocaleString()}</span>
                          <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {readingTime(post.excerpt)} {isUk ? 'хв' : 'min'}</span>
                        </div>
                        {post.excerpt && (
                          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{post.excerpt}</p>
                        )}
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>

            {/* Sidebar — 1/3 */}
            <aside className="space-y-6">
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                <div className="flex border-b border-slate-200 dark:border-slate-700 mb-3">
                  <button
                    type="button"
                    onClick={() => setSort('popular')}
                    className={`px-3 py-2 text-xs font-semibold uppercase ${sort === 'popular' ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    {t('blog.popular')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSort('latest')}
                    className={`px-3 py-2 text-xs font-semibold uppercase ${sort === 'latest' ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    {t('blog.latest')}
                  </button>
                </div>
                <ul className="space-y-2">
                  {(sort === 'popular' ? popularPosts : latestPosts).map((p) => (
                    <li key={p.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 pb-2 last:pb-0">
                      <Link to={`/blog/${p.slug}`} className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline">
                        {p.title}
                      </Link>
                      <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(p.published_at || p.created_at, isUk ? 'uk' : 'en')} · {p.view_count || 0} {isUk ? 'переглядів' : 'views'}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-violet-600 to-indigo-600 p-6 text-white">
                <p className="text-sm font-medium opacity-90">
                  <SiteEditableText page="blog" section="sidebar" fieldKey="cta_text" value={contentText('sidebar', 'cta_text', t('blog.ctaText'))} multiline as="span" />
                </p>
                <Link to="/login" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-slate-100">
                  <SiteEditableText page="blog" section="sidebar" fieldKey="cta_button" value={contentText('sidebar', 'cta_button', t('blog.ctaButton'))} as="span" /> <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </aside>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 mt-12 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <Link to="/" className="hover:text-slate-700 dark:hover:text-slate-300">{t('blog.backHome')}</Link>
      </footer>
    </div>
  );
}
