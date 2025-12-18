import { useState, useEffect } from 'react';
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
import Logo from '../components/Logo.jsx';
import api from '../config/api.js';

const ICON_MAP = {
  MousePointerClick,
  TrendingUp,
  DollarSign,
  Shield,
  Zap,
  BarChart3,
  Users,
  Globe
};

export default function HomeNew({ structure: propStructure }) {
  const [structure, setStructure] = useState(propStructure || null);
  const [loading, setLoading] = useState(!propStructure);
  
  let theme = 'light';
  let toggleTheme = () => {};
  
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    toggleTheme = themeContext.toggleTheme;
  } catch (error) {
    console.error('❌ Error loading theme:', error);
  }

  useEffect(() => {
    if (!propStructure) {
      fetchStructure();
    }
  }, [propStructure]);

  const fetchStructure = async () => {
    try {
      const response = await api.get('/api/page-structure/home');
      if (response.data.success && response.data.structure) {
        setStructure(response.data.structure);
      }
    } catch (error) {
      console.error('Failed to load page structure:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Завантаження...</div>
      </div>
    );
  }

  // Якщо структура має canvas (новий формат), відображаємо canvas-елементи
  if (structure && structure.canvas && structure.canvas.elements) {
    const { elements, width = 1200, height = 2000 } = structure.canvas;
    
    return (
      <div className="min-h-screen bg-white">
        <div className="w-full flex justify-center" style={{ minHeight: '100vh', padding: '20px' }}>
          <div style={{ width: `${width}px`, height: `${height}px`, position: 'relative', maxWidth: '100%' }}>
            {elements.map((element) => (
              <div 
                key={element.id} 
                style={{ 
                  position: 'absolute', 
                  left: `${element.x}px`, 
                  top: `${element.y}px`, 
                  width: `${element.width}px`, 
                  height: `${element.height}px`, 
                  zIndex: element.zIndex || 0 
                }}
              >
                <CanvasElementView element={element} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!structure || !structure.sections) {
    // Fallback на дефолтну структуру
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
            Сторінка не налаштована
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Будь ласка, налаштуйте сторінку через адмін панель.
          </p>
        </div>
      </div>
    );
  }

  const visibleSections = structure.sections.filter(s => s.visible);

// Canvas Element View Component (for displaying canvas elements on home page)
function CanvasElementView({ element }) {
  const { theme, toggleTheme } = useTheme();
  switch (element.type) {
    case 'text':
      return (
        <div
          style={{
            fontSize: `${element.fontSize || 24}px`,
            color: element.color || '#000000',
            fontWeight: element.fontWeight || 'normal',
            fontFamily: element.fontFamily || 'inherit',
            minHeight: '20px',
            wordWrap: 'break-word',
            width: '100%',
            height: '100%'
          }}
        >
          {element.content || 'Текст'}
        </div>
      );
    case 'heading':
      return (
        <h1
          style={{
            fontSize: `${element.fontSize || 48}px`,
            color: element.color || '#000000',
            fontWeight: element.fontWeight || 'bold',
            fontFamily: element.fontFamily || 'inherit',
            margin: 0,
            minHeight: '30px',
            wordWrap: 'break-word',
            width: '100%',
            height: '100%'
          }}
        >
          {element.content || 'Заголовок'}
        </h1>
      );
    case 'button':
      return (
        <button
          style={{
            backgroundColor: element.bgColor || '#7c3aed',
            color: element.color || '#ffffff',
            fontSize: `${element.fontSize || 16}px`,
            borderRadius: `${element.borderRadius || 8}px`,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}
        >
          {element.text || 'Кнопка'}
        </button>
      );
    case 'login_button':
      return (
        <Link
          to={element.link || '/login'}
          style={{
            backgroundColor: element.bgColor || '#7c3aed',
            color: element.color || '#ffffff',
            fontSize: `${element.fontSize || 16}px`,
            borderRadius: `${element.borderRadius || 8}px`,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            fontWeight: 'semibold',
            width: '100%',
            height: '100%'
          }}
        >
          {element.text || 'Увійти'}
        </Link>
      );
    case 'register_button':
      return (
        <Link
          to={element.link || '/login?register=true'}
          style={{
            backgroundColor: element.bgColor || '#7c3aed',
            color: element.color || '#ffffff',
            fontSize: `${element.fontSize || 16}px`,
            borderRadius: `${element.borderRadius || 8}px`,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            fontWeight: 'semibold',
            width: '100%',
            height: '100%'
          }}
        >
          {element.text || 'Реєстрація'}
        </Link>
      );
    case 'try_free_button':
      return (
        <Link
          to={element.link || '/login'}
          style={{
            background: element.bgColor || 'linear-gradient(to right, #7c3aed, #4f46e5)',
            backgroundColor: element.bgColor || '#7c3aed',
            color: element.color || '#ffffff',
            fontSize: `${element.fontSize || 16}px`,
            borderRadius: `${element.borderRadius || 8}px`,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            fontWeight: 'semibold',
            boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.25)',
            width: '100%',
            height: '100%'
          }}
        >
          {element.text || 'Спробувати безкоштовно'}
        </Link>
      );
    case 'theme_toggle':
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleTheme();
          }}
          style={{
            backgroundColor: element.bgColor || 'transparent',
            color: element.color || (theme === 'dark' ? '#fbbf24' : '#6b7280'),
            fontSize: `${element.fontSize || 16}px`,
            borderRadius: `${element.borderRadius || 8}px`,
            border: element.bgColor === 'transparent' ? '1px solid currentColor' : 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            width: '100%',
            height: '100%'
          }}
          title={theme === 'dark' ? 'Світла тема' : 'Темна тема'}
        >
          {theme === 'dark' ? (
            <Sun className="w-full h-full" style={{ maxWidth: '24px', maxHeight: '24px' }} />
          ) : (
            <Moon className="w-full h-full" style={{ maxWidth: '24px', maxHeight: '24px' }} />
          )}
        </button>
      );
    case 'image':
      return (
        <div style={{ width: '100%', height: '100%' }}>
          {element.src ? (
            <img
              src={element.src}
              alt={element.alt || 'Image'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              border: '2px dashed #ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999'
            }}>
              Зображення
            </div>
          )}
        </div>
      );
    case 'box':
      return (
        <div
          style={{
            backgroundColor: element.bgColor || '#f0f0f0',
            borderRadius: `${element.borderRadius || 0}px`,
            width: '100%',
            height: '100%'
          }}
        />
      );
    default:
      return null;
  }
}

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
              <Logo size="md" showText={true} />
              <div className="flex items-center space-x-4">
                <a
                  href="#about"
                  className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
                >
                  Про нас
                </a>
                <a
                  href="#blog"
                  className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
                >
                  Блог
                </a>
                <a
                  href={`https://t.me/${import.meta.env.VITE_TELEGRAM_USERNAME || 'your_username'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
                >
                  Контакти
                </a>
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

        {/* Render Sections */}
        {visibleSections.map((section) => (
          <SectionRenderer key={section.id} section={section} theme={theme} />
        ))}

        {/* Footer */}
        <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 py-12 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <img 
                        src="/logo.png" 
                        alt="LehkoTrack Logo" 
                        className="w-full h-full object-contain p-1.5"
                      />
                    </div>
                    <span className="text-xl font-bold text-white">LehkoTrack</span>
                  </div>
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
              <p>&copy; 2024 LehkoTrack. Всі права захищені.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// Section Renderer Component
function SectionRenderer({ section, theme }) {
  const sectionStyle = {
    backgroundColor: section.data?.bgColor || undefined,
    color: section.data?.textColor || undefined,
    paddingTop: section.styles?.padding?.top ? `${section.styles.padding.top}px` : undefined,
    paddingBottom: section.styles?.padding?.bottom ? `${section.styles.padding.bottom}px` : undefined,
    paddingLeft: section.styles?.padding?.left ? `${section.styles.padding.left}px` : undefined,
    paddingRight: section.styles?.padding?.right ? `${section.styles.padding.right}px` : undefined,
  };

  switch (section.type) {
    case 'hero':
      return <HeroSection data={section.data} theme={theme} style={sectionStyle} />;
    case 'text':
      return <TextSection data={section.data} theme={theme} style={sectionStyle} />;
    case 'stats':
      return <StatsSection data={section.data} theme={theme} style={sectionStyle} />;
    case 'features':
      return <FeaturesSection data={section.data} theme={theme} style={sectionStyle} />;
    case 'benefits':
      return <BenefitsSection data={section.data} theme={theme} style={sectionStyle} />;
    case 'cta':
      return <CTASection data={section.data} theme={theme} style={sectionStyle} />;
    case 'image':
      return <ImageSection data={section.data} theme={theme} style={sectionStyle} />;
    default:
      return null;
  }
}

// Individual Section Components
function HeroSection({ data, theme, style }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={style}>
      {data.image && (
        <div className="mb-8">
          <img src={data.image} alt="Hero" className="max-w-4xl mx-auto rounded-2xl shadow-2xl" />
        </div>
      )}
      <div className="text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6" style={{ color: data.titleColor || data.textColor || '#1e293b' }}>
          {data.title}{' '}
          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            {data.titleHighlight}
          </span>
          {data.subtitle && (
            <>
              <br />
              {data.subtitle}
            </>
          )}
        </h1>
        {data.description && (
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
            {data.description}
          </p>
        )}
        {data.ctaText && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to={data.ctaLink || '/login'}
              className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 flex items-center space-x-2 text-lg"
            >
              <span>{data.ctaText}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function TextSection({ data, theme, style }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={style}>
      <div className={`text-${data.align || 'center'}`}>
        {data.title && (
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {data.title}
          </h2>
        )}
        {data.content && (
          <div className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto" dangerouslySetInnerHTML={{ __html: data.content }} />
        )}
      </div>
    </section>
  );
}

function StatsSection({ data, theme, style }) {
  if (!data.items || data.items.length === 0) return null;
  
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={style}>
      <div className={`grid grid-cols-1 md:grid-cols-${data.items.length} gap-8`}>
        {data.items.map((item, index) => (
          <div key={index} className="text-center">
            <div className="text-4xl font-bold mb-2" style={{ color: item.color || '#7c3aed' }}>
              {item.value}
            </div>
            <div className="text-slate-600 dark:text-slate-400">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturesSection({ data, theme }) {
  if (!data.items || data.items.length === 0) return null;
  
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      {data.title && (
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {data.title}
          </h2>
          {data.subtitle && (
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              {data.subtitle}
            </p>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {data.items.map((item, index) => {
          const Icon = ICON_MAP[item.icon] || MousePointerClick;
          return (
            <div
              key={index}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow"
            >
              <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{item.title}</h3>
              <p className="text-slate-600 dark:text-slate-300">{item.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BenefitsSection({ data, theme }) {
  return (
    <section className="bg-gradient-to-r from-violet-600 to-indigo-600 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            {data.title && (
              <h2 className="text-4xl font-bold text-white mb-6">
                {data.title}
              </h2>
            )}
            {data.description && (
              <p className="text-xl text-violet-100 mb-8">
                {data.description}
              </p>
            )}
            {data.items && data.items.length > 0 && (
              <ul className="space-y-4">
                {data.items.map((item, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-violet-600" />
                    </div>
                    <span className="text-white text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {data.stats && data.stats.length > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="space-y-6">
                {data.stats.map((stat, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-8 h-8 text-violet-600" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-white">{stat.value}</div>
                      <div className="text-violet-100">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CTASection({ data, theme, style }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={style}>
      <div className="rounded-3xl p-12 text-center shadow-2xl" style={{ backgroundColor: data.bgColor || '#7c3aed', color: data.textColor || '#ffffff' }}>
        {data.title && (
          <h2 className="text-4xl font-bold text-white mb-4">
            {data.title}
          </h2>
        )}
        {data.description && (
          <p className="text-xl text-violet-100 mb-8 max-w-2xl mx-auto">
            {data.description}
          </p>
        )}
          {data.buttonText && (
            <Link
              to={data.buttonLink || '/login'}
              className="inline-flex items-center space-x-2 px-8 py-4 font-semibold rounded-xl transition-all shadow-lg text-lg"
              style={{ backgroundColor: data.buttonColor || '#ffffff', color: data.buttonTextColor || '#7c3aed' }}
            >
              <span>{data.buttonText}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
      </div>
    </section>
  );
}

function ImageSection({ data, theme, style }) {
  if (!data.image) return null;
  
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={style}>
      <div className="text-center">
        <img
          src={data.image}
          alt={data.alt || 'Image'}
          className="max-w-full h-auto mx-auto rounded-xl shadow-lg"
        />
        {data.caption && (
          <p className="mt-4 text-slate-600 dark:text-slate-400">{data.caption}</p>
        )}
      </div>
    </section>
  );
}

