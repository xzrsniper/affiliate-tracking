/**
 * Утиліта для відстеження конверсій без tracker.js
 * Прямі виклики API для відстеження конверсій
 */

const DEFAULT_API_BASE_URL =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : 'http://localhost:3000';

const API_BASE_URL = import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL;

/** Hard 14-day attribution window (must match utils/attribution.js / pixel.js). */
const ATTRIBUTION_MS = 14 * 24 * 60 * 60 * 1000;
const ATTRIB_AT_KEY = 'lehko_attrib_at';

function getAttributionStartedAt() {
  try {
    const ts = parseInt(localStorage.getItem(ATTRIB_AT_KEY) || '', 10);
    return Number.isFinite(ts) ? ts : null;
  } catch (e) {
    return null;
  }
}

function isAttributionFresh() {
  const ts = getAttributionStartedAt();
  if (!ts) return false;
  return Date.now() - ts <= ATTRIBUTION_MS;
}

function clearAttributionStorage() {
  try {
    localStorage.removeItem('aff_ref_code');
    localStorage.removeItem('lehko_ref');
    localStorage.removeItem('lehko_click_id');
    localStorage.removeItem(ATTRIB_AT_KEY);
  } catch (e) {
    /* ignore */
  }
  try {
    const expire = 'expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax';
    document.cookie = `aff_ref_code=;${expire}`;
    document.cookie = `lehko_ref=;${expire}`;
    document.cookie = `lehko_click_id=;${expire}`;
  } catch (e) {
    /* ignore */
  }
}

function markAttributionStartIfNeeded() {
  if (!getAttributionStartedAt()) {
    try {
      localStorage.setItem(ATTRIB_AT_KEY, String(Date.now()));
    } catch (e) {
      /* ignore */
    }
  }
}

/**
 * Отримати ref код з URL або localStorage (hard 14-day expiry)
 */
export function getRefCode() {
  // Expire stale / legacy immortal storage first
  const legacy =
    (() => {
      try {
        return localStorage.getItem('aff_ref_code') || localStorage.getItem('lehko_ref');
      } catch (e) {
        return null;
      }
    })();
  if (legacy && !isAttributionFresh()) {
    clearAttributionStorage();
  }

  // Спочатку перевіряємо URL параметр
  const urlParams = new URLSearchParams(window.location.search);
  const refFromUrl = urlParams.get('ref');
  if (refFromUrl) {
    try {
      const existing = localStorage.getItem('aff_ref_code') || localStorage.getItem('lehko_ref');
      const fresh = isAttributionFresh();
      // Sticky first-touch: do not overwrite a fresh different ref with bare ?ref=
      if (!fresh || !existing || existing === refFromUrl) {
        localStorage.setItem('aff_ref_code', refFromUrl);
        localStorage.setItem('lehko_ref', refFromUrl);
        if (!fresh) markAttributionStartIfNeeded();
      }
    } catch (e) {
      // localStorage може бути недоступний
    }
    if (isAttributionFresh()) {
      try {
        return localStorage.getItem('aff_ref_code') || refFromUrl;
      } catch (e) {
        return refFromUrl;
      }
    }
    return refFromUrl;
  }

  // Перевіряємо localStorage
  try {
    const refFromStorage = localStorage.getItem('aff_ref_code') || localStorage.getItem('lehko_ref');
    if (refFromStorage) {
      if (!isAttributionFresh()) {
        clearAttributionStorage();
        return null;
      }
      return refFromStorage;
    }
  } catch (e) {
    // localStorage недоступний
  }

  // Перевіряємо cookies (still require local timestamp — cookies alone used to live forever)
  try {
    if (!isAttributionFresh()) {
      clearAttributionStorage();
      return null;
    }
    const cookies = document.cookie.split('; ');
    const refCookie = cookies.find(row => row.startsWith('aff_ref_code=') || row.startsWith('lehko_ref='));
    if (refCookie) {
      return decodeURIComponent(refCookie.split('=').slice(1).join('='));
    }
  } catch (e) {
    // cookies недоступні
  }

  return null;
}

/**
 * Отримати або створити visitor ID
 */
export function getVisitorId() {
  const STORAGE_KEY = 'affiliate_visitor_id';
  
  try {
    let visitorId = localStorage.getItem(STORAGE_KEY);
    if (!visitorId) {
      // Генеруємо новий visitor ID
      const timestamp = Date.now().toString(36);
      const randomPart = Math.random().toString(36).substring(2, 15);
      visitorId = 'v_' + timestamp + '_' + randomPart;
      localStorage.setItem(STORAGE_KEY, visitorId);
    }
    return visitorId;
  } catch (e) {
    // Якщо localStorage недоступний, генеруємо тимчасовий ID
    return 'v_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
  }
}

/**
 * Відстежити конверсію
 * @param {number} orderValue - Сума замовлення
 * @param {string} orderId - ID замовлення (опціонально)
 * @returns {Promise<boolean>} - true якщо успішно відстежено
 */
export async function trackConversion(orderValue = 0, orderId = null) {
  const refCode = getRefCode();
  
  if (!refCode) {
    console.warn('[Tracking] Немає ref коду для відстеження конверсії');
    return false;
  }

  const visitorId = getVisitorId();
  const conversionUrl = `${API_BASE_URL}/api/track/conversion`;

  const requestBody = {
    unique_code: refCode,
    code: refCode,
    order_value: orderValue,
    value: orderValue,
    amount: orderValue,
    total: orderValue,
    visitor_id: visitorId,
    visitorId: visitorId
  };

  if (orderId) {
    requestBody.order_id = orderId;
    requestBody.orderId = orderId;
    requestBody.order_number = orderId;
  }

  try {
    const response = await fetch(conversionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Visitor-ID': visitorId
      },
      body: JSON.stringify(requestBody)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[Tracking] ✅ Конверсія відстежена:', {
        refCode,
        orderValue,
        orderId: orderId || 'none',
        response: data
      });
      return true;
    } else {
      console.warn('[Tracking] ⚠️ Помилка відстеження конверсії:', response.status);
      return false;
    }
  } catch (error) {
    console.error('[Tracking] ❌ Помилка при відстеженні конверсії:', error);
    return false;
  }
}

/**
 * Відстежити перегляд сторінки (page view)
 * @param {string} refCode - Ref код (опціонально, якщо не передано, буде взято з getRefCode)
 * @returns {Promise<boolean>} - true якщо успішно відстежено
 */
export async function trackPageView(refCode = null) {
  const code = refCode || getRefCode();
  
  if (!code) {
    // Немає ref коду, пропускаємо
    return false;
  }

  const visitorId = getVisitorId();
  const viewUrl = `${API_BASE_URL}/api/track/view/${encodeURIComponent(code)}?visitor_id=${encodeURIComponent(visitorId)}`;

  try {
    const response = await fetch(viewUrl, {
      method: 'GET',
      headers: {
        'X-Visitor-ID': visitorId
      }
    });

    if (response.ok) {
      console.log('[Tracking] ✅ Page view відстежено:', code);
      return true;
    } else {
      console.warn('[Tracking] ⚠️ Помилка відстеження page view:', response.status);
      return false;
    }
  } catch (error) {
    console.error('[Tracking] ❌ Помилка при відстеженні page view:', error);
    return false;
  }
}

