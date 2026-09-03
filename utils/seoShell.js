import fs from 'fs';
import path from 'path';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function upsertMetaByName(html, name, content) {
  const safeName = escapeHtml(name);
  const safeContent = escapeHtml(content);
  const re = new RegExp(`<meta\\s+name=["']${safeName}["'][^>]*>`, 'i');
  const tag = `<meta name="${safeName}" content="${safeContent}" />`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

function upsertMetaByProperty(html, property, content) {
  const safeProperty = escapeHtml(property);
  const safeContent = escapeHtml(content);
  const re = new RegExp(`<meta\\s+property=["']${safeProperty}["'][^>]*>`, 'i');
  const tag = `<meta property="${safeProperty}" content="${safeContent}" />`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

function upsertCanonical(html, url) {
  const safeUrl = escapeHtml(url);
  const re = /<link\s+rel=["']canonical["'][^>]*>/i;
  const tag = `<link rel="canonical" href="${safeUrl}" />`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

function upsertTitle(html, title) {
  const safeTitle = escapeHtml(title);
  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`);
  }
  return html.replace(/<\/head>/i, `    <title>${safeTitle}</title>\n  </head>`);
}

function absoluteUrl(siteUrl, maybeRelative) {
  if (!maybeRelative) return null;
  const raw = String(maybeRelative).trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${siteUrl}${raw.startsWith('/') ? raw : `/${raw}`}`;
}

/**
 * Inject SEO tags into the SPA index.html shell for crawlers.
 */
export function applySeoToHtml(html, { siteUrl, title, description, canonicalPath, image, jsonLd }) {
  let out = html;
  const canonical = `${siteUrl}${canonicalPath === '/' ? '' : canonicalPath}`;
  const desc = (description || '').replace(/\s+/g, ' ').trim().slice(0, 300);
  const img = absoluteUrl(siteUrl, image);

  out = upsertTitle(out, title);
  if (desc) out = upsertMetaByName(out, 'description', desc);
  out = upsertCanonical(out, canonical);
  out = upsertMetaByProperty(out, 'og:type', jsonLd?.['@type'] === 'Article' ? 'article' : 'website');
  out = upsertMetaByProperty(out, 'og:title', title);
  if (desc) out = upsertMetaByProperty(out, 'og:description', desc);
  out = upsertMetaByProperty(out, 'og:url', canonical);
  if (img) out = upsertMetaByProperty(out, 'og:image', img);
  out = upsertMetaByName(out, 'twitter:card', img ? 'summary_large_image' : 'summary');
  out = upsertMetaByName(out, 'twitter:title', title);
  if (desc) out = upsertMetaByName(out, 'twitter:description', desc);
  if (img) out = upsertMetaByName(out, 'twitter:image', img);

  if (jsonLd) {
    // Prevent </script> breakouts without HTML-escaping the JSON payload.
    const json = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
    const tag = `<script type="application/ld+json" id="lehko-seo-jsonld">${json}</script>`;
    if (/<script\s+type=["']application\/ld\+json["']\s+id=["']lehko-seo-jsonld["'][\s\S]*?<\/script>/i.test(out)) {
      out = out.replace(
        /<script\s+type=["']application\/ld\+json["']\s+id=["']lehko-seo-jsonld["'][\s\S]*?<\/script>/i,
        tag
      );
    } else {
      out = out.replace(/<\/head>/i, `    ${tag}\n  </head>`);
    }
  }

  // Helpful noscript snippet for non-JS crawlers
  if (title || desc) {
    const noscript = `<noscript><div style="max-width:720px;margin:24px auto;padding:16px;font-family:sans-serif"><h1>${escapeHtml(title)}</h1>${desc ? `<p>${escapeHtml(desc)}</p>` : ''}</div></noscript>`;
    if (/id=["']root["'][^>]*>/i.test(out)) {
      out = out.replace(/id=["']root["'][^>]*>/i, (m) => `${m}${noscript}`);
    }
  }

  return out;
}

export function loadSpaIndexHtml(frontendPath) {
  const indexPath = path.join(frontendPath, 'index.html');
  return fs.readFileSync(indexPath, 'utf8');
}
