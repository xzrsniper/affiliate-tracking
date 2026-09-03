import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  applyDocumentLanguage,
  getInitialLanguage,
  persistLanguage
} from './utils/language.js';

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

applyDocumentLanguage(initialLanguage);

await i18n.use(initReactI18next).init({
  resources: {
    [initialLanguage]: { translation: initialTranslations }
  },
  lng: initialLanguage,
  fallbackLng: 'uk',
  interpolation: { escapeValue: false }
});

i18n.on('languageChanged', async (lng) => {
  applyDocumentLanguage(lng);
  if (!i18n.hasResourceBundle(lng, 'translation')) {
    const translations = await loadLocale(lng);
    i18n.addResourceBundle(lng, 'translation', translations, true, true);
  }
});

/** Call from language toggles so we only persist explicit user choice. */
export function changeUserLanguage(lng) {
  persistLanguage(lng);
  return i18n.changeLanguage(lng);
}

export default i18n;
