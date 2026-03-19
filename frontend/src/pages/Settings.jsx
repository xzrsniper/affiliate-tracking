import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../config/api.js';
import { Settings as SettingsIcon, Lock, Check, X } from 'lucide-react';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [hasPassword, setHasPassword] = useState(user?.has_password ?? true);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordCheckEmail, setPasswordCheckEmail] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Fetch fresh user info on mount to get accurate has_password
  useEffect(() => {
    api.get('/api/auth/me').then(res => {
      if (res.data?.user) {
        setHasPassword(!!res.data.user.has_password);
        updateUser({ ...user, ...res.data.user });
      }
    }).catch(() => {});
  }, []);

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    });
    setPasswordError('');
    setPasswordSuccess('');
  };

  // Set initial password (Google-only accounts)
  const handleSetPassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError(t('settings.passwordsMismatch'));
      return;
    }
    if (passwordForm.new_password.length < 6) {
      setPasswordError(t('settings.passwordMinLength'));
      return;
    }

    setChangingPassword(true);
    try {
      await api.put('/api/auth/set-password', {
        new_password: passwordForm.new_password
      });
      setPasswordSuccess(t('settings.setPasswordSuccess'));
      setHasPassword(true);
      updateUser({ ...user, has_password: true });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setPasswordError(err.response?.data?.error || t('settings.setPasswordError'));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordCheckEmail(false);

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError(t('settings.passwordsMismatch'));
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setPasswordError(t('settings.passwordMinLength'));
      return;
    }

    setChangingPassword(true);

    try {
      const res = await api.put('/api/auth/change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        lang: i18n.language || undefined
      });

      if (res.data?.needConfirmation) {
        setPasswordCheckEmail(true);
        setPasswordForm({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      } else {
        setPasswordSuccess(t('settings.passwordSuccess'));
        setPasswordForm({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      }
    } catch (err) {
      setPasswordError(err.response?.data?.error || t('settings.passwordError'));
    } finally {
      setChangingPassword(false);
    }
  };

  const tabs = [
    { key: 'account', label: t('settings.tabAccount') },
    { key: 'security', label: t('settings.tabSecurity') },
    { key: 'notifications', label: t('settings.tabNotifications') },
    { key: 'billing', label: t('settings.tabBilling') }
  ];

  const renderComingSoon = () => (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-700 dark:bg-slate-900/80">
      <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-4 rounded-full bg-violet-100 px-4 py-1.5 text-sm font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
          {t('settings.comingSoonBadge')}
        </div>
        <h2 className="mb-2 font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
          {tabs.find((tab) => tab.key === activeTab)?.label}
        </h2>
        <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
          {t('settings.comingSoonText')}
        </p>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="max-w-4xl">
        <div className="mb-6 rounded-xl border border-slate-200 bg-white/80 dark:bg-slate-900/70 px-5 py-4 backdrop-blur">
          <h1 className="font-display text-3xl font-bold text-slate-900 mb-2">{t('settings.title')}</h1>
          <p className="text-slate-600">{t('settings.subtitle')}</p>
        </div>

        <div className="mb-6 border-b-2 border-slate-200">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`border-b-2 px-4 py-2.5 text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-violet-600 font-semibold text-violet-700 dark:text-violet-300'
                    : 'border-transparent font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 p-5 dark:border-violet-900/60 dark:from-slate-900 dark:to-indigo-950/80">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">Pro Plan</p>
              <p className="text-sm text-violet-700 dark:text-violet-300">Active · Renews next month</p>
            </div>
            <div className="w-full sm:w-64">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-semibold text-slate-700 dark:text-slate-200">{user?.link_limit || 0} link limit</span>
                <span className="text-slate-500 dark:text-slate-400">Used: {Math.min(10, user?.link_limit || 0)}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-violet-200 dark:bg-slate-700/80">
                <div className="h-full w-1/5 bg-violet-600 dark:bg-violet-400" />
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'account' ? (
          <>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/80">
              <div className="flex items-center space-x-4 border-b border-slate-100 px-6 py-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
                  <SettingsIcon className="h-6 w-6 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('settings.accountInfo')}</h2>
                  <p className="text-slate-500 dark:text-slate-400">{t('settings.accountDetails')}</p>
                </div>
              </div>

              <div className="space-y-6 p-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {t('settings.email')}
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {t('settings.role')}
                  </label>
                  <input
                    type="text"
                    value={user?.role === 'super_admin' ? t('layout.superAdmin') : t('layout.user')}
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {t('settings.linkLimit')}
                  </label>
                  <input
                    type="text"
                    value={user?.link_limit || 0}
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600"
                  />
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-3 text-sm font-semibold text-slate-700">Юридичні документи</p>
                  <div className="flex flex-wrap gap-2">
                    <a href="/terms" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">Terms</a>
                    <a href="/privacy" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">Privacy</a>
                    <a href="/refund" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">Refund</a>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/80">
              <div className="flex items-center space-x-4 border-b border-slate-100 px-6 py-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
                  <Lock className="h-6 w-6 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {hasPassword ? t('settings.changePasswordTitle') : t('settings.setPasswordTitle')}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400">
                    {hasPassword ? t('settings.changePasswordDesc') : t('settings.setPasswordDesc')}
                  </p>
                </div>
              </div>

              <div className="p-6">
                {passwordError && (
                  <div className="mb-6 flex items-center space-x-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                    <X className="h-5 w-5" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="mb-6 flex items-center space-x-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
                    <Check className="h-5 w-5" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {passwordCheckEmail && (
                  <div className="mb-6 space-y-1 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-violet-700">
                    <p className="font-medium">{t('settings.passwordCheckEmailTitle')}</p>
                    <p className="text-sm">{t('settings.passwordCheckEmailText', { email: user?.email || '' })}</p>
                    <p className="text-xs opacity-90">{t('settings.passwordCheckEmailSpam')}</p>
                  </div>
                )}

                {!hasPassword && (
                  <form onSubmit={handleSetPassword} className="space-y-6">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        {t('settings.newPassword')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="new_password"
                        value={passwordForm.new_password}
                        onChange={handlePasswordChange}
                        required
                        minLength={6}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
                        placeholder={t('settings.newPasswordPlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        {t('settings.confirmPassword')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="confirm_password"
                        value={passwordForm.confirm_password}
                        onChange={handlePasswordChange}
                        required
                        minLength={6}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
                        placeholder={t('settings.confirmPasswordPlaceholder')}
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={changingPassword}
                        className="flex items-center space-x-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition-all hover:bg-violet-700 disabled:opacity-50"
                      >
                        {changingPassword ? <span>{t('settings.saving')}</span> : <><Lock className="h-5 w-5" /><span>{t('settings.setPasswordBtn')}</span></>}
                      </button>
                    </div>
                  </form>
                )}

                {hasPassword && (
                  <form onSubmit={handleChangePassword} className="space-y-6">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        {t('settings.currentPassword')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="current_password"
                        value={passwordForm.current_password}
                        onChange={handlePasswordChange}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
                        placeholder={t('settings.currentPasswordPlaceholder')}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        {t('settings.newPassword')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="new_password"
                        value={passwordForm.new_password}
                        onChange={handlePasswordChange}
                        required
                        minLength={6}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
                        placeholder={t('settings.newPasswordPlaceholder')}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        {t('settings.confirmPassword')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="confirm_password"
                        value={passwordForm.confirm_password}
                        onChange={handlePasswordChange}
                        required
                        minLength={6}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
                        placeholder={t('settings.confirmPasswordPlaceholder')}
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={changingPassword}
                        className="flex items-center space-x-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition-all hover:bg-violet-700 disabled:opacity-50"
                      >
                        {changingPassword ? (
                          <span>{t('settings.saving')}</span>
                        ) : (
                          <><Lock className="h-5 w-5" /><span>{t('settings.changePassword')}</span></>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </>
        ) : (
          renderComingSoon()
        )}
      </div>
    </Layout>
  );
}

