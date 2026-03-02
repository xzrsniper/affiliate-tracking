import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from '../components/Logo.jsx';

export default function VerifyEmail() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('verifying'); // verifying | success | invalid | expired
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setErrorMessage(t('login.verifyEmailInvalid'));
      return;
    }

    let cancelled = false;
    api.get('/api/auth/verify-email', { params: { token } })
      .then((res) => {
        if (cancelled) return;
        const { token: jwt, user } = res.data;
        login(jwt, user);
        setStatus('success');
        setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
      })
      .catch((err) => {
        if (cancelled) return;
        const code = err.response?.data?.code;
        const msg = err.response?.data?.error || t('login.verifyEmailInvalid');
        if (code === 'EXPIRED_TOKEN') {
          setStatus('expired');
          setErrorMessage(t('login.verifyEmailExpired'));
        } else {
          setStatus('invalid');
          setErrorMessage(msg);
        }
      });

    return () => { cancelled = true; };
  }, [token, login, navigate, t]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <Logo size="xl" showText={true} linkTo="/" />
        </div>
        <h1 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
          {t('login.verifyEmailTitle')}
        </h1>

        {status === 'verifying' && (
          <p className="text-slate-600 dark:text-slate-400">{t('login.verifyEmailVerifying')}</p>
        )}
        {status === 'success' && (
          <p className="text-green-600 dark:text-green-400">{t('login.verifyEmailSuccess')}</p>
        )}
        {(status === 'invalid' || status === 'expired') && (
          <>
            <p className="text-red-600 dark:text-red-400 mb-6">{errorMessage}</p>
            <Link
              to="/login"
              className="inline-block bg-violet-600 text-white font-medium py-2 px-4 rounded-xl hover:bg-violet-700"
            >
              {t('login.backToLogin')}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
