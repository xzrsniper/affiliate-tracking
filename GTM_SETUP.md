# 🏷️ Налаштування Lehko Track через Google Tag Manager

## Переваги використання GTM

- ✅ Централізоване управління всіма тегами
- ✅ Не потрібно редагувати код сайту
- ✅ Легко оновлювати та налаштовувати
- ✅ Підтримка версіонування та тестування
- ✅ Автоматична перевірка наявності трекера

---

## Крок 1: Відкрийте Google Tag Manager

1. Перейдіть на https://tagmanager.google.com/
2. Виберіть ваш контейнер або створіть новий
3. Натисніть "Додати новий тег" (Add a new tag)

---

## Крок 2: Створіть Custom HTML тег

1. **Назва тега:** `Lehko Track - Affiliate Tracker`

2. **Тип тега:** Custom HTML

3. **HTML код:** Скопіюйте код з файлу `public/gtm-install.html` або використайте:

```html
<script>
(function() {
  'use strict';
  
  if (window._lehkoTrackerGTMInitialized) return;
  window._lehkoTrackerGTMInitialized = true;

  const BASE_URL = 'https://lehko.space/api/track';
  const CONVERSION_KEYWORDS = ['order', 'thank-you', 'thankyou', 'success', 'confirmation', 'complete', 'purchase'];
  const STORAGE_REF_CODE = 'aff_ref_code';
  const STORAGE_VISITOR_ID = 'lehko_visitor_id';
  const REF_PARAM = 'ref';
  
  function getRootDomain() {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length <= 2) return hostname;
    return '.' + parts.slice(-2).join('.');
  }
  
  const COOKIE_DOMAIN = getRootDomain();
  const COOKIE_PATH = '/';

  function setCookie(name, value, days) {
    try {
      const expires = new Date();
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
      const cookieString = name + '=' + encodeURIComponent(value) +
                          ';expires=' + expires.toUTCString() +
                          ';path=' + COOKIE_PATH + ';SameSite=Lax';
      if (COOKIE_DOMAIN && !COOKIE_DOMAIN.includes('localhost')) {
        document.cookie = cookieString + ';domain=' + COOKIE_DOMAIN;
      } else {
        document.cookie = cookieString;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function getCookie(name) {
    try {
      const nameEQ = name + '=';
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) {
          return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  function getURLParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  function generateVisitorId() {
    return 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function getVisitorId() {
    let visitorId = localStorage.getItem(STORAGE_VISITOR_ID);
    if (!visitorId) {
      visitorId = generateVisitorId();
      localStorage.setItem(STORAGE_VISITOR_ID, visitorId);
    }
    return visitorId;
  }

  function captureReferral() {
    const refCode = getURLParameter(REF_PARAM);
    if (refCode) {
      setCookie(STORAGE_REF_CODE, refCode, 365);
      localStorage.setItem(STORAGE_REF_CODE, refCode);
    }
  }

  function trackPageView() {
    const refCode = getURLParameter(REF_PARAM) || getCookie(STORAGE_REF_CODE) || localStorage.getItem(STORAGE_REF_CODE);
    if (!refCode) return;

    const visitorId = getVisitorId();
    const url = BASE_URL + '/view/' + encodeURIComponent(refCode) + '?visitor_id=' + encodeURIComponent(visitorId);

    if (navigator.sendBeacon) {
      navigator.sendBeacon(url);
    } else {
      const img = new Image();
      img.src = url;
    }
  }

  function trackConversion() {
    const refCode = getCookie(STORAGE_REF_CODE) || localStorage.getItem(STORAGE_REF_CODE);
    if (!refCode) return;

    const currentPath = window.location.pathname.toLowerCase();
    const isConversionPage = CONVERSION_KEYWORDS.some(keyword => 
      currentPath.includes(keyword.toLowerCase())
    );

    if (!isConversionPage) return;

    const visitorId = getVisitorId();
    const url = BASE_URL + '/conversion?code=' + encodeURIComponent(refCode) + 
                '&visitor_id=' + encodeURIComponent(visitorId);

    if (navigator.sendBeacon) {
      navigator.sendBeacon(url);
    } else {
      const img = new Image();
      img.src = url;
    }
  }

  function sendVerificationPing() {
    const refCode = getURLParameter(REF_PARAM) || getCookie(STORAGE_REF_CODE) || localStorage.getItem(STORAGE_REF_CODE);
    if (!refCode) return;

    const domain = window.location.hostname;
    const url = BASE_URL.replace('/api/track', '') + '/api/track/verify?code=' + encodeURIComponent(refCode) + 
                '&domain=' + encodeURIComponent(domain) + '&version=gtm';

    if (navigator.sendBeacon) {
      navigator.sendBeacon(url);
    } else {
      const img = new Image();
      img.src = url;
    }
  }

  function init() {
    try {
      captureReferral();
      trackPageView();
      sendVerificationPing();
      setTimeout(function() {
        trackConversion();
      }, 500);
    } catch (error) {
      console.error('[Lehko Tracker GTM] Error:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  setInterval(function() {
    sendVerificationPing();
  }, 5 * 60 * 1000);
})();
</script>
```

---

## Крок 3: Налаштуйте тригер

1. **Тип тригера:** All Pages
2. **Це забезпечить завантаження трекера на всіх сторінках**

---

## Крок 4: Налаштуйте пріоритет

1. Відкрийте налаштування тегу
2. Встановіть **Tag firing priority: High** (щоб завантажувався рано)
3. Це забезпечить правильне відстеження

---

## Крок 5: Збережіть та опублікуйте

1. Натисніть "Зберегти" (Save)
2. Натисніть "Публікувати" (Publish)
3. Перевірте, чи тег працює

---

## Перевірка встановлення

### Метод 1: Перевірка в панелі управління

1. Відкрийте панель Lehko Track
2. Перейдіть в "Сайти" (Websites)
3. Додайте ваш домен
4. Натисніть "Перевірити підключення"
5. Статус має показати "✅ Підключено"

### Метод 2: Перевірка в браузері

1. Відкрийте ваш сайт з параметром `?ref=TEST123`
2. Відкрийте DevTools (F12) → Console
3. Має бути видно: `[Lehko Tracker GTM] Tracker initialized`

### Метод 3: Перевірка Network

1. Відкрийте DevTools → Network
2. Фільтр: `verify`
3. Має бути запит до `https://lehko.space/api/track/verify`
4. Статус: `200 OK`

---

## Автоматична перевірка статусу

Система автоматично перевіряє наявність трекера через:

1. **Verification pings** - трекер відправляє ping кожні 5 хвилин
2. **HTML scraping** - перевірка коду сторінки (якщо ping не знайдено)

Якщо трекер встановлено через GTM, система автоматично визначить це через verification pings.

---

## Оновлення коду трекера

Якщо потрібно оновити код трекера:

1. Відкрийте GTM
2. Знайдіть тег "Lehko Track - Affiliate Tracker"
3. Оновіть HTML код
4. Збережіть та опублікуйте

---

## Підтримка

Якщо виникають проблеми:

1. Перевірте консоль браузера на помилки
2. Перевірте Network вкладку на запити до API
3. Перевірте статус в панелі управління Lehko Track

---

## Важливо!

- ✅ Завжди встановлюйте пріоритет "High" для тега
- ✅ Використовуйте тригер "All Pages"
- ✅ Перевіряйте статус після встановлення
- ✅ Трекер відправляє verification ping кожні 5 хвилин
