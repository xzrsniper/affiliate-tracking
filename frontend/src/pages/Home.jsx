import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext.jsx';
import api from '../config/api.js';
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
import SiteEditableText from '../components/SiteEditableText.jsx';

export default function Home() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isUk = i18n.language === 'uk';
  const [faqOpen, setFaqOpen] = useState(0);
  const [pageContent, setPageContent] = useState({});

  const loadPageContent = useCallback(async () => {
    try {
      const res = await api.get('/api/page-content/home');
      if (res.data?.content) {
        setPageContent(res.data.content);
      }
    } catch {
      setPageContent({});
    }
  }, []);

  useEffect(() => {
    loadPageContent();
  }, [loadPageContent]);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.page === 'home') loadPageContent();
    };
    window.addEventListener('lehko-page-content-refresh', handler);
    return () => window.removeEventListener('lehko-page-content-refresh', handler);
  }, [loadPageContent]);

  const contentText = (section, key, fallback) => {
    return pageContent?.[section]?.[key]?.content || fallback;
  };

  useEffect(() => {
    const defaultTitle = isUk ? 'LehkoTrack - Affiliate Tracking Platform' : 'LehkoTrack - Affiliate Tracking Platform';
    const defaultDescription = isUk
      ? 'Платформа трекінгу кліків, конверсій та прибутку для affiliate-маркетингу.'
      : 'Track affiliate clicks, conversions, and revenue in one dashboard.';

    const seoTitle = contentText('seo', 'title', defaultTitle);
    const seoDescription = contentText('seo', 'description', defaultDescription);

    document.title = seoTitle;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', seoDescription);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = seoDescription;
      document.head.appendChild(meta);
    }
  }, [pageContent, isUk]);

  const budgetPoints = useMemo(
    () => [
      contentText('budget', 'item1', t('home.budget1')),
      contentText('budget', 'item2', t('home.budget2')),
      contentText('budget', 'item3', t('home.budget3')),
      contentText('budget', 'item4', t('home.budget4')),
      contentText('budget', 'item5', t('home.budget5'))
    ],
    [pageContent, t]
  );

  const whyPoints = useMemo(
    () => [
      contentText('why', 'item1', t('home.benefit1')),
      contentText('why', 'item2', t('home.benefit2')),
      contentText('why', 'item3', t('home.benefit3')),
      contentText('why', 'item4', t('home.benefit4')),
      contentText('why', 'item5', t('home.benefit5')),
      contentText('why', 'item6', t('home.benefit6'))
    ],
    [pageContent, t]
  );

  const faqItems = useMemo(
    () =>
      [1, 2, 3, 4, 5, 6, 7].map((n) => ({
        q: contentText('faq', `q${n}`, t(`home.faqQ${n}`)),
        a: contentText('faq', `a${n}`, t(`home.faqA${n}`))
      })),
    [pageContent, t]
  );

  const channelRows = useMemo(
    () => [
      ['r1_name', 'r1_pct', 'r1_money'],
      ['r2_name', 'r2_pct', 'r2_money'],
      ['r3_name', 'r3_pct', 'r3_money'],
      ['r4_name', 'r4_pct', 'r4_money']
    ].map(([nk, pk, vk], i) => {
      const def = [
        [t('home.googleAds'), '85%', '$1,240'],
        [t('home.facebook'), '60%', '$890'],
        [t('home.telegram'), '40%', '$580'],
        [t('home.emailChannel'), '25%', '$340']
      ][i];
      return {
        name: contentText('channels', nk, def[0]),
        pct: contentText('channels', pk, def[1]),
        money: contentText('channels', vk, def[2])
      };
    }),
    [pageContent, t]
  );

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <nav className="sticky top-0 z-50 border-b border-[#d6deea] bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex h-[68px] w-full max-w-[1240px] items-center justify-between px-4 sm:px-8">
          <Logo size="md" showText={true} />

          <div className="hidden items-center gap-1 md:flex">
            <a href="#features" className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100">
              <SiteEditableText page="home" section="nav" fieldKey="features" value={contentText('nav', 'features', t('home.navFeatures'))} />
            </a>
            <a href="#pricing" className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100">
              <SiteEditableText page="home" section="nav" fieldKey="pricing" value={contentText('nav', 'pricing', t('home.navPricing'))} />
            </a>
            <Link to="/blog" className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100">{t('common.blog')}</Link>
            <Link to="/guide" className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100">
              <SiteEditableText page="home" section="nav" fieldKey="guide" value={contentText('nav', 'guide', t('home.navGuide'))} />
            </Link>
            <a href="https://t.me/hodunkooo" target="_blank" rel="noopener noreferrer" className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100">
              <SiteEditableText page="home" section="nav" fieldKey="support" value={contentText('nav', 'support', t('home.navSupport'))} />
            </a>
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
              <SiteEditableText page="home" section="nav" fieldKey="sign_in" value={contentText('nav', 'sign_in', t('home.signIn'))} />
            </Link>
            <Link to="/login" className="rounded-[10px] bg-[#6d5cf6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5d4af0] shadow-[0_10px_24px_rgba(109,92,246,0.28)]">
              <SiteEditableText page="home" section="nav" fieldKey="start_free" value={contentText('nav', 'start_free', t('home.startFree'))} />
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-12 px-4 pb-16 pt-16 sm:px-8 lg:grid-cols-2 lg:items-center lg:pt-20">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            <Sparkles className="h-3.5 w-3.5" />{' '}
            <SiteEditableText page="home" section="hero" fieldKey="badge" value={contentText('hero', 'badge', t('home.newVersionLive'))} as="span" />
          </div>

          <h1 className="mb-5 text-[36px] font-extrabold leading-tight tracking-[-0.03em] text-slate-900 dark:text-slate-100 sm:text-[52px]">
            <SiteEditableText page="home" section="hero" fieldKey="headline_before" value={contentText('hero', 'headline_before', t('home.heroHeadlineBefore1'))} as="span" />
            <span className="bg-gradient-to-r from-violet-700 to-indigo-500 bg-clip-text text-transparent">
              <SiteEditableText page="home" section="hero" fieldKey="headline_highlight_1" value={contentText('hero', 'headline_highlight_1', t('home.heroHeadlineHighlight1'))} as="span" />
            </span>
            <SiteEditableText page="home" section="hero" fieldKey="headline_mid" value={contentText('hero', 'headline_mid', t('home.heroHeadlineMid'))} as="span" />
            <span className="bg-gradient-to-r from-violet-700 to-indigo-500 bg-clip-text text-transparent">
              <SiteEditableText page="home" section="hero" fieldKey="headline_highlight_2" value={contentText('hero', 'headline_highlight_2', t('home.heroHeadlineHighlight2'))} as="span" />
            </span>
            <SiteEditableText page="home" section="hero" fieldKey="headline_end" value={contentText('hero', 'headline_end', t('home.heroHeadlineEnd'))} as="span" />
          </h1>

          <p className="mb-2 max-w-[560px] text-[17px] leading-relaxed text-slate-600 dark:text-slate-300">
            <SiteEditableText page="home" section="hero" fieldKey="subline" value={contentText('hero', 'subline', t('home.heroSubline'))} multiline as="span" className="text-[17px] leading-relaxed text-slate-600 dark:text-slate-300" />
          </p>
          <p className="mb-8 max-w-[560px] text-[17px] leading-relaxed text-slate-600 dark:text-slate-300">
            <SiteEditableText page="home" section="hero" fieldKey="subline2" value={contentText('hero', 'subline2', t('home.heroSubline2'))} multiline as="span" className="text-[17px] leading-relaxed text-slate-600 dark:text-slate-300" />
          </p>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Link to="/login" className="inline-flex items-center gap-2 rounded-[12px] bg-[#6d5cf6] px-6 py-3.5 font-semibold text-white transition hover:bg-[#5d4af0] shadow-[0_10px_24px_rgba(109,92,246,0.28)]">
              <SiteEditableText page="home" section="hero" fieldKey="cta_text" value={contentText('hero', 'cta_text', t('home.heroCta'))} as="span" /> <ArrowRight className="h-4 w-4" />
            </Link>
            <button type="button" className="inline-flex items-center gap-2 rounded-[12px] border-2 border-[#6d5cf6] bg-white px-6 py-3.5 font-semibold text-[#6d5cf6] transition hover:bg-[#f0edff] dark:border-[#8b7bff] dark:bg-transparent dark:text-white dark:hover:bg-white/5">
              <Play className="h-4 w-4" /> <SiteEditableText page="home" section="hero" fieldKey="watch_demo" value={contentText('hero', 'watch_demo', t('home.watchDemo'))} as="span" />
            </button>
          </div>

          <div className="text-sm text-slate-500">
            <SiteEditableText page="home" section="hero" fieldKey="note" value={contentText('hero', 'note', t('home.heroNote'))} as="span" />
          </div>
        </div>

          <div className="rounded-[22px] border border-[#d8dfeb] bg-white p-5 shadow-[0_24px_80px_rgba(19,33,68,0.14)] dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              <SiteEditableText page="home" section="demo" fieldKey="title" value={contentText('demo', 'title', t('home.campaignOverview'))} as="span" />
            </h3>
            <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
              <SiteEditableText page="home" section="demo" fieldKey="live_badge" value={contentText('demo', 'live_badge', t('home.live'))} as="span" />
            </span>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-3">
            <MetricCard
              label={<SiteEditableText page="home" section="demo" fieldKey="m_clicks_label" value={contentText('demo', 'm_clicks_label', t('home.clicks'))} as="span" />}
              value={<SiteEditableText page="home" section="demo" fieldKey="m_clicks_val" value={contentText('demo', 'm_clicks_val', '4,821')} as="span" />}
              delta={<SiteEditableText page="home" section="demo" fieldKey="m_clicks_delta" value={contentText('demo', 'm_clicks_delta', '+18.4%')} as="span" />}
            />
            <MetricCard
              label={<SiteEditableText page="home" section="demo" fieldKey="m_conv_label" value={contentText('demo', 'm_conv_label', t('home.conversions'))} as="span" />}
              value={<SiteEditableText page="home" section="demo" fieldKey="m_conv_val" value={contentText('demo', 'm_conv_val', '312')} as="span" />}
              delta={<SiteEditableText page="home" section="demo" fieldKey="m_conv_delta" value={contentText('demo', 'm_conv_delta', '+7.2%')} as="span" />}
              accent="violet"
            />
            <MetricCard
              label={<SiteEditableText page="home" section="demo" fieldKey="m_rev_label" value={contentText('demo', 'm_rev_label', t('home.revenue'))} as="span" />}
              value={<SiteEditableText page="home" section="demo" fieldKey="m_rev_val" value={contentText('demo', 'm_rev_val', '$2,140')} as="span" />}
              delta={<SiteEditableText page="home" section="demo" fieldKey="m_rev_delta" value={contentText('demo', 'm_rev_delta', '+23.1%')} as="span" />}
              accent="amber"
            />
          </div>

          <div className="mb-4 flex h-24 items-end gap-1 rounded-xl bg-slate-50 p-3">
            {[28, 44, 35, 57, 50, 71, 60, 83, 73, 94, 86, 100].map((h, i) => (
              <div key={`${h}-${i}`} className="w-full rounded-t bg-gradient-to-t from-[#6d5cf6] to-[#8aa4ff]" style={{ height: `${h}%` }} />
            ))}
          </div>

          <SourceRow
            name={<SiteEditableText page="home" section="demo" fieldKey="src1_name" value={contentText('demo', 'src1_name', t('home.googleAds'))} as="span" />}
            value={<SiteEditableText page="home" section="demo" fieldKey="src1_val" value={contentText('demo', 'src1_val', '2,344')} as="span" />}
            width="84%"
          />
          <SourceRow
            name={<SiteEditableText page="home" section="demo" fieldKey="src2_name" value={contentText('demo', 'src2_name', t('home.facebook'))} as="span" />}
            value={<SiteEditableText page="home" section="demo" fieldKey="src2_val" value={contentText('demo', 'src2_val', '1,590')} as="span" />}
            width="63%"
          />
          <SourceRow
            name={<SiteEditableText page="home" section="demo" fieldKey="src3_name" value={contentText('demo', 'src3_name', t('home.telegram'))} as="span" />}
            value={<SiteEditableText page="home" section="demo" fieldKey="src3_val" value={contentText('demo', 'src3_val', '744')} as="span" />}
            width="38%"
            last
          />
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#5d6df9] to-[#6e4dfa] py-16 text-white">
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-4 sm:px-8 lg:grid-cols-2 lg:items-center">
          <div>
          <h2 className="mb-6 text-3xl font-extrabold">
            <SiteEditableText page="home" section="budget" fieldKey="title" value={contentText('budget', 'title', t('home.budgetTitle'))} as="span" />
          </h2>
            <ul className="space-y-3">
              {budgetPoints.map((point, idx) => (
                <li key={`budget-${idx}`} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md border border-white/40 bg-white/15">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-white/95">
                    <SiteEditableText
                      page="home"
                      section="budget"
                      fieldKey={`item${idx + 1}`}
                      value={point}
                      as="span"
                      className="text-white/95"
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-white/20 bg-white/10 p-8 text-center backdrop-blur">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <TrendingUp className="h-6 w-6" />
            </div>
            <p className="text-lg leading-relaxed text-white/95">
              <SiteEditableText
                page="home"
                section="highlight"
                fieldKey="value_prop"
                value={contentText('highlight', 'value_prop', t('home.valueProp'))}
                multiline
                as="span"
                className="text-lg leading-relaxed text-white/95"
              />
            </p>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-[1240px] px-4 py-20 sm:px-8">
        <div className="mb-10">
          <span className="mb-3 inline-block rounded-full bg-violet-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-700">{t('home.navFeatures')}</span>
          <h2 className="mb-3 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            <SiteEditableText page="home" section="features" fieldKey="title" value={contentText('features', 'title', t('home.featuresSectionTitle'))} as="span" />
          </h2>
          <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            <SiteEditableText page="home" section="features" fieldKey="subtitle" value={contentText('features', 'subtitle', t('home.featuresSectionSubtitle'))} multiline as="span" className="text-lg text-slate-600 dark:text-slate-300" />
          </p>
        </div>

        <div className="mb-16 grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 dark:border-slate-700 dark:bg-slate-900">
            {channelRows.map((row, ri) => {
              const pctKey = ['r1_pct', 'r2_pct', 'r3_pct', 'r4_pct'][ri];
              const nameKey = ['r1_name', 'r2_name', 'r3_name', 'r4_name'][ri];
              const moneyKey = ['r1_money', 'r2_money', 'r3_money', 'r4_money'][ri];
              return (
                <div key={`ch-${ri}`} className="mb-3 flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3 last:mb-0 dark:border-slate-700 dark:bg-slate-800">
                  <span className="w-28 shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <SiteEditableText page="home" section="channels" fieldKey={nameKey} value={row.name} as="span" />
                  </span>
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div className="h-2 min-w-0 flex-1 rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className="h-2 rounded-full bg-gradient-to-r from-[#6d5cf6] to-[#5ea8ff]" style={{ width: row.pct }} />
                    </div>
                    <SiteEditableText
                      page="home"
                      section="channels"
                      fieldKey={pctKey}
                      value={row.pct}
                      as="span"
                      className="w-10 shrink-0 text-center text-[11px] tabular-nums text-slate-500 dark:text-slate-400"
                    />
                  </div>
                  <span className="shrink-0 text-sm font-bold text-violet-700">
                    <SiteEditableText page="home" section="channels" fieldKey={moneyKey} value={row.money} as="span" />
                  </span>
                </div>
              );
            })}
          </div>
          <div>
            <h3 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              <SiteEditableText page="home" section="money" fieldKey="title" value={contentText('money', 'title', t('home.moneyFromTitle'))} as="span" />
            </h3>
            <p className="mb-5 leading-relaxed text-slate-600 dark:text-slate-300">
              <SiteEditableText page="home" section="money" fieldKey="description" value={contentText('money', 'description', t('home.moneyFromDesc'))} multiline as="span" className="leading-relaxed text-slate-600 dark:text-slate-300" />
            </p>
            <ul className="space-y-2 text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" /><SiteEditableText page="home" section="money" fieldKey="bullet1" value={contentText('money', 'bullet1', t('home.moneyFromBullet1'))} as="span" /></li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" /><SiteEditableText page="home" section="money" fieldKey="bullet2" value={contentText('money', 'bullet2', t('home.moneyFromBullet2'))} as="span" /></li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" /><SiteEditableText page="home" section="money" fieldKey="bullet3" value={contentText('money', 'bullet3', t('home.moneyFromBullet3'))} as="span" /></li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <h3 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              <SiteEditableText page="home" section="integration" fieldKey="title" value={contentText('integration', 'title', t('home.integration5minTitle'))} as="span" />
            </h3>
            <p className="mb-5 leading-relaxed text-slate-600 dark:text-slate-300">
              <SiteEditableText page="home" section="integration" fieldKey="description" value={contentText('integration', 'description', t('home.integration5minDesc'))} multiline as="span" className="leading-relaxed text-slate-600 dark:text-slate-300" />
            </p>
            <ul className="space-y-2 text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" /><SiteEditableText page="home" section="integration" fieldKey="bullet1" value={contentText('integration', 'bullet1', t('home.integrationBullet1'))} as="span" /></li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" /><SiteEditableText page="home" section="integration" fieldKey="bullet2" value={contentText('integration', 'bullet2', t('home.integrationBullet2'))} as="span" /></li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" /><SiteEditableText page="home" section="integration" fieldKey="bullet3" value={contentText('integration', 'bullet3', t('home.integrationBullet3'))} as="span" /></li>
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
            <h2 className="mb-4 text-3xl font-extrabold">
              <SiteEditableText page="home" section="why" fieldKey="title" value={contentText('why', 'title', t('home.whyTitle'))} as="span" className="text-white" />
            </h2>
            <p className="mb-6 text-white/80">
              <SiteEditableText page="home" section="why" fieldKey="subtitle" value={contentText('why', 'subtitle', t('home.whySubtitle'))} multiline as="span" className="text-white/80" />
            </p>
            <ul className="space-y-2">
              {whyPoints.map((point, idx) => (
                <li key={`why-${idx}`} className="flex items-start gap-2 text-white/95">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <SiteEditableText page="home" section="why" fieldKey={`item${idx + 1}`} value={point} as="span" className="text-white/95" />
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <StatCard
              icon={<ShieldCheck className="h-7 w-7" />}
              value={<SiteEditableText page="home" section="why_stats" fieldKey="card1_value" value={contentText('why_stats', 'card1_value', '100+')} as="span" />}
              label={<SiteEditableText page="home" section="why_stats" fieldKey="card1_label" value={contentText('why_stats', 'card1_label', t('home.statAccuracy'))} as="span" />}
            />
            <StatCard
              icon={<BarChart3 className="h-7 w-7" />}
              value={<SiteEditableText page="home" section="why_stats" fieldKey="card2_value" value={contentText('why_stats', 'card2_value', t('home.statSetupValue'))} as="span" />}
              label={<SiteEditableText page="home" section="why_stats" fieldKey="card2_label" value={contentText('why_stats', 'card2_label', t('home.statSetup'))} as="span" />}
            />
            <StatCard
              icon={<TrendingUp className="h-7 w-7" />}
              value={<SiteEditableText page="home" section="why_stats" fieldKey="card3_value" value={contentText('why_stats', 'card3_value', '24/7')} as="span" />}
              label={<SiteEditableText page="home" section="why_stats" fieldKey="card3_label" value={contentText('why_stats', 'card3_label', t('home.statMonitoring'))} as="span" />}
            />
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-[1240px] px-4 py-20 sm:px-8">
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block rounded-full bg-violet-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-700">{t('home.navPricing')}</span>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            <SiteEditableText page="home" section="pricing" fieldKey="title" value={contentText('pricing', 'title', t('home.pricingTitle'))} as="span" />
          </h2>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-3">
          <PricingCard section="plan_starter" contentText={contentText} t={t} />
          <PricingCard section="plan_pro" featured popular contentText={contentText} t={t} perSuffix={contentText('pricing', 'per_month', t('home.perMonth'))} />
          <PricingCard section="plan_agency" contact contentText={contentText} t={t} perSuffix={contentText('pricing', 'per_month', t('home.perMonth'))} />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-8">
        <div className="mb-8 text-center">
          <span className="mb-3 inline-block rounded-full bg-violet-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-700">
            <SiteEditableText page="home" section="faq" fieldKey="title" value={contentText('faq', 'title', t('common.faq'))} as="span" />
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            <SiteEditableText page="home" section="faq" fieldKey="title" value={contentText('faq', 'title', t('common.faq'))} as="span" />
          </h2>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          {faqItems.map((item, idx) => {
            const open = faqOpen === idx;
            const n = idx + 1;
            return (
              <div key={`faq-${idx}`} className="border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                <button
                  type="button"
                  onClick={() => setFaqOpen(open ? -1 : idx)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className={`font-semibold ${open ? 'text-violet-700 dark:text-violet-300' : 'text-slate-800 dark:text-slate-200'}`}>
                    <SiteEditableText page="home" section="faq" fieldKey={`q${n}`} value={item.q} as="span" />
                  </span>
                  <ChevronDown className={`h-5 w-5 text-slate-400 dark:text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                  <div className="px-5 pb-4 text-slate-600 dark:text-slate-300">
                    <SiteEditableText page="home" section="faq" fieldKey={`a${n}`} value={item.a} multiline as="span" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <p className="mb-3 font-medium text-slate-700 dark:text-slate-200">
            <SiteEditableText page="home" section="faq" fieldKey="help_title" value={contentText('faq', 'help_title', t('home.faqHelpTitle'))} as="span" />
          </p>
          <p className="mb-3">
            <SiteEditableText page="home" section="faq" fieldKey="help_description" value={contentText('faq', 'help_description', t('home.faqHelpDesc'))} multiline as="span" />
          </p>
          <a
            href="https://t.me/hodunkooo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            <SiteEditableText page="home" section="faq" fieldKey="help_button" value={contentText('faq', 'help_button', t('home.faqHelpBtn'))} as="span" />
          </a>
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#4f81ff] to-[#6b4ffb] py-14 text-white">
        <div className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-5 px-4 sm:px-8 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              <SiteEditableText page="home" section="cta" fieldKey="title" value={contentText('cta', 'title', t('home.readyScale'))} as="span" className="text-white" />
            </h2>
            <p className="mt-1 text-white/85">
              <SiteEditableText page="home" section="cta" fieldKey="description" value={contentText('cta', 'description', t('home.register30secCardless'))} multiline as="span" className="text-white/85" />
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
              <Link to="/login" className="rounded-xl border border-white/60 bg-white/12 px-6 py-3 font-semibold text-slate-100 backdrop-blur-sm transition hover:bg-white/18">
                <SiteEditableText page="home" section="bottom_cta" fieldKey="start_free" value={contentText('bottom_cta', 'start_free', t('home.startFree'))} as="span" />
              </Link>
            <a href="https://t.me/hodunkooo" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/40 bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/20">
              <SiteEditableText page="home" section="bottom_cta" fieldKey="talk_to_us" value={contentText('bottom_cta', 'talk_to_us', t('home.talkToUs'))} as="span" />
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#d6deea] bg-white py-10 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-4 px-4 text-sm text-slate-500 dark:text-slate-400 sm:px-8 lg:flex-row lg:items-center">
          <Logo size="sm" showText={true} />
          <div className="flex flex-wrap gap-5">
            <a href="#features" className="hover:text-slate-800 dark:hover:text-slate-100">
              <SiteEditableText page="home" section="footer" fieldKey="features" value={contentText('footer', 'features', t('home.navFeatures'))} as="span" />
            </a>
            <a href="#pricing" className="hover:text-slate-800 dark:hover:text-slate-100">
              <SiteEditableText page="home" section="footer" fieldKey="pricing" value={contentText('footer', 'pricing', t('home.navPricing'))} as="span" />
            </a>
            <Link to="/guide" className="hover:text-slate-800 dark:hover:text-slate-100">{t('common.documentation')}</Link>
            <Link to="/terms" className="hover:text-slate-800 dark:hover:text-slate-100">Terms</Link>
            <Link to="/privacy" className="hover:text-slate-800 dark:hover:text-slate-100">Privacy</Link>
            <Link to="/refund" className="hover:text-slate-800 dark:hover:text-slate-100">Refund</Link>
            <a href="https://t.me/hodunkooo" target="_blank" rel="noopener noreferrer" className="hover:text-slate-800 dark:hover:text-slate-100">
              <SiteEditableText page="home" section="footer" fieldKey="support" value={contentText('footer', 'support', t('home.navSupport'))} as="span" />
            </a>
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
      <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className={`text-xl font-extrabold ${valueClass}`}>{value}</div>
      <div className="text-[11px] font-semibold text-green-600">{delta}</div>
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

function PricingCard({ section, featured = false, popular = false, contact = false, contentText, t, perSuffix }) {
  const c = (key, fb) => contentText(section, key, fb);

  const cfg =
    section === 'plan_starter'
      ? {
          nameFb: t('home.planStarter'),
          priceFb: t('home.planStarterPrice'),
          descFb: t('home.planStarterDesc'),
          ctaFb: t('home.planStarterAction'),
          itemKeys: ['item1', 'item2', 'item3', 'item4'],
          itemFbs: [1, 2, 3, 4].map((i) => t(`home.planStarterItem${i}`))
        }
      : section === 'plan_pro'
        ? {
            badgeFb: t('home.planPopular'),
            nameFb: t('home.planPro'),
            priceFb: t('home.planProPrice'),
            descFb: t('home.planProDesc'),
            ctaFb: t('home.planProAction'),
            itemKeys: ['item1', 'item2', 'item3', 'item4', 'item5', 'item6'],
            itemFbs: [1, 2, 3, 4, 5, 6].map((i) => t(`home.planProItem${i}`))
          }
        : {
            nameFb: t('home.planAgency'),
            priceFb: t('home.planAgencyPrice'),
            descFb: t('home.planAgencyDesc'),
            ctaFb: t('home.navContacts'),
            itemKeys: ['item1', 'item2', 'item3', 'item4', 'item5'],
            itemFbs: [1, 2, 3, 4, 5].map((i) => t(`home.planAgencyItem${i}`))
          };

  const showPer = section === 'plan_pro' || section === 'plan_agency';
  const per = showPer ? perSuffix ?? t('home.perMonth') : null;

  return (
    <div
      className={`relative rounded-3xl border p-7 ${featured ? 'border-2 border-violet-600 bg-white shadow-lg shadow-violet-200/60 dark:bg-slate-900 dark:shadow-violet-900/30' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}
    >
      {popular ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
          <SiteEditableText page="home" section="plan_pro" fieldKey="badge" value={c('badge', cfg.badgeFb)} as="span" />
        </span>
      ) : null}

      <p className={`mb-3 text-xs font-bold uppercase tracking-wider ${featured ? 'text-violet-700 dark:text-violet-300' : 'text-slate-500 dark:text-slate-400'}`}>
        <SiteEditableText page="home" section={section} fieldKey="name" value={c('name', cfg.nameFb)} as="span" />
      </p>
      <p className="mb-1 text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
        <SiteEditableText page="home" section={section} fieldKey="price" value={c('price', cfg.priceFb)} as="span" />
        {per ? (
          <span className="text-base font-medium text-slate-500 dark:text-slate-400">
            <SiteEditableText page="home" section="pricing" fieldKey="per_month" value={per} as="span" />
          </span>
        ) : null}
      </p>
      <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
        <SiteEditableText page="home" section={section} fieldKey="desc" value={c('desc', cfg.descFb)} multiline as="span" className="text-sm text-slate-500 dark:text-slate-400" />
      </p>

      <ul className="mb-6 space-y-2 text-sm text-slate-700 dark:text-slate-300">
        {cfg.itemKeys.map((ik, i) => (
          <li key={ik} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-600" />
            <SiteEditableText page="home" section={section} fieldKey={ik} value={c(ik, cfg.itemFbs[i])} as="span" />
          </li>
        ))}
      </ul>

      {contact ? (
        <a
          href="https://t.me/hodunkooo"
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          <SiteEditableText page="home" section={section} fieldKey="cta" value={c('cta', cfg.ctaFb)} as="span" />
        </a>
      ) : (
        <Link
          to="/login"
          className={`block rounded-xl px-4 py-2.5 text-center font-semibold transition ${featured ? 'bg-violet-600 text-white hover:bg-violet-700' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'}`}
        >
          <SiteEditableText page="home" section={section} fieldKey="cta" value={c('cta', cfg.ctaFb)} as="span" />
        </Link>
      )}
    </div>
  );
}
