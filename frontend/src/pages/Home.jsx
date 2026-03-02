import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MousePointerClick,
  TrendingUp,
  DollarSign,
  Shield,
  Zap,
  BarChart3,
  ArrowRight,
  Check,
  Users,
  Globe,
  Sun,
  Moon,
  LayoutDashboard
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import Logo from '../components/Logo.jsx';

export default function Home() {
  const { t, i18n } = useTranslation();
  const isUk = i18n.language === 'uk';

  let theme = 'light';
  let toggleTheme = () => {};
  try {
    const themeContext = useTheme();
    if (themeContext) {
      theme = themeContext.theme || 'light';
      toggleTheme = themeContext.toggleTheme || (() => {});
    }
  } catch {
    theme = 'light';
    toggleTheme = () => {};
  }


  const features = [
    { icon: MousePointerClick, title: t('home.feature1Title'), description: t('home.feature1Desc') },
    { icon: TrendingUp, title: t('home.feature2Title'), description: t('home.feature2Desc') },
    { icon: Shield, title: t('home.feature3Title'), description: t('home.feature3Desc') },
    { icon: Zap, title: t('home.feature4Title'), description: t('home.feature4Desc') },
    { icon: BarChart3, title: t('home.feature5Title'), description: t('home.feature5Desc') },
    { icon: Globe, title: t('home.feature6Title'), description: t('home.feature6Desc') }
  ];

  const budgetPoints = [t('home.budget1'), t('home.budget2'), t('home.budget3'), t('home.budget4'), t('home.budget5')];
  const benefits = [
    t('home.benefit1'),
    t('home.benefit2'),
    t('home.benefit3'),
    t('home.benefit4'),
    t('home.benefit5'),
    t('home.benefit6')
  ];

  const stats = [
    { value: '1000+', label: t('home.activeUsers'), icon: Users },
    { value: '1M+', label: t('home.trackedClicks'), icon: TrendingUp },
    { value: '$10M+', label: t('home.trackedRevenue'), icon: DollarSign }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo size="md" showText={true} />
            <div className="flex items-center gap-4">
              <a href="https://t.me/hodunkooo" target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors">
                {t('home.navContacts')}
              </a>
              <Link to="/guide" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors">
                {t('home.navGuide')}
              </Link>
              <button
                onClick={() => i18n.changeLanguage(isUk ? 'en' : 'uk')}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium px-2 py-1 rounded transition-colors"
              >
                {isUk ? 'EN' : 'УКР'}
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title={theme === 'dark' ? t('common.lightTheme') : t('common.darkTheme')}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <Link
                to="/login"
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {t('home.startFree')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight max-w-4xl mx-auto">
          {t('home.heroHeadlineBefore1')}
          <span className="text-violet-600 dark:text-violet-400">{t('home.heroHeadlineHighlight1')}</span>
          {t('home.heroHeadlineMid')}
          <span className="text-violet-600 dark:text-violet-400">{t('home.heroHeadlineHighlight2')}</span>
          {t('home.heroHeadlineEnd')}
        </h1>
        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-3 max-w-3xl mx-auto">
          {t('home.heroSubline')}
        </p>
        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-3xl mx-auto">
          {t('home.heroSubline2')}
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors text-lg"
        >
          {t('home.heroCta')}
          <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          {t('home.heroNote')}
        </p>
      </section>

      {/* Purple block 1: Budget + Value prop */}
      <section className="bg-gradient-to-r from-violet-600 to-indigo-600 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">
                {t('home.budgetTitle')}
              </h2>
              <ul className="space-y-4">
                {budgetPoints.map((text, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-white" />
                    </span>
                    <span className="text-white/95 text-lg">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-8 border border-white/20 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
                <LayoutDashboard className="w-10 h-10 text-white" />
              </div>
              <p className="text-white text-lg leading-relaxed">
                {t('home.valueProp')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {t('home.featuresSectionTitle')}
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            {t('home.featuresSectionSubtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/40 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-300">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Purple block 2: Why choose + Stats */}
      <section className="bg-gradient-to-r from-violet-600 to-indigo-600 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                {t('home.whyTitle')}
              </h2>
              <p className="text-white/90 text-lg mb-8">
                {t('home.whySubtitle')}
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-white" />
                    </span>
                    <span className="text-white/95 text-lg">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              {stats.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-5 border border-white/20 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                      <Icon className="w-7 h-7 text-violet-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{item.value}</div>
                      <div className="text-white/90 text-sm">{item.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-10 sm:p-14 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {t('home.ctaHeadline')}
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            {t('home.ctaSubline')}
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-violet-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-lg"
          >
            {t('home.ctaButton')}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img src="/logo.png" alt="LehkoTrack" className="w-full h-full object-contain p-1.5" />
                </div>
                <span className="text-xl font-bold text-white">LehkoTrack</span>
              </div>
              <p className="text-slate-400 text-sm">{t('home.footerTagline')}</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">{t('home.product')}</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/setup" className="hover:text-white transition-colors">{t('common.documentation')}</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('common.api')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('home.footerApps')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">{t('home.company')}</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">{t('common.about')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('common.blog')}</a></li>
                <li><a href="https://t.me/hodunkooo" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{t('common.contacts')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">{t('home.support')}</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">{t('common.help')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('common.faq')}</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">{t('common.login')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400 text-sm">
            <p>© 2024 LehkoTrack. {t('common.allRightsReserved')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
