import { Link } from 'react-router-dom';
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
  Settings
} from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <LinkIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800">Affiliate Tracker</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Увійти
              </Link>
              <Link
                to="/login"
                className="px-6 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25"
              >
                Почати
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            Відстежуйте{' '}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              кожен клік
            </span>
            <br />
            та конверсію
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Потужна система відстеження affiliate трафіку з детальною статистикою, 
            автоматичним підрахунком конверсій та зручним dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center space-x-2"
            >
              <span>Почати безкоштовно</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#features"
              className="px-8 py-4 bg-white text-slate-700 font-semibold rounded-xl border-2 border-slate-200 hover:border-slate-300 transition-all flex items-center justify-center space-x-2"
            >
              <span>Дізнатися більше</span>
            </a>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-16 max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 overflow-hidden">
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatPreview icon={MousePointerClick} label="Кліки" value="1,234" color="blue" />
                <StatPreview icon={Users} label="Унікальні" value="892" color="purple" />
                <StatPreview icon={TrendingUp} label="Конверсії" value="156" color="green" />
                <StatPreview icon={DollarSign} label="Доходи" value="$12,450" color="emerald" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Все, що потрібно для успішного tracking
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Потужні інструменти для відстеження та аналізу вашого affiliate трафіку
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={MousePointerClick}
            title="Відстеження кліків"
            description="Автоматичне відстеження кожного кліку з детальною статистикою по унікальним відвідувачам"
            color="blue"
          />
          <FeatureCard
            icon={TrendingUp}
            title="Конверсії"
            description="Автоматичне визначення конверсій на сторінках замовлення з підрахунком доходів"
            color="green"
          />
          <FeatureCard
            icon={BarChart3}
            title="Детальна статистика"
            description="Повна статистика по кожному tracking посиланню з метриками ROMI та конверсій"
            color="purple"
          />
          <FeatureCard
            icon={Zap}
            title="Швидке встановлення"
            description="Встановлення за 2 хвилини - просто додайте код на ваш сайт або через Google Tag Manager"
            color="amber"
          />
          <FeatureCard
            icon={Shield}
            title="Безпека"
            description="Захищені дані, надійне зберігання статистики та захист від дублікатів конверсій"
            color="red"
          />
          <FeatureCard
            icon={Settings}
            title="Гнучке налаштування"
            description="Налаштуйте tracking під ваші потреби з підтримкою різних типів джерел трафіку"
            color="indigo"
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Як це працює
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Три прості кроки до початку відстеження
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StepCard
            number="1"
            title="Створіть tracking посилання"
            description="Додайте ваше посилання в систему та отримайте унікальний tracking URL"
            icon={LinkIcon}
          />
          <StepCard
            number="2"
            title="Встановіть tracker на сайт"
            description="Додайте простий JavaScript код на ваш сайт продаж або через Google Tag Manager"
            icon={Settings}
          />
          <StepCard
            number="3"
            title="Відстежуйте результати"
            description="Переглядайте детальну статистику кліків та конверсій в зручному dashboard"
            icon={BarChart3}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-12 text-center shadow-2xl">
          <h2 className="text-4xl font-bold text-white mb-4">
            Готові почати відстежувати?
          </h2>
          <p className="text-xl text-violet-100 mb-8 max-w-2xl mx-auto">
            Створіть акаунт за хвилину та почніть відстежувати ваш affiliate трафік вже сьогодні
          </p>
          <Link
            to="/login"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-violet-600 font-semibold rounded-xl hover:bg-violet-50 transition-all shadow-lg"
          >
            <span>Створити акаунт</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <LinkIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Affiliate Tracker</span>
              </div>
              <p className="text-slate-400">
                Потужна система відстеження affiliate трафіку з детальною статистикою
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Навігація</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    Увійти
                  </Link>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Можливості
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Підтримка</h3>
              <ul className="space-y-2">
                <li>
                  <a href="mailto:support@example.com" className="hover:text-white transition-colors">
                    Email підтримки
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-400">
            <p>&copy; 2024 Affiliate Tracker. Всі права захищені.</p>
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

