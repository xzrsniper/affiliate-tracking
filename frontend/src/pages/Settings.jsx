import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../config/api.js';
import { Settings as SettingsIcon, Lock, Check, X } from 'lucide-react';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuth();
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

  return (
    <Layout>
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">{t('settings.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t('settings.subtitle')}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('settings.accountInfo')}</h2>
              <p className="text-slate-500 dark:text-slate-400">{t('settings.accountDetails')}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('settings.email')}
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-xl border-0 text-slate-600 dark:text-slate-300 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('settings.role')}
              </label>
              <input
                type="text"
                value={user?.role === 'super_admin' ? t('layout.superAdmin') : t('layout.user')}
                disabled
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-xl border-0 text-slate-600 dark:text-slate-300 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('settings.linkLimit')}
              </label>
              <input
                type="text"
                value={user?.link_limit || 0}
                disabled
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-xl border-0 text-slate-600 dark:text-slate-300 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 mt-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
              <Lock className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {hasPassword ? t('settings.changePasswordTitle') : t('settings.setPasswordTitle')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                {hasPassword ? t('settings.changePasswordDesc') : t('settings.setPasswordDesc')}
              </p>
            </div>
          </div>

          {passwordError && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl flex items-center space-x-2">
              <X className="w-5 h-5" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl flex items-center space-x-2">
              <Check className="w-5 h-5" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordCheckEmail && (
            <div className="mb-6 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 px-4 py-3 rounded-xl space-y-1">
              <p className="font-medium">{t('settings.passwordCheckEmailTitle')}</p>
              <p className="text-sm">{t('settings.passwordCheckEmailText', { email: user?.email || '' })}</p>
              <p className="text-xs opacity-90">{t('settings.passwordCheckEmailSpam')}</p>
            </div>
          )}

          {/* Set password form — for Google-only accounts */}
          {!hasPassword && (
            <form onSubmit={handleSetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('settings.newPassword')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="new_password"
                  value={passwordForm.new_password}
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-xl border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white dark:focus:bg-slate-600 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder={t('settings.newPasswordPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('settings.confirmPassword')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  value={passwordForm.confirm_password}
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-xl border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white dark:focus:bg-slate-600 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder={t('settings.confirmPasswordPlaceholder')}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center space-x-2"
                >
                  {changingPassword ? <span>{t('settings.saving')}</span> : <><Lock className="w-5 h-5" /><span>{t('settings.setPasswordBtn')}</span></>}
                </button>
              </div>
            </form>
          )}

          {/* Change password form — for accounts with existing password */}
          {hasPassword && (
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('settings.currentPassword')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="current_password"
                  value={passwordForm.current_password}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-xl border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white dark:focus:bg-slate-600 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder={t('settings.currentPasswordPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('settings.newPassword')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="new_password"
                  value={passwordForm.new_password}
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-xl border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white dark:focus:bg-slate-600 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder={t('settings.newPasswordPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('settings.confirmPassword')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  value={passwordForm.confirm_password}
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-xl border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white dark:focus:bg-slate-600 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder={t('settings.confirmPasswordPlaceholder')}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center space-x-2"
                >
                  {changingPassword ? (
                    <span>{t('settings.saving')}</span>
                  ) : (
                    <><Lock className="w-5 h-5" /><span>{t('settings.changePassword')}</span></>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}
