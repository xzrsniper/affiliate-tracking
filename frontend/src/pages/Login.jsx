import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock } from 'lucide-react';
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
    if (import.meta.env.DEV) console.log('🔍 Fetching Google Client ID from /api/config/public...');
    api.get('/api/config/public')
      .then((res) => {
        if (cancelled) return;
        const id = (res.data?.googleClientId || '').trim();
        if (id) {
          setResolvedGoogleClientId(id);
          if (import.meta.env.DEV) console.log('✅ Google Client ID resolved');
        }
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.error('❌ Failed to fetch Google Client ID:', err);
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
      setError(err.response?.data?.error || t('login.googleSignInFailed'));
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
        setError(t('login.loadingSettings'));
        return;
      }
      setError(t('login.googleNotConfigured'));
      return;
    }

    if (!window.google || !window.google.accounts) {
      setError(t('login.googleLoading'));
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
            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || t('login.googleSignInFailed');
            setError(errorMessage);
            setGoogleLoading(false);
          }
        }
      });
      
      // Використовуємо requestAccessToken без popup
      client.requestAccessToken({ prompt: 'consent' });
      
    } catch (error) {
      console.error('Error with Google Sign-In:', error);
      setError(t('login.googleError'));
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

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [errorShake, setErrorShake] = useState(false);

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
      let errorMsg = '';
      const code = err.response?.data?.code;
      if (code === 'EMAIL_NOT_VERIFIED') {
        errorMsg = t('login.emailNotVerified');
        setEmailNotVerifiedEmail(formData.email);
      } else if (code === 'INVALID_CREDENTIALS') {
        errorMsg = t('login.invalidCredentials');
      } else if (code === 'USE_GOOGLE_LOGIN') {
        errorMsg = t('login.useGoogleLogin');
      } else if (code === 'ACCOUNT_BANNED') {
        errorMsg = t('login.accountBanned');
      } else if (err.response) {
        errorMsg = err.response?.data?.error || (isRegister ? t('login.registerFailed') : t('login.signInFailed'));
      } else if (err.request) {
        errorMsg = t('login.serverConnectionError');
      } else {
        errorMsg = err.message || (isRegister ? t('login.registerFailed') : t('login.signInFailed'));
      }
      setError(errorMsg);
      // Trigger shake animation
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess(false);
    setForgotLoading(true);

    try {
      await api.post('/api/auth/forgot-password', {
        email: forgotEmail,
        lang: i18n.language || undefined
      });
      setForgotSuccess(true);
    } catch (err) {
      setForgotError(err.response?.data?.error || t('login.forgotPasswordError'));
    } finally {
      setForgotLoading(false);
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
    <div className="min-h-screen bg-[#f3f4f6]">
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[46%_54%]">
        <aside className="hidden lg:flex flex-col justify-center bg-[linear-gradient(135deg,#0b2530_0%,#6d28d9_40%,#7c3aed_70%,#8b5cf6_100%)] px-14 py-16 text-white relative overflow-hidden">
          <div className="absolute -top-28 -right-20 h-[390px] w-[390px] rounded-full bg-white/10" />
          <div className="absolute -bottom-24 -left-16 h-[320px] w-[320px] rounded-full bg-white/10" />
          <div className="relative z-10">
            <div className="mb-12">
              <Logo size="lg" showText={true} linkTo={null} className="text-white [&>span]:text-white" />
            </div>
            <h1 className="text-[50px] font-extrabold leading-[1.08] tracking-[-0.03em] mb-4">
              {t('login.marketingHeadlineLine1')}<br />{t('login.marketingHeadlineLine2')}
            </h1>
            <p className="text-white/75 text-[15px] leading-relaxed mb-10 max-w-md">
              {t('login.marketingSubline')}
            </p>
            <ul className="space-y-3 text-white/90 text-sm">
              <li className="flex items-center gap-3"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[11px]">✓</span>{t('login.marketingBullet1')}</li>
              <li className="flex items-center gap-3"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[11px]">✓</span>{t('login.marketingBullet2')}</li>
              <li className="flex items-center gap-3"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[11px]">✓</span>{t('login.marketingBullet3')}</li>
              <li className="flex items-center gap-3"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[11px]">✓</span>{t('login.marketingBullet4')}</li>
              <li className="flex items-center gap-3"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[11px]">✓</span>{t('login.marketingBullet5')}</li>
            </ul>

            <div className="mt-12 grid grid-cols-3 gap-5 max-w-md">
              <div className="rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-center backdrop-blur">
                <p className="text-2xl font-extrabold leading-none">2.4M</p>
                <p className="mt-1 text-xs text-white/75">{t('login.metricClicksTracked')}</p>
              </div>
              <div className="rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-center backdrop-blur">
                <p className="text-2xl font-extrabold leading-none">18K</p>
                <p className="mt-1 text-xs text-white/75">{t('login.metricConversions')}</p>
              </div>
              <div className="rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-center backdrop-blur">
                <p className="text-2xl font-extrabold leading-none">99.9%</p>
                <p className="mt-1 text-xs text-white/75">{t('login.metricUptime')}</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex items-center justify-center bg-[#f7fbfd] p-8 sm:p-10">
          <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="text-center mb-8 lg:hidden">
          <div className="flex justify-center mb-4">
            <Logo size="xl" showText={true} linkTo={null} />
          </div>
          <p className="text-slate-500">
            {isRegister ? t('login.createYourAccount') : t('login.signInToContinue')}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-[20px] border border-slate-300 p-10 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          {!showCheckEmail && !showForgotPassword && (
            <div className="mb-6">
              <h2 className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">{t('login.welcomeBack')}</h2>
              <p className="text-slate-500 mt-1 text-sm">{t('login.signInTrackFlow')}</p>
              <div className="mt-5 rounded-[10px] bg-slate-100 p-[3px] grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => { setIsRegister(false); setError(''); setEmailNotVerifiedEmail(''); }}
                  className={`rounded-lg py-2 text-sm font-medium transition ${!isRegister ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {t('login.signIn')}
                </button>
                <button
                  type="button"
                  onClick={() => { setIsRegister(true); setError(''); setEmailNotVerifiedEmail(''); }}
                  className={`rounded-lg py-2 text-sm font-medium transition ${isRegister ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {t('login.createAccount')}
                </button>
              </div>
            </div>
          )}

          {showCheckEmail ? (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-800">
                {t('login.checkEmailTitle')}
              </h2>
              <p className="text-slate-600 text-sm">
                {t('login.checkEmailText', { email: registeredEmail })}
              </p>
              <p className="text-slate-500 text-xs">
                {t('login.checkEmailSpam')}
              </p>
              {resendSuccess && (
                <p className="text-green-600 text-sm">{t('login.resendSuccess')}</p>
              )}
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="w-full bg-violet-100 text-violet-700 font-medium py-2 px-4 rounded-xl hover:bg-violet-200 disabled:opacity-50"
                >
                  {resendLoading ? t('login.pleaseWait') : t('login.resendVerification')}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCheckEmail(false); setError(''); setResendSuccess(false); }}
                  className="w-full text-slate-600 hover:text-slate-800 text-sm font-medium"
                >
                  {t('login.backToLogin')}
                </button>
              </div>
            </div>
          ) : showForgotPassword ? (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-800">
                {t('login.forgotPasswordTitle')}
              </h2>
              <p className="text-slate-600 text-sm">
                {t('login.forgotPasswordDesc')}
              </p>
              {forgotSuccess ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                    {t('login.forgotPasswordSuccess')}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(false); setForgotSuccess(false); setForgotEmail(''); setForgotError(''); }}
                    className="w-full text-slate-600 hover:text-slate-800 text-sm font-medium"
                  >
                    {t('login.backToLogin')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  {forgotError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                      {forgotError}
                    </div>
                  )}
                  <div>
                    <label htmlFor="forgotEmail" className="block text-sm font-medium text-slate-700 mb-2">
                      {t('login.emailAddress')}
                    </label>
                    <input
                      id="forgotEmail"
                      type="email"
                      required
                      className="w-full px-3 py-2.5 bg-white rounded-[10px] border border-slate-300 focus:ring-2 focus:ring-violet-500 transition-all text-slate-900 placeholder-slate-400"
                      placeholder={t('login.emailExample')}
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25"
                  >
                    {forgotLoading ? t('login.pleaseWait') : t('login.forgotPasswordSend')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(false); setForgotError(''); setForgotEmail(''); }}
                    className="w-full text-slate-600 hover:text-slate-800 text-sm font-medium"
                  >
                    {t('login.backToLogin')}
                  </button>
                </form>
              )}
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className={`space-y-2 ${errorShake ? 'animate-shake' : ''}`}>
                <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-4 rounded-xl text-sm flex items-start gap-3">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div>
                    <p className="font-semibold">{t('login.errorTitle')}</p>
                    <p className="mt-1">{error}</p>
                  </div>
                </div>
                {emailNotVerifiedEmail && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="text-sm text-violet-600 hover:underline"
                  >
                    {resendLoading ? t('login.pleaseWait') : t('login.resendVerification')}
                  </button>
                )}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                {t('login.emailAddress')}
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-white rounded-[10px] border border-slate-300 focus:ring-2 focus:ring-violet-500 transition-all text-slate-900 placeholder-slate-400"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  {t('login.password')}
                </label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(true); setForgotEmail(formData.email); setError(''); }}
                    className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                  >
                    {t('login.forgotPassword')}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-white rounded-[10px] border border-slate-300 focus:ring-2 focus:ring-violet-500 transition-all text-slate-900 placeholder-slate-400"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                  {t('login.confirmPasswordLabel')}
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required={isRegister}
                  className="w-full px-3 py-2.5 bg-white rounded-[10px] border border-slate-300 focus:ring-2 focus:ring-violet-500 transition-all text-slate-900 placeholder-slate-400"
                  placeholder="••••••••"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold py-2.5 px-4 rounded-[10px] hover:from-violet-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_6px_18px_rgba(109,40,217,0.22)]"
            >
              {loading
                ? t('login.pleaseWait')
                : isRegister
                ? t('login.createAccount')
                : t('login.signIn')}
            </button>
          </form>
          )}

          {/* Divider - hide when showing check email or forgot password */}
          {!showCheckEmail && !showForgotPassword && (
          <>
          <div className="mt-6 mb-6 flex items-center">
            <div className="flex-1 border-t border-slate-200"></div>
            <span className="px-4 text-sm text-slate-500">{t('login.or')}</span>
            <div className="flex-1 border-t border-slate-200"></div>
          </div>

          {/* Google Sign In Button - показується якщо налаштовано або під час завантаження */}
          {(resolvedGoogleClientId || !publicConfigFetched) && (
            <button
              onClick={handleGoogleButtonClick}
              disabled={googleLoading || !resolvedGoogleClientId}
              className="w-full flex items-center justify-center space-x-3 bg-white border border-slate-300 text-slate-700 font-semibold py-2.5 px-4 rounded-[10px] hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            <span className="text-sm text-slate-500">
              {isRegister ? t('login.hasAccount') : t('login.noAccount')}{' '}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
                setEmailNotVerifiedEmail('');
              }}
              className="text-sm text-violet-600 hover:text-violet-700 font-medium"
            >
              {isRegister ? t('login.signIn') : t('login.signUp')}
            </button>
          </div>
          </>
          )}
        </div>
        </div>
        </section>
      </div>
    </div>
  );
}
