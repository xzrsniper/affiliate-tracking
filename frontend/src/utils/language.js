export const LANG_STORAGE_KEY = 'lehko_lang';

/** Read ?lang=uk|en from the current URL (first visit / shared links). */
export function getLangFromUrl() {
  if (typeof window === 'undefined') return null;
  const param = new URLSearchParams(window.location.search).get('lang');
  return param === 'uk' || param === 'en' ? param : null;
}

/** Default Ukrainian; English only when saved or ?lang=en. */
export function getInitialLanguage() {
  const fromUrl = getLangFromUrl();
  if (fromUrl) return fromUrl;

  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'uk' || saved === 'en') return saved;
  } catch (_) {
    /* ignore */
  }

  return 'uk';
}

export function persistLanguage(lng) {
  if (lng !== 'uk' && lng !== 'en') return;
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lng);
  } catch (_) {
    /* ignore */
  }
}

export function applyDocumentLanguage(lng) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lng === 'en' ? 'en' : 'uk';
}
