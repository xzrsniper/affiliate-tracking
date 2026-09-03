import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  MousePointerClick, 
  TrendingUp, 
  DollarSign, 
  Shield, 
  Zap, 
  BarChart3,
  Check,
  ArrowRight,
  Link as LinkIcon,
  Users,
  Settings,
  User
} from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Landing() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo size="md" showText={true} />
            <div className="flex items-center space-x-4">
              <a
                href="#about"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                {t('landing.about')}
              </a>
              <a
                href="#blog"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                {t('landing.blog')}
              </a>
              <a
                href={`https://t.me/${import.meta.env.VITE_TELEGRAM_USERNAME || 'your_username'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                {t('landing.contacts')}
              </a>
              <Link
                to="/login"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                {t('landing.signIn')}
              </Link>
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-[#6d5cf6] text-white hover:bg-[#5d4af0] transition-all shadow-lg shadow-violet-500/25"
                aria-label="Account"
                title="Account"
              >
                <User className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-6 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25"
              >
                {t('landing.start')}
              </Link>
            )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            {t('landing.heroTitle1')}{' '}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              {t('landing.heroHighlight')}
            </span>
            <br />
            {t('landing.heroTitle2')}
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            {t('landing.heroDesc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center space-x-2"
            >
              <span>{t('landing.startFree')}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#features"
              className="px-8 py-4 bg-white text-slate-700 font-semibold rounded-xl border-2 border-slate-200 hover:border-slate-300 transition-all flex items-center justify-center space-x-2"
            >
              <span>{t('landing.learnMore')}</span>
            </a>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-16 max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 overflow-hidden">
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatPreview icon={MousePointerClick} label={t('landing.statClicks')} value="1,234" color="blue" />
                <StatPreview icon={Users} label={t('landing.statUnique')} value="892" color="purple" />
                <StatPreview icon={TrendingUp} label={t('landing.statConversions')} value="156" color="green" />
                <StatPreview icon={DollarSign} label={t('landing.statRevenue')} value="$12,450" color="emerald" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            {t('landing.featuresTitle')}
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {t('landing.featuresSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={MousePointerClick}
            title={t('landing.featureClicksTitle')}
            description={t('landing.featureClicksDesc')}
            color="blue"
          />
          <FeatureCard
            icon={TrendingUp}
            title={t('landing.featureConversionsTitle')}
            description={t('landing.featureConversionsDesc')}
            color="green"
          />
          <FeatureCard
            icon={BarChart3}
            title={t('landing.featureStatsTitle')}
            description={t('landing.featureStatsDesc')}
            color="purple"
          />
          <FeatureCard
            icon={Zap}
            title={t('landing.featureSetupTitle')}
            description={t('landing.featureSetupDesc')}
            color="amber"
          />
          <FeatureCard
            icon={Shield}
            title={t('landing.featureSecurityTitle')}
            description={t('landing.featureSecurityDesc')}
            color="red"
          />
          <FeatureCard
            icon={Settings}
            title={t('landing.featureFlexTitle')}
            description={t('landing.featureFlexDesc')}
            color="indigo"
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            {t('landing.howItWorks')}
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {t('landing.howItWorksSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StepCard
            number="1"
            title={t('landing.step1Title')}
            description={t('landing.step1Desc')}
            icon={LinkIcon}
          />
          <StepCard
            number="2"
            title={t('landing.step2Title')}
            description={t('landing.step2Desc')}
            icon={Settings}
          />
          <StepCard
            number="3"
            title={t('landing.step3Title')}
            description={t('landing.step3Desc')}
            icon={BarChart3}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-12 text-center shadow-2xl">
          <h2 className="text-4xl font-bold text-white mb-4">
            {t('landing.ctaTitle')}
          </h2>
          <p className="text-xl text-violet-100 mb-8 max-w-2xl mx-auto">
            {t('landing.ctaDesc')}
          </p>
          <Link
            to="/login"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-violet-600 font-semibold rounded-xl hover:bg-violet-50 transition-all shadow-lg"
          >
            <span>{t('landing.ctaButton')}</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="mb-4">
                <img
                  src="/logo-on-dark.png"
                  alt="lehko space"
                  className="h-10 w-auto object-contain"
                />
              </div>
              <p className="text-slate-400">
                {t('landing.footerDesc')}
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">{t('landing.navigation')}</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#about" className="hover:text-white transition-colors">
                    {t('landing.about')}
                  </a>
                </li>
                <li>
                  <a href="#blog" className="hover:text-white transition-colors">
                    {t('landing.blog')}
                  </a>
                </li>
                <li>
                  <a href={`https://t.me/${import.meta.env.VITE_TELEGRAM_USERNAME || 'your_username'}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    {t('landing.contacts')}
                  </a>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    {t('landing.signIn')}
                  </Link>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    {t('landing.features')}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">{t('landing.supportTitle')}</h3>
              <ul className="space-y-2">
                <li>
                  <a href={`https://t.me/${import.meta.env.VITE_TELEGRAM_USERNAME || 'your_username'}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    {t('landing.telegramSupport')}
                  </a>
                </li>
                <li>
                  <a href="mailto:support@example.com" className="hover:text-white transition-colors">
                    {t('landing.emailSupport')}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-400">
            <p>&copy; 2024 {t('landing.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Stat Preview Component
function StatPreview({ icon: Icon, label, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    emerald: 'bg-emerald-100 text-emerald-600'
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200">
      <div className={`w-10 h-10 ${colorClasses[color]} rounded-lg flex items-center justify-center mb-2`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon: Icon, title, description, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    indigo: 'bg-indigo-100 text-indigo-600'
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
      <div className={`w-12 h-12 ${colorClasses[color]} rounded-xl flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </div>
  );
}

// Step Card Component
function StepCard({ number, title, description, icon: Icon }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl font-bold text-white">{number}</span>
      </div>
      <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-violet-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </div>
  );
}

