import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { changeUserLanguage } from '../i18n.js';
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
  ShieldAlert,
  Menu,
  X
} from 'lucide-react';
import Logo from './Logo.jsx';

function NavLink({ item, active, onNavigate, compact = false }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onNavigate}
      className={`group flex items-center gap-3 rounded-lg transition-colors ${
        compact
          ? `flex-col gap-1 px-2 py-2 min-w-[4.5rem] ${active ? 'text-violet-700' : 'text-slate-500'}`
          : `px-3 py-2.5 ${active ? 'bg-violet-50 text-violet-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`
      }`}
    >
      <Icon className={compact ? 'w-5 h-5' : 'w-4 h-4'} />
      <span className={`font-medium ${compact ? 'text-[10px] leading-tight text-center' : 'text-sm'}`}>
        {item.label}
      </span>
    </Link>
  );
}

export default function Layout({ children }) {
  const { t, i18n } = useTranslation();
  const { user, logout, login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isUk = i18n.language === 'uk';
  const impersonating = isImpersonating();
  const adminUser = impersonating ? getAdminUser() : null;

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleLogout = () => {
    closeMobileMenu();
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

  const canAccessAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('layout.dashboard') },
    ...(canAccessAdmin ? [{ path: '/admin', icon: Users, label: t('layout.admin') }] : []),
    { path: '/setup', icon: Code, label: t('layout.setup') },
    { path: '/utm-builder', icon: Tags, label: t('layout.utmBuilder') },
    { path: '/link-shortener', icon: Scissors, label: t('layout.linkShortener') },
    { path: '/settings', icon: Settings, label: t('layout.settings') }
  ];

  const mobileBottomItems = navItems.filter((item) =>
    ['/dashboard', '/setup', '/settings'].includes(item.path)
  );

  const resourceItems = [
    { path: '/blog', icon: BookOpen, label: t('common.blog'), matchPrefix: true },
    { path: '/guide', icon: FileText, label: t('common.documentation'), matchPrefix: false }
  ];

  const sidebarContent = (onNavigate) => (
    <>
      <div className="p-5 border-b border-slate-100">
        <Logo size="lg" variant="auto" linkTo="/" />
      </div>

      <div className="px-3 pt-4 pb-2">
        <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">{t('layout.menu')}</p>
      </div>
      <nav className="px-3 pb-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            item={item}
            active={location.pathname === item.path}
            onNavigate={onNavigate}
          />
        ))}
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
              onClick={onNavigate}
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
            type="button"
            onClick={() => changeUserLanguage(isUk ? 'en' : 'uk')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title={isUk ? 'English' : 'Ukrainian'}
          >
            <Globe className="w-4 h-4" />
            <span>{isUk ? 'EN' : 'UKR'}</span>
          </button>
          <button
            type="button"
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
            {user?.role === 'super_admin'
              ? t('layout.superAdmin')
              : user?.role === 'admin'
                ? t('layout.administrator')
                : user?.role === 'affiliate'
                  ? t('layout.affiliate')
                  : t('layout.user')}
          </p>
        </div>
        <div className="mt-1">
          <button
            type="button"
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
    </>
  );

  return (
    <div className="min-h-screen bg-[#f7fbfd] text-slate-900 lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:fixed lg:h-screen left-0 top-0 flex-col bg-white border-r border-slate-200">
        {sidebarContent(undefined)}
      </aside>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t('common.close')}
            onClick={closeMobileMenu}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[min(100%,300px)] flex flex-col bg-white shadow-xl overflow-y-auto">
            <div className="flex items-center justify-end p-3 border-b border-slate-100">
              <button
                type="button"
                onClick={closeMobileMenu}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label={t('common.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent(closeMobileMenu)}
          </aside>
        </div>
      )}

      <div className="flex-1 lg:ml-60 min-h-screen flex flex-col">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
          <Logo size="md" variant="auto" linkTo="/dashboard" />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => changeUserLanguage(isUk ? 'en' : 'uk')}
              className="rounded-lg px-2.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {isUk ? 'EN' : 'UKR'}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
              aria-label={t('layout.menu')}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 min-h-0 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
          {impersonating && (
            <div className="sticky top-[57px] lg:top-0 z-40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-amber-500 px-4 py-2.5 text-white shadow-md">
              <div className="flex items-center gap-2 text-sm font-medium min-w-0">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {isUk
                    ? `Перегляд: ${user?.email}`
                    : `Viewing: ${user?.email}`}
                </span>
              </div>
              <button
                type="button"
                onClick={handleExitImpersonation}
                className="shrink-0 flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1 text-sm font-semibold hover:bg-white/30 transition-colors self-start sm:self-auto"
              >
                <LogOut className="w-3.5 h-3.5" />
                {isUk ? 'Вийти' : 'Exit'}
              </button>
            </div>
          )}
          <div className="p-3 sm:p-6 lg:p-8">{children}</div>
        </main>

        {/* Mobile bottom navigation */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-around">
            {mobileBottomItems.map((item) => (
              <NavLink
                key={item.path}
                item={item}
                active={location.pathname === item.path}
                onNavigate={closeMobileMenu}
                compact
              />
            ))}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center gap-1 px-2 py-2 min-w-[4.5rem] text-slate-500"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-tight text-center">{t('layout.menu')}</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
