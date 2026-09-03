/**
 * CMS page-content is stored per language. Older rows have no lang tag,
 * so skip overlays that clearly belong to the other language.
 */
export function normalizeLang(lng) {
  return String(lng || '').toLowerCase().startsWith('en') ? 'en' : 'uk';
}

export function detectTextLang(text) {
  const letters = String(text || '').replace(/[^A-Za-zА-Яа-яЁёІіЇїЄєҐґ]/g, '');
  if (letters.length < 2) return null;
  const cyrillic = (letters.match(/[\u0400-\u04FF]/g) || []).length;
  return cyrillic / letters.length >= 0.3 ? 'uk' : 'en';
}

export function cmsOrI18n(cmsValue, fallback, lang) {
  const text = cmsValue == null ? '' : String(cmsValue);
  if (!text.trim()) return fallback;
  const detected = detectTextLang(text);
  if (detected && detected !== normalizeLang(lang)) return fallback;
  return text;
}
