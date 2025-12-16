import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import {
  LayoutDashboard,
  Users,
  LogOut,
  Link as LinkIcon,
  Settings,
  Code,
  Sun,
  Moon,
  MessageCircle,
  Edit
} from 'lucide-react';
import Logo from './Logo.jsx';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Check if user can access admin panel (only owner/client)
  // Admin link is hidden from UI - access is controlled by backend
  // Backend will check ADMIN_EMAIL environment variable
  const canAccessAdmin = user?.role === 'super_admin';

  const navItems = [
    {
      path: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard'
    },
    // Admin link is only shown if user is super_admin
    // Backend will verify that only the owner (ADMIN_EMAIL) can actually access
    ...(canAccessAdmin
      ? [
          {
            path: '/admin',
            icon: Users,
            label: 'Admin'
          },
          {
            path: '/admin/page-builder',
            icon: Edit,
            label: 'Конструктор сторінки'
          }
        ]
      : []),
    {
      path: '/setup',
      icon: Code,
      label: 'Setup'
    },
    {
      path: '/settings',
      icon: Settings,
      label: 'Settings'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 fixed h-full left-0 top-0 flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <Logo size="md" showText={true} linkTo="/dashboard" />
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  active
                    ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-medium'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="px-4 py-2 mb-2">
            <p className="text-sm font-medium text-slate-800 dark:text-white">{user?.email}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user?.role === 'super_admin' ? 'Super Admin' : 'User'}
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all mb-2"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-5 h-5" />
                <span>Світла тема</span>
              </>
            ) : (
              <>
                <Moon className="w-5 h-5" />
                <span>Темна тема</span>
              </>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <div className="p-8 relative">
          {/* Contacts Button - Top Right (приховано на сторінках редагування) */}
          {!location.pathname.includes('/page-builder') && !location.pathname.includes('/home-editor') && (
            <a
              href={`https://t.me/${import.meta.env.VITE_TELEGRAM_USERNAME || 'your_username'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-8 right-8 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 z-10"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Контакти</span>
            </a>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}