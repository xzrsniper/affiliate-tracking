/**
 * Утиліта для відстеження конверсій без tracker.js
 * Прямі виклики API для відстеження конверсій
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Отримати ref код з URL або localStorage
 */
export function getRefCode() {
  // Спочатку перевіряємо URL параметр
  const urlParams = new URLSearchParams(window.location.search);
  const refFromUrl = urlParams.get('ref');
  if (refFromUrl) {
    // Зберігаємо в localStorage для подальшого використання
    try {
      localStorage.setItem('aff_ref_code', refFromUrl);
    } catch (e) {
      // localStorage може бути недоступний
    }
    return refFromUrl;
  }

  // Перевіряємо localStorage
  try {
    const refFromStorage = localStorage.getItem('aff_ref_code');
    if (refFromStorage) {
      return refFromStorage;
    }
  } catch (e) {
    // localStorage недоступний
  }

  // Перевіряємо cookies
  try {
    const cookies = document.cookie.split('; ');
    const refCookie = cookies.find(row => row.startsWith('aff_ref_code='));
    if (refCookie) {
      return refCookie.split('=')[1];
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

