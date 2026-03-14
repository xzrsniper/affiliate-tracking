import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext.jsx';
import {
  Check,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Play,
  Sun,
  Moon
} from 'lucide-react';
import Logo from '../components/Logo.jsx';

export default function Home() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isUk = i18n.language === 'uk';
  const [faqOpen, setFaqOpen] = useState(0);

  const budgetPoints = [
    t('home.budget1'),
    t('home.budget2'),
    t('home.budget3'),
    t('home.budget4'),
    t('home.budget5')
  ];

  const benefits = [
    t('home.benefit1'),
    t('home.benefit2'),
    t('home.benefit3'),
    t('home.benefit4'),
    t('home.benefit5'),
    t('home.benefit6')
  ];

  const faqItems = [
    { q: t('home.faqQ1'), a: t('home.faqA1') },
    { q: t('home.faqQ2'), a: t('home.faqA2') },
    { q: t('home.faqQ3'), a: t('home.faqA3') },
    { q: t('home.faqQ4'), a: t('home.faqA4') }
  ];

  return (
    <div className="min-h-screen bg-[#f7fbfd] text-slate-900 bg-[radial-gradient(circle_at_10%_0%,rgba(109,40,217,0.12),transparent_45%),radial-gradient(circle_at_90%_5%,rgba(245,158,11,0.1),transparent_40%)] dark:bg-slate-950 dark:text-slate-100 dark:bg-[radial-gradient(circle_at_10%_0%,rgba(139,92,246,0.22),transparent_45%),radial-gradient(circle_at_90%_5%,rgba(14,165,233,0.16),transparent_40%)]">
      <nav className="sticky top-0 z-50 border-b border-[#d6e3e8] bg-[#f7fbfd]/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex h-[68px] w-full max-w-[1280px] items-center justify-between px-4 sm:px-8 lg:px-12">
          <Logo size="md" showText={true} />
          <div className="hidden items-center gap-1 md:flex">
            <a href="#features" className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100">{t('home.navFeatures')}</a>
            <a href="#pricing" className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100">{t('home.navPricing')}</a>
            <Link to="/guide" className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100">{t('home.navGuide')}</Link>
            <a href="https://t.me/hodunkooo" target="_blank" rel="noopener noreferrer" className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100">{t('home.navSupport')}</a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              title={theme === 'dark' ? t('common.lightTheme') : t('common.darkTheme')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => i18n.changeLanguage(isUk ? 'en' : 'uk')}
              className="rounded-lg px-2 py-1 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
            >
              {isUk ? 'EN' : 'УКР'}
            </button>
            <Link to="/login" className="hidden rounded-[9px] border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:block">
              {t('home.signIn')}
            </Link>
            <Link to="/login" className="rounded-[9px] bg-violet-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-800 shadow-[0_6px_18px_rgba(109,40,217,0.22)]">
              {t('home.startFree')}
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-10 px-4 pb-16 pt-20 sm:px-8 lg:grid-cols-2 lg:gap-14 lg:px-12 lg:pt-24">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 dark:border-violet-700/50 dark:bg-violet-500/10 dark:text-violet-300">
            <Sparkles className="h-3.5 w-3.5" /> {t('home.newVersionLive')}
          </div>
          <h1 className="mb-5 font-display text-[44px] font-extrabold leading-[1.1] tracking-[-0.03em] text-slate-900 dark:text-slate-100 sm:text-[56px]">
            {t('home.heroTitleLine1')}<br />
            <span className="bg-gradient-to-br from-violet-900 to-violet-500 bg-clip-text text-transparent dark:from-violet-300 dark:to-fuchsia-400">{t('home.heroTitleLine2')}</span>
          </h1>
          <p className="mb-9 max-w-[500px] text-[17px] leading-[1.75] text-slate-600 dark:text-slate-300">
            {t('home.heroDescriptionShort')}
          </p>
          <div className="mb-8 flex flex-wrap gap-3">
            <Link to="/login" className="inline-flex items-center gap-2 rounded-[11px] bg-violet-700 px-6 py-3 font-semibold text-white transition hover:bg-violet-800 shadow-[0_6px_18px_rgba(109,40,217,0.22)]">
              {t('home.startFree')} <ArrowRight className="h-4 w-4" />
            </Link>
            <button className="inline-flex items-center gap-2 rounded-[11px] border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
              <Play className="h-4 w-4" /> {t('home.watchDemo')}
            </button>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex -space-x-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-amber-300">А</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-green-300">В</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-sky-300">Д</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-rose-300">С</span>
            </div>
            <span>{t('home.trustedBy')} <strong className="text-slate-800 dark:text-slate-100">1000+ {t('home.teams')}</strong></span>
          </div>
        </div>

        <div className="relative rounded-[20px] border border-[#d6e3e8] bg-white p-5 shadow-[0_28px_70px_rgba(11,37,48,0.16),0_4px_18px_rgba(11,37,48,0.06)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_28px_70px_rgba(2,6,23,0.65),0_4px_18px_rgba(2,6,23,0.45)]">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{t('home.campaignOverview')}</h3>
            <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">{t('home.live')}</span>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('home.clicks')}</p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100">4,821</p>
              <p className="text-[11px] font-semibold text-green-600">+18.4%</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('home.conversions')}</p>
              <p className="text-xl font-extrabold text-violet-600">312</p>
              <p className="text-[11px] font-semibold text-green-600">+7.2%</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('home.revenue')}</p>
              <p className="text-xl font-extrabold text-amber-600">$2,140</p>
              <p className="text-[11px] font-semibold text-green-600">+23.1%</p>
            </div>
          </div>
          <div className="mb-4 flex h-24 items-end gap-1 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
            {[30, 50, 40, 65, 55, 75, 60, 85, 70, 100, 80, 90].map((h) => (
              <div key={h} className="w-full rounded-t bg-violet-500/80" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800"><span className="font-medium text-slate-700 dark:text-slate-300">{t('home.googleAds')}</span><span className="font-semibold text-violet-600">2,144</span></div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800"><span className="font-medium text-slate-700 dark:text-slate-300">{t('home.facebook')}</span><span className="font-semibold text-violet-600">1,390</span></div>
            <div className="flex items-center justify-between"><span className="font-medium text-slate-700 dark:text-slate-300">{t('home.telegram')}</span><span className="font-semibold text-violet-600">744</span></div>
          </div>
          <div className="absolute -bottom-4 -left-4 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{t('home.attributionLive')}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('home.realtimeUpdatesEnabled')}</p>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-10 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 px-4 text-sm text-slate-500 dark:text-slate-400 sm:px-6 lg:px-8">
          <span>Google Analytics</span>
          <span>Google Tag Manager</span>
          <span>Facebook Ads</span>
          <span>Shopify</span>
          <span>WooCommerce</span>
          <span>Mailchimp</span>
        </div>
      </section>

      <section className="bg-gradient-to-r from-violet-600 to-indigo-500 py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div>
            <h2 className="mb-6 text-3xl font-extrabold text-white">{t('home.budgetTitle')}</h2>
            <ul className="space-y-3">
              {budgetPoints.map((text) => (
                <li key={text} className="flex items-start gap-3 text-white/95">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border border-white/30 bg-white/20">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-white/20 bg-white/10 p-8 text-center text-white backdrop-blur">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">▶</div>
            <p className="text-lg leading-relaxed">{t('home.valueProp')}</p>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12">
          <span className="mb-3 inline-block rounded-full bg-violet-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-700">{t('home.navFeatures')}</span>
          <h2 className="mb-3 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{t('home.featuresSectionTitle')}</h2>
          <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-300">{t('home.featuresSectionSubtitle')}</p>
        </div>

        <div className="mb-16 grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 dark:border-slate-700 dark:bg-slate-900">
            {[
              [t('home.googleAds'), '85%', '$1,240'],
              [t('home.facebook'), '60%', '$890'],
              [t('home.telegram'), '40%', '$580'],
              [t('home.email'), '25%', '$340']
            ].map((row) => (
              <div key={row[0]} className="mb-3 flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3 last:mb-0 dark:border-slate-700 dark:bg-slate-800">
                <span className="w-24 text-sm font-semibold text-slate-700 dark:text-slate-200">{row[0]}</span>
                <div className="h-2 flex-1 rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-500" style={{ width: row[1] }} /></div>
                <span className="text-sm font-bold text-violet-700">{row[2]}</span>
              </div>
            ))}
          </div>
          <div>
            <h3 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{t('home.moneyFromTitle')}</h3>
            <p className="mb-5 leading-relaxed text-slate-600 dark:text-slate-300">{t('home.moneyFromDesc')}</p>
            <ul className="space-y-2 text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />{t('home.moneyFromBullet1')}</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />{t('home.moneyFromBullet2')}</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />{t('home.moneyFromBullet3')}</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <h3 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{t('home.integration5minTitle')}</h3>
            <p className="mb-5 leading-relaxed text-slate-600 dark:text-slate-300">{t('home.integration5minDesc')}</p>
            <ul className="space-y-2 text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />{t('home.integrationBullet1')}</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />{t('home.integrationBullet2')}</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />{t('home.integrationBullet3')}</li>
            </ul>
          </div>
          <div className="rounded-3xl bg-slate-900 p-6 font-mono text-sm text-violet-200 shadow-xl">
            <p className="mb-2 text-slate-400">&lt;!-- {t('home.addToSite')} --&gt;</p>
            <p>&lt;script src="https://cdn.trckflw.io/pixel.js"</p>
            <p className="pl-3">data-site-id="your-id"&gt;&lt;/script&gt;</p>
            <p className="mt-3 text-slate-400">&lt;!-- {t('home.thatsAll')} --&gt;</p>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-14 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h3 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{t('home.ctaTitle')}</h3>
          <p className="mb-6 text-slate-600 dark:text-slate-300">{t('home.register30secCardless')}</p>
          <Link to="/login" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-7 py-3 font-semibold text-white transition hover:bg-violet-700">{t('home.createAccount')} <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <section className="bg-gradient-to-r from-indigo-500 to-violet-600 py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div>
            <h2 className="mb-4 text-3xl font-extrabold text-white">{t('home.whyTitle')}</h2>
            <p className="mb-6 text-white/80">{t('home.whySubtitle')}</p>
            <ul className="space-y-2">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 text-white/95">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-2xl border border-white/25 bg-white/10 p-5 text-white backdrop-blur"><div className="text-3xl">👥</div><div><div className="text-3xl font-extrabold">1000+</div><div className="text-white/80">{t('home.activeUsers')}</div></div></div>
            <div className="flex items-center gap-4 rounded-2xl border border-white/25 bg-white/10 p-5 text-white backdrop-blur"><div className="text-3xl">📈</div><div><div className="text-3xl font-extrabold">1M+</div><div className="text-white/80">{t('home.trackedClicks')}</div></div></div>
            <div className="flex items-center gap-4 rounded-2xl border border-white/25 bg-white/10 p-5 text-white backdrop-blur"><div className="text-3xl">💵</div><div><div className="text-3xl font-extrabold">$10M+</div><div className="text-white/80">{t('home.trackedRevenue')}</div></div></div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block rounded-full bg-violet-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-700">{t('home.navPricing')}</span>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{t('home.pricingTitle')}</h2>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 dark:border-slate-700 dark:bg-slate-900">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('home.planStarter')}</p>
            <p className="mb-1 text-4xl font-extrabold tracking-tight">{t('home.planStarterPrice')}</p>
            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">{t('home.planStarterDesc')}</p>
            <ul className="mb-6 space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />{t('home.planStarterItem1')}</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />{t('home.planStarterItem2')}</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />{t('home.planStarterItem3')}</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />{t('home.planStarterItem4')}</li>
            </ul>
            <Link to="/login" className="block rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">{t('home.planStarterAction')}</Link>
          </div>

          <div className="relative rounded-3xl border-2 border-violet-600 bg-white p-7 shadow-lg shadow-violet-200/60 dark:bg-slate-900 dark:shadow-violet-900/30">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">{t('home.planPopular')}</span>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-violet-700">{t('home.planPro')}</p>
            <p className="mb-1 text-5xl font-extrabold tracking-tight dark:text-slate-100">{t('home.planProPrice')}<span className="text-base font-medium text-slate-500 dark:text-slate-400">{t('home.perMonth')}</span></p>
            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">{t('home.planProDesc')}</p>
            <ul className="mb-6 space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />{t('home.planProItem1')}</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />{t('home.planProItem2')}</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />{t('home.planProItem3')}</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />{t('home.planProItem4')}</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />{t('home.planProItem5')}</li>
            </ul>
            <Link to="/login" className="block rounded-xl bg-violet-600 px-4 py-2.5 text-center font-semibold text-white transition hover:bg-violet-700">{t('home.planProAction')}</Link>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7 dark:border-slate-700 dark:bg-slate-900">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('home.planAgency')}</p>
            <p className="mb-1 text-5xl font-extrabold tracking-tight dark:text-slate-100">{t('home.planAgencyPrice')}<span className="text-base font-medium text-slate-500 dark:text-slate-400">{t('home.perMonth')}</span></p>
            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">{t('home.planAgencyDesc')}</p>
            <ul className="mb-6 space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />{t('home.planAgencyItem1')}</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />{t('home.planAgencyItem2')}</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />{t('home.planAgencyItem3')}</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />{t('home.planAgencyItem4')}</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />{t('home.planAgencyItem5')}</li>
            </ul>
            <a href="https://t.me/hodunkooo" target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">{t('home.navContacts')}</a>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 dark:bg-slate-900">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <span className="mb-3 inline-block rounded-full bg-violet-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-700">{t('common.faq')}</span>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{t('common.faq')}</h2>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            {faqItems.map((item, idx) => {
              const open = faqOpen === idx;
              return (
                <div key={item.q} className="border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setFaqOpen(open ? -1 : idx)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                  >
                    <span className={`font-semibold ${open ? 'text-violet-700 dark:text-violet-300' : 'text-slate-800 dark:text-slate-200'}`}>{item.q}</span>
                    <ChevronDown className={`h-5 w-5 text-slate-400 dark:text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && <div className="px-5 pb-4 text-slate-600 dark:text-slate-300">{item.a}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-violet-600 to-indigo-600 py-14 dark:from-violet-700 dark:to-indigo-700">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">{t('home.readyScale')}</h2>
            <p className="mt-1 text-white/85">{t('home.register30secCardless')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/login" className="rounded-xl bg-white px-6 py-3 font-semibold text-violet-700 transition hover:bg-slate-100 dark:bg-slate-100">{t('home.startFree')}</Link>
            <a href="https://t.me/hodunkooo" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/40 bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/20">{t('home.talkToUs')}</a>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50 py-10 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 text-sm text-slate-500 dark:text-slate-400 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <Logo size="sm" showText={true} />
          <div className="flex flex-wrap gap-5">
            <a href="#features" className="hover:text-slate-800 dark:hover:text-slate-100">{t('home.navFeatures')}</a>
            <a href="#pricing" className="hover:text-slate-800 dark:hover:text-slate-100">{t('home.navPricing')}</a>
            <Link to="/guide" className="hover:text-slate-800 dark:hover:text-slate-100">{t('common.documentation')}</Link>
            <a href="https://t.me/hodunkooo" target="_blank" rel="noopener noreferrer" className="hover:text-slate-800 dark:hover:text-slate-100">{t('home.navSupport')}</a>
          </div>
          <span>© 2026 TrackFlow. {t('common.allRightsReserved')}</span>
        </div>
      </footer>
    </div>
  );
}
