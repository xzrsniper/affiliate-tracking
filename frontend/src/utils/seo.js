const SITE_ORIGIN = (typeof window !== 'undefined' && window.location?.origin)
  ? window.location.origin.replace(/\/$/, '')
  : 'https://lehko.space';

function ensureMetaByName(name) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  return el;
}

function ensureMetaByProperty(property) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  return el;
}

function ensureCanonical() {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  return el;
}

/**
 * Update document title / description / canonical for the current public page.
 */
export function applyClientSeo({ title, description, pathName, image }) {
  if (title) document.title = title;

  if (description) {
    ensureMetaByName('description').setAttribute('content', description);
    ensureMetaByProperty('og:description').setAttribute('content', description);
    ensureMetaByName('twitter:description').setAttribute('content', description);
  }

  const canonicalPath = pathName || (window.location.pathname + window.location.search);
  const canonical = `${SITE_ORIGIN}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`;
  ensureCanonical().setAttribute('href', canonical);

  if (title) {
    ensureMetaByProperty('og:title').setAttribute('content', title);
    ensureMetaByName('twitter:title').setAttribute('content', title);
  }
  ensureMetaByProperty('og:url').setAttribute('content', canonical);

  if (image) {
    const abs = /^https?:\/\//i.test(image)
      ? image
      : `${SITE_ORIGIN}${image.startsWith('/') ? image : `/${image}`}`;
    ensureMetaByProperty('og:image').setAttribute('content', abs);
    ensureMetaByName('twitter:image').setAttribute('content', abs);
  }
}
