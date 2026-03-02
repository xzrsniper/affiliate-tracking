import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/api.js';
import Logo from '../components/Logo.jsx';

export default function ConfirmPasswordChange() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('verifying'); // verifying | success | invalid | expired
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setErrorMessage(t('confirmPasswordChange.invalid'));
      return;
    }

    let cancelled = false;
    api.get('/api/auth/confirm-password-change', { params: { token } })
      .then(() => {
        if (cancelled) return;
        setStatus('success');
      })
      .catch((err) => {
        if (cancelled) return;
        const code = err.response?.data?.code;
        if (code === 'EXPIRED_TOKEN') {
          setStatus('expired');
          setErrorMessage(t('confirmPasswordChange.expired'));
        } else {
          setStatus('invalid');
          setErrorMessage(err.response?.data?.error || t('confirmPasswordChange.invalid'));
        }
      });

    return () => { cancelled = true; };
  }, [token, t]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <Logo size="xl" showText={true} linkTo="/" />
        </div>
        <h1 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
          {t('confirmPasswordChange.title')}
        </h1>

        {status === 'verifying' && (
          <p className="text-slate-600 dark:text-slate-400">{t('confirmPasswordChange.verifying')}</p>
        )}
        {status === 'success' && (
          <>
            <p className="text-green-600 dark:text-green-400 mb-6">{t('confirmPasswordChange.success')}</p>
            <Link
              to="/login"
              className="inline-block bg-violet-600 text-white font-medium py-2 px-4 rounded-xl hover:bg-violet-700"
            >
              {t('login.signIn')}
            </Link>
          </>
        )}
        {(status === 'invalid' || status === 'expired') && (
          <>
            <p className="text-red-600 dark:text-red-400 mb-6">{errorMessage}</p>
            <Link
              to="/settings"
              className="inline-block bg-violet-600 text-white font-medium py-2 px-4 rounded-xl hover:bg-violet-700"
            >
              {t('confirmPasswordChange.backToSettings')}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
