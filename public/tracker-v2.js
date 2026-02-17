/**
 * Affiliate Tracking Pixel v2.0
 * Simplified, Reliable, Production-Ready
 * 
 * Key improvements:
 * - Simpler code (400 lines vs 1500)
 * - More reliable cookie/localStorage handling
 * - Better pixel tracking support
 * - Explicit conversion tracking (less auto-detection)
 * - Better error handling
 */

(function() {
  'use strict';
  
  // Prevent double initialization
  if (typeof window !== 'undefined' && window._affiliateTrackerV2Initialized) {
    return;
  }
  if (typeof window !== 'undefined') {
    window._affiliateTrackerV2Initialized = true;
  }

  // ========== UTILITY FUNCTIONS (must be defined first) ==========

  function getRootDomain() {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return null; // Don't set domain for localhost
    }
    const parts = hostname.split('.');
    if (parts.length <= 2) {
      return hostname;
    }
    return '.' + parts.slice(-2).join('.');
  }

  function log(...args) {
    if (typeof window !== 'undefined' && window.TRACKER_CONFIG && window.TRACKER_CONFIG.DEBUG) {
      console.log('[Affiliate Tracker v2]', ...args);
    }
  }

  function logError(...args) {
    if (typeof window !== 'undefined' && window.TRACKER_CONFIG && window.TRACKER_CONFIG.DEBUG) {
      console.error('[Affiliate Tracker v2]', ...args);
    }
  }

  // ========== CONFIGURATION ==========
  const CONFIG = window.TRACKER_CONFIG || {};
  const BASE_URL = CONFIG.BASE_URL || 'http://localhost:3000/api/track';
  const DEBUG = CONFIG.DEBUG || false;
  
  // Storage keys
  const STORAGE_REF_CODE = 'aff_ref_code';
  const STORAGE_VISITOR_ID = 'affiliate_visitor_id';
  const STORAGE_CONVERSION_SENT = 'aff_conversion_sent_';
  
  // Cookie settings
  const COOKIE_DOMAIN = CONFIG.COOKIE_DOMAIN || getRootDomain();
  const COOKIE_MAX_AGE = 365; // days
  
  // URL parameter for referral code
  const REF_PARAM = 'ref';
  
  // Conversion detection settings
  // MIN_CONFIDENCE_SCORE: Minimum points needed to auto-track conversion (default: 5)
  // Lower = more aggressive (may have false positives), Higher = more conservative (may miss some)
  // CONVERSION_URLS: Custom URLs to always treat as conversion pages (array of strings/regex)
  // CONVERSION_SELECTORS: Custom CSS selectors that indicate conversion page (array of strings)
  const MIN_CONFIDENCE_SCORE = CONFIG.MIN_CONFIDENCE_SCORE !== undefined ? CONFIG.MIN_CONFIDENCE_SCORE : 5;
  const CUSTOM_CONVERSION_URLS = CONFIG.CONVERSION_URLS || [];
  const CUSTOM_CONVERSION_SELECTORS = CONFIG.CONVERSION_SELECTORS || [];

  function setCookie(name, value, days) {
    try {
      const expires = new Date();
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
      
      let cookieString = name + '=' + encodeURIComponent(value) +
                        ';expires=' + expires.toUTCString() +
                        ';path=/' +
                        ';SameSite=Lax';
      
      if (COOKIE_DOMAIN && !COOKIE_DOMAIN.includes('localhost')) {
        cookieString += ';domain=' + COOKIE_DOMAIN;
      }
      
      document.cookie = cookieString;
      return true;
    } catch (e) {
      logError('Failed to set cookie:', e);
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
    } catch (e) {
      logError('Failed to get cookie:', e);
    }
    return null;
  }

  function setStorage(key, value) {
    try {
      localStorage.setItem(key, value);
      setCookie(key, value, COOKIE_MAX_AGE);
      return true;
    } catch (e) {
      // Fallback to cookie only
      return setCookie(key, value, COOKIE_MAX_AGE);
    }
  }

  function getStorage(key) {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        // Sync to cookie
        setCookie(key, value, COOKIE_MAX_AGE);
        return value;
      }
    } catch (e) {
      // localStorage might be disabled
    }
    
    // Fallback to cookie
    const cookieValue = getCookie(key);
    if (cookieValue) {
      try {
        localStorage.setItem(key, cookieValue);
      } catch (e) {
        // Ignore
      }
      return cookieValue;
    }
    
    return null;
  }

  function generateVisitorId() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return 'v2_' + timestamp + '_' + randomPart;
  }

  function getVisitorId() {
    let visitorId = getStorage(STORAGE_VISITOR_ID);
    if (!visitorId) {
      visitorId = generateVisitorId();
      setStorage(STORAGE_VISITOR_ID, visitorId);
    }
    return visitorId;
  }

  function getRefCodeFromURL() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(REF_PARAM);
    } catch (e) {
      return null;
    }
  }

  function storeRefCode(code) {
    if (code) {
      setStorage(STORAGE_REF_CODE, code);
      log('Ref code stored:', code);
    }
  }

  function getStoredRefCode() {
    return getStorage(STORAGE_REF_CODE);
  }

  function safeFetch(url, options = {}) {
    return fetch(url, {
      mode: 'cors',
      credentials: 'omit',
      ...options
    }).catch(function(err) {
      logError('Fetch error:', err);
      return null;
    });
  }

  // ========== TRACKING FUNCTIONS ==========

  function trackPageView() {
    const refCode = getStoredRefCode();
    if (!refCode) {
      log('No ref code found, skipping page view tracking');
      return;
    }

    const visitorId = getVisitorId();
    const url = BASE_URL + '/view/' + encodeURIComponent(refCode) + 
                '?visitor_id=' + encodeURIComponent(visitorId);

    // Check if already tracked for this URL (prevent duplicates on refresh)
    const currentUrl = window.location.href.split('?')[0];
    const pageViewKey = 'pv_' + btoa(currentUrl).substring(0, 16);
    
    try {
      const alreadyTracked = sessionStorage.getItem(pageViewKey);
      if (alreadyTracked) {
        const timestamp = parseInt(alreadyTracked);
        if (timestamp && (Date.now() - timestamp) < 300000) { // 5 minutes
          log('Page view already tracked for this URL');
          return;
        }
      }
    } catch (e) {
      // sessionStorage might be disabled
    }

    safeFetch(url, {
      method: 'GET',
      headers: {
        'X-Visitor-ID': visitorId
      }
    }).then(function(response) {
      if (response && response.ok) {
        try {
          sessionStorage.setItem(pageViewKey, Date.now().toString());
        } catch (e) {
          // Ignore
        }
        log('Page view tracked');
      }
    });
  }

  function trackConversion(orderValue, orderId) {
    const refCode = getStoredRefCode();
    if (!refCode) {
      logError('No ref code found, cannot track conversion');
      return false;
    }

    // Check for duplicates
    const conversionKey = STORAGE_CONVERSION_SENT + (orderId || 'generic');
    try {
      const alreadySent = sessionStorage.getItem(conversionKey);
      if (alreadySent) {
        log('Conversion already tracked for this order');
        return false;
      }
    } catch (e) {
      // sessionStorage might be disabled
    }

    const visitorId = getVisitorId();
    const url = BASE_URL + '/conversion';
    
    const body = {
      unique_code: refCode,
      code: refCode,
      order_value: orderValue || 0,
      value: orderValue || 0,
      visitor_id: visitorId,
      visitorId: visitorId
    };

    if (orderId) {
      body.order_id = orderId;
      body.orderId = orderId;
    }

    // Mark as sent BEFORE request (prevent double sends)
    try {
      sessionStorage.setItem(conversionKey, Date.now().toString());
    } catch (e) {
      // Ignore
    }

    // Try POST first
    safeFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Visitor-ID': visitorId
      },
      body: JSON.stringify(body)
    }).then(function(response) {
      if (response && response.ok) {
        log('Conversion tracked (POST):', { orderValue, orderId });
        return true;
      } else {
        // Fallback to pixel
        trackConversionPixel(orderValue, orderId);
        return false;
      }
    }).catch(function(error) {
      logError('POST failed, using pixel fallback:', error);
      trackConversionPixel(orderValue, orderId);
      return false;
    });

    return true;
  }

  function trackConversionPixel(orderValue, orderId) {
    const refCode = getStoredRefCode();
    if (!refCode) return;

    const visitorId = getVisitorId();
    const params = new URLSearchParams({
      code: refCode,
      value: orderValue || '0',
      visitor_id: visitorId
    });
    
    if (orderId) {
      params.append('order_id', orderId);
    }

    const pixelUrl = BASE_URL.replace('/conversion', '') + '/conversion?' + params.toString();
    
    // Create 1x1 pixel image
    const img = new Image();
    img.src = pixelUrl;
    img.style.display = 'none';
    img.width = 1;
    img.height = 1;
    
    if (document.body) {
      document.body.appendChild(img);
    } else {
      // Wait for body
      document.addEventListener('DOMContentLoaded', function() {
        document.body.appendChild(img);
      });
    }

    log('Conversion tracked (pixel):', { orderValue, orderId });
  }

  // ========== SMART AUTO-DETECTION ==========
  // Uses scoring system: multiple indicators = higher confidence
  // Only tracks if confidence is high enough

  function autoDetectConversion() {
    const refCode = getStoredRefCode();
    if (!refCode) {
      return;
    }

    let confidenceScore = 0;
    let orderValue = 0;
    let orderId = null;
    const indicators = [];

    const url = window.location.href.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    const hostname = window.location.hostname.toLowerCase();

    // ========== INDICATOR 0: CUSTOM CONVERSION URLS (Very strong - user configured) ==========
    // Check custom URLs first (user knows best)
    for (let customUrl of CUSTOM_CONVERSION_URLS) {
      try {
        let matches = false;
        if (typeof customUrl === 'string') {
          // Simple string match
          matches = path.includes(customUrl.toLowerCase()) || url.includes(customUrl.toLowerCase());
        } else if (customUrl instanceof RegExp) {
          // Regex match
          matches = customUrl.test(path) || customUrl.test(url);
        }
        
        if (matches) {
          confidenceScore += 10; // Very high score for custom URLs
          indicators.push('custom conversion URL');
          log(`Custom conversion URL matched: ${customUrl} (+10 points)`);
          break; // Only count one custom URL
        }
      } catch (e) {
        logError('Error checking custom URL:', e);
      }
    }

    // ========== INDICATOR 1: URL PATTERNS (Strong indicator) ==========
    const urlPatterns = [
      { pattern: /thank[-_]?you/i, score: 3, name: 'thank-you URL' },
      { pattern: /order[-_]?confirm/i, score: 3, name: 'order-confirmation URL' },
      { pattern: /order[-_]?success/i, score: 3, name: 'order-success URL' },
      { pattern: /checkout[-_]?success/i, score: 3, name: 'checkout-success URL' },
      { pattern: /purchase[-_]?complete/i, score: 3, name: 'purchase-complete URL' },
      { pattern: /receipt/i, score: 2, name: 'receipt URL' },
      { pattern: /order[-_]?complete/i, score: 2, name: 'order-complete URL' },
      { pattern: /success/i, score: 1, name: 'success URL' },
      { pattern: /complete/i, score: 1, name: 'complete URL' },
      { pattern: /confirmation/i, score: 1, name: 'confirmation URL' }
    ];

    for (let { pattern, score, name } of urlPatterns) {
      if (pattern.test(path) || pattern.test(url)) {
        confidenceScore += score;
        indicators.push(name);
        log(`URL indicator found: ${name} (+${score} points)`);
        break; // Only count one URL pattern
      }
    }

    // ========== INDICATOR 2: ORDER ID PRESENCE (Very strong indicator) ==========
    // Check URL params first
    try {
      const urlParams = new URLSearchParams(window.location.search);
      orderId = urlParams.get('order_id') || urlParams.get('orderId') || 
                urlParams.get('order_number') || urlParams.get('orderNumber') ||
                urlParams.get('order') || urlParams.get('orderid');
      
      if (orderId) {
        confidenceScore += 4;
        indicators.push('order ID in URL');
        log(`Order ID found in URL: ${orderId} (+4 points)`);
      }
    } catch (e) {
      // Ignore
    }

    // Check page content for order ID
    if (!orderId) {
      try {
        const orderIdSelectors = [
          '#order-id', '#orderId', '#order_id', '#order-number', '#orderNumber',
          '[data-order-id]', '[data-order-number]', '[data-order]',
          '.order-id', '.orderId', '.order-number', '.orderNumber',
          '[id*="order"]', '[class*="order-id"]', '[class*="order-number"]'
        ];
        
        for (let selector of orderIdSelectors) {
          try {
            const el = document.querySelector(selector);
            if (el) {
              const text = (el.textContent || el.innerText || el.value || '').trim();
              // Look for order ID patterns: numbers, alphanumeric codes
              const match = text.match(/(?:order[#\s:]*)?([A-Z0-9]{4,})/i);
              if (match && match[1]) {
                orderId = match[1];
                confidenceScore += 4;
                indicators.push('order ID in DOM');
                log(`Order ID found in DOM: ${orderId} (+4 points)`);
                break;
              }
            }
          } catch (e) {
            // Continue to next selector
          }
        }
      } catch (e) {
        // Ignore
      }
    }

    // ========== INDICATOR 3: ORDER VALUE PRESENCE (Strong indicator) ==========
    // Check URL params first
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlValue = urlParams.get('total') || urlParams.get('amount') || 
                       urlParams.get('order_value') || urlParams.get('value') ||
                       urlParams.get('sum') || urlParams.get('price');
      if (urlValue) {
        orderValue = parseFloat(urlValue.replace(/[^0-9.,]/g, '').replace(',', '')) || 0;
        if (orderValue > 0 && orderValue < 1000000) {
          confidenceScore += 3;
          indicators.push('order value in URL');
          log(`Order value found in URL: ${orderValue} (+3 points)`);
        }
      }
    } catch (e) {
      // Ignore
    }

    // Check data attributes
    if (orderValue === 0) {
      try {
        const dataValue = document.body?.getAttribute('data-order-value') ||
                         document.querySelector('[data-order-value]')?.getAttribute('data-order-value') ||
                         document.querySelector('[data-total]')?.getAttribute('data-total');
        if (dataValue) {
          orderValue = parseFloat(dataValue.replace(/[^0-9.,]/g, '').replace(',', '')) || 0;
          if (orderValue > 0 && orderValue < 1000000) {
            confidenceScore += 3;
            indicators.push('order value in data attribute');
            log(`Order value found in data attribute: ${orderValue} (+3 points)`);
          }
        }
      } catch (e) {
        // Ignore
      }
    }

    // Check DOM elements for order total
    if (orderValue === 0) {
      try {
        const totalSelectors = [
          '#order-total', '#orderTotal', '#order_total', '#total-amount', '#totalAmount',
          '.order-total', '.orderTotal', '.total-amount', '.grand-total',
          '[data-order-total]', '[data-total]', '[data-amount]',
          '[id*="total"]', '[class*="total"]', '[class*="amount"]'
        ];
        
        for (let selector of totalSelectors) {
          try {
            const el = document.querySelector(selector);
            if (el) {
              const text = (el.textContent || el.innerText || el.value || '').trim();
              // Look for price patterns: $123.45, 123.45, 123,45 €, etc.
              const patterns = [
                /\$?\s*([\d,]+\.?\d*)\s*\$?/,
                /([\d,]+\.?\d*)\s*(?:грн|₴|€|£|USD|EUR|UAH)/i,
                /(?:total|сума|сумма)[:\s]*\$?\s*([\d,]+\.?\d*)/i
              ];
              
              for (let pattern of patterns) {
                const match = text.match(pattern);
                if (match && match[1]) {
                  const value = parseFloat(match[1].replace(/,/g, '')) || 0;
                  if (value > 0 && value < 1000000) {
                    orderValue = value;
                    confidenceScore += 3;
                    indicators.push('order value in DOM');
                    log(`Order value found in DOM: ${orderValue} (+3 points)`);
                    break;
                  }
                }
              }
              if (orderValue > 0) break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
      } catch (e) {
        // Ignore
      }
    }

    // ========== INDICATOR 4: PAGE TEXT CONTENT (Medium indicator) ==========
    try {
      const pageText = (document.body?.innerText || document.body?.textContent || '').toLowerCase();
      const textPatterns = [
        { pattern: /thank you for your order/i, score: 2, name: 'thank you text' },
        { pattern: /order confirmed/i, score: 2, name: 'order confirmed text' },
        { pattern: /order successful/i, score: 2, name: 'order successful text' },
        { pattern: /your order has been placed/i, score: 2, name: 'order placed text' },
        { pattern: /your order has been received/i, score: 2, name: 'order received text' },
        { pattern: /замовлення прийнято/i, score: 2, name: 'замовлення прийнято text' },
        { pattern: /замовлення підтверджено/i, score: 2, name: 'замовлення підтверджено text' },
        { pattern: /дякуємо за замовлення/i, score: 2, name: 'дякуємо text' },
        { pattern: /order number/i, score: 1, name: 'order number text' },
        { pattern: /confirmation number/i, score: 1, name: 'confirmation number text' }
      ];

      let textScore = 0;
      for (let { pattern, score, name } of textPatterns) {
        if (pattern.test(pageText)) {
          textScore += score;
          indicators.push(name);
          log(`Text indicator found: ${name} (+${score} points)`);
        }
      }
      confidenceScore += Math.min(textScore, 4); // Cap text indicators at 4 points
    } catch (e) {
      // Ignore
    }

    // ========== INDICATOR 5: DOM ELEMENTS (Medium indicator) ==========
    try {
      // Check custom selectors first (user configured)
      for (let customSelector of CUSTOM_CONVERSION_SELECTORS) {
        try {
          if (document.querySelector(customSelector)) {
            confidenceScore += 5; // High score for custom selectors
            indicators.push('custom conversion selector');
            log(`Custom conversion selector found: ${customSelector} (+5 points)`);
            break; // Only count one custom selector
          }
        } catch (e) {
          logError('Error checking custom selector:', e);
        }
      }

      // Check default selectors
      const conversionSelectors = [
        { selector: '[class*="order-confirmation"]', score: 2, name: 'order-confirmation class' },
        { selector: '[class*="order-success"]', score: 2, name: 'order-success class' },
        { selector: '[class*="thank-you"]', score: 2, name: 'thank-you class' },
        { selector: '[id*="order-confirmation"]', score: 2, name: 'order-confirmation id' },
        { selector: '[id*="order-success"]', score: 2, name: 'order-success id' },
        { selector: '[id*="thank-you"]', score: 2, name: 'thank-you id' },
        { selector: '.order-confirmation', score: 2, name: 'order-confirmation element' },
        { selector: '.order-success', score: 2, name: 'order-success element' },
        { selector: '#order-confirmation', score: 2, name: 'order-confirmation element' },
        { selector: '#order-success', score: 2, name: 'order-success element' }
      ];

      for (let { selector, score, name } of conversionSelectors) {
        try {
          if (document.querySelector(selector)) {
            confidenceScore += score;
            indicators.push(name);
            log(`DOM indicator found: ${name} (+${score} points)`);
            break; // Only count one DOM indicator
          }
        } catch (e) {
          // Continue
        }
      }
    } catch (e) {
      // Ignore
    }

    // ========== INDICATOR 6: META TAGS & STRUCTURED DATA (Weak indicator) ==========
    try {
      // Check meta tags
      const metaTags = document.querySelectorAll('meta[property], meta[name]');
      for (let meta of metaTags) {
        const property = (meta.getAttribute('property') || meta.getAttribute('name') || '').toLowerCase();
        if (property.includes('order') && (property.includes('status') || property.includes('complete'))) {
          confidenceScore += 1;
          indicators.push('order meta tag');
          log('Meta tag indicator found: order status (+1 point)');
          break;
        }
      }

      // Check JSON-LD structured data
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (let script of jsonLdScripts) {
        try {
          const data = JSON.parse(script.textContent);
          const dataStr = JSON.stringify(data).toLowerCase();
          if ((dataStr.includes('order') && dataStr.includes('complete')) ||
              (dataStr.includes('purchase') && dataStr.includes('complete'))) {
            confidenceScore += 1;
            indicators.push('JSON-LD order data');
            log('JSON-LD indicator found: order complete (+1 point)');
            break;
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
    } catch (e) {
      // Ignore
    }

    // ========== FINAL DECISION ==========
    // Track conversion if confidence score is high enough
    // Threshold: 5 points minimum (requires multiple indicators)
    // Higher threshold = more reliable, fewer false positives
    
    log(`Conversion detection summary:`, {
      confidenceScore: confidenceScore,
      threshold: MIN_CONFIDENCE_SCORE,
      indicators: indicators,
      orderValue: orderValue,
      orderId: orderId,
      willTrack: confidenceScore >= MIN_CONFIDENCE_SCORE
    });

    if (confidenceScore >= MIN_CONFIDENCE_SCORE) {
      log(`✅ High confidence conversion detected (${confidenceScore} points), tracking...`);
      trackConversion(orderValue, orderId);
    } else {
      log(`⚠️ Low confidence (${confidenceScore} points, need ${MIN_CONFIDENCE_SCORE}), skipping auto-tracking`);
      log(`💡 Tip: Use manual tracking for this page: window.AffiliateTracker.trackConversion(value, orderId)`);
    }
  }

  // ========== VERIFICATION PING ==========
  // Send verification ping to confirm tracker is installed
  // This helps the system detect if tracker is active on the website

  function sendVerificationPing() {
    try {
      const refCode = getStoredRefCode();
      const domain = window.location.hostname;
      const version = '2.0.0'; // Tracker version
      
      // Build verify URL correctly
      let verifyBase = BASE_URL;
      // Remove any trailing paths
      if (verifyBase.endsWith('/conversion') || verifyBase.endsWith('/view')) {
        verifyBase = verifyBase.replace(/\/conversion$|\/view$/, '');
      }
      // Ensure it ends with /api/track
      if (!verifyBase.endsWith('/api/track')) {
        try {
          const urlObj = new URL(verifyBase);
          verifyBase = urlObj.origin + '/api/track';
        } catch (e) {
          // If URL parsing fails, try to fix manually
          verifyBase = BASE_URL.split('/api/track')[0] + '/api/track';
        }
      }
      
      const verifyUrl = verifyBase + '/verify?' + 
        new URLSearchParams({
          code: refCode || '',
          domain: domain,
          version: version,
          timestamp: Date.now()
        }).toString();
      
      // Send verification ping (fire and forget)
      safeFetch(verifyUrl, {
        method: 'GET'
      }).then(function(response) {
        if (DEBUG && response) {
          log('✅ Verification ping sent');
        }
      }).catch(function(error) {
        // Silent fail - don't break client site
        if (DEBUG) {
          logError('Verification ping failed:', error);
        }
      });
    } catch (e) {
      // Silent fail
      if (DEBUG) {
        logError('Verification ping error:', e);
      }
    }
  }

  // ========== INITIALIZATION ==========

  function init() {
    try {
      // Step 0: Send verification ping immediately
      sendVerificationPing();

      // Step 1: Capture referral code from URL
      const refCode = getRefCodeFromURL();
      if (refCode) {
        storeRefCode(refCode);
      }

      // Step 2: Get or create visitor ID
      getVisitorId();

      // Step 3: Track page view
      trackPageView();

      // Step 4: Auto-detect conversion (with delay to ensure page is loaded)
      setTimeout(function() {
        autoDetectConversion();
      }, 1000);

      log('Tracker initialized');

      // Send periodic verification pings (every 5 minutes)
      if (typeof window !== 'undefined' && !window._affiliateTrackerV2PingInterval) {
        window._affiliateTrackerV2PingInterval = setInterval(function() {
          sendVerificationPing();
        }, 5 * 60 * 1000); // 5 minutes
      }
    } catch (error) {
      logError('Initialization error:', error);
    }
  }

  // ========== PUBLIC API ==========

  const AffiliateTracker = {
    // Manual tracking functions
    trackView: trackPageView,
    trackConversion: trackConversion,
    
    // Utility functions
    getVisitorId: getVisitorId,
    getRefCode: getStoredRefCode,
    sendVerificationPing: sendVerificationPing,
    
    // Configuration
    setConfig: function(config) {
      window.TRACKER_CONFIG = window.TRACKER_CONFIG || {};
      if (config.BASE_URL) {
        window.TRACKER_CONFIG.BASE_URL = config.BASE_URL;
      }
      if (config.DEBUG !== undefined) {
        window.TRACKER_CONFIG.DEBUG = config.DEBUG;
      }
      if (config.MIN_CONFIDENCE_SCORE !== undefined) {
        window.TRACKER_CONFIG.MIN_CONFIDENCE_SCORE = config.MIN_CONFIDENCE_SCORE;
      }
      if (config.CONVERSION_URLS) {
        window.TRACKER_CONFIG.CONVERSION_URLS = config.CONVERSION_URLS;
      }
      if (config.CONVERSION_SELECTORS) {
        window.TRACKER_CONFIG.CONVERSION_SELECTORS = config.CONVERSION_SELECTORS;
      }
    }
  };

  // Expose to window
  if (typeof window !== 'undefined') {
    window.AffiliateTracker = AffiliateTracker;
  }

  // ========== AUTO-EXECUTE ==========

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

})();
