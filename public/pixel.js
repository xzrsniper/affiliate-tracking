/**
 * LehkoTrack Pixel v4.3 — GTM/dataLayer price extraction, JSON-LD, enhanced success detection
 *
 * Install ONCE: <script src="https://YOUR_DOMAIN/pixel.js" data-site="SITE_ID" async></script>
 *
 * The tracker automatically:
 *   1. Captures ref & click_id from URL → stores in localStorage + cookies
 *   2. Decorates ALL internal links so ref/click_id follow the user across pages
 *   3. On ANY page load: checks if it's a success page → sends "sale"
 *   4. Detects purchase button click → sends "lead" (ONLY if button configured via Visual Mapper)
 *   5. Deferred conversion: if user returns after purchase → sale detected
 *   6. Works even if installed only on ONE page (cookies + URL decoration)
 *   7. Extracts price from: URL params, GTM dataLayer, JSON-LD, meta tags, global vars, DOM scan
 */
(function () {
  'use strict';
  if (window.__lehkoTrackLoaded) return;
  window.__lehkoTrackLoaded = true;

  // Config sources (priority): window.__lehkoConfig > script[data-site] > document.currentScript
  var gtmCfg = window.__lehkoConfig || {};
  var scriptEl = document.currentScript || document.querySelector('script[data-site]');
  var SITE_ID = gtmCfg.siteId || (scriptEl ? scriptEl.getAttribute('data-site') : null);
  var BASE_URL = gtmCfg.baseUrl || '';

  if (!BASE_URL && scriptEl && scriptEl.src) {
    try { BASE_URL = new URL(scriptEl.src).origin; } catch (e) { /* */ }
  }

  if (!SITE_ID || !BASE_URL) {
    console.warn('[LehkoTrack] Missing config. Use data-site attribute or set window.__lehkoConfig = { siteId: "X", baseUrl: "https://..." }');
    return;
  }

  // ── Persistence: localStorage + cookies ────────────────────────────────
  function ls(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      if (val === null) return localStorage.removeItem(key);
      localStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  function ss(key, val) {
    try {
      if (val === undefined) return sessionStorage.getItem(key);
      if (val === null) return sessionStorage.removeItem(key);
      sessionStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  function setCookie(name, val, days) {
    var d = new Date();
    d.setTime(d.getTime() + (days || 30) * 864e5);
    document.cookie = name + '=' + encodeURIComponent(val) +
      ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
  }

  function getCookie(name) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }

  // Read from ANY available source (URL params > localStorage > cookies)
  function getRef() {
    return new URLSearchParams(location.search).get('ref') ||
           ls('lehko_ref') || getCookie('lehko_ref') || null;
  }

  function getClickId() {
    return new URLSearchParams(location.search).get('click_id') ||
           ls('lehko_click_id') || getCookie('lehko_click_id') || null;
  }

  // ── 1. Capture & Persist ───────────────────────────────────────────────
  // Save tracking params to ALL persistence layers
  function captureAndPersist() {
    var params = new URLSearchParams(location.search);
    var urlRef = params.get('ref');
    var urlCid = params.get('click_id');

    // If URL has fresh params, they take priority
    if (urlRef) {
      ls('lehko_ref', urlRef);
      setCookie('lehko_ref', urlRef, 30);
    }
    if (urlCid) {
      ls('lehko_click_id', urlCid);
      setCookie('lehko_click_id', urlCid, 30);
    }

    // Sync: if localStorage has data but cookie doesn't (or vice versa)
    var ref = getRef();
    var cid = getClickId();
    if (ref) {
      if (!ls('lehko_ref')) ls('lehko_ref', ref);
      if (!getCookie('lehko_ref')) setCookie('lehko_ref', ref, 30);
    }
    if (cid) {
      if (!ls('lehko_click_id')) ls('lehko_click_id', cid);
      if (!getCookie('lehko_click_id')) setCookie('lehko_click_id', cid, 30);
    }
  }

  // ── 2. URL Decoration (auto-propagate to ALL pages) ────────────────────
  function decorateUrl(href) {
    var ref = getRef();
    if (!ref) return href;
    try {
      var u = new URL(href, location.origin);
      if (u.origin !== location.origin) return href;
      if (u.searchParams.has('ref')) return href;
      u.searchParams.set('ref', ref);
      var cid = getClickId();
      if (cid) u.searchParams.set('click_id', cid);
      return u.toString();
    } catch (e) { return href; }
  }

  function decorateElement(el) {
    if (!el || !el.tagName) return;
    if (el.tagName === 'A') {
      var href = el.getAttribute('href');
      if (!href || href.charAt(0) === '#' || href.indexOf('javascript:') === 0 ||
          href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;
      var newHref = decorateUrl(el.href);
      if (newHref !== el.href) el.href = newHref;
    }
    if (el.tagName === 'FORM') {
      var ref = getRef();
      var cid = getClickId();
    if (!ref) return;
      // Add hidden inputs to forms
      if (!el.querySelector('input[name="ref"]')) {
        var inp = document.createElement('input');
        inp.type = 'hidden'; inp.name = 'ref'; inp.value = ref;
        el.appendChild(inp);
      }
      if (cid && !el.querySelector('input[name="click_id"]')) {
        var inp2 = document.createElement('input');
        inp2.type = 'hidden'; inp2.name = 'click_id'; inp2.value = cid;
        el.appendChild(inp2);
      }
    }
  }

  function decorateAllLinks() {
    if (!getRef()) return;
    var els = document.querySelectorAll('a[href], form');
    for (var i = 0; i < els.length; i++) decorateElement(els[i]);

    // Watch for dynamically added links
    try {
      new MutationObserver(function (muts) {
        for (var m = 0; m < muts.length; m++) {
          var added = muts[m].addedNodes;
          for (var n = 0; n < added.length; n++) {
            var node = added[n];
            if (node.nodeType !== 1) continue;
            decorateElement(node);
            if (node.querySelectorAll) {
              var sub = node.querySelectorAll('a[href], form');
              for (var j = 0; j < sub.length; j++) decorateElement(sub[j]);
            }
          }
        }
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) { /* old browser */ }
  }

  // ── 3. Server Config ──────────────────────────────────────────────────
  var cfg = {
    purchaseButtonSelector: null,
    cartButtonSelector: null,
    priceSelector: null,
    staticPrice: null,
    conversionUrls: []
  };

  function fetchConfig() {
    return fetch(BASE_URL + '/api/track/config?site=' + encodeURIComponent(SITE_ID), { mode: 'cors' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.success) {
          cfg.purchaseButtonSelector = d.purchaseButtonSelector || null;
          cfg.cartButtonSelector = d.cartButtonSelector || null;
          cfg.priceSelector = d.priceSelector || null;
          cfg.staticPrice = d.staticPrice != null ? Number(d.staticPrice) : null;
          cfg.conversionUrls = d.conversionUrls || [];
        }
      })
      .catch(function () {});
  }

  // ── 4. Price Extraction ───────────────────────────────────────────────
  function parsePrice(text) {
    if (!text) return 0;
    var s = text.replace(/\s/g, '').replace(/[^\d.,-]/g, '');
    if (/^\d+,\d{1,2}$/.test(s)) s = s.replace(',', '.');
    else s = s.replace(/,/g, '');
    var v = parseFloat(s);
    return (v > 0 && v < 10000000) ? v : 0;
  }

  function extractPrice(near) {
    if (cfg.staticPrice != null && cfg.staticPrice > 0) return cfg.staticPrice;
    if (cfg.priceSelector) {
      var el = document.querySelector(cfg.priceSelector);
      if (el) { var p = parsePrice(el.textContent); if (p > 0) return p; }
    }
    if (near) {
      var parent = near.parentElement;
      for (var depth = 0; depth < 5 && parent; depth++, parent = parent.parentElement) {
        var nodes = parent.querySelectorAll('*');
        for (var i = 0; i < nodes.length; i++) {
          var t = nodes[i].textContent || '';
          if (/[\u20B4$\u20AC]|грн|uah|usd|eur/i.test(t)) {
            var val = parsePrice(t);
            if (val > 0) return val;
          }
        }
      }
    }
    return 0;
  }

  function extractOrderFromUrl() {
    var p = new URLSearchParams(location.search);
    var total = p.get('total') || p.get('amount') || p.get('sum') ||
                p.get('order_value') || p.get('price') || p.get('value') ||
                p.get('order_total') || p.get('grand_total') || p.get('revenue') ||
                p.get('transaction_total') || p.get('suma') || p.get('сума');
    var orderId = p.get('order') || p.get('order_id') || p.get('orderId') ||
                  p.get('order_number') || p.get('orderNumber') || p.get('transaction_id') ||
                  p.get('transactionId') || p.get('id') || p.get('order_key');
    // Also check URL hash fragment (some SPAs use #order=123&total=500)
    if (!total || !orderId) {
      try {
        var hashParams = new URLSearchParams(location.hash.replace(/^#\/?/, ''));
        if (!total) total = hashParams.get('total') || hashParams.get('amount') || hashParams.get('order_value');
        if (!orderId) orderId = hashParams.get('order_id') || hashParams.get('order');
      } catch (e) { /* */ }
    }
    return { total: total ? parseFloat(total) : 0, orderId: orderId || null };
  }

  // ── 4b. Extract price from GTM dataLayer (WooCommerce, Shopify, GA4 ecommerce) ──
  function extractFromDataLayer() {
    try {
      var dl = window.dataLayer;
      if (!dl || !Array.isArray(dl)) return 0;
      // Scan dataLayer in reverse (latest events first)
      for (var i = dl.length - 1; i >= 0; i--) {
        var entry = dl[i];
        if (!entry) continue;
        // GA4 ecommerce purchase event
        if (entry.event === 'purchase' && entry.ecommerce) {
          var v = parseFloat(entry.ecommerce.value || entry.ecommerce.revenue || entry.ecommerce.total || 0);
          if (v > 0) { console.log('[LehkoTrack] Price from dataLayer GA4 purchase:', v); return v; }
        }
        // UA / GTM ecommerce
        if (entry.ecommerce && entry.ecommerce.purchase && entry.ecommerce.purchase.actionField) {
          var v = parseFloat(entry.ecommerce.purchase.actionField.revenue || entry.ecommerce.purchase.actionField.value || 0);
          if (v > 0) { console.log('[LehkoTrack] Price from dataLayer UA purchase:', v); return v; }
        }
        // Generic transaction event
        if (entry.transactionTotal) {
          var v = parseFloat(entry.transactionTotal);
          if (v > 0) { console.log('[LehkoTrack] Price from dataLayer transactionTotal:', v); return v; }
        }
        if (entry.event === 'transaction' || entry.event === 'purchase' || entry.event === 'order_complete') {
          var v = parseFloat(entry.value || entry.revenue || entry.total || entry.order_total || entry.amount || 0);
          if (v > 0) { console.log('[LehkoTrack] Price from dataLayer event:', entry.event, v); return v; }
        }
        // WooCommerce specific
        if (entry.event === 'gtm4wp.orderCompletedEEC') {
          var ecom = entry.ecommerce || {};
          var purch = ecom.purchase || {};
          var af = purch.actionField || {};
          var v = parseFloat(af.revenue || af.value || 0);
          if (v > 0) { console.log('[LehkoTrack] Price from WooCommerce dataLayer:', v); return v; }
        }
      }
    } catch (e) { /* */ }
    return 0;
  }

  // ── 4c. Extract price from JSON-LD structured data (schema.org) ────────
  function extractFromJsonLd() {
    try {
      var scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (var i = 0; i < scripts.length; i++) {
        var data = JSON.parse(scripts[i].textContent);
        // Handle @graph arrays
        var items = Array.isArray(data) ? data : (data['@graph'] || [data]);
        for (var j = 0; j < items.length; j++) {
          var item = items[j];
          if (!item) continue;
          var type = item['@type'] || '';
          if (/Order|Invoice|Receipt/i.test(type)) {
            var v = parseFloat(item.totalPrice || item.price || item.priceCurrency && item.totalPaymentDue && item.totalPaymentDue.value || 0);
            if (v > 0) { console.log('[LehkoTrack] Price from JSON-LD:', v); return v; }
          }
          if (/Product|Offer/i.test(type)) {
            var offers = item.offers || item;
            if (offers.price) {
              var v = parseFloat(offers.price);
              if (v > 0) { console.log('[LehkoTrack] Price from JSON-LD Product:', v); return v; }
            }
          }
        }
      }
    } catch (e) { /* */ }
    return 0;
  }

  // ── 4d. Extract price from global JS variables (common e-commerce patterns) ──
  function extractFromGlobalVars() {
    try {
      // WooCommerce, Shopify, and custom integrations often expose order data
      var sources = [
        window.wc_order_data,
        window.Shopify && window.Shopify.checkout,
        window.__order__,
        window.orderData,
        window.order_data,
        window.checkoutData,
        window.__CHECKOUT_DATA__,
        window.TRACKER_CONFIG
      ];
      for (var i = 0; i < sources.length; i++) {
        var src = sources[i];
        if (!src || typeof src !== 'object') continue;
        var v = parseFloat(src.total || src.total_price || src.order_total || src.amount ||
                           src.revenue || src.value || src.ORDER_VALUE || src.grand_total ||
                           src.subtotal_price || src.price || 0);
        if (v > 0) { console.log('[LehkoTrack] Price from global var:', v); return v; }
      }
      // Shopify checkout in cents
      if (window.Shopify && window.Shopify.checkout && window.Shopify.checkout.total_price) {
        var shopifyVal = parseFloat(window.Shopify.checkout.total_price);
        // Shopify sometimes returns price in cents (e.g. "4999" for $49.99)
        if (shopifyVal > 0) {
          if (shopifyVal > 100000) shopifyVal = shopifyVal / 100; // likely cents
          console.log('[LehkoTrack] Price from Shopify checkout:', shopifyVal);
          return shopifyVal;
        }
      }
    } catch (e) { /* */ }
    return 0;
  }

  // ── 4e. Extract price from meta tags ──────────────────────────────────
  function extractFromMeta() {
    try {
      var selectors = [
        'meta[property="product:price:amount"]',
        'meta[property="og:price:amount"]',
        'meta[name="order-total"]',
        'meta[name="order_total"]',
        'meta[name="amount"]',
        'meta[name="order-value"]'
      ];
      for (var i = 0; i < selectors.length; i++) {
        var el = document.querySelector(selectors[i]);
        if (el) {
          var v = parseFloat(el.getAttribute('content'));
          if (v > 0) { console.log('[LehkoTrack] Price from meta tag:', selectors[i], v); return v; }
        }
      }
    } catch (e) { /* */ }
    return 0;
  }

  // ── 4f. Full-page price scan (for success/thank-you pages) ────────────
  // When priceSelector/staticPrice are NOT configured, scan the DOM for order total
  function extractPriceFromPage() {
    // Try structured data sources first (most reliable)
    var dlPrice = extractFromDataLayer();
    if (dlPrice > 0) return dlPrice;

    var jsonLdPrice = extractFromJsonLd();
    if (jsonLdPrice > 0) return jsonLdPrice;

    var globalPrice = extractFromGlobalVars();
    if (globalPrice > 0) return globalPrice;

    var metaPrice = extractFromMeta();
    if (metaPrice > 0) return metaPrice;

    // Fallback: scan the DOM
    var body = document.body;
    if (!body) return 0;

    var TOTAL_RE = /total|сума|разом|підсумок|итого|всего|до сплати|к оплате|вартість|стоимость|замовлення на суму|заказ на сумму|order\s*amount|order\s*total|grand\s*total|amount\s*due|amount\s*paid|сплачено|оплачено/i;
    var PRICE_RE = /[\u20B4$\u20AC£\u20BD]|грн|uah|usd|eur|руб|zł|pln/i;

    // Strategy 1: find element with "total" label + sibling/adjacent price element
    var candidates = body.querySelectorAll('td, th, span, p, div, li, dt, dd, strong, b, small, h1, h2, h3, h4, h5, h6, label, tr, .order-total, .woocommerce-order-overview, .total, [class*="total"], [class*="price"], [class*="amount"], [class*="sum"]');
    for (var i = 0; i < candidates.length; i++) {
      var el = candidates[i];
      if (el.children.length > 10) continue;
      var text = (el.textContent || '').trim();
      if (text.length < 3 || text.length > 300) continue;
      if (TOTAL_RE.test(text) && /\d/.test(text)) {
        var val = parsePrice(text);
        if (val > 0) return val;
      }
    }

    // Strategy 1b: "total" label in one element, price in adjacent sibling
    var labels = body.querySelectorAll('td, th, span, p, div, dt, label, strong, b');
    for (var i = 0; i < labels.length; i++) {
      var lbl = labels[i];
      var lblText = (lbl.textContent || '').trim();
      if (lblText.length < 3 || lblText.length > 60) continue;
      if (!TOTAL_RE.test(lblText)) continue;
      // Check next sibling element
      var sibling = lbl.nextElementSibling;
      if (sibling) {
        var sibText = (sibling.textContent || '').trim();
        if (sibText.length > 0 && sibText.length < 80) {
          var val = parsePrice(sibText);
          if (val > 0) return val;
        }
      }
      // Check parent's next sibling (for table rows: <td>Сума</td><td>500 грн</td>)
      if (lbl.parentElement) {
        var parentSibling = lbl.parentElement.nextElementSibling;
        if (parentSibling) {
          var psText = (parentSibling.textContent || '').trim();
          if (psText.length > 0 && psText.length < 80) {
            var val = parsePrice(psText);
            if (val > 0) return val;
          }
        }
      }
    }

    // Strategy 2: any prominent element with currency symbol
    for (var i = 0; i < candidates.length; i++) {
      var el = candidates[i];
      if (el.children.length > 3) continue;
      var text = (el.textContent || '').trim();
      if (text.length < 2 || text.length > 80) continue;
      if (PRICE_RE.test(text)) {
        var val = parsePrice(text);
        if (val > 0) return val;
      }
    }

    // Strategy 3: regex scan of visible body text for price patterns
    var bodyText = (body.innerText || '').substring(0, 8000);
    var priceMatch = bodyText.match(/(?:сума|total|разом|итого|всего|до сплати|к оплате|amount|оплачено|сплачено)[^\d]{0,30}?([\d][\d\s.,]*\d)/i);
    if (priceMatch) {
      var val = parsePrice(priceMatch[1]);
      if (val > 0) return val;
    }

    return 0;
  }

  // ── 5. Event Sender ────────────────────────────────────────────────────
  // Dedup rules:
  //   - With orderId: block same orderId permanently (prevents reload/back)
  //   - Without orderId: block rapid duplicates (lead: 12s — GTM+pixel double fire; sale: 3s)
  //   - Lead: завжди відправляємо order_value 0 — дохід рахується тільки з sale (після покупки)
  function sendEvent(eventType, value, orderId) {
    var ref = getRef();
    if (!ref) {
      console.warn('[LehkoTrack] Подія не відправлена: немає ref (зайдіть по трекінговому посиланню з click_id/ref)');
      return;
    }
    if (eventType === 'lead') value = 0;

    if (orderId) {
      // Permanent dedup by orderId — same order never sent twice
      var orderKey = 'lehko_oid_' + eventType + '_' + orderId;
      try { if (ls(orderKey)) { console.log('[LehkoTrack] Dedup: orderId already sent', orderId); return; } ls(orderKey, '1'); } catch (e) { /* */ }
    } else {
      // Anti-double: lead 12s (GTM + pixel обидва можуть викликати на один клік), sale 3s
      var dedupMs = eventType === 'lead' ? 12000 : 3000;
      var tsKey = 'lehko_ts_' + eventType;
      var now = Date.now();
      try {
        var lastTs = parseInt(ss(tsKey) || '0');
        if (now - lastTs < dedupMs) { console.log('[LehkoTrack] Dedup: duplicate blocked', eventType, '(within', dedupMs / 1000, 's)'); return; }
        ss(tsKey, String(now));
      } catch (e) { /* */ }
    }

    var body = {
      unique_code: ref,
      order_value: value || 0,
      event_type: eventType,
      site_id: SITE_ID
    };
    var clickId = getClickId();
    if (clickId) body.click_id = clickId;
    if (orderId) body.order_id = orderId;

    fetch(BASE_URL + '/api/track/conversion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true
    }).catch(function (err) {
      console.error('[LehkoTrack] Помилка відправки конверсії:', err.message || err);
    });

    console.log('[LehkoTrack]', eventType.toUpperCase(), '| value:', value, '| orderId:', orderId, '| ref:', ref);
    if (eventType === 'sale' && (!value || value === 0)) {
      console.warn('[LehkoTrack] ⚠️ Sale відправлено з ціною 0. Використайте один із способів:',
        '\n• Налаштуйте "Селектор ціни" або "Фіксована ціна" в адмінці LehkoTrack',
        '\n• Додайте ?total=500 до URL сторінки подяки',
        '\n• Викличте: window.LehkoTrack.trackPurchase({ amount: 500, orderId: "123" })');
    }
  }

  // ── 6. (Removed) Generic button detection removed ─────────────────
  // Leads now fire ONLY via purchaseButtonSelector set through Visual Mapper.

  // ── 7. Success Page Detection ─────────────────────────────────────────
  // Не вважати success: checkout, cart, сторінка оформлення/оплати (це ще не подяка)
  var CHECKOUT_URL_RE = /checkout|cart|basket|korzin|koszyk|oplata|payment|\/pay\/|order\/?$|zamovlennya|oformlennya|checkout/i;
  var SUCCESS_URL_RE = /thank|thanks|dyakuy|spasybi|success|payment[_-]?success|order[_-]?(done|ready)|complete/i;

  var SUCCESS_TEXT_RE = new RegExp([
    'дякуємо за (замовлення|покупку|оплату|ваше замовлення)',
    'замовлення (оформлено|прийнято|підтверджено|створено|відправлено|успішно)',
    'замовлення\\s*[#№]\\s*\\d',
    'ваше замовлення\\s*(прийнято|оформлено|підтверджено|#|№)',
    'оплата (пройшла|успішна|прийнята|підтверджена)',
    'order\\s*(confirmed|placed|received|complete|accepted|number|#)',
    'thank you for (your\\s*)?(order|purchase|payment)',
    'successfully\\s*(placed|ordered|completed|submitted)',
    'payment\\s*(successful|accepted|confirmed|received)',
    'спасибо за (заказ|покупку|оплату)',
    'заказ (оформлен|принят|подтвержд|создан|отправлен)',
    'ваш заказ\\s*(принят|оформлен|подтвержд|#|№)',
    'оплата (прошла|успешна|принята|подтверждена)',
    'дякуємо за замовлення',
    'оформлення завершено',
    'оформление завершено',
    'покупка оформлена'
  ].join('|'), 'i');

  function isSuccessPage() {
    var path = location.pathname + location.search;
    if (CHECKOUT_URL_RE.test(path)) return false;
    if (SUCCESS_URL_RE.test(location.pathname)) return true;
    for (var i = 0; i < cfg.conversionUrls.length; i++) {
      if (path.indexOf(cfg.conversionUrls[i]) !== -1) return true;
    }
    return false;
  }

  // ── 7b. Success by DOM text (fallback when URL doesn't match) ────────
  function isSuccessPageByContent() {
    try {
      var bodyText = (document.body.innerText || '').substring(0, 5000);
      if (SUCCESS_TEXT_RE.test(bodyText)) return true;
    } catch (e) { /* */ }
    return false;
  }

  // ── 8. On-Load Success Detection ──────────────────────────────────────
  // If THIS page is a success/thank-you page → send sale immediately.
  // Dedup is handled by sendEvent (orderId-based or 3s anti-double-click).
  function checkSuccessOnLoad() {
    var urlSuccess = isSuccessPage();
    var textSuccess = !urlSuccess && isSuccessPageByContent();

    if (!urlSuccess && !textSuccess) return;
    var ref = getRef();
    if (!ref) return;

    console.log('[LehkoTrack] Success page detected via', urlSuccess ? 'URL' : 'DOM text', ':', location.pathname);

    var urlOrder = extractOrderFromUrl();

    // Try to extract order ID and price from dataLayer (GTM / WooCommerce / Shopify)
    var dataLayerOrderId = null;
    var dataLayerPrice = 0;
    try {
      var dl = window.dataLayer;
      if (dl && Array.isArray(dl)) {
        for (var i = dl.length - 1; i >= 0; i--) {
          var entry = dl[i];
          if (!entry) continue;
          // GA4 purchase
          if (entry.event === 'purchase' && entry.ecommerce) {
            dataLayerPrice = parseFloat(entry.ecommerce.value || entry.ecommerce.revenue || entry.ecommerce.total || 0) || 0;
            dataLayerOrderId = entry.ecommerce.transaction_id || entry.ecommerce.order_id || null;
            if (dataLayerPrice > 0) break;
          }
          // UA purchase
          if (entry.ecommerce && entry.ecommerce.purchase && entry.ecommerce.purchase.actionField) {
            var af = entry.ecommerce.purchase.actionField;
            dataLayerPrice = parseFloat(af.revenue || af.value || 0) || 0;
            dataLayerOrderId = af.id || null;
            if (dataLayerPrice > 0) break;
          }
          // WooCommerce GTM4WP
          if (entry.event === 'gtm4wp.orderCompletedEEC') {
            var ecom = entry.ecommerce || {};
            var purch = ecom.purchase || {};
            var wooAf = purch.actionField || {};
            dataLayerPrice = parseFloat(wooAf.revenue || wooAf.value || 0) || 0;
            dataLayerOrderId = wooAf.id || null;
            if (dataLayerPrice > 0) break;
          }
          // Generic transaction
          if (entry.transactionTotal) {
            dataLayerPrice = parseFloat(entry.transactionTotal) || 0;
            dataLayerOrderId = entry.transactionId || null;
            if (dataLayerPrice > 0) break;
          }
        }
      }
    } catch (e) { /* */ }

    // Also check pending sale price from localStorage (stored when buy button was clicked)
    var pendingPrice = 0;
    try {
      var raw = ls('lehko_pending_sale');
      if (raw) {
        var pending = JSON.parse(raw);
        if (pending && pending.price > 0 && Date.now() - pending.timestamp < 30 * 60 * 1000) {
          pendingPrice = pending.price;
        }
      }
    } catch (e) { /* */ }

    // Priority: URL params > dataLayer > configured selector/static > pending from button click > full page scan
    var price = urlOrder.total || dataLayerPrice || extractPrice(null) || pendingPrice || extractPriceFromPage() || 0;
    var orderId = urlOrder.orderId || dataLayerOrderId || null;

    if (price === 0) {
      console.warn('[LehkoTrack] ⚠️ Sale відправляється з ціною 0! Ціну не вдалося витягнути автоматично.',
        '\nМожливі рішення:',
        '\n1. Налаштуйте "Селектор ціни" або "Статична ціна" в адмінці LehkoTrack',
        '\n2. Додайте параметр "total" або "amount" до URL сторінки подяки',
        '\n3. Використайте API: window.LehkoTrack.trackPurchase({ amount: 500, orderId: "ORDER-123" })',
        '\n4. Переконайтесь що GTM dataLayer має подію purchase з value');
    }

    sendEvent('sale', price, orderId);

    ls('lehko_pending_sale', null);
    console.log('[LehkoTrack] Sale sent | price:', price, '| orderId:', orderId, '| source:',
      urlOrder.total ? 'URL' : dataLayerPrice ? 'dataLayer' : pendingPrice ? 'pendingSale' : price > 0 ? 'DOM' : 'none');
  }

  // ── 9. Deferred Conversion ────────────────────────────────────────────
  // For pages WITHOUT pixel.js: when user returns to a page WITH pixel.js,
  // check if they completed a purchase on a different page
  function storePendingSale(price) {
    try {
      ls('lehko_pending_sale', JSON.stringify({
        price: price || 0,
        timestamp: Date.now(),
        page: location.href
      }));
    } catch (e) { /* */ }
  }

  function checkDeferredConversion() {
    try {
      var raw = ls('lehko_pending_sale');
      if (!raw) return;
      var pending = JSON.parse(raw);

      // Expire after 30 minutes
      if (Date.now() - pending.timestamp > 30 * 60 * 1000) {
        ls('lehko_pending_sale', null);
        return;
      }

      // Check if we came FROM a success page (document.referrer)
      if (document.referrer) {
        try {
          var refUrl = new URL(document.referrer);
          if (refUrl.origin === location.origin && SUCCESS_URL_RE.test(refUrl.pathname)) {
            // Extract order info from the referrer URL if possible
            var refParams = new URLSearchParams(refUrl.search);
            var refTotal = parseFloat(refParams.get('total') || refParams.get('amount') || '0');
            var refOrderId = refParams.get('order') || refParams.get('order_id') || null;
            sendEvent('sale', refTotal || pending.price, refOrderId);
            ls('lehko_pending_sale', null);
            console.log('[LehkoTrack] Deferred sale via referrer:', document.referrer);
            return;
          }
        } catch (e) { /* invalid referrer */ }
      }
    } catch (e) { /* */ }
  }

  // ── 10. Confirmation Watcher ──────────────────────────────────────────
  var watcherActive = false;

  function startConfirmationWatcher(price) {
    if (watcherActive) return;
    watcherActive = true;

    var startUrl = location.href;
    var TIMEOUT = 120000;
    var startTime = Date.now();
    var observer = null;
    var interval = null;

    function fireSale(detectedPrice, detectedOrderId) {
      cleanup();
      var finalPrice = detectedPrice || price || extractFromDataLayer() || extractPrice(null) || extractPriceFromPage();
      sendEvent('sale', finalPrice, detectedOrderId || null);
      ls('lehko_pending_sale', null);
      console.log('[LehkoTrack] Watcher confirmed sale:', finalPrice, detectedOrderId);
    }

    function cleanup() {
      watcherActive = false;
      if (observer) { observer.disconnect(); observer = null; }
      if (interval) { clearInterval(interval); interval = null; }
    }

    function checkTimeout() {
      if (Date.now() - startTime > TIMEOUT) { cleanup(); return true; }
      return false;
    }

    function checkUrl() {
      if (isSuccessPage()) {
        var urlOrder = extractOrderFromUrl();
        fireSale(urlOrder.total || price, urlOrder.orderId);
        return true;
      }
      return false;
    }

    // Watch DOM mutations for success text (не на checkout/cart)
    try {
      observer = new MutationObserver(function (mutations) {
        if (checkTimeout()) return;
        if (CHECKOUT_URL_RE.test(location.pathname)) return;
        for (var m = 0; m < mutations.length; m++) {
          var added = mutations[m].addedNodes;
          for (var n = 0; n < added.length; n++) {
            var node = added[n];
            if (node.nodeType !== 1) continue;
            var text = (node.textContent || '').trim();
            if (text.length < 10 || text.length > 1000) continue;
            if (SUCCESS_TEXT_RE.test(text)) {
              fireSale(price, null);
              return;
            }
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    } catch (e) { /* */ }

    // Poll for URL changes
    interval = setInterval(function () {
      if (checkTimeout()) return;
      if (location.href !== startUrl) {
        startUrl = location.href;
        captureAndPersist();
        checkUrl();
      }
    }, 500);
  }

  // ── 11. Click Handler ─────────────────────────────────────────────────
  // Lead спрацьовує ТІЛЬКИ якщо purchaseButtonSelector налаштовано через Visual Mapper.
  // Cart спрацьовує ТІЛЬКИ якщо cartButtonSelector налаштовано через Visual Mapper.
  // Без налаштованого селектора — ліди/корзини не відправляються автоматично.
  function onDocClick(e) {
    var target = e.target;

    // Check cart button first
    if (cfg.cartButtonSelector) {
      var cartBtn = target.closest(cfg.cartButtonSelector);
      if (cartBtn) {
        sendEvent('cart', 0, null);
        return;
      }
    }

    // Then check purchase/lead button
    if (!cfg.purchaseButtonSelector) return;

    var btn = target.closest(cfg.purchaseButtonSelector);

    if (btn) {
      var price = extractPrice(btn);
      sendEvent('lead', 0, null);
      storePendingSale(price);
      startConfirmationWatcher(price);
    }
  }

  // ── 12. SPA URL-Change Watcher ────────────────────────────────────────
  function watchUrlChanges() {
    var last = location.href;
    var check = function () {
      if (location.href !== last) {
        last = location.href;
        captureAndPersist();
        decorateAllLinks();
        checkSuccessOnLoad();
      }
    };
    var _push = history.pushState;
    var _replace = history.replaceState;
    history.pushState = function () { _push.apply(this, arguments); check(); };
    history.replaceState = function () { _replace.apply(this, arguments); check(); };
    window.addEventListener('popstate', check);
  }

  // ── 13. Verification Ping ─────────────────────────────────────────────
  function verify() {
    fetch(BASE_URL + '/api/track/verify?domain=' + encodeURIComponent(location.hostname) +
      '&site_id=' + encodeURIComponent(SITE_ID) + '&version=4.3', { mode: 'cors' }).catch(function () {});
  }

  // ── 14. Configuration Mode (Visual Event Mapper) ──────────────────────
  function isConfigMode() {
    var params = new URLSearchParams(location.search);
    // Support: full token in URL, short code in URL, or sessionStorage (persists across page navigation)
    if ((params.get('lehko_mode') === 'configure' && params.get('token')) || params.get('lehko_cfg')) return true;
    try { return !!sessionStorage.getItem('lehko_mapper_token'); } catch (e) { return false; }
  }

  function resolveConfigToken(cb) {
    var params = new URLSearchParams(location.search);
    // Legacy: full token in URL
    if (params.get('lehko_mode') === 'configure' && params.get('token')) {
      var t = params.get('token');
      try { sessionStorage.setItem('lehko_mapper_token', t); } catch (e) {}
      cb(t);
      return;
    }
    // New: short code → fetch full token from server
    var code = params.get('lehko_cfg');
    if (code) {
      fetch(BASE_URL + '/api/track/cfg/' + encodeURIComponent(code), { mode: 'cors' })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.success && d.token) {
            try { sessionStorage.setItem('lehko_mapper_token', d.token); } catch (e) {}
            cb(d.token);
          } else {
            console.warn('[LehkoTrack] Config code expired or invalid');
          }
        })
        .catch(function () { console.warn('[LehkoTrack] Failed to resolve config code'); });
      return;
    }
    // Fallback: token stored in sessionStorage from previous page
    try {
      var saved = sessionStorage.getItem('lehko_mapper_token');
      if (saved) { cb(saved); return; }
    } catch (e) {}
  }

  function startConfigMode(token) {
    // Two modes: 'navigate' (browse the site freely) and 'select' (pick elements)
    var mode = 'navigate';       // 'navigate' | 'select'
    var selecting = 'button';    // what we're selecting: 'button' | 'cart'
    var overlay, tooltip, toolbar, highlighted;
    var savedBtn = null, savedCart = null;

    function buildSelector(el) {
      if (el.id) return '#' + CSS.escape(el.id);
      var path = [];
      while (el && el !== document.body) {
        var seg = el.tagName.toLowerCase();
        if (el.id) { path.unshift('#' + CSS.escape(el.id)); break; }
        if (el.className && typeof el.className === 'string') {
          var cls = el.className.trim().split(/\s+/).filter(function (c) {
            return c && !c.startsWith('lehko-');
          });
          if (cls.length) seg += '.' + cls.map(CSS.escape).join('.');
        }
        var parent = el.parentElement;
        if (parent) {
          var siblings = Array.from(parent.children).filter(function (c) { return c.tagName === el.tagName; });
          if (siblings.length > 1) seg += ':nth-of-type(' + (siblings.indexOf(el) + 1) + ')';
        }
        path.unshift(seg);
        el = parent;
      }
      return path.join(' > ');
    }

    var style = document.createElement('style');
    style.textContent =
      '.lehko-overlay{position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483640;pointer-events:none}' +
      '.lehko-highlight{outline:3px solid #6d28d9;outline-offset:2px;background:rgba(109,40,217,.08);position:relative;z-index:2147483641}' +
      '.lehko-tooltip{position:fixed;z-index:2147483645;background:#1e1b4b;color:#fff;padding:8px 14px;border-radius:8px;font:13px/1.4 system-ui,sans-serif;max-width:360px;pointer-events:none;box-shadow:0 4px 20px rgba(0,0,0,.3)}' +
      '.lehko-toolbar{position:fixed;top:16px;right:16px;z-index:2147483646;background:#1e1b4b;color:#fff;padding:16px 20px;border-radius:12px;font:14px/1.5 system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.3);max-width:340px;user-select:none}' +
      '.lehko-toolbar button{padding:8px 16px;border:none;border-radius:8px;font:600 13px/1 system-ui,sans-serif;cursor:pointer;width:100%}' +
      '.lehko-toolbar .lehko-btn-primary{background:#7c3aed;color:#fff}.lehko-toolbar .lehko-btn-primary:hover{background:#6d28d9}' +
      '.lehko-toolbar .lehko-btn-secondary{background:#334155;color:#e2e8f0}.lehko-toolbar .lehko-btn-secondary:hover{background:#475569}' +
      '.lehko-toolbar .lehko-btn-done{background:#059669;color:#fff}.lehko-toolbar .lehko-btn-done:hover{background:#047857}' +
      '.lehko-toolbar .lehko-btn-nav{background:#0ea5e9;color:#fff}.lehko-toolbar .lehko-btn-nav:hover{background:#0284c7}' +
      '.lehko-toolbar .lehko-btn-select{background:#f59e0b;color:#1e1b4b}.lehko-toolbar .lehko-btn-select:hover{background:#d97706}' +
      '.lehko-selected{outline:3px solid #059669!important;outline-offset:2px;background:rgba(5,150,105,.1)!important}' +
      '.lehko-mode-badge{display:inline-block;padding:3px 10px;border-radius:6px;font-size:12px;font-weight:700;margin-left:8px}' +
      '.lehko-mode-nav{background:#0ea5e9;color:#fff}' +
      '.lehko-mode-sel{background:#f59e0b;color:#1e1b4b}';
    document.head.appendChild(style);

    overlay = document.createElement('div'); overlay.className = 'lehko-overlay'; document.body.appendChild(overlay);
    tooltip = document.createElement('div'); tooltip.className = 'lehko-tooltip'; tooltip.style.display = 'none'; document.body.appendChild(tooltip);
    toolbar = document.createElement('div'); toolbar.className = 'lehko-toolbar'; document.body.appendChild(toolbar);

    // Make toolbar draggable
    var dragging = false, dragX = 0, dragY = 0;
    toolbar.addEventListener('mousedown', function (ev) {
      if (ev.target.tagName === 'BUTTON') return;
      dragging = true; dragX = ev.clientX - toolbar.offsetLeft; dragY = ev.clientY - toolbar.offsetTop;
      toolbar.style.cursor = 'grabbing';
    });
    document.addEventListener('mousemove', function (ev) {
      if (!dragging) return;
      toolbar.style.right = 'auto';
      toolbar.style.left = Math.max(0, Math.min(ev.clientX - dragX, window.innerWidth - toolbar.offsetWidth)) + 'px';
      toolbar.style.top = Math.max(0, Math.min(ev.clientY - dragY, window.innerHeight - toolbar.offsetHeight)) + 'px';
    });
    document.addEventListener('mouseup', function () { dragging = false; toolbar.style.cursor = ''; });

    function esc(s) { return (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    function switchMode(m, sel) {
      if (m === 'navigate') {
        mode = 'navigate';
        // Remove highlight when switching to navigate
        if (highlighted) { highlighted.classList.remove('lehko-highlight'); highlighted = null; }
        tooltip.style.display = 'none';
      } else {
        mode = 'select';
        selecting = sel || selecting;
      }
      render();
    }

    function render() {
      var isNav = mode === 'navigate';
      var modeBadge = isNav
        ? '<span class="lehko-mode-badge lehko-mode-nav">\u{1F310} \u041d\u0430\u0432\u0456\u0433\u0430\u0446\u0456\u044f</span>'
        : '<span class="lehko-mode-badge lehko-mode-sel">\u{1F3AF} \u0412\u0438\u0431\u0456\u0440 ' + (selecting === 'button' ? '\u043a\u043d\u043e\u043f\u043a\u0438 \u043b\u0456\u0434\u0443' : '\u043a\u043d\u043e\u043f\u043a\u0438 \u043a\u043e\u0440\u0437\u0438\u043d\u0438') + '</span>';

      var bl = savedBtn ? '<span style="color:#34d399">\u2714</span> ' + esc(savedBtn) : '<span style="opacity:.5">\u041d\u0435 \u0432\u0438\u0431\u0440\u0430\u043d\u043e</span>';
      var cl = savedCart ? '<span style="color:#34d399">\u2714</span> ' + esc(savedCart) : '<span style="opacity:.5">\u041d\u0435 \u0432\u0438\u0431\u0440\u0430\u043d\u043e</span>';

      var hint = '';
      if (isNav) {
        hint = '<div style="font-size:12px;color:#94a3b8;margin-top:4px">\u041a\u043b\u0456\u043a\u0430\u0439\u0442\u0435 \u043f\u043e \u0441\u0430\u0439\u0442\u0443 \u0432\u0456\u043b\u044c\u043d\u043e: \u0432\u0456\u0434\u043a\u0440\u0438\u0432\u0430\u0439\u0442\u0435 \u043a\u043e\u0448\u0438\u043a, \u043f\u0435\u0440\u0435\u0445\u043e\u0434\u044c\u0442\u0435 \u043d\u0430 \u0441\u0442\u043e\u0440\u0456\u043d\u043a\u0438, \u0434\u043e\u0434\u0430\u0432\u0430\u0439\u0442\u0435 \u0442\u043e\u0432\u0430\u0440\u0438.<br/>\u041a\u043e\u043b\u0438 \u043f\u043e\u0431\u0430\u0447\u0438\u0442\u0435 \u043f\u043e\u0442\u0440\u0456\u0431\u043d\u0443 \u043a\u043d\u043e\u043f\u043a\u0443 \u2014 \u043e\u0431\u0435\u0440\u0456\u0442\u044c \u0432\u0456\u0434\u043f\u043e\u0432\u0456\u0434\u043d\u0438\u0439 \u0440\u0435\u0436\u0438\u043c.</div>';
      } else {
        var selLabel = selecting === 'button' ? '\u043a\u043d\u043e\u043f\u043a\u0443 \u043b\u0456\u0434\u0443' : '\u043a\u043d\u043e\u043f\u043a\u0443 \u043a\u043e\u0440\u0437\u0438\u043d\u0438';
        hint = '<div style="font-size:12px;color:#fbbf24;margin-top:4px">\u041d\u0430\u0432\u0435\u0434\u0456\u0442\u044c \u043a\u0443\u0440\u0441\u043e\u0440 \u043d\u0430 ' + selLabel + ' \u0456 \u043a\u043b\u0456\u043a\u043d\u0456\u0442\u044c. \u041a\u043b\u0456\u043a\u0438 \u043f\u043e \u0441\u0430\u0439\u0442\u0443 \u0437\u0430\u0431\u043b\u043e\u043a\u043e\u0432\u0430\u043d\u0456.</div>';
      }

      toolbar.innerHTML =
        '<div style="margin-bottom:10px">' +
          '<div style="font-weight:700;font-size:15px;display:flex;align-items:center">\uD83D\uDD27 LehkoTrack' + modeBadge + '</div>' +
          hint +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">' +
          '<div style="font-size:12px">\u041a\u043d\u043e\u043f\u043a\u0430 \u043b\u0456\u0434\u0443: ' + bl + '</div>' +
          '<div style="font-size:12px">\u041a\u043d\u043e\u043f\u043a\u0430 \u043a\u043e\u0440\u0437\u0438\u043d\u0438: ' + cl + '</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:6px">' +
          (isNav
            ? '<button class="lehko-btn-select" data-a="sel-btn">\u{1F3AF} \u041e\u0431\u0440\u0430\u0442\u0438 \u043a\u043d\u043e\u043f\u043a\u0443 \u043b\u0456\u0434\u0443</button>' +
              '<button class="lehko-btn-secondary" style="background:#f97316;color:#fff" data-a="sel-cart">\u{1F6D2} \u041e\u0431\u0440\u0430\u0442\u0438 \u043a\u043d\u043e\u043f\u043a\u0443 \u043a\u043e\u0440\u0437\u0438\u043d\u0438</button>'
            : '<button class="lehko-btn-nav" data-a="nav">\u{1F310} \u041d\u0430\u0437\u0430\u0434 \u0434\u043e \u043d\u0430\u0432\u0456\u0433\u0430\u0446\u0456\u0457</button>'
          ) +
          (savedBtn || savedCart ? '<button class="lehko-btn-done" data-a="save">\u2714 \u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438</button>' : '') +
          '<button class="lehko-btn-secondary" data-a="cancel">\u2716 \u0421\u043a\u0430\u0441\u0443\u0432\u0430\u0442\u0438</button>' +
        '</div>';

      toolbar.querySelectorAll('button').forEach(function (b) {
        b.onclick = function (ev) {
          ev.stopPropagation();
          var a = b.getAttribute('data-a');
          if (a === 'sel-btn') switchMode('select', 'button');
          else if (a === 'sel-cart') switchMode('select', 'cart');
          else if (a === 'nav') switchMode('navigate');
          else if (a === 'save') save();
          else if (a === 'cancel') cleanupConfig();
        };
      });
    }

    function onMove(e) {
      if (mode !== 'select') return;
      var el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || el.closest('.lehko-toolbar,.lehko-tooltip')) return;
      if (highlighted && highlighted !== el) highlighted.classList.remove('lehko-highlight');
      el.classList.add('lehko-highlight'); highlighted = el;
      var sel = buildSelector(el), text = (el.textContent || '').trim().substring(0, 60);
      tooltip.innerHTML = '<b>' + esc(el.tagName.toLowerCase()) + '</b><div style="opacity:.7;font-size:12px">' + esc(sel) + '</div>' + (text ? '<div style="font-style:italic">"' + esc(text) + '"</div>' : '');
      tooltip.style.display = 'block';
      tooltip.style.left = Math.min(e.clientX + 16, window.innerWidth - 376) + 'px';
      tooltip.style.top = Math.min(e.clientY + 16, window.innerHeight - 80) + 'px';
    }

    function onClick(e) {
      if (e.target.closest('.lehko-toolbar')) return;

      // In navigate mode — let all clicks through (user browses the site freely)
      if (mode === 'navigate') return;

      // In select mode — block the click and capture the element
      e.preventDefault(); e.stopPropagation();
      if (!highlighted) return;
      var sel = buildSelector(highlighted);
      highlighted.classList.remove('lehko-highlight'); highlighted.classList.add('lehko-selected');
      if (selecting === 'button') {
        if (savedBtn) try { document.querySelector(savedBtn).classList.remove('lehko-selected'); } catch (x) {}
        savedBtn = sel;
      } else if (selecting === 'cart') {
        if (savedCart) try { document.querySelector(savedCart).classList.remove('lehko-selected'); } catch (x) {}
        savedCart = sel;
      }
      // After selecting, go back to navigate mode so user can continue browsing
      switchMode('navigate');
    }

    function save() {
      if (!savedBtn && !savedCart) return;
      toolbar.innerHTML = '<div style="padding:12px;text-align:center">\u23F3 \u0417\u0431\u0435\u0440\u0456\u0433\u0430\u044e...</div>';
      fetch(BASE_URL + '/api/track/save-selector', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token, selector: savedBtn || '', cartSelector: savedCart }) })
        .then(function (r) {
          if (r.status === 401) {
            toolbar.innerHTML = '<div style="color:#f87171;padding:8px">\u274C \u0422\u043e\u043a\u0435\u043d \u0437\u0430\u043a\u0456\u043d\u0447\u0438\u0432\u0441\u044f (30 \u0445\u0432). \u0417\u0433\u0435\u043d\u0435\u0440\u0443\u0439\u0442\u0435 \u043d\u043e\u0432\u0438\u0439 \u043a\u043e\u0434 \u0432 \u0430\u0434\u043c\u0456\u043d\u0446\u0456.</div>';
            return null;
          }
          return r.json();
        })
        .then(function (d) {
          if (!d) return;
          if (d.success) {
            toolbar.innerHTML = '<div style="padding:12px;text-align:center">\u2705 \u041d\u0430\u043b\u0430\u0448\u0442\u0443\u0432\u0430\u043d\u043d\u044f \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043e!</div>';
            setTimeout(cleanupConfig, 3000);
          } else {
            toolbar.innerHTML = '<div style="color:#f87171;padding:8px">\u274C ' + esc(d.error || 'Unknown error') + '</div>';
          }
        })
        .catch(function () { toolbar.innerHTML = '<div style="color:#f87171;padding:8px">\u274C \u041f\u043e\u043c\u0438\u043b\u043a\u0430 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043d\u044f</div>'; });
    }

    function cleanupConfig() {
      document.removeEventListener('mousemove', onMove, true); document.removeEventListener('click', onClick, true);
      document.querySelectorAll('.lehko-highlight,.lehko-selected').forEach(function (el) { el.classList.remove('lehko-highlight', 'lehko-selected'); });
      [overlay, tooltip, toolbar, style].forEach(function (el) { if (el) el.remove(); });
      // Clear sessionStorage so mapper won't load on next navigation
      try { sessionStorage.removeItem('lehko_mapper_token'); } catch (e) {}
    }

    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('click', onClick, true);
    render();
  }

  // ── 15. Public API ────────────────────────────────────────────────────
  window.LehkoTrack = {
    version: '4.3',
    trackPurchase: function (o) { o = o || {}; sendEvent('sale', o.amount || o.value || o.price || 0, o.orderId || o.order_id || null); },
    trackLead: function (o) { o = o || {}; sendEvent('lead', o.amount || o.value || o.price || 0, o.orderId || o.order_id || null); },
    getRef: getRef,
    getClickId: getClickId
  };

  // ── 16. dataLayer.push() listener ─────────────────────────────────────
  // Intercept future dataLayer pushes: if a purchase event is pushed after page load,
  // automatically send a sale with the correct price (common in SPAs / delayed GTM events)
  function hookDataLayer() {
    try {
      window.dataLayer = window.dataLayer || [];
      var origPush = window.dataLayer.push;
      window.dataLayer.push = function () {
        var result = origPush.apply(this, arguments);
        for (var i = 0; i < arguments.length; i++) {
          var entry = arguments[i];
          if (!entry || typeof entry !== 'object') continue;
          var price = 0, orderId = null;
          if (entry.event === 'purchase' && entry.ecommerce) {
            price = parseFloat(entry.ecommerce.value || entry.ecommerce.revenue || entry.ecommerce.total || 0) || 0;
            orderId = entry.ecommerce.transaction_id || entry.ecommerce.order_id || null;
          } else if (entry.ecommerce && entry.ecommerce.purchase && entry.ecommerce.purchase.actionField) {
            var af = entry.ecommerce.purchase.actionField;
            price = parseFloat(af.revenue || af.value || 0) || 0;
            orderId = af.id || null;
          } else if (entry.event === 'gtm4wp.orderCompletedEEC') {
            var ecom = entry.ecommerce || {};
            var purch = ecom.purchase || {};
            var wooAf = purch.actionField || {};
            price = parseFloat(wooAf.revenue || wooAf.value || 0) || 0;
            orderId = wooAf.id || null;
          }
          if (price > 0 && getRef()) {
            console.log('[LehkoTrack] dataLayer purchase intercepted: price', price, 'orderId', orderId);
            sendEvent('sale', price, orderId);
          }
        }
        return result;
      };
    } catch (e) { /* */ }
  }

  // ── INIT ──────────────────────────────────────────────────────────────
  if (isConfigMode()) {
    resolveConfigToken(function (token) {
      startConfigMode(token);
    });
  } else {
    captureAndPersist();

    // Клік — завжди, навіть якщо config не завантажився
    document.addEventListener('click', onDocClick, true);
    watchUrlChanges();
    hookDataLayer();

    // checkSuccessOnLoad ТІЛЬКИ після завантаження конфігу — щоб staticPrice/priceSelector були доступні
    // Інакше sale відправляється з price=0, а потім dedup блокує повторну спробу з правильною ціною
    fetchConfig().then(function () {
      decorateAllLinks();
      checkDeferredConversion();
      checkSuccessOnLoad();
      watchUrlChanges();
    }).catch(function () {
      // Config не завантажився — все одно перевіряємо success page (ціна буде з URL або pending sale)
      decorateAllLinks();
      checkDeferredConversion();
      checkSuccessOnLoad();
    });

    verify();
    setInterval(verify, 5 * 60 * 1000);
  }
})();
