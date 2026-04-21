import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext.jsx';
import api from '../config/api.js';
import Logo from '../components/Logo.jsx';
import { ArrowRight, BookOpen, Home, Sun, Moon, Sparkles } from 'lucide-react';

export default function NotFound() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isUk = i18n.language === 'uk';
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    document.title = t('notFound.documentTitle');
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingPosts(true);
      try {
        const res = await api.get('/api/blog', { params: { sort: 'popular' } });
        const list = res.data?.posts || [];
        const sorted = [...list].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        if (!cancelled) setPosts(sorted.slice(0, 5));
      } catch {
        if (!cancelled) setPosts([]);
      } finally {
        if (!cancelled) setLoadingPosts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <nav className="sticky top-0 z-50 border-b border-[#d6deea] bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex h-[68px] w-full max-w-[1240px] items-center justify-between px-4 sm:px-8">
          <Link to="/">
            <Logo size="md" showText={true} />
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => i18n.changeLanguage(isUk ? 'en' : 'uk')}
              className="rounded-lg px-2 py-1 text-sm font-medium text-slate-600 dark:text-slate-300"
            >
              {isUk ? 'EN' : 'УКР'}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg p-2 text-slate-600 dark:text-slate-300"
              title={theme === 'dark' ? t('common.lightTheme') : t('common.darkTheme')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link
              to="/login?register=true"
              className="rounded-[10px] bg-[#6d5cf6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5d4af0]"
            >
              {t('notFound.ctaTryFree')}
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1240px] px-4 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:border-violet-500/40 dark:bg-violet-950/50 dark:text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            Lehko
          </p>
          <h1 className="font-display text-7xl font-extrabold tracking-tight sm:text-8xl">
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-500 bg-clip-text text-transparent dark:from-violet-400 dark:via-indigo-400 dark:to-violet-300">
              404
            </span>
          </h1>
          <h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">
            {t('notFound.title')}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400 sm:text-lg">
            {t('notFound.subtitle')}
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              to="/login?register=true"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:from-violet-700 hover:to-indigo-700"
            >
              {t('notFound.ctaTryFree')}
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-base font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <Home className="h-5 w-5" />
              {t('notFound.backHome')}
            </Link>
          </div>
        </div>

        <section className="mx-auto mt-14 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-8">
          <div className="mb-4 flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <BookOpen className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h3 className="text-lg font-bold">{t('notFound.bestArticles')}</h3>
          </div>
          {loadingPosts && <p className="text-sm text-slate-500">{t('common.loading')}</p>}
          {!loadingPosts && posts.length === 0 && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('notFound.noArticlesYet')}{' '}
              <Link to="/blog" className="font-semibold text-violet-600 hover:underline dark:text-violet-400">
                {t('notFound.allArticles')}
              </Link>
            </p>
          )}
          {!loadingPosts && posts.length > 0 && (
            <ul className="space-y-3">
              {posts.map((post) => (
                <li key={post.id}>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="group flex items-start justify-between gap-3 rounded-xl border border-transparent px-3 py-2 transition hover:border-violet-200 hover:bg-violet-50/80 dark:hover:border-violet-500/30 dark:hover:bg-violet-950/40"
                  >
                    <span className="font-medium text-violet-700 group-hover:underline dark:text-violet-300">
                      {post.title}
                    </span>
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-violet-600 dark:group-hover:text-violet-400" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {!loadingPosts && posts.length > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:underline dark:text-violet-400"
              >
                {t('notFound.allArticles')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <Link to="/" className="hover:text-slate-700 dark:hover:text-slate-300">
          {t('notFound.backHome')}
        </Link>
        {' · '}
        <Link to="/blog" className="hover:text-slate-700 dark:hover:text-slate-300">
          {t('common.blog')}
        </Link>
      </footer>
    </div>
  );
}
