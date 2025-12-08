import { Link } from 'react-router-dom';
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
  Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Home() {
  console.log('🏠 Home component rendering...');
  
  let theme = 'light';
  let toggleTheme = () => {};
  
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    toggleTheme = themeContext.toggleTheme;
    console.log('✅ Theme context loaded:', theme);
  } catch (error) {
    console.error('❌ Error loading theme:', error);
  }
  const features = [
    {
      icon: MousePointerClick,
      title: 'Відстеження кліків',
      description: 'Точна статистика по кожному tracking посиланню з розбивкою на унікальні та загальні кліки'
    },
    {
      icon: TrendingUp,
      title: 'Конверсії та доходи',
      description: 'Автоматичне відстеження конверсій та розрахунок доходів від ваших партнерських програм'
    },
    {
      icon: Shield,
      title: 'Надійність',
      description: 'Захищена система з підтримкою visitor fingerprint для точного відстеження'
    },
    {
      icon: Zap,
      title: 'Просте встановлення',
      description: 'Один рядок коду або інтеграція через Google Tag Manager - працює на будь-якому сайті'
    },
    {
      icon: BarChart3,
      title: 'Детальна аналітика',
      description: 'Повна статистика по джерелам трафіку, конверсіям та ефективності кампаній'
    },
    {
      icon: Globe,
      title: 'Універсальність',
      description: 'Працює з будь-якими e-commerce платформами та системами управління контентом'
    }
  ];

  const benefits = [
    'Автоматичне відстеження кліків та конверсій',
    'Підтримка visitor fingerprint для унікальних відвідувачів',
    'Гнучкі налаштування для різних джерел трафіку',
    'API для інтеграції з вашими системами',
    'Детальна статистика та звіти',
    'Безкоштовний старт з можливістю масштабування'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30 dark:opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, ${theme === 'dark' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.1)'} 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>
      
      {/* Gradient Orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-violet-400/20 dark:bg-violet-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      
      <div className="relative z-10">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <MousePointerClick className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800 dark:text-white">Affiliate Tracker</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title={theme === 'dark' ? 'Світла тема' : 'Темна тема'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
              <Link
                to="/login"
                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
              >
                Увійти
              </Link>
              <Link
                to="/login"
                className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25"
              >
                Почати безкоштовно
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            Відстежуйте{' '}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              партнерські програми
            </span>
            <br />
            з точністю до кліку
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
            Професійна система відстеження affiliate трафіку з автоматичним підрахунком конверсій та доходів. 
            Встановлення за 2 хвилини, працює на будь-якому сайті.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/login"
              className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 flex items-center space-x-2 text-lg"
            >
              <span>Створити акаунт</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-violet-600 dark:text-violet-400 mb-2">100%</div>
            <div className="text-slate-600 dark:text-slate-400">Точність відстеження</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-violet-600 dark:text-violet-400 mb-2">&lt;2 хв</div>
            <div className="text-slate-600 dark:text-slate-400">Встановлення</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-violet-600 dark:text-violet-400 mb-2">24/7</div>
            <div className="text-slate-600 dark:text-slate-400">Моніторинг</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Всі можливості для успішного tracking
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Все, що потрібно для ефективного управління партнерськими програмами
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow"
              >
                <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-300">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gradient-to-r from-violet-600 to-indigo-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">
                Чому обирають нас?
              </h2>
              <p className="text-xl text-violet-100 mb-8">
                Професійне рішення для відстеження affiliate трафіку з усіма необхідними інструментами
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-violet-600" />
                    </div>
                    <span className="text-white text-lg">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center">
                    <Users className="w-8 h-8 text-violet-600" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">1000+</div>
                    <div className="text-violet-100">Активних користувачів</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-violet-600" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">1M+</div>
                    <div className="text-violet-100">Відстежених кліків</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center">
                    <DollarSign className="w-8 h-8 text-violet-600" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">$10M+</div>
                    <div className="text-violet-100">Відстежених доходів</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-12 text-center shadow-2xl">
          <h2 className="text-4xl font-bold text-white mb-4">
            Готові почати?
          </h2>
          <p className="text-xl text-violet-100 mb-8 max-w-2xl mx-auto">
            Створіть безкоштовний акаунт за хвилину та почніть відстежувати ваш affiliate трафік вже сьогодні
          </p>
          <Link
            to="/login"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-violet-600 font-semibold rounded-xl hover:bg-violet-50 transition-all shadow-lg text-lg"
          >
            <span>Створити акаунт безкоштовно</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <MousePointerClick className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Affiliate Tracker</span>
              </div>
              <p className="text-slate-400">
                Професійна система відстеження affiliate трафіку
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Продукт</h3>
              <ul className="space-y-2">
                <li><Link to="/setup" className="hover:text-white transition-colors">Документація</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Інтеграції</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Компанія</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Про нас</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Блог</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Контакти</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Підтримка</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Допомога</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Увійти</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 Affiliate Tracker. Всі права захищені.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

