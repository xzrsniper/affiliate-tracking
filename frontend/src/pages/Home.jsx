import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Check,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Play
} from 'lucide-react';
import Logo from '../components/Logo.jsx';

export default function Home() {
  const { t, i18n } = useTranslation();
  const isUk = i18n.language === 'uk';
  const [faqOpen, setFaqOpen] = useState(0);

  const budgetPoints = [
    'Ви не оцінюєте рекламу по прибутку, а тільки по кліках',
    'Ви не знаєте, яке джерело трафіку реально продає',
    'У вас 3-5 різних звітів замість одного',
    'Ви довіряєте скріншотам від підрядників',
    'Ви не рахуєте ROMI по кожному каналу'
  ];

  const benefits = [
    'Автоматичне відстеження кліків та конверсій',
    'Підтримка visitor fingerprint для унікальних відвідувачів',
    'Гнучкі налаштування для різних джерел трафіку',
    'API для інтеграції з вашими системами',
    'Детальна статистика та звіти',
    'Безкоштовний старт з можливістю масштабування'
  ];

  const faqItems = [
    {
      q: 'Як TrackFlow впливає на швидкість завантаження мого сайту?',
      a: 'Практично ніяк. Наш скрипт оптимізований і завантажується асинхронно, тому не блокує рендер сторінки.'
    },
    {
      q: 'Чи потрібно бути програмістом, щоб усе налаштувати?',
      a: 'Ні. У більшості випадків достатньо вставити 1 фрагмент коду або додати тег через GTM.'
    },
    {
      q: 'Чим це краще за стандартний GA4?',
      a: 'TrackFlow показує бізнес-метрики в одному місці: конверсії, виручку, ROMI та джерела трафіку без зайвої складності.'
    },
    {
      q: 'Чи можна підключити декілька сайтів до одного кабінету?',
      a: 'Так, ви можете вести кілька проектів в одному акаунті з розділеною аналітикою по кожному сайту.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#f7fbfd] text-slate-900 bg-[radial-gradient(circle_at_10%_0%,rgba(109,40,217,0.12),transparent_45%),radial-gradient(circle_at_90%_5%,rgba(245,158,11,0.1),transparent_40%)]">
      <nav className="sticky top-0 z-50 border-b border-[#d6e3e8] bg-[#f7fbfd]/90 backdrop-blur">
        <div className="mx-auto flex h-[68px] w-full max-w-[1280px] items-center justify-between px-4 sm:px-8 lg:px-12">
          <Logo size="md" showText={true} />
          <div className="hidden items-center gap-1 md:flex">
            <a href="#features" className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900">Features</a>
            <a href="#pricing" className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900">Pricing</a>
            <Link to="/guide" className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900">Guide</Link>
            <a href="https://t.me/hodunkooo" target="_blank" rel="noopener noreferrer" className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900">Support</a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => i18n.changeLanguage(isUk ? 'en' : 'uk')}
              className="rounded-lg px-2 py-1 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              {isUk ? 'EN' : 'УКР'}
            </button>
            <Link to="/login" className="hidden rounded-[9px] border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:block">
              Sign in
            </Link>
            <Link to="/login" className="rounded-[9px] bg-violet-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-800 shadow-[0_6px_18px_rgba(109,40,217,0.22)]">
              Start free
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-10 px-4 pb-16 pt-20 sm:px-8 lg:grid-cols-2 lg:gap-14 lg:px-12 lg:pt-24">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            <Sparkles className="h-3.5 w-3.5" /> New version is live
          </div>
          <h1 className="mb-5 font-display text-[44px] font-extrabold leading-[1.1] tracking-[-0.03em] text-slate-900 sm:text-[56px]">
            Track every click.<br />
            <span className="bg-gradient-to-br from-violet-900 to-violet-500 bg-clip-text text-transparent">Grow every sale.</span>
          </h1>
          <p className="mb-9 max-w-[500px] text-[17px] leading-[1.75] text-slate-600">
            Affiliate and UTM tracking platform with real-time analytics, conversion attribution, and revenue clarity.
          </p>
          <div className="mb-8 flex flex-wrap gap-3">
            <Link to="/login" className="inline-flex items-center gap-2 rounded-[11px] bg-violet-700 px-6 py-3 font-semibold text-white transition hover:bg-violet-800 shadow-[0_6px_18px_rgba(109,40,217,0.22)]">
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <button className="inline-flex items-center gap-2 rounded-[11px] border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100">
              <Play className="h-4 w-4" /> Watch demo
            </button>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <div className="flex -space-x-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-amber-300">А</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-green-300">В</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-sky-300">Д</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-rose-300">С</span>
            </div>
            <span>Trusted by <strong className="text-slate-800">1000+ teams</strong></span>
          </div>
        </div>

        <div className="relative rounded-[20px] border border-[#d6e3e8] bg-white p-5 shadow-[0_28px_70px_rgba(11,37,48,0.16),0_4px_18px_rgba(11,37,48,0.06)]">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">Campaign overview</h3>
            <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">Live</span>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Clicks</p>
              <p className="text-xl font-extrabold text-slate-900">4,821</p>
              <p className="text-[11px] font-semibold text-green-600">+18.4%</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Conversions</p>
              <p className="text-xl font-extrabold text-violet-600">312</p>
              <p className="text-[11px] font-semibold text-green-600">+7.2%</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Revenue</p>
              <p className="text-xl font-extrabold text-amber-600">$2,140</p>
              <p className="text-[11px] font-semibold text-green-600">+23.1%</p>
            </div>
          </div>
          <div className="mb-4 flex h-24 items-end gap-1 rounded-xl bg-slate-50 p-3">
            {[30, 50, 40, 65, 55, 75, 60, 85, 70, 100, 80, 90].map((h) => (
              <div key={h} className="w-full rounded-t bg-violet-500/80" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2"><span className="font-medium text-slate-700">Google Ads</span><span className="font-semibold text-violet-600">2,144</span></div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2"><span className="font-medium text-slate-700">Facebook</span><span className="font-semibold text-violet-600">1,390</span></div>
            <div className="flex items-center justify-between"><span className="font-medium text-slate-700">Telegram</span><span className="font-semibold text-violet-600">744</span></div>
          </div>
          <div className="absolute -bottom-4 -left-4 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
            <p className="text-xs font-semibold text-slate-800">Attribution live</p>
            <p className="text-xs text-slate-500">Real-time updates enabled</p>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 px-4 text-sm text-slate-500 sm:px-6 lg:px-8">
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
            <h2 className="mb-6 text-3xl font-extrabold text-white">Ви втрачаєте бюджет якщо...</h2>
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
            <p className="text-lg leading-relaxed">
              TrackFlow об'єднує всі джерела трафіку в один центр контролю та показує тільки те, що має значення - продажі та прибуток.
            </p>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12">
          <span className="mb-3 inline-block rounded-full bg-violet-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-700">Функції</span>
          <h2 className="mb-3 text-4xl font-extrabold tracking-tight text-slate-900">Все що вам потрібно<br />для зростання</h2>
          <p className="max-w-2xl text-lg text-slate-600">Від базового трекінгу до глибокої аналітики - TrackFlow дає повну картину маркетингу.</p>
        </div>

        <div className="mb-16 grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-7">
            {[
              ['Google Ads', '85%', '$1,240'],
              ['Facebook', '60%', '$890'],
              ['Telegram', '40%', '$580'],
              ['Email', '25%', '$340']
            ].map((row) => (
              <div key={row[0]} className="mb-3 flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3 last:mb-0">
                <span className="w-24 text-sm font-semibold text-slate-700">{row[0]}</span>
                <div className="h-2 flex-1 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-500" style={{ width: row[1] }} /></div>
                <span className="text-sm font-bold text-violet-700">{row[2]}</span>
              </div>
            ))}
          </div>
          <div>
            <h3 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-900">Знай звідки приходять твої <span className="text-violet-600">гроші</span></h3>
            <p className="mb-5 leading-relaxed text-slate-600">Точна атрибуція за всіма каналами: Google, Facebook, email, Telegram, органіка. Розуміння ROI кожного каналу - ключ до зростання.</p>
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />UTM-параметри та кастомні теги</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />Multi-touch атрибуція</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />Порівняння по часових проміжках</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <h3 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-900">Інтеграція за <span className="text-violet-600">5 хвилин</span></h3>
            <p className="mb-5 leading-relaxed text-slate-600">Один рядок коду на сайті - і ти вже відстежуєш. Підтримка GTM, WordPress, Shopify та будь-якого іншого сайту.</p>
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />JavaScript сніпет в 1 рядок</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />Google Tag Manager рецепт</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />REST API для власних інтеграцій</li>
            </ul>
          </div>
          <div className="rounded-3xl bg-slate-900 p-6 font-mono text-sm text-violet-200 shadow-xl">
            <p className="mb-2 text-slate-400">&lt;!-- Додай на сайт --&gt;</p>
            <p>&lt;script src="https://cdn.trckflw.io/pixel.js"</p>
            <p className="pl-3">data-site-id="your-id"&gt;&lt;/script&gt;</p>
            <p className="mt-3 text-slate-400">&lt;!-- Ось і все! --&gt;</p>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-14">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h3 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900">Готовий почати з <span className="text-violet-600">TrackFlow</span>?</h3>
          <p className="mb-6 text-slate-600">Безкоштовно. Кредитна картка не потрібна. Реєстрація за 30 секунд.</p>
          <Link to="/login" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-7 py-3 font-semibold text-white transition hover:bg-violet-700">Створити акаунт <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <section className="bg-gradient-to-r from-indigo-500 to-violet-600 py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div>
            <h2 className="mb-4 text-3xl font-extrabold text-white">Чому бізнеси обирають<br />TrackFlow?</h2>
            <p className="mb-6 text-white/80">Професійна система трекінгу реклами та обліку трафіку з повним контролем конверсій, доходу та окупності.</p>
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
            <div className="flex items-center gap-4 rounded-2xl border border-white/25 bg-white/10 p-5 text-white backdrop-blur"><div className="text-3xl">👥</div><div><div className="text-3xl font-extrabold">1000+</div><div className="text-white/80">Активних користувачів</div></div></div>
            <div className="flex items-center gap-4 rounded-2xl border border-white/25 bg-white/10 p-5 text-white backdrop-blur"><div className="text-3xl">📈</div><div><div className="text-3xl font-extrabold">1M+</div><div className="text-white/80">Відстежених кліків</div></div></div>
            <div className="flex items-center gap-4 rounded-2xl border border-white/25 bg-white/10 p-5 text-white backdrop-blur"><div className="text-3xl">💵</div><div><div className="text-3xl font-extrabold">$10M+</div><div className="text-white/80">Відстежених доходів</div></div></div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block rounded-full bg-violet-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-700">Тарифи</span>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">Прозорі ціни без сюрпризів</h2>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-7">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Старт</p>
            <p className="mb-1 text-4xl font-extrabold tracking-tight">Безкоштовно</p>
            <p className="mb-5 text-sm text-slate-500">Ідеально для початку</p>
            <ul className="mb-6 space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />До 10,000 кліків/міс</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />1 сайт</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />Базова аналітика</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />30 днів зберігання</li>
            </ul>
            <Link to="/login" className="block rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center font-semibold text-slate-700 transition hover:bg-slate-100">Почати</Link>
          </div>

          <div className="relative rounded-3xl border-2 border-violet-600 bg-white p-7 shadow-lg shadow-violet-200/60">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">Популярний</span>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-violet-700">Про</p>
            <p className="mb-1 text-5xl font-extrabold tracking-tight">$29<span className="text-base font-medium text-slate-500">/міс</span></p>
            <p className="mb-5 text-sm text-slate-500">Для серйозних маркетологів</p>
            <ul className="mb-6 space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />До 500,000 кліків/міс</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />10 сайтів</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />Розширена аналітика</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />1 рік зберігання</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />Email звіти</li>
            </ul>
            <Link to="/login" className="block rounded-xl bg-violet-600 px-4 py-2.5 text-center font-semibold text-white transition hover:bg-violet-700">Обрати план</Link>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Агентство</p>
            <p className="mb-1 text-5xl font-extrabold tracking-tight">$99<span className="text-base font-medium text-slate-500">/міс</span></p>
            <p className="mb-5 text-sm text-slate-500">Для команд та агентств</p>
            <ul className="mb-6 space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />Необмежено кліків</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />Необмежено сайтів</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />White label</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />Командний доступ</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />Пріоритетна підтримка</li>
            </ul>
            <a href="https://t.me/hodunkooo" target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center font-semibold text-slate-700 transition hover:bg-slate-100">Контакти</a>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <span className="mb-3 inline-block rounded-full bg-violet-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-700">FAQ</span>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">Часті запитання</h2>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white">
            {faqItems.map((item, idx) => {
              const open = faqOpen === idx;
              return (
                <div key={item.q} className="border-b border-slate-100 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setFaqOpen(open ? -1 : idx)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                  >
                    <span className={`font-semibold ${open ? 'text-violet-700' : 'text-slate-800'}`}>{item.q}</span>
                    <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <div className="px-5 pb-4 text-slate-600">{item.a}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-violet-600 to-indigo-600 py-14">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Готовий масштабувати свої кампанії?</h2>
            <p className="mt-1 text-white/85">Реєстрація за 30 секунд. Кредитна картка не потрібна.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/login" className="rounded-xl bg-white px-6 py-3 font-semibold text-violet-700 transition hover:bg-slate-100">Почати безкоштовно</Link>
            <a href="https://t.me/hodunkooo" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/40 bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/20">Поговорити з нами</a>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <Logo size="sm" showText={true} />
          <div className="flex flex-wrap gap-5">
            <a href="#features" className="hover:text-slate-800">Функції</a>
            <a href="#pricing" className="hover:text-slate-800">Ціни</a>
            <Link to="/guide" className="hover:text-slate-800">Docs</Link>
            <a href="https://t.me/hodunkooo" target="_blank" rel="noopener noreferrer" className="hover:text-slate-800">Підтримка</a>
          </div>
          <span>© 2026 TrackFlow. Всі права захищені.</span>
        </div>
      </footer>
    </div>
  );
}

