import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext.jsx';
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  Moon,
  Play,
  ShieldCheck,
  Sparkles,
  Sun,
  TrendingUp
} from 'lucide-react';
import Logo from '../components/Logo.jsx';

export default function Home() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isUk = i18n.language === 'uk';
  const [faqOpen, setFaqOpen] = useState(0);

  const budgetPoints = useMemo(
    () => [t('home.budget1'), t('home.budget2'), t('home.budget3'), t('home.budget4'), t('home.budget5')],
    [t]
  );

  const whyPoints = useMemo(
    () => [t('home.benefit1'), t('home.benefit2'), t('home.benefit3'), t('home.benefit4'), t('home.benefit5'), t('home.benefit6')],
    [t]
  );

  const faqItems = useMemo(
    () => [
      { q: t('home.faqQ1'), a: t('home.faqA1') },
      { q: t('home.faqQ2'), a: t('home.faqA2') },
      { q: t('home.faqQ3'), a: t('home.faqA3') },
      { q: t('home.faqQ4'), a: t('home.faqA4') },
      { q: t('home.faqQ5'), a: t('home.faqA5') },
      { q: t('home.faqQ6'), a: t('home.faqA6') },
      { q: t('home.faqQ7'), a: t('home.faqA7') }
    ],
    [t]
  );

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <nav className="sticky top-0 z-50 border-b border-[#d6deea] bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex h-[68px] w-full max-w-[1240px] items-center justify-between px-4 sm:px-8">
          <Logo size="md" showText={true} />

          <div className="hidden items-center gap-1 md:flex">
            <a href="#features" className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100">{t('home.navFeatures')}</a>
            <a href="#pricing" className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100">{t('home.navPricing')}</a>
            <Link to="/guide" className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100">{t('home.navGuide')}</Link>
            <a href="https://t.me/hodunkooo" target="_blank" rel="noopener noreferrer" className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100">{t('home.navSupport')}</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => i18n.changeLanguage(isUk ? 'en' : 'uk')}
              className="rounded-lg px-2 py-1 text-xs font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 sm:text-sm"
            >
              {isUk ? 'EN' : 'УКР'}
            </button>
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              title={theme === 'dark' ? t('common.lightTheme') : t('common.darkTheme')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/login" className="hidden rounded-[10px] border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:block">
              {t('home.signIn')}
            </Link>
            <Link to="/login" className="rounded-[10px] bg-[#6d5cf6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5d4af0] shadow-[0_10px_24px_rgba(109,92,246,0.28)]">
              {t('home.startFree')}
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-12 px-4 pb-16 pt-16 sm:px-8 lg:grid-cols-2 lg:items-center lg:pt-20">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            <Sparkles className="h-3.5 w-3.5" /> {t('home.newVersionLive')}
          </div>

          <h1 className="mb-5 text-[36px] font-extrabold leading-tight tracking-[-0.03em] text-slate-900 dark:text-slate-100 sm:text-[52px]">
            {t('home.heroHeadlineBefore1')}
            <span className="bg-gradient-to-r from-violet-700 to-indigo-500 bg-clip-text text-transparent">{t('home.heroHeadlineHighlight1')}</span>
            {t('home.heroHeadlineMid')}
            <span className="bg-gradient-to-r from-violet-700 to-indigo-500 bg-clip-text text-transparent">{t('home.heroHeadlineHighlight2')}</span>
            {t('home.heroHeadlineEnd')}
          </h1>

          <p className="mb-2 max-w-[560px] text-[17px] leading-relaxed text-slate-600 dark:text-slate-300">{t('home.heroSubline')}</p>
          <p className="mb-8 max-w-[560px] text-[17px] leading-relaxed text-slate-600 dark:text-slate-300">{t('home.heroSubline2')}</p>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Link to="/login" className="inline-flex items-center gap-2 rounded-[12px] bg-[#6d5cf6] px-6 py-3.5 font-semibold text-white transition hover:bg-[#5d4af0] shadow-[0_10px_24px_rgba(109,92,246,0.28)]">
              {t('home.heroCta')} <ArrowRight className="h-4 w-4" />
            </Link>
            <button className="inline-flex items-center gap-2 rounded-[12px] border-2 border-white/80 bg-transparent px-6 py-3.5 font-semibold text-white transition hover:bg-white/10">
              <Play className="h-4 w-4" /> {t('home.watchDemo')}
            </button>
          </div>

          <div className="text-sm text-slate-500">{t('home.heroNote')}</div>
        </div>

          <div className="rounded-[22px] border border-[#d8dfeb] bg-white p-5 shadow-[0_24px_80px_rgba(19,33,68,0.14)] dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{t('home.campaignOverview')}</h3>
            <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">{t('home.live')}</span>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-3">
            <MetricCard label={t('home.clicks')} value="4,821" delta="+18.4%" />
            <MetricCard label={t('home.conversions')} value="312" delta="+7.2%" accent="violet" />
            <MetricCard label={t('home.revenue')} value="$2,140" delta="+23.1%" accent="amber" />
          </div>

          <div className="mb-4 flex h-24 items-end gap-1 rounded-xl bg-slate-50 p-3">
            {[28, 44, 35, 57, 50, 71, 60, 83, 73, 94, 86, 100].map((h, i) => (
              <div key={`${h}-${i}`} className="w-full rounded-t bg-gradient-to-t from-[#6d5cf6] to-[#8aa4ff]" style={{ height: `${h}%` }} />
            ))}
          </div>

          <SourceRow name={t('home.googleAds')} value="2,344" width="84%" />
          <SourceRow name={t('home.facebook')} value="1,590" width="63%" />
          <SourceRow name={t('home.telegram')} value="744" width="38%" last />
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#5d6df9] to-[#6e4dfa] py-16 text-white">
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-4 sm:px-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="mb-6 text-3xl font-extrabold">{t('home.budgetTitle')}</h2>
            <ul className="space-y-3">
              {budgetPoints.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md border border-white/40 bg-white/15">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-white/95">{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-white/20 bg-white/10 p-8 text-center backdrop-blur">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <TrendingUp className="h-6 w-6" />
            </div>
            <p className="text-lg leading-relaxed text-white/95">{t('home.valueProp')}</p>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-[1240px] px-4 py-20 sm:px-8">
        <div className="mb-10">
          <span className="mb-3 inline-block rounded-full bg-violet-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-700">{t('home.navFeatures')}</span>
          <h2 className="mb-3 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{t('home.featuresSectionTitle')}</h2>
          <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-300">{t('home.featuresSectionSubtitle')}</p>
        </div>

        <div className="mb-16 grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 dark:border-slate-700 dark:bg-slate-900">
            {[ [t('home.googleAds'), '85%', '$1,240'], [t('home.facebook'), '60%', '$890'], [t('home.telegram'), '40%', '$580'], ['Email', '25%', '$340'] ].map((row) => (
              <div key={row[0]} className="mb-3 flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3 last:mb-0 dark:border-slate-700 dark:bg-slate-800">
                <span className="w-24 text-sm font-semibold text-slate-700 dark:text-slate-200">{row[0]}</span>
                <div className="h-2 flex-1 rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-2 rounded-full bg-gradient-to-r from-[#6d5cf6] to-[#5ea8ff]" style={{ width: row[1] }} /></div>
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
          <div className="rounded-3xl bg-[#121525] p-6 font-mono text-sm text-[#96b5ff] shadow-xl">
            <p className="mb-2 text-slate-400">&lt;!-- {t('home.addToSite')} --&gt;</p>
            <p>&lt;script src="https://cdn.trckflw.io/pixel.js"</p>
            <p className="pl-3">data-site-id="your-id"&gt;&lt;/script&gt;</p>
            <p className="mt-3 text-slate-400">&lt;!-- {t('home.thatsAll')} --&gt;</p>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#4f81ff] to-[#6b4ffb] py-16 text-white">
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-10 px-4 sm:px-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-3xl font-extrabold">{t('home.whyTitle')}</h2>
            <p className="mb-6 text-white/80">{t('home.whySubtitle')}</p>
            <ul className="space-y-2">
              {whyPoints.map((point) => (
                <li key={point} className="flex items-start gap-2 text-white/95">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <StatCard icon={<ShieldCheck className="h-7 w-7" />} value="100+" label={t('home.statAccuracy')} />
            <StatCard icon={<BarChart3 className="h-7 w-7" />} value="5 хв" label={t('home.statSetup')} />
            <StatCard icon={<TrendingUp className="h-7 w-7" />} value="24/7" label={t('home.statMonitoring')} />
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-[1240px] px-4 py-20 sm:px-8">
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block rounded-full bg-violet-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-700">{t('home.navPricing')}</span>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{t('home.pricingTitle')}</h2>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-3">
          <PricingCard
            tag={t('home.planStarter')}
            price={t('home.planStarterPrice')}
            desc={t('home.planStarterDesc')}
            items={[t('home.planStarterItem1'), t('home.planStarterItem2'), t('home.planStarterItem3'), t('home.planStarterItem4')]}
            cta={t('home.planStarterAction')}
          />

          <PricingCard
            featured
            popular={t('home.planPopular')}
            tag={t('home.planPro')}
            price={t('home.planProPrice')}
            per={t('home.perMonth')}
            desc={t('home.planProDesc')}
            items={[t('home.planProItem1'), t('home.planProItem2'), t('home.planProItem3'), t('home.planProItem4'), t('home.planProItem5'), t('home.planProItem6')]}
            cta={t('home.planProAction')}
          />

          <PricingCard
            tag={t('home.planAgency')}
            price={t('home.planAgencyPrice')}
            per={t('home.perMonth')}
            desc={t('home.planAgencyDesc')}
            items={[t('home.planAgencyItem1'), t('home.planAgencyItem2'), t('home.planAgencyItem3'), t('home.planAgencyItem4'), t('home.planAgencyItem5')]}
            cta={t('home.navContacts')}
            contact
          />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-8">
        <div className="mb-8 text-center">
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

        <div className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <p className="mb-3 font-medium text-slate-700 dark:text-slate-200">{t('home.faqHelpTitle')}</p>
          <p className="mb-3">{t('home.faqHelpDesc')}</p>
          <a
            href="https://t.me/hodunkooo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            {t('home.faqHelpBtn')}
          </a>
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#4f81ff] to-[#6b4ffb] py-14 text-white">
        <div className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-5 px-4 sm:px-8 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">{t('home.readyScale')}</h2>
            <p className="mt-1 text-white/85">{t('home.register30secCardless')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/login" className="rounded-xl bg-white px-6 py-3 font-semibold text-violet-700 transition hover:bg-slate-100">{t('home.startFree')}</Link>
            <a href="https://t.me/hodunkooo" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/40 bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/20">{t('home.talkToUs')}</a>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#d6deea] bg-white py-10 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-4 px-4 text-sm text-slate-500 dark:text-slate-400 sm:px-8 lg:flex-row lg:items-center">
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

function MetricCard({ label, value, delta, accent = 'slate' }) {
  const valueClass = accent === 'violet' ? 'text-violet-600' : accent === 'amber' ? 'text-amber-600' : 'text-slate-900 dark:text-slate-100';

  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
      <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`text-xl font-extrabold ${valueClass}`}>{value}</p>
      <p className="text-[11px] font-semibold text-green-600">{delta}</p>
    </div>
  );
}

function SourceRow({ name, value, width, last = false }) {
  return (
    <div className={`flex items-center justify-between py-2 ${last ? '' : 'border-b border-slate-100 dark:border-slate-800'}`}>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{name}</span>
      <div className="mx-4 h-2 flex-1 rounded-full bg-slate-200 dark:bg-slate-700">
        <div className="h-2 rounded-full bg-gradient-to-r from-[#6d5cf6] to-[#5ea8ff]" style={{ width }} />
      </div>
      <span className="text-sm font-semibold text-violet-600">{value}</span>
    </div>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/25 bg-white/10 p-5 text-white backdrop-blur">
      <div className="text-3xl">{icon}</div>
      <div>
        <div className="text-3xl font-extrabold">{value}</div>
        <div className="text-white/80">{label}</div>
      </div>
    </div>
  );
}

function PricingCard({ tag, price, per, desc, items, cta, featured = false, popular, contact = false }) {
  return (
    <div className={`relative rounded-3xl border p-7 ${featured ? 'border-2 border-violet-600 bg-white shadow-lg shadow-violet-200/60 dark:bg-slate-900 dark:shadow-violet-900/30' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}>
      {popular ? <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">{popular}</span> : null}

      <p className={`mb-3 text-xs font-bold uppercase tracking-wider ${featured ? 'text-violet-700 dark:text-violet-300' : 'text-slate-500 dark:text-slate-400'}`}>{tag}</p>
      <p className="mb-1 text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
        {price}
        {per ? <span className="text-base font-medium text-slate-500 dark:text-slate-400">{per}</span> : null}
      </p>
      <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">{desc}</p>

      <ul className="mb-6 space-y-2 text-sm text-slate-700 dark:text-slate-300">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />{item}</li>
        ))}
      </ul>

      {contact ? (
        <a href="https://t.me/hodunkooo" target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">{cta}</a>
      ) : (
        <Link to="/login" className={`block rounded-xl px-4 py-2.5 text-center font-semibold transition ${featured ? 'bg-violet-600 text-white hover:bg-violet-700' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'}`}>
          {cta}
        </Link>
      )}
    </div>
  );
}
