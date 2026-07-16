import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { isImpersonating, getAdminUser, restoreAdminSession } from '../utils/auth.js';
import {
  LayoutDashboard,
  Users,
  LogOut,
  Settings,
  Code,
  Tags,
  Scissors,
  Sun,
  Moon,
  Globe,
  FileText,
  MessageCircle,
  BookOpen,
  ShieldAlert
} from 'lucide-react';
import Logo from './Logo.jsx';

export default function Layout({ children }) {
  const { t, i18n } = useTranslation();
  const { user, logout, login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isUk = i18n.language === 'uk';
  const impersonating = isImpersonating();
  const adminUser = impersonating ? getAdminUser() : null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleExitImpersonation = () => {
    const adminData = restoreAdminSession();
    if (adminData) {
      const token = localStorage.getItem('token');
      login(token, adminData);
    }
    navigate('/admin');
  };

  const canAccessAdmin = user?.role === 'super_admin';

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('layout.dashboard') },
    ...(canAccessAdmin ? [{ path: '/admin', icon: Users, label: t('layout.admin') }] : []),
    { path: '/setup', icon: Code, label: t('layout.setup') },
    { path: '/utm-builder', icon: Tags, label: t('layout.utmBuilder') },
    { path: '/link-shortener', icon: Scissors, label: t('layout.linkShortener') },
    { path: '/settings', icon: Settings, label: t('layout.settings') }
  ];

  const resourceItems = [
    { path: '/blog', icon: BookOpen, label: t('common.blog'), matchPrefix: true },
    { path: '/guide', icon: FileText, label: t('common.documentation'), matchPrefix: false }
  ];

  return (
    <div className="min-h-screen bg-[#f7fbfd] text-slate-900 lg:flex">
      <aside className="w-full lg:w-60 lg:fixed lg:h-screen left-0 top-0 flex flex-col bg-white border-b lg:border-b-0 lg:border-r border-slate-200">
        <div className="p-5 border-b border-slate-100 w-full">
          <Logo size="lg" variant="auto" linkTo="/" />
        </div>

        <div className="px-3 pt-4 pb-2">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">{t('layout.menu')}</p>
        </div>
        <nav className="px-3 pb-3 lg:block flex gap-2 overflow-x-auto lg:space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  active
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-3 pb-3">
          <div className="px-2 pt-2 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">{t('layout.resources')}</p>
          </div>
          {resourceItems.map((item) => {
            const Icon = item.icon;
            const active = item.matchPrefix
              ? location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
              : location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <a
            href="https://t.me/hodunkooo"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{t('home.navSupport')}</span>
          </a>
          <div className="mt-1 space-y-1">
            <button
              onClick={() => i18n.changeLanguage(isUk ? 'en' : 'uk')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              title={isUk ? 'English' : 'Ukrainian'}
            >
              <Globe className="w-4 h-4" />
              <span>{isUk ? 'EN' : 'UKR'}</span>
            </button>
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4" />
                  <span>{t('common.lightTheme')}</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  <span>{t('common.darkTheme')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-3 border-t border-slate-100">
          <div className="px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
            <p className="text-sm font-semibold text-slate-900 truncate">{user?.email}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {user?.role === 'super_admin' ? t('layout.superAdmin') : t('layout.user')}
            </p>
          </div>
          <div className="mt-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('common.logout')}</span>
            </button>
          </div>
          {typeof __BUILD_ID__ !== 'undefined' && (
            <p className="mt-3 px-2 text-[10px] text-slate-400">Build: {__BUILD_ID__}</p>
          )}
        </div>
      </aside>

      <main className="flex-1 lg:ml-60 min-h-screen">
        {impersonating && (
          <div className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-amber-500 px-4 py-2.5 text-white shadow-md">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                {isUk
                  ? `Ви переглядаєте кабінет: ${user?.email}`
                  : `Viewing account: ${user?.email}`}
              </span>
              {adminUser && (
                <span className="opacity-70 text-xs">
                  {isUk ? `(ви — ${adminUser.email})` : `(you are ${adminUser.email})`}
                </span>
              )}
            </div>
            <button
              onClick={handleExitImpersonation}
              className="shrink-0 flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1 text-sm font-semibold hover:bg-white/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              {isUk ? 'Вийти з режиму перегляду' : 'Exit view mode'}
            </button>
          </div>
        )}
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
