import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uk from './locales/uk.json';
import en from './locales/en.json';

const STORAGE_KEY = 'lehko_lang';

function getInitialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'uk' || saved === 'en') return saved;
  } catch (e) {}
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'uk';
  return nav.startsWith('uk') ? 'uk' : 'en';
}

i18n.use(initReactI18next).init({
  resources: { uk: { translation: uk }, en: { translation: en } },
  lng: getInitialLanguage(),
  fallbackLng: 'uk',
  interpolation: { escapeValue: false }
});

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch (e) {}
});

export default i18n;
