import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const STORAGE_KEY = 'lehko_lang';

function getInitialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'uk' || saved === 'en') return saved;
  } catch (e) {}
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'uk';
  return nav.startsWith('uk') ? 'uk' : 'en';
}

async function loadLocale(lng) {
  if (lng === 'en') {
    const en = await import('./locales/en.json');
    return en.default;
  }

  const uk = await import('./locales/uk.json');
  return uk.default;
}

const initialLanguage = getInitialLanguage();
const initialTranslations = await loadLocale(initialLanguage);

await i18n.use(initReactI18next).init({
  resources: {
    [initialLanguage]: { translation: initialTranslations }
  },
  lng: initialLanguage,
  fallbackLng: 'uk',
  interpolation: { escapeValue: false }
});

i18n.on('languageChanged', async (lng) => {
  if (!i18n.hasResourceBundle(lng, 'translation')) {
    const translations = await loadLocale(lng);
    i18n.addResourceBundle(lng, 'translation', translations, true, true);
  }
});

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch (e) {}
});

export default i18n;
