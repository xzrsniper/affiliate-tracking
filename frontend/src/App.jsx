import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SiteTextEditProvider } from './context/SiteTextEditContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import SiteTextEditOverlay from './components/SiteTextEditOverlay.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
const Home = lazy(() => import('./pages/Home.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const Success = lazy(() => import('./pages/Success.jsx'));
const Setup = lazy(() => import('./pages/Setup.jsx'));
const Guide = lazy(() => import('./pages/Guide.jsx'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail.jsx'));
const ConfirmPasswordChange = lazy(() => import('./pages/ConfirmPasswordChange.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const HomeNew = lazy(() => import('./pages/HomeNew.jsx'));
const ConsoleCode = lazy(() => import('./pages/ConsoleCode.jsx'));
const Blog = lazy(() => import('./pages/Blog.jsx'));
const BlogPost = lazy(() => import('./pages/BlogPost.jsx'));
const Terms = lazy(() => import('./pages/Terms.jsx'));
const Privacy = lazy(() => import('./pages/Privacy.jsx'));
const Refund = lazy(() => import('./pages/Refund.jsx'));
const TrackingOutboundRedirect = lazy(() => import('./pages/TrackingOutboundRedirect.jsx'));

// Component to redirect pixel.js to API endpoint
function PixelJsRedirect() {
  const location = useLocation();
  const queryString = location.search || '';
  
  useEffect(() => {
    window.location.replace(`/api/track/pixel.js${queryString}`);
  }, [queryString]);
  
  return null;
}

function AppRoutes() {
  const { t } = useTranslation();
  let user = null;
  let loading = true;
  let authenticated = false;

  try {
    const auth = useAuth();
    user = auth?.user || null;
    loading = auth?.loading !== undefined ? auth.loading : false;
    authenticated = !!user;
  } catch (error) {
    console.error('❌ Error in AppRoutes:', error);
    loading = false;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-slate-500">{t('common.loading')}</div>
        </div>
      }
    >
      <main id="main-content">
        <Routes>
          {/* Route for pixel.js - redirects to API endpoint */}
          <Route
            path="/pixel.js"
            element={<PixelJsRedirect />}
          />
          {/* Short tracking URLs: Nginx often serves SPA here; bounce to /api/links/go for real 302 */}
          <Route path="/r/:code" element={<TrackingOutboundRedirect />} />
          <Route path="/track/:code" element={<TrackingOutboundRedirect />} />
          <Route
            path="/"
            element={<Home />}
          />
          <Route
            path="/guide"
            element={<Guide />}
          />
          <Route
            path="/blog"
            element={<Blog />}
          />
          <Route
            path="/blog/:slug"
            element={<BlogPost />}
          />
          <Route
            path="/terms"
            element={<Terms />}
          />
          <Route
            path="/privacy"
            element={<Privacy />}
          />
          <Route
            path="/refund"
            element={<Refund />}
          />
          <Route
            path="/home-new"
            element={<HomeNew />}
          />
          <Route
            path="/login"
            element={authenticated ? <Navigate to="/dashboard" replace /> : <Login />}
          />
          <Route
            path="/verify-email"
            element={authenticated ? <Navigate to="/dashboard" replace /> : <VerifyEmail />}
          />
          <Route
            path="/confirm-password-change"
            element={<ConfirmPasswordChange />}
          />
          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/setup"
            element={
              <ProtectedRoute>
                <Setup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/console-code"
            element={
              <ProtectedRoute>
                <ConsoleCode />
              </ProtectedRoute>
            }
          />
          <Route
            path="/success"
            element={<Success />}
          />
        </Routes>
      </main>
    </Suspense>
  );
}

function App() {
  console.log('🔧 App component rendering...');
  
  try {
    return (
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <SiteTextEditProvider>
              <AppRoutes />
              <SiteTextEditOverlay />
            </SiteTextEditProvider>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    );
  } catch (error) {
    console.error('❌ Error in App component:', error);
    return (
      <div style={{ padding: '20px', background: '#fee', color: '#c00' }}>
        <h1>Error in App</h1>
        <p>{error.message}</p>
        <pre>{error.stack}</pre>
      </div>
    );
  }
}

export default App;