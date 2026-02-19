/**
 * LehkoTrack Pixel v4.2 — GTM: один лід, sale тільки на сторінці подяки
 *
 * Install ONCE: <script src="https://YOUR_DOMAIN/pixel.js" data-site="SITE_ID" async></script>
 *
 * The tracker automatically:
 *   1. Captures ref & click_id from URL → stores in localStorage + cookies
 *   2. Decorates ALL internal links so ref/click_id follow the user across pages
 *   3. On ANY page load: checks if it's a success page → sends "sale"
 *   4. Detects checkout button (Оформити замовлення / place order only; «Купити» = кошик — не лід) → sends "lead"
 *   5. Deferred conversion: if user returns after purchase → sale detected
 *   6. Works even if installed only on ONE page (cookies + URL decoration)
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
                p.get('order_value') || p.get('price') || p.get('value');
    var orderId = p.get('order') || p.get('order_id') || p.get('orderId') ||
                  p.get('order_number') || p.get('orderNumber');
    return { total: total ? parseFloat(total) : 0, orderId: orderId || null };
  }

  // ── 5. Event Sender ────────────────────────────────────────────────────
  // Dedup rules:
  //   - With orderId: block same orderId permanently (prevents reload/back)
  //   - Without orderId: block rapid duplicates (lead: 12s — GTM+pixel double fire; sale: 3s)
  //   - Lead: завжди відправляємо order_value 0 — дохід рахується тільки з sale (після покупки)
  function sendEvent(eventType, value, orderId) {
    var ref = getRef();
    if (!ref) return;
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
    }).catch(function () {});

    console.log('[LehkoTrack]', eventType.toUpperCase(), '| value:', value, '| orderId:', orderId, '| ref:', ref);
  }

  // ── 6. Button Detection ───────────────────────────────────────────────
  // Лід рахуємо тільки по кнопці оформлення замовлення (друга кнопка). «Купити» / «Додати в кошик» — не лід.
  var CART_RE = /кошик|корзин|cart|wishlist|обране|favorite|порівн|compar|додати|добавить|add to|купити в один клік|купить в один клик/i;
  var LEAD_BUTTON_RE = /оформити замовлення|оформить заказ|оплатити|оплатить|checkout|place order|pay now|підтвердити замовлення|confirm order|complete purchase|оформити покупку|submit order|перейти до оплати|перейти к оплате/i;

  function isCheckoutButton(el) {
    var text = (el.textContent || '').trim();
    if (text.length > 80) return false;
    var val = el.getAttribute('value') || '';
    var combined = text + ' ' + val;
    if (CART_RE.test(combined)) return false;
    return LEAD_BUTTON_RE.test(combined);
  }

  // Сторінка кошика (повна або попап): «Оформити замовлення» тут лише веде на крок оплати — не лід.
  function isCartPage() {
    var path = location.pathname || '';
    return /\/(cart|basket|koszyk|korzin)(\/|$|\?)/i.test(path) || /^\/cart(\/|$|\?)/i.test(path);
  }

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

  // ── 8. On-Load Success Detection ──────────────────────────────────────
  // If THIS page is a success/thank-you page → send sale immediately.
  // Dedup is handled by sendEvent (orderId-based or 3s anti-double-click).
  function checkSuccessOnLoad() {
    if (!isSuccessPage()) return;
    var ref = getRef();
    if (!ref) return;

    var urlOrder = extractOrderFromUrl();
    var price = urlOrder.total || extractPrice(null) || (cfg.staticPrice > 0 ? cfg.staticPrice : 0);

    sendEvent('sale', price, urlOrder.orderId);

    ls('lehko_pending_sale', null);
    console.log('[LehkoTrack] Success page detected:', location.pathname, '| price:', price, '| order:', urlOrder.orderId);
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
      var finalPrice = detectedPrice || price || extractPrice(null);
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
  // Лід по кнопці «Оформити замовлення». Не рахуємо на сторінці кошика (там лише перехід). Макс 1 лід за 30 с — щоб не дублювати на 2-й кнопці.
  var lastLeadClickAt = 0;
  var LEAD_DEBOUNCE_MS = 30000;

  function onDocClick(e) {
    var target = e.target;
    var btn = null;

    if (cfg.purchaseButtonSelector) {
      btn = target.closest(cfg.purchaseButtonSelector);
    }

    if (!btn) {
      var clickable = target.closest('button, a, input[type="submit"], [role="button"], .btn, [class*="btn"], [class*="button"]');
      if (clickable && isCheckoutButton(clickable)) btn = clickable;
    }

    if (!btn || isCartPage()) return;
    var now = Date.now();
    if (now - lastLeadClickAt < LEAD_DEBOUNCE_MS) return;
    lastLeadClickAt = now;
    var price = extractPrice(btn);
    sendEvent('lead', 0, null);
    storePendingSale(price);
    startConfirmationWatcher(price);
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
      '&site_id=' + encodeURIComponent(SITE_ID) + '&version=4.2', { mode: 'cors' }).catch(function () {});
  }

  // ── 14. Configuration Mode (Visual Event Mapper) ──────────────────────
  function isConfigMode() {
    var params = new URLSearchParams(location.search);
    return params.get('lehko_mode') === 'configure' && params.get('token');
  }

  function startConfigMode(token) {
    var selecting = 'button';
    var overlay, tooltip, toolbar, highlighted;

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
      '.lehko-toolbar{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:2147483646;background:#1e1b4b;color:#fff;padding:14px 24px;border-radius:12px;font:14px/1.5 system-ui,sans-serif;display:flex;gap:12px;align-items:center;box-shadow:0 8px 30px rgba(0,0,0,.3)}' +
      '.lehko-toolbar button{padding:8px 18px;border:none;border-radius:8px;font:600 13px/1 system-ui,sans-serif;cursor:pointer}' +
      '.lehko-toolbar .lehko-btn-primary{background:#7c3aed;color:#fff}.lehko-toolbar .lehko-btn-primary:hover{background:#6d28d9}' +
      '.lehko-toolbar .lehko-btn-secondary{background:#334155;color:#e2e8f0}.lehko-toolbar .lehko-btn-secondary:hover{background:#475569}' +
      '.lehko-toolbar .lehko-btn-done{background:#059669;color:#fff}.lehko-toolbar .lehko-btn-done:hover{background:#047857}' +
      '.lehko-selected{outline:3px solid #059669!important;outline-offset:2px;background:rgba(5,150,105,.1)!important}';
    document.head.appendChild(style);

    overlay = document.createElement('div'); overlay.className = 'lehko-overlay'; document.body.appendChild(overlay);
    tooltip = document.createElement('div'); tooltip.className = 'lehko-tooltip'; tooltip.style.display = 'none'; document.body.appendChild(tooltip);
    toolbar = document.createElement('div'); toolbar.className = 'lehko-toolbar'; document.body.appendChild(toolbar);

    var savedBtn = null, savedPrice = null;
    function setMode(m) { selecting = m; render(); }
    function esc(s) { return (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    function render() {
      var bl = savedBtn ? '<span style="color:#34d399">\u2714</span> ' + esc(savedBtn) : '\u041d\u0435 \u0432\u0438\u0431\u0440\u0430\u043d\u043e';
      var pl = savedPrice ? '<span style="color:#34d399">\u2714</span> ' + esc(savedPrice) : '\u041d\u0435 \u0432\u0438\u0431\u0440\u0430\u043d\u043e';
      toolbar.innerHTML =
        '<div style="display:flex;flex-direction:column;gap:6px"><div style="font-weight:700;font-size:15px">\uD83D\uDD27 LehkoTrack</div>' +
        '<div style="font-size:13px;opacity:.8">' + (selecting === 'button' ? '\u27A1 \u041a\u043b\u0456\u043a\u043d\u0456\u0442\u044c \u043d\u0430 \u043a\u043d\u043e\u043f\u043a\u0443' : '\u27A1 \u041a\u043b\u0456\u043a\u043d\u0456\u0442\u044c \u043d\u0430 \u0446\u0456\u043d\u0443') + '</div>' +
        '<div style="font-size:12px">\u041a\u043d\u043e\u043f\u043a\u0430: ' + bl + '</div><div style="font-size:12px">\u0426\u0456\u043d\u0430: ' + pl + '</div></div>' +
        '<div style="display:flex;flex-direction:column;gap:6px;margin-left:16px">' +
        '<button class="lehko-btn-' + (selecting === 'button' ? 'primary' : 'secondary') + '" data-a="btn">\u041a\u043d\u043e\u043f\u043a\u0430</button>' +
        '<button class="lehko-btn-' + (selecting === 'price' ? 'primary' : 'secondary') + '" data-a="price">\u0426\u0456\u043d\u0430</button>' +
        (savedBtn ? '<button class="lehko-btn-done" data-a="save">\u2714 \u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438</button>' : '') +
        '<button class="lehko-btn-secondary" data-a="cancel">\u2716 \u0421\u043a\u0430\u0441\u0443\u0432\u0430\u0442\u0438</button></div>';
      toolbar.querySelectorAll('button').forEach(function (b) {
        b.onclick = function (ev) { ev.stopPropagation(); var a = b.getAttribute('data-a');
          if (a === 'btn') setMode('button'); else if (a === 'price') setMode('price');
          else if (a === 'save') save(); else if (a === 'cancel') cleanupConfig(); };
      });
    }

    function onMove(e) {
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
      e.preventDefault(); e.stopPropagation();
      if (!highlighted) return;
      var sel = buildSelector(highlighted);
      highlighted.classList.remove('lehko-highlight'); highlighted.classList.add('lehko-selected');
      if (selecting === 'button') { if (savedBtn) try { document.querySelector(savedBtn).classList.remove('lehko-selected'); } catch (x) {} savedBtn = sel; }
      else { if (savedPrice) try { document.querySelector(savedPrice).classList.remove('lehko-selected'); } catch (x) {} savedPrice = sel; }
      render();
    }

    function save() {
      if (!savedBtn) return;
      toolbar.innerHTML = '<div style="padding:8px">\u23F3 ...</div>';
      fetch(BASE_URL + '/api/track/save-selector', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token, selector: savedBtn, priceSelector: savedPrice }) })
        .then(function (r) { return r.json(); })
        .then(function (d) { toolbar.innerHTML = d.success ? '<div style="padding:12px;text-align:center">\u2705 \u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043e!</div>' : '<div style="color:#f87171">\u274C ' + esc(d.error) + '</div>'; if (d.success) setTimeout(cleanupConfig, 3000); })
        .catch(function () { toolbar.innerHTML = '<div style="color:#f87171">\u274C Error</div>'; });
    }

    function cleanupConfig() {
      document.removeEventListener('mousemove', onMove, true); document.removeEventListener('click', onClick, true);
      document.querySelectorAll('.lehko-highlight,.lehko-selected').forEach(function (el) { el.classList.remove('lehko-highlight', 'lehko-selected'); });
      [overlay, tooltip, toolbar, style].forEach(function (el) { if (el) el.remove(); });
    }

    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('click', onClick, true);
    render();
  }

  // ── 15. Public API ────────────────────────────────────────────────────
  window.LehkoTrack = {
    version: '4.2',
    trackPurchase: function (o) { o = o || {}; sendEvent('sale', o.amount || o.value || o.price || 0, o.orderId || o.order_id || null); },
    trackLead: function (o) { o = o || {}; sendEvent('lead', o.amount || o.value || o.price || 0, o.orderId || o.order_id || null); },
    getRef: getRef,
    getClickId: getClickId
  };

  // ── INIT ──────────────────────────────────────────────────────────────
  if (isConfigMode()) {
    startConfigMode(new URLSearchParams(location.search).get('token'));
  } else {
    // Step 1: Capture & persist tracking params (URL → localStorage + cookies)
    captureAndPersist();

    // Step 2: Fetch server config, then init everything
    fetchConfig().then(function () {
      // Step 3: Decorate all internal links (propagate ref to other pages)
      decorateAllLinks();

      // Step 4: Check for deferred conversion (user returned from success page)
      checkDeferredConversion();

      // Step 5: Check if THIS page is a success page
      checkSuccessOnLoad();

      // Step 6: Set up purchase button detection
      document.addEventListener('click', onDocClick, true);

      // Step 7: Watch URL changes (SPA support)
      watchUrlChanges();
    });

    // Step 8: Verification ping
    verify();
    setInterval(verify, 5 * 60 * 1000);
  }
})();
