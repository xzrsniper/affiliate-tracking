import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Перевіряємо збережену тему або використовуємо світлу за замовчуванням
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme || 'light';
      }
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
    return 'light';
  });

  useEffect(() => {
    try {
      // Зберігаємо тему в localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('theme', theme);
      }
      
      // Додаємо/видаляємо клас dark та синхронізуємо browser color-scheme
      if (typeof document !== 'undefined') {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
        }
        document.documentElement.style.colorScheme = theme;
      }
    } catch (e) {
      console.warn('Error setting theme:', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

