import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Settings, FileCode, MessageCircle, ArrowLeft, ExternalLink } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo size="md" showText={true} />
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('guide.backHome')}
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
            {t('guide.title')}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            {t('guide.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card) => {
            const Icon = card.icon;
            const content = (
              <>
                <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/40 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                  {card.title}
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-5 flex-1">
                  {card.description}
                </p>
                <span className="inline-flex items-center gap-1.5 text-violet-600 dark:text-violet-400 font-medium">
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
                  className="block bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-800 transition-all flex flex-col"
                >
                  {content}
                </a>
              );
            }

            return (
              <Link
                key={card.key}
                to={card.to}
                className="block bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-800 transition-all flex flex-col"
              >
                {content}
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
