import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from '../components/Logo.jsx';

const ENV_GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  // Спершу з env; якщо порожній — підтягуємо з /api/config/public (щоб продакшн працював без VITE_* при білді)
  const [resolvedGoogleClientId, setResolvedGoogleClientId] = useState(() => {
    const id = (ENV_GOOGLE_CLIENT_ID || '').trim();
    return id && id !== 'YOUR_GOOGLE_CLIENT_ID' ? id : '';
  });
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(searchParams.get('register') === 'true');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const [publicConfigFetched, setPublicConfigFetched] = useState(false);
  const [showCheckEmail, setShowCheckEmail] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [emailNotVerifiedEmail, setEmailNotVerifiedEmail] = useState('');

  // Використовуємо ref для зберігання актуальних значень
  const loginRef = useRef(login);
  const navigateRef = useRef(navigate);
  
  // Оновлюємо ref при зміні
  useEffect(() => {
    loginRef.current = login;
    navigateRef.current = navigate;
  }, [login, navigate]);

  // Якщо в білді немає VITE_GOOGLE_CLIENT_ID — беремо з бекенду (GOOGLE_CLIENT_ID_PUBLIC на сервері)
  useEffect(() => {
    if (publicConfigFetched || resolvedGoogleClientId) return;
    let cancelled = false;
    console.log('🔍 Fetching Google Client ID from /api/config/public...');
    api.get('/api/config/public')
      .then((res) => {
        if (cancelled) return;
        const id = (res.data?.googleClientId || '').trim();
        console.log('📥 Received from /api/config/public:', { googleClientId: id ? id.substring(0, 20) + '...' : '(empty)' });
        if (id) {
          setResolvedGoogleClientId(id);
          if (import.meta.env.DEV) console.log('✅ Google Client ID resolved from /api/config/public');
        }
      })
      .catch((err) => {
        console.error('❌ Failed to fetch Google Client ID from /api/config/public:', err);
      })
      .finally(() => {
        if (!cancelled) setPublicConfigFetched(true);
      });
    return () => { cancelled = true; };
  }, [publicConfigFetched, resolvedGoogleClientId]);

  // ВИЗНАЧАЄМО handleGoogleSignIn ПЕРШИМ, щоб він був доступний в useEffect
  const handleGoogleSignIn = useCallback(async (response) => {
    setGoogleLoading(true);
    setError('');

    try {
      const result = await api.post('/api/auth/google', {
        idToken: response.credential
      });

      const { token, user } = result.data;
      
      // Використовуємо актуальні значення з ref
      if (loginRef.current && navigateRef.current) {
        loginRef.current(token, user);

        // Admin panel is only accessible via email login, not Google OAuth
        // Redirect all Google OAuth users to dashboard, even if they are super_admin
        navigateRef.current('/dashboard');
      } else {
        throw new Error('Login or navigate function not available');
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.response?.data?.error || 'Google sign in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }, []); // Порожній масив залежностей, використовуємо ref

  // Initialize Google Sign-In when script is loaded
  useEffect(() => {
    try {
      if (resolvedGoogleClientId) {
        // Просто перевіряємо, чи скрипт завантажений
        const checkGoogleLoaded = () => {
          if (window.google && window.google.accounts) {
            setGoogleScriptLoaded(true);
            console.log('✅ Google Sign-In script loaded');
            return true;
          }
          return false;
        };

        // Check if already loaded
        if (checkGoogleLoaded()) {
          return;
        }

        // Wait for script to load (it's in index.html)
        const checkInterval = setInterval(() => {
          if (checkGoogleLoaded()) {
            clearInterval(checkInterval);
          }
        }, 100);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!googleScriptLoaded) {
            console.warn('⚠️ Google Sign-In script took too long to load');
          }
        }, 10000);

        return () => {
          clearInterval(checkInterval);
        };
      }
    } catch (error) {
      console.error('Error in Google Sign-In useEffect:', error);
    }
  }, [resolvedGoogleClientId, googleScriptLoaded]);

  const handleGoogleButtonClick = () => {
    if (!resolvedGoogleClientId) {
      if (!publicConfigFetched) {
        setError('Завантаження налаштувань Google... Зачекайте кілька секунд.');
        return;
      }
      setError('Google OAuth не налаштовано. Додайте GOOGLE_CLIENT_ID_PUBLIC у .env на сервері або VITE_GOOGLE_CLIENT_ID при збірці.');
      return;
    }

    if (!window.google || !window.google.accounts) {
      setError('Google Sign-In завантажується... Будь ласка, зачекайте кілька секунд і спробуйте знову.');
      return;
    }

    try {
      setGoogleLoading(true);
      
      // Використовуємо OAuth2 redirect flow замість popup
      // Це працює навіть якщо popup заблокований
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: resolvedGoogleClientId,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          try {
            if (tokenResponse.error) {
              throw new Error(tokenResponse.error);
            }
            
            // Отримуємо інформацію про користувача
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: {
                Authorization: `Bearer ${tokenResponse.access_token}`
              }
            });
            
            if (!userInfoResponse.ok) {
              throw new Error('Failed to get user info from Google');
            }
            
            const userInfo = await userInfoResponse.json();
            
            console.log('📥 Raw userInfo from Google:', userInfo);
            console.log('📥 userInfo keys:', Object.keys(userInfo || {}));
            console.log('📥 userInfo.id:', userInfo?.id);
            console.log('📥 userInfo.email:', userInfo?.email);
            
            // Перевіряємо, чи отримано всі необхідні дані
            if (!userInfo || (!userInfo.id && !userInfo.sub) || !userInfo.email) {
              console.error('❌ Invalid userInfo from Google:', userInfo);
              throw new Error('Invalid userInfo from Google: missing id/sub or email');
            }
            
            // Створюємо payload з обов'язковими полями
            const userId = userInfo.id || userInfo.sub;
            const payload = {
              accessToken: tokenResponse.access_token,
              userInfo: {
                id: String(userId), // Переконуємося, що це рядок
                email: String(userInfo.email),
                name: userInfo.name || null,
                picture: userInfo.picture || null
              },
              googleId: String(userId)
            };
            
            console.log('📤 Full payload object:', payload);
            console.log('📤 Payload JSON string:', JSON.stringify(payload, null, 2));
            console.log('📤 userInfo.id type:', typeof payload.userInfo.id);
            console.log('📤 userInfo.id value:', payload.userInfo.id);
            console.log('📤 userInfo.email:', payload.userInfo.email);

            // Відправляємо на backend
            console.log('📡 Sending POST request to /api/auth/google...');
            const result = await api.post('/api/auth/google', payload, {
              headers: {
                'Content-Type': 'application/json'
              }
            });
            console.log('✅ Backend response:', result.data);

                const { token, user } = result.data;
                
                if (loginRef.current && navigateRef.current) {
                  loginRef.current(token, user);

                  // Admin panel is only accessible via email login, not Google OAuth
                  // Redirect all Google OAuth users to dashboard, even if they are super_admin
                  navigateRef.current('/dashboard');
                }
          } catch (err) {
            console.error('Google login error:', err);
            console.error('Error response:', err.response);
            console.error('Error response data:', err.response?.data);
            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Google sign in failed. Please try again.';
            setError(errorMessage);
            setGoogleLoading(false);
          }
        }
      });
      
      // Використовуємо requestAccessToken без popup
      client.requestAccessToken({ prompt: 'consent' });
      
    } catch (error) {
      console.error('Error with Google Sign-In:', error);
      setError('Помилка ініціалізації Google Sign-In. Спробуйте оновити сторінку.');
      setGoogleLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailNotVerifiedEmail('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const response = await api.post(endpoint, {
        ...formData,
        lang: i18n.language || undefined
      });

      if (isRegister && response.data?.needVerification) {
        setRegisteredEmail(response.data.email || formData.email);
        setShowCheckEmail(true);
        setLoading(false);
        return;
      }

      const { token, user } = response.data;
      login(token, user);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        setError(t('login.emailNotVerified'));
        setEmailNotVerifiedEmail(formData.email);
      } else if (err.response) {
        setError(err.response?.data?.error || (isRegister ? t('login.register') : t('login.signIn')) + ' failed.');
      } else if (err.request) {
        setError('Cannot connect to server. Please make sure the backend is running on http://localhost:3000');
      } else {
        setError(err.message || (isRegister ? 'Registration' : 'Login') + ' failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const email = registeredEmail || formData.email || emailNotVerifiedEmail;
    if (!email) return;
    setResendLoading(true);
    setResendSuccess(false);
    setError('');
    try {
      await api.post('/api/auth/resend-verification', {
        email,
        lang: i18n.language || undefined
      });
      setResendSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || t('login.resendError'));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="xl" showText={true} linkTo={null} />
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            {isRegister ? t('login.createYourAccount') : t('login.signInToContinue')}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          {showCheckEmail ? (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                {t('login.checkEmailTitle')}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {t('login.checkEmailText', { email: registeredEmail })}
              </p>
              <p className="text-slate-500 dark:text-slate-500 text-xs">
                {t('login.checkEmailSpam')}
              </p>
              {resendSuccess && (
                <p className="text-green-600 dark:text-green-400 text-sm">{t('login.resendSuccess')}</p>
              )}
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="w-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium py-2 px-4 rounded-xl hover:bg-violet-200 dark:hover:bg-violet-900/50 disabled:opacity-50"
                >
                  {resendLoading ? t('login.pleaseWait') : t('login.resendVerification')}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCheckEmail(false); setError(''); setResendSuccess(false); }}
                  className="w-full text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-sm font-medium"
                >
                  {t('login.backToLogin')}
                </button>
              </div>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="space-y-2">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
                {emailNotVerifiedEmail && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    {resendLoading ? t('login.pleaseWait') : t('login.resendVerification')}
                  </button>
                )}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('login.emailAddress')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-xl border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white dark:focus:bg-slate-600 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('login.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-xl border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white dark:focus:bg-slate-600 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {isRegister && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('login.confirmPasswordLabel')}
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required={isRegister}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-xl border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white dark:focus:bg-slate-600 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="••••••••"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25"
            >
              {loading
                ? t('login.pleaseWait')
                : isRegister
                ? t('login.createAccount')
                : t('login.signIn')}
            </button>
          </form>
          )}

          {/* Divider - hide when showing check email */}
          {!showCheckEmail && (
          <>
          <div className="mt-6 mb-6 flex items-center">
            <div className="flex-1 border-t border-slate-200 dark:border-slate-700"></div>
            <span className="px-4 text-sm text-slate-500 dark:text-slate-400">{t('login.or')}</span>
            <div className="flex-1 border-t border-slate-200 dark:border-slate-700"></div>
          </div>

          {/* Google Sign In Button - показується якщо налаштовано або під час завантаження */}
          {(resolvedGoogleClientId || !publicConfigFetched) && (
            <button
              onClick={handleGoogleButtonClick}
              disabled={googleLoading || !resolvedGoogleClientId}
              className="w-full flex items-center justify-center space-x-3 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-3 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>
                {googleLoading 
                  ? t('login.signingIn') 
                  : !resolvedGoogleClientId && !publicConfigFetched
                  ? t('common.loading')
                  : !resolvedGoogleClientId
                  ? t('login.googleNotConfigured')
                  : t('login.continueWithGoogle')}
              </span>
            </button>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
                setEmailNotVerifiedEmail('');
              }}
              className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium"
            >
              {isRegister
                ? t('login.hasAccount') + ' ' + t('login.signIn')
                : t('login.noAccount') + ' ' + t('login.signUp')}
            </button>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}