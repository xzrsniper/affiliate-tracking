import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext.jsx';
import { Moon, Sun } from 'lucide-react';
import Logo from './Logo.jsx';

export default function LegalPageShell({ title, updatedAt, children }) {
  const { i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isUk = i18n.language === 'uk';

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <nav className="sticky top-0 z-50 border-b border-[#d6deea] bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex h-[68px] w-full max-w-[1240px] items-center justify-between px-4 sm:px-8">
          <Link to="/"><Logo size="md" showText={true} /></Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => i18n.changeLanguage(isUk ? 'en' : 'uk')}
              className="rounded-lg px-2 py-1 text-sm font-medium text-slate-600 dark:text-slate-300"
            >
              {isUk ? 'EN' : 'УКР'}
            </button>
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-slate-600 dark:text-slate-300"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/" className="rounded-[10px] bg-[#6d5cf6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5d4af0]">
              На головну
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[980px] px-4 py-8 sm:px-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{updatedAt}</p>
        <article className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 leading-7 dark:border-slate-700 dark:bg-slate-900">
          {children}
        </article>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 mt-12 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <Link to="/terms" className="hover:text-slate-700 dark:hover:text-slate-300">Угода користувача</Link>
        <span className="mx-2">·</span>
        <Link to="/privacy" className="hover:text-slate-700 dark:hover:text-slate-300">Privacy Policy</Link>
        <span className="mx-2">·</span>
        <Link to="/refund" className="hover:text-slate-700 dark:hover:text-slate-300">Refund Policy</Link>
      </footer>
    </div>
  );
}
