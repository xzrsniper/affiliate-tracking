import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Settings, FileCode, MessageCircle, ArrowLeft, ExternalLink, Check } from 'lucide-react';
import Logo from '../components/Logo.jsx';

const TELEGRAM_URL = import.meta.env.VITE_TELEGRAM_USERNAME
  ? `https://t.me/${import.meta.env.VITE_TELEGRAM_USERNAME}`
  : 'https://t.me/hodunkooo';

export default function Guide() {
  const { t } = useTranslation();
  const apiBase = typeof window !== 'undefined' ? window.location.origin : '';

  const cards = [
    {
      key: 'install',
      icon: Settings,
      title: t('guide.installTitle'),
      description: t('guide.installDesc'),
      to: '/setup',
      external: false
    },
    {
      key: 'api',
      icon: FileCode,
      title: t('guide.apiTitle'),
      description: t('guide.apiDesc'),
      to: `${apiBase}/api`,
      external: true
    },
    {
      key: 'telegram',
      icon: MessageCircle,
      title: t('guide.telegramTitle'),
      description: t('guide.telegramDesc'),
      to: TELEGRAM_URL,
      external: true
    }
  ];

  return (
    <div className="min-h-screen bg-[#f7fbfd] text-slate-900">
      <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[60px] max-w-[1280px] items-center justify-between px-4 sm:px-8 lg:px-10">
          <Logo size="md" showText={true} />
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <Link to="/settings" className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">Settings</Link>
            <Link to="/login" className="rounded-lg bg-violet-700 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-violet-800">Account</Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1280px] px-4 py-14 sm:px-8 lg:px-10">
        <section className="mb-10 text-center">
          <span className="mb-4 inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-700">
            Tracker
          </span>
          <h1 className="mb-3 font-display text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Get <span className="text-violet-700">Tracker</span> running
            <br />on your store in 10 minutes
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600 leading-relaxed">
            Follow the steps below to install the tracking pixel, configure your first link, and start seeing real-time analytics.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/setup" className="rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-800">Watch Video Tutorial</Link>
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Read Full Docs</a>
          </div>
        </section>

        <section className="mx-auto mb-10 max-w-4xl rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Your setup progress</span>
            <span className="text-sm font-semibold text-violet-700">1 / 3 complete</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-1/3 bg-gradient-to-r from-violet-600 to-indigo-600" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-slate-500">
            <span className="text-violet-700">Pixel installed</span>
            <span>Create link</span>
            <span>First conversion</span>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            const content = (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 ring-1 ring-violet-200">
                    <Icon className="h-6 w-6 text-violet-600" />
                  </div>
                  <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-violet-700">
                    {card.key === 'install' ? 'Step 1' : card.key === 'api' ? 'Step 2' : 'Step 3'}
                  </span>
                </div>
                <h2 className="mb-2 text-xl font-bold text-slate-800">
                  {card.title}
                </h2>
                <p className="mb-4 flex-1 text-slate-600">
                  {card.description}
                </p>
                <ul className="mb-5 space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />Follow all steps in order</li>
                  <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-violet-600" />Verify tracking after each update</li>
                </ul>
                <span className="inline-flex items-center gap-1.5 text-violet-600 font-medium">
                  {card.key === 'install' && t('guide.installLink')}
                  {card.key === 'api' && t('guide.apiLink')}
                  {card.key === 'telegram' && t('guide.telegramLink')}
                  {card.external && <ExternalLink className="w-4 h-4" />}
                </span>
              </>
            );

            if (card.external) {
              return (
                <a
                  key={card.key}
                  href={card.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-200/50"
                >
                  {content}
                </a>
              );
            }

            return (
              <Link
                key={card.key}
                to={card.to}
                className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-200/50"
              >
                {content}
              </Link>
            );
          })}
        </section>

        <section className="mx-auto mt-10 max-w-4xl">
          <h3 className="mb-4 text-2xl font-extrabold tracking-tight text-slate-900">Frequently Asked Questions</h3>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {[
              'Чи потрібен програміст для встановлення?',
              'Як швидко з’являються дані в Dashboard?',
              'Чи можна підключити кілька сайтів?',
              'Як перевірити, що трекер працює?'
            ].map((q, i) => (
              <div key={q} className={`px-5 py-4 ${i < 3 ? 'border-b border-slate-100' : ''}`}>
                <p className="font-semibold text-slate-800">{q}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

