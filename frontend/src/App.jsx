import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SiteTextEditProvider } from './context/SiteTextEditContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import SiteTextEditOverlay from './components/SiteTextEditOverlay.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Admin from './pages/Admin.jsx';
import Settings from './pages/Settings.jsx';
import Success from './pages/Success.jsx';
import Setup from './pages/Setup.jsx';
import Guide from './pages/Guide.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import ConfirmPasswordChange from './pages/ConfirmPasswordChange.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import HomeNew from './pages/HomeNew.jsx';
import ConsoleCode from './pages/ConsoleCode.jsx';
import Blog from './pages/Blog.jsx';
import BlogPost from './pages/BlogPost.jsx';
import Terms from './pages/Terms.jsx';
import Privacy from './pages/Privacy.jsx';
import Refund from './pages/Refund.jsx';

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
    <Routes>
        {/* Route for pixel.js - redirects to API endpoint */}
        <Route
          path="/pixel.js"
          element={<PixelJsRedirect />}
        />
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