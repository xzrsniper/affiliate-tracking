/**
 * Shared config for Site Content admin + on-site text edit mode.
 * Keys must match PageContent (page, section, key) in the API.
 */
export const SITE_PAGE_PATHS = {
  home: '/',
  guide: '/guide',
  blog: '/blog',
  terms: '/terms',
  privacy: '/privacy',
  refund: '/refund'
};

export const CONTENT_FIELDS_BY_PAGE = {
  home: [
    { section: 'seo', key: 'title', label: 'SEO Title', type: 'text' },
    { section: 'seo', key: 'description', label: 'SEO Description', type: 'textarea' },
    { section: 'nav', key: 'features', label: 'Nav: Features', type: 'text' },
    { section: 'nav', key: 'pricing', label: 'Nav: Pricing', type: 'text' },
    { section: 'nav', key: 'guide', label: 'Nav: Guide', type: 'text' },
    { section: 'nav', key: 'support', label: 'Nav: Support', type: 'text' },
    { section: 'nav', key: 'sign_in', label: 'Nav: Sign in button', type: 'text' },
    { section: 'nav', key: 'start_free', label: 'Nav: Start free button', type: 'text' },
    { section: 'hero', key: 'badge', label: 'Hero badge', type: 'text' },
    { section: 'hero', key: 'headline_before', label: 'Hero headline before', type: 'text' },
    { section: 'hero', key: 'headline_highlight_1', label: 'Hero highlight 1', type: 'text' },
    { section: 'hero', key: 'headline_mid', label: 'Hero headline mid', type: 'text' },
    { section: 'hero', key: 'headline_highlight_2', label: 'Hero highlight 2', type: 'text' },
    { section: 'hero', key: 'headline_end', label: 'Hero headline end', type: 'text' },
    { section: 'hero', key: 'subline', label: 'Hero subline', type: 'textarea' },
    { section: 'hero', key: 'subline2', label: 'Hero subline 2', type: 'textarea' },
    { section: 'hero', key: 'cta_text', label: 'Hero CTA button', type: 'text' },
    { section: 'hero', key: 'watch_demo', label: 'Hero demo button', type: 'text' },
    { section: 'hero', key: 'note', label: 'Hero note', type: 'text' },
    { section: 'budget', key: 'item1', label: 'Budget bullet 1', type: 'text' },
    { section: 'budget', key: 'item2', label: 'Budget bullet 2', type: 'text' },
    { section: 'budget', key: 'item3', label: 'Budget bullet 3', type: 'text' },
    { section: 'budget', key: 'item4', label: 'Budget bullet 4', type: 'text' },
    { section: 'budget', key: 'item5', label: 'Budget bullet 5', type: 'text' },
    { section: 'features', key: 'title', label: 'Features title', type: 'text' },
    { section: 'features', key: 'subtitle', label: 'Features subtitle', type: 'textarea' },
    { section: 'money', key: 'title', label: 'Revenue block title', type: 'text' },
    { section: 'money', key: 'description', label: 'Revenue block description', type: 'textarea' },
    { section: 'money', key: 'bullet1', label: 'Revenue bullet 1', type: 'text' },
    { section: 'money', key: 'bullet2', label: 'Revenue bullet 2', type: 'text' },
    { section: 'money', key: 'bullet3', label: 'Revenue bullet 3', type: 'text' },
    { section: 'integration', key: 'title', label: 'Integration title', type: 'text' },
    { section: 'integration', key: 'description', label: 'Integration description', type: 'textarea' },
    { section: 'integration', key: 'bullet1', label: 'Integration bullet 1', type: 'text' },
    { section: 'integration', key: 'bullet2', label: 'Integration bullet 2', type: 'text' },
    { section: 'integration', key: 'bullet3', label: 'Integration bullet 3', type: 'text' },
    { section: 'why', key: 'title', label: 'Why us title', type: 'text' },
    { section: 'why', key: 'subtitle', label: 'Why us subtitle', type: 'textarea' },
    { section: 'why', key: 'item1', label: 'Why bullet 1', type: 'text' },
    { section: 'why', key: 'item2', label: 'Why bullet 2', type: 'text' },
    { section: 'why', key: 'item3', label: 'Why bullet 3', type: 'text' },
    { section: 'why', key: 'item4', label: 'Why bullet 4', type: 'text' },
    { section: 'why', key: 'item5', label: 'Why bullet 5', type: 'text' },
    { section: 'why', key: 'item6', label: 'Why bullet 6', type: 'text' },
    { section: 'pricing', key: 'title', label: 'Pricing title', type: 'text' },
    { section: 'faq', key: 'title', label: 'FAQ title', type: 'text' },
    { section: 'faq', key: 'help_title', label: 'FAQ help title', type: 'text' },
    { section: 'faq', key: 'help_description', label: 'FAQ help description', type: 'textarea' },
    { section: 'faq', key: 'help_button', label: 'FAQ help button', type: 'text' },
    { section: 'bottom_cta', key: 'start_free', label: 'Bottom CTA: start free', type: 'text' },
    { section: 'bottom_cta', key: 'talk_to_us', label: 'Bottom CTA: talk to us', type: 'text' },
    { section: 'footer', key: 'features', label: 'Footer: Features', type: 'text' },
    { section: 'footer', key: 'pricing', label: 'Footer: Pricing', type: 'text' },
    { section: 'footer', key: 'support', label: 'Footer: Support', type: 'text' },
    { section: 'cta', key: 'title', label: 'Bottom CTA title', type: 'text' },
    { section: 'cta', key: 'description', label: 'Bottom CTA description', type: 'textarea' },

    /* Budget / hero stats — title was used in UI; value prop card */
    { section: 'budget', key: 'title', label: 'Budget section H2 title', type: 'text' },
    { section: 'highlight', key: 'value_prop', label: 'Purple card: paragraph (traffic sources)', type: 'textarea' },

    /* Demo dashboard widget (campaign overview) */
    { section: 'demo', key: 'title', label: 'Demo: widget title', type: 'text' },
    { section: 'demo', key: 'live_badge', label: 'Demo: live badge', type: 'text' },
    { section: 'demo', key: 'm_clicks_label', label: 'Demo: metric label — clicks', type: 'text' },
    { section: 'demo', key: 'm_conv_label', label: 'Demo: metric label — conversions', type: 'text' },
    { section: 'demo', key: 'm_rev_label', label: 'Demo: metric label — revenue', type: 'text' },
    { section: 'demo', key: 'm_clicks_val', label: 'Demo: clicks value', type: 'text' },
    { section: 'demo', key: 'm_conv_val', label: 'Demo: conversions value', type: 'text' },
    { section: 'demo', key: 'm_rev_val', label: 'Demo: revenue value', type: 'text' },
    { section: 'demo', key: 'm_clicks_delta', label: 'Demo: clicks delta', type: 'text' },
    { section: 'demo', key: 'm_conv_delta', label: 'Demo: conversions delta', type: 'text' },
    { section: 'demo', key: 'm_rev_delta', label: 'Demo: revenue delta', type: 'text' },
    { section: 'demo', key: 'src1_name', label: 'Demo: source 1 name', type: 'text' },
    { section: 'demo', key: 'src1_val', label: 'Demo: source 1 value', type: 'text' },
    { section: 'demo', key: 'src2_name', label: 'Demo: source 2 name', type: 'text' },
    { section: 'demo', key: 'src2_val', label: 'Demo: source 2 value', type: 'text' },
    { section: 'demo', key: 'src3_name', label: 'Demo: source 3 name', type: 'text' },
    { section: 'demo', key: 'src3_val', label: 'Demo: source 3 value', type: 'text' },

    /* Features: channel breakdown card (4 rows) */
    { section: 'channels', key: 'r1_name', label: 'Channels row1 name', type: 'text' },
    { section: 'channels', key: 'r1_pct', label: 'Channels row1 bar %', type: 'text' },
    { section: 'channels', key: 'r1_money', label: 'Channels row1 $', type: 'text' },
    { section: 'channels', key: 'r2_name', label: 'Channels row2 name', type: 'text' },
    { section: 'channels', key: 'r2_pct', label: 'Channels row2 bar %', type: 'text' },
    { section: 'channels', key: 'r2_money', label: 'Channels row2 $', type: 'text' },
    { section: 'channels', key: 'r3_name', label: 'Channels row3 name', type: 'text' },
    { section: 'channels', key: 'r3_pct', label: 'Channels row3 bar %', type: 'text' },
    { section: 'channels', key: 'r3_money', label: 'Channels row3 $', type: 'text' },
    { section: 'channels', key: 'r4_name', label: 'Channels row4 name', type: 'text' },
    { section: 'channels', key: 'r4_pct', label: 'Channels row4 bar %', type: 'text' },
    { section: 'channels', key: 'r4_money', label: 'Channels row4 $', type: 'text' },

    { section: 'why_stats', key: 'card1_value', label: 'Why stats card1 value', type: 'text' },
    { section: 'why_stats', key: 'card1_label', label: 'Why stats card1 label', type: 'text' },
    { section: 'why_stats', key: 'card2_value', label: 'Why stats card2 value', type: 'text' },
    { section: 'why_stats', key: 'card2_label', label: 'Why stats card2 label', type: 'text' },
    { section: 'why_stats', key: 'card3_value', label: 'Why stats card3 value', type: 'text' },
    { section: 'why_stats', key: 'card3_label', label: 'Why stats card3 label', type: 'text' },

    { section: 'faq', key: 'q1', label: 'FAQ Q1', type: 'text' },
    { section: 'faq', key: 'a1', label: 'FAQ A1', type: 'textarea' },
    { section: 'faq', key: 'q2', label: 'FAQ Q2', type: 'text' },
    { section: 'faq', key: 'a2', label: 'FAQ A2', type: 'textarea' },
    { section: 'faq', key: 'q3', label: 'FAQ Q3', type: 'text' },
    { section: 'faq', key: 'a3', label: 'FAQ A3', type: 'textarea' },
    { section: 'faq', key: 'q4', label: 'FAQ Q4', type: 'text' },
    { section: 'faq', key: 'a4', label: 'FAQ A4', type: 'textarea' },
    { section: 'faq', key: 'q5', label: 'FAQ Q5', type: 'text' },
    { section: 'faq', key: 'a5', label: 'FAQ A5', type: 'textarea' },
    { section: 'faq', key: 'q6', label: 'FAQ Q6', type: 'text' },
    { section: 'faq', key: 'a6', label: 'FAQ A6', type: 'textarea' },
    { section: 'faq', key: 'q7', label: 'FAQ Q7', type: 'text' },
    { section: 'faq', key: 'a7', label: 'FAQ A7', type: 'textarea' },

    { section: 'pricing', key: 'per_month', label: 'Pricing: /month suffix', type: 'text' },
    { section: 'plan_starter', key: 'name', label: 'Plan Start: name', type: 'text' },
    { section: 'plan_starter', key: 'price', label: 'Plan Start: price', type: 'text' },
    { section: 'plan_starter', key: 'desc', label: 'Plan Start: description', type: 'textarea' },
    { section: 'plan_starter', key: 'item1', label: 'Plan Start: feature 1', type: 'text' },
    { section: 'plan_starter', key: 'item2', label: 'Plan Start: feature 2', type: 'text' },
    { section: 'plan_starter', key: 'item3', label: 'Plan Start: feature 3', type: 'text' },
    { section: 'plan_starter', key: 'item4', label: 'Plan Start: feature 4', type: 'text' },
    { section: 'plan_starter', key: 'cta', label: 'Plan Start: button', type: 'text' },
    { section: 'plan_pro', key: 'badge', label: 'Plan Pro: popular badge', type: 'text' },
    { section: 'plan_pro', key: 'name', label: 'Plan Pro: name', type: 'text' },
    { section: 'plan_pro', key: 'price', label: 'Plan Pro: price', type: 'text' },
    { section: 'plan_pro', key: 'desc', label: 'Plan Pro: description', type: 'textarea' },
    { section: 'plan_pro', key: 'item1', label: 'Plan Pro: feature 1', type: 'text' },
    { section: 'plan_pro', key: 'item2', label: 'Plan Pro: feature 2', type: 'text' },
    { section: 'plan_pro', key: 'item3', label: 'Plan Pro: feature 3', type: 'text' },
    { section: 'plan_pro', key: 'item4', label: 'Plan Pro: feature 4', type: 'text' },
    { section: 'plan_pro', key: 'item5', label: 'Plan Pro: feature 5', type: 'text' },
    { section: 'plan_pro', key: 'item6', label: 'Plan Pro: feature 6', type: 'text' },
    { section: 'plan_pro', key: 'cta', label: 'Plan Pro: button', type: 'text' },
    { section: 'plan_agency', key: 'name', label: 'Plan Agency: name', type: 'text' },
    { section: 'plan_agency', key: 'price', label: 'Plan Agency: price', type: 'text' },
    { section: 'plan_agency', key: 'desc', label: 'Plan Agency: description', type: 'textarea' },
    { section: 'plan_agency', key: 'item1', label: 'Plan Agency: feature 1', type: 'text' },
    { section: 'plan_agency', key: 'item2', label: 'Plan Agency: feature 2', type: 'text' },
    { section: 'plan_agency', key: 'item3', label: 'Plan Agency: feature 3', type: 'text' },
    { section: 'plan_agency', key: 'item4', label: 'Plan Agency: feature 4', type: 'text' },
    { section: 'plan_agency', key: 'item5', label: 'Plan Agency: feature 5', type: 'text' },
    { section: 'plan_agency', key: 'cta', label: 'Plan Agency: button', type: 'text' }
  ],
  guide: [
    { section: 'seo', key: 'title', label: 'SEO Title', type: 'text' },
    { section: 'seo', key: 'description', label: 'SEO Description', type: 'textarea' },
    { section: 'hero', key: 'badge', label: 'Hero badge', type: 'text' },
    { section: 'hero', key: 'title', label: 'Hero title', type: 'text' },
    { section: 'hero', key: 'description', label: 'Hero description', type: 'textarea' },
    { section: 'hero', key: 'primary_cta', label: 'Primary CTA', type: 'text' },
    { section: 'hero', key: 'secondary_cta', label: 'Secondary CTA', type: 'text' },
    { section: 'faq', key: 'title', label: 'FAQ title', type: 'text' }
  ],
  blog: [
    { section: 'seo', key: 'title', label: 'SEO Title', type: 'text' },
    { section: 'seo', key: 'description', label: 'SEO Description', type: 'textarea' },
    { section: 'hero', key: 'title', label: 'Page title', type: 'text' },
    { section: 'sidebar', key: 'cta_text', label: 'Sidebar CTA text', type: 'textarea' },
    { section: 'sidebar', key: 'cta_button', label: 'Sidebar CTA button', type: 'text' }
  ],
  terms: [
    { section: 'seo', key: 'title', label: 'SEO Title', type: 'text' },
    { section: 'seo', key: 'description', label: 'SEO Description', type: 'textarea' },
    { section: 'header', key: 'title_uk', label: 'Title (UK)', type: 'text' },
    { section: 'header', key: 'title_en', label: 'Title (EN)', type: 'text' },
    { section: 'header', key: 'updated_uk', label: 'Updated text (UK)', type: 'text' },
    { section: 'header', key: 'updated_en', label: 'Updated text (EN)', type: 'text' },
    { section: 'intro', key: 'text_uk', label: 'Intro (UK)', type: 'textarea' },
    { section: 'intro', key: 'text_en', label: 'Intro (EN)', type: 'textarea' }
  ],
  privacy: [
    { section: 'seo', key: 'title', label: 'SEO Title', type: 'text' },
    { section: 'seo', key: 'description', label: 'SEO Description', type: 'textarea' },
    { section: 'header', key: 'title_uk', label: 'Title (UK)', type: 'text' },
    { section: 'header', key: 'title_en', label: 'Title (EN)', type: 'text' },
    { section: 'header', key: 'updated_uk', label: 'Updated text (UK)', type: 'text' },
    { section: 'header', key: 'updated_en', label: 'Updated text (EN)', type: 'text' },
    { section: 'intro', key: 'text_uk', label: 'Intro (UK)', type: 'textarea' },
    { section: 'intro', key: 'text_en', label: 'Intro (EN)', type: 'textarea' }
  ],
  refund: [
    { section: 'seo', key: 'title', label: 'SEO Title', type: 'text' },
    { section: 'seo', key: 'description', label: 'SEO Description', type: 'textarea' },
    { section: 'header', key: 'title_uk', label: 'Title (UK)', type: 'text' },
    { section: 'header', key: 'title_en', label: 'Title (EN)', type: 'text' },
    { section: 'header', key: 'updated_uk', label: 'Updated text (UK)', type: 'text' },
    { section: 'header', key: 'updated_en', label: 'Updated text (EN)', type: 'text' },
    { section: 'intro', key: 'text_uk', label: 'Intro (UK)', type: 'textarea' },
    { section: 'intro', key: 'text_en', label: 'Intro (EN)', type: 'textarea' }
  ]
};

export function contentFieldId(section, key) {
  return `${section}.${key}`;
}

export function getFieldMeta(page, section, fieldKey) {
  const list = CONTENT_FIELDS_BY_PAGE[page] || [];
  return list.find((f) => f.section === section && f.key === fieldKey) || null;
}

export function getFieldOrderIndex(page, section, fieldKey) {
  const list = CONTENT_FIELDS_BY_PAGE[page] || [];
  const i = list.findIndex((f) => f.section === section && f.key === fieldKey);
  return i >= 0 ? i + 1 : 0;
}

/** Normalize pathname for comparison */
export function normalizePathname(pathname) {
  if (!pathname) return '/';
  const p = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  return p === '' ? '/' : p;
}

export function sitePathMatchesPage(pathname, pageKey) {
  const expected = SITE_PAGE_PATHS[pageKey];
  if (!expected) return false;
  return normalizePathname(pathname) === normalizePathname(expected);
}
