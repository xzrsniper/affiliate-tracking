import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext.jsx';
import api from '../config/api.js';
import Logo from '../components/Logo.jsx';
import { MessageCircle, Eye, Clock, Sun, Moon } from 'lucide-react';

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

function decodeHtmlEntities(maybeEscapedHtml) {
  if (!maybeEscapedHtml) return '';
  // If user saved body as "&lt;h1&gt;" etc, decode it so it can be rendered.
  if (!maybeEscapedHtml.includes('&lt;') && !maybeEscapedHtml.includes('&gt;')) return maybeEscapedHtml;
  const textarea = document.createElement('textarea');
  textarea.innerHTML = maybeEscapedHtml;
  return textarea.value || '';
}

export default function BlogPost() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isUk = i18n.language === 'uk';
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!slug) return;
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/api/blog/${encodeURIComponent(slug)}`);
        if (!cancelled && res.data?.success) setPost(res.data.post);
      } catch (e) {
        if (!cancelled) setError(e.response?.status === 404 ? t('blog.notFound') : (e.response?.data?.error || t('blog.errorLoad')));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, t]);

  const imageSrc = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE.replace(/\/$/, '')}${url.startsWith('/') ? url : '/' + url}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] dark:bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500">{t('common.loading')}</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] dark:bg-slate-950 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-red-600 dark:text-red-400">{error || t('blog.notFound')}</p>
        <Link to="/blog" className="text-violet-600 dark:text-violet-400 hover:underline">{t('blog.backToBlog')}</Link>
      </div>
    );
  }

  const decodedBody = decodeHtmlEntities(post.body);
  const readMin = readingTime(decodedBody);

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <nav className="sticky top-0 z-50 border-b border-[#d6deea] bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex h-[68px] w-full max-w-[1240px] items-center justify-between px-4 sm:px-8">
          <Link to="/"><Logo size="md" showText={true} /></Link>
          <div className="flex items-center gap-2">
            <button onClick={() => i18n.changeLanguage(isUk ? 'en' : 'uk')} className="rounded-lg px-2 py-1 text-sm font-medium text-slate-600 dark:text-slate-300">{isUk ? 'EN' : 'УКР'}</button>
            <button onClick={toggleTheme} className="rounded-lg p-2 text-slate-600 dark:text-slate-300">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/blog" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100">{t('blog.backToBlog')}</Link>
          </div>
        </div>
      </nav>

      <article className="mx-auto max-w-[800px] px-4 py-8 sm:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">{post.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          {post.author_name && <span>{post.author_name}</span>}
          <span>{formatDate(post.published_at || post.created_at, isUk ? 'uk' : 'en')}</span>
          <span className="inline-flex items-center gap-1"><Eye className="w-4 h-4" /> {(post.view_count || 0).toLocaleString()}</span>
          <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4" /> {readMin} {isUk ? 'хв читання' : 'min read'}</span>
        </div>

        {post.featured_image && (
          <div className="mt-6 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-700">
            <img src={imageSrc(post.featured_image)} alt="" className="w-full h-auto object-cover" />
          </div>
        )}

        <div
          className="mt-6 prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-violet-600 prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: decodedBody || '' }}
        />
      </article>

      <footer className="border-t border-slate-200 dark:border-slate-800 mt-12 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <Link to="/blog" className="hover:text-slate-700 dark:hover:text-slate-300">{t('blog.backToBlog')}</Link>
        <span className="mx-2">·</span>
        <Link to="/" className="hover:text-slate-700 dark:hover:text-slate-300">{t('blog.backHome')}</Link>
      </footer>
    </div>
  );
}
