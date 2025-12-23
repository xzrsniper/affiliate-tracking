/**
 * Affiliate Tracking Pixel
 * Pure Vanilla JS (ES6) - No Dependencies
 * Production-Ready with Subdomain Support & Duplicate Prevention
 */

(function() {
  'use strict';
  
  // CRITICAL: Early exit if tracker is already initialized
  // This prevents duplicate execution even if script is loaded multiple times (e.g., in GTM)
  if (typeof window !== 'undefined' && window._affiliateTrackerInitialized) {
    if (window.TRACKER_CONFIG?.DEBUG) {
      console.log('[Affiliate Tracker] Script already executed, skipping duplicate initialization');
    }
    return; // Exit immediately without executing any code
  }

  // ========== CONFIGURATION ==========
  const BASE_URL = window.TRACKER_CONFIG?.BASE_URL || 'http://localhost:3000/api/track';
  const CONVERSION_KEYWORD = window.TRACKER_CONFIG?.CONVERSION_KEYWORD || 'order';
  
  // Storage keys
  const STORAGE_REF_CODE = 'aff_ref_code';
  const STORAGE_VISITOR_ID = 'affiliate_visitor_id';
  
  // Cookie settings for subdomain support
  const COOKIE_DOMAIN = window.TRACKER_CONFIG?.COOKIE_DOMAIN || getRootDomain();
  const COOKIE_PATH = '/';
  const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year
  
  // URL parameter for referral code
  const REF_PARAM = 'ref';
  
  // Conversion keywords (configurable + defaults)
  const DEFAULT_CONVERSION_KEYWORDS = ['order', 'thank-you', 'thankyou', 'success', 'confirmation', 'complete', 'purchase'];
  const CONVERSION_KEYWORDS = window.TRACKER_CONFIG?.CONVERSION_KEYWORDS || DEFAULT_CONVERSION_KEYWORDS;

  // ========== UTILITY FUNCTIONS ==========

  /**
   * Get root domain for cookie sharing across subdomains
   * Example: shop.example.com -> .example.com
   */
  function getRootDomain() {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    
    if (parts.length <= 2) {
      // No subdomain (example.com) or single part (localhost)
      return hostname;
    }
    
    // Return root domain with leading dot for subdomain sharing
    return '.' + parts.slice(-2).join('.');
  }

  /**
   * Set a cookie (for subdomain sharing)
   */
  function setCookie(name, value, days) {
    try {
      const expires = new Date();
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
      
      const cookieString = name + '=' + encodeURIComponent(value) +
                          ';expires=' + expires.toUTCString() +
                          ';path=' + COOKIE_PATH +
                          ';SameSite=Lax';
      
      // Only add domain if not localhost
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

  /**
   * Get a cookie value
   */
  function getCookie(name) {
    try {
      const nameEQ = name + '=';
      const ca = document.cookie.split(';');
      
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
          c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
          return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Set value in both localStorage and cookie (for subdomain support)
   */
  function setValue(key, value) {
    // Try localStorage first
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // localStorage might be disabled
    }
    
    // Also set in cookie for subdomain sharing
    setCookie(key, value, COOKIE_MAX_AGE / (24 * 60 * 60));
  }

  /**
   * Get value from localStorage first, then cookie
   */
  function getValue(key) {
    // Try localStorage first
    try {
      const value = localStorage.getItem(key);
      if (value) {
        return value;
      }
    } catch (e) {
      // localStorage might be disabled
    }
    
    // Fallback to cookie
    const cookieValue = getCookie(key);
    if (cookieValue) {
      // Also sync back to localStorage if possible
      try {
        localStorage.setItem(key, cookieValue);
      } catch (e) {
        // Ignore
      }
      return cookieValue;
    }
    
    // Fallback to sessionStorage
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  /**
   * Generate a simple UUID-like string (lightweight alternative to full UUID)
   */
  function generateVisitorId() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return 'v_' + timestamp + '_' + randomPart;
  }

  /**
   * Get or create visitor ID (stored in both localStorage and cookie)
   */
  function getVisitorId() {
    let visitorId = getValue(STORAGE_VISITOR_ID);
    
    if (!visitorId) {
      visitorId = generateVisitorId();
      setValue(STORAGE_VISITOR_ID, visitorId);
    }
    
    return visitorId;
  }

  /**
   * Extract ref code from URL query parameter
   */
  function getRefCodeFromURL() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(REF_PARAM);
    } catch (e) {
      return null;
    }
  }

  /**
   * Store ref code (in both localStorage and cookie)
   */
  function storeRefCode(code) {
    if (!code) return;
    setValue(STORAGE_REF_CODE, code);
  }

  /**
   * Get stored ref code
   */
  function getStoredRefCode() {
    return getValue(STORAGE_REF_CODE);
  }

  /**
   * Check if conversion was already sent (prevent duplicates)
   * Uses URL + orderId as unique identifier to prevent duplicates on refresh
   */
  function hasConversionBeenSent(orderId) {
    // Create unique key based on current URL and order ID
    // This prevents duplicates when user refreshes the same page
    const currentUrl = window.location.href.split('?')[0]; // URL without query params
    const urlHash = currentUrl.length.toString(36).substring(0, 8); // Short hash of URL
    const uniqueKey = 'conv_' + urlHash + '_' + (orderId || 'generic');
    
    // Check sessionStorage first (cleared on tab close)
    try {
      const sent = sessionStorage.getItem(uniqueKey);
      if (sent) {
        // Also check timestamp - if sent more than 1 hour ago, allow again (edge case)
        const timestamp = parseInt(sent);
        if (timestamp && (Date.now() - timestamp) < 3600000) { // 1 hour
          return true;
        }
      }
    } catch (e) {
      // sessionStorage might be disabled
    }
    
    // Also check cookie (as backup) - but only for same session
    const cookieValue = getCookie(uniqueKey);
    if (cookieValue) {
      const timestamp = parseInt(cookieValue);
      if (timestamp && (Date.now() - timestamp) < 3600000) { // 1 hour
        return true;
      }
    }
    
    return false;
  }

  /**
   * Mark conversion as sent (prevent duplicates)
   * Uses URL + orderId as unique identifier
   */
  function markConversionAsSent(orderId) {
    // Create unique key based on current URL and order ID
    const currentUrl = window.location.href.split('?')[0]; // URL without query params
    const urlHash = currentUrl.length.toString(36).substring(0, 8); // Short hash of URL
    const uniqueKey = 'conv_' + urlHash + '_' + (orderId || 'generic');
    const timestamp = Date.now().toString();
    
    // Store in sessionStorage (cleared on tab close)
    try {
      sessionStorage.setItem(uniqueKey, timestamp);
    } catch (e) {
      // sessionStorage might be disabled
    }
    
    // Also store in cookie as backup (expires in 24 hours)
    setCookie(uniqueKey, timestamp, 1);
  }

  /**
   * Normalize order ID - remove prefixes like "ORDER-", "INV-", etc.
   * This ensures consistent order_id format for duplicate prevention
   */
  function normalizeOrderId(orderId) {
    if (!orderId) return null;
    
    // Convert to string
    const str = String(orderId).trim();
    
    // Remove common prefixes
    const normalized = str.replace(/^(ORDER[-_]?|INV[-_]?|INVOICE[-_]?|TRANS[-_]?|TXN[-_]?)/i, '');
    
    // Extract only digits (in case there are other characters)
    const digitsOnly = normalized.match(/\d+/);
    
    return digitsOnly ? digitsOnly[0] : normalized;
  }

  /**
   * Extract order ID from URL or page (for duplicate prevention)
   * UNIVERSAL method - works on any e-commerce platform
   */
  function extractOrderId() {
    // Method 1: Extract from URL (most common)
    const url = window.location.href;
    const urlPath = window.location.pathname;
    
    // Patterns: /order/12345, /checkout/12345, /confirmation/12345, ?order=12345
    const urlPatterns = [
      /[\/=](?:order|checkout|confirmation|purchase|invoice)[\/=](\d{4,})/i,
      /[\/=](\d{6,})/, // Long numbers in URL (likely order IDs)
      /[?&](?:order|orderid|order_id|order_number|orderNumber)[=:](\d+)/i
    ];
    
    for (let i = 0; i < urlPatterns.length; i++) {
      const match = url.match(urlPatterns[i]);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    // Method 2: Extract from page content (text)
    try {
      const pageText = document.body ? (document.body.innerText || document.body.textContent) : '';
      
      const orderIdPatterns = [
        /order[#\s:]+(\d{4,})/i,
        /order[_\s]?id[:\s]+(\d{4,})/i,
        /order[_\s]?number[:\s]+(\d{4,})/i,
        /confirmation[#\s:]+(\d{4,})/i,
        /invoice[#\s:]+(\d{4,})/i,
        /transaction[#\s:]+(\d{4,})/i,
        /номер замовлення[:\s]+(\d{4,})/i,
        /замовлення[#\s:]+(\d{4,})/i
      ];
      
      for (let i = 0; i < orderIdPatterns.length; i++) {
        const match = pageText.match(orderIdPatterns[i]);
        if (match && match[1]) {
          return match[1];
        }
      }
    } catch (e) {
      // Ignore errors
    }
    
    // Method 3: Extract from DOM elements (common IDs/classes)
    try {
      const orderIdSelectors = [
        '#order-id',
        '#orderId',
        '#order_id',
        '#order-number',
        '#orderNumber',
        '[data-order-id]',
        '[data-order-id]',
        '[data-order-number]',
        '.order-id',
        '.orderId',
        '.order-number'
      ];
      
      for (let i = 0; i < orderIdSelectors.length; i++) {
        const el = document.querySelector(orderIdSelectors[i]);
        if (el) {
          const text = el.textContent || el.innerText || el.value || '';
          const match = text.match(/(\d{4,})/);
          if (match && match[1]) {
            return match[1];
          }
        }
      }
    } catch (e) {
      // Ignore errors
    }
    
    // Method 4: Extract from meta tags
    try {
      const metaTags = document.querySelectorAll('meta[property], meta[name]');
      for (let i = 0; i < metaTags.length; i++) {
        const property = (metaTags[i].getAttribute('property') || metaTags[i].getAttribute('name') || '').toLowerCase();
        if (property.indexOf('order') !== -1) {
          const content = metaTags[i].getAttribute('content') || '';
          const match = content.match(/(\d{4,})/);
          if (match && match[1]) {
            return match[1];
          }
        }
      }
    } catch (e) {
      // Ignore errors
    }
    
    return null;
  }

  /**
   * Safe fetch wrapper with CORS and error handling
   */
  function safeFetch(url, options = {}) {
    // Ensure CORS mode
    const fetchOptions = {
      mode: 'cors',
      credentials: 'omit',
      ...options
    };

    return fetch(url, fetchOptions).catch(function(err) {
      // Silent fail - don't break client site
      if (window.TRACKER_CONFIG?.DEBUG) {
        console.error('[Affiliate Tracker] Error:', err);
      }
      return null;
    });
  }

  // ========== STEP 1: CAPTURE REFERRAL ==========

  /**
   * Step 1: Check URL for ?ref=CODE and store it
   */
  function captureReferral() {
    const refCode = getRefCodeFromURL();
    
    if (refCode) {
      storeRefCode(refCode);
      return refCode;
    }
    
    return null;
  }

  // ========== STEP 2: IDENTIFY VISITOR ==========

  /**
   * Step 2: Get or generate visitor ID
   */
  function identifyVisitor() {
    return getVisitorId();
  }

  // ========== STEP 3: TRACK PAGE VIEW ==========

  // Flag to prevent double page view tracking
  let pageViewTracked = false;
  let pageViewInProgress = false;

  /**
   * Step 3: Track page view via GET request
   * With duplicate prevention
   */
  function trackPageView() {
    // Prevent double call
    if (pageViewTracked || pageViewInProgress) {
      if (window.TRACKER_CONFIG?.DEBUG) {
        console.log('[Affiliate Tracker] Page view already tracked or in progress, skipping');
      }
      return;
    }
    
    pageViewInProgress = true;
    
    const refCode = getStoredRefCode();
    
    if (!refCode) {
      // No ref code found, skip tracking
      pageViewInProgress = false;
      return;
    }

    // Check if already tracked for this URL
    const currentUrl = window.location.href.split('?')[0];
    const urlHash = currentUrl.length.toString(36).substring(0, 8);
    const pageViewKey = 'pv_' + urlHash;
    
    try {
      const alreadyTracked = sessionStorage.getItem(pageViewKey);
      if (alreadyTracked) {
        const timestamp = parseInt(alreadyTracked);
        // Allow re-tracking if more than 5 minutes passed (for SPA navigation)
        if (timestamp && (Date.now() - timestamp) < 300000) { // 5 minutes
          if (window.TRACKER_CONFIG?.DEBUG) {
            console.log('[Affiliate Tracker] Page view already tracked for this URL');
          }
          pageViewInProgress = false;
          return;
        }
      }
    } catch (e) {
      // sessionStorage might be disabled
    }

    const visitorId = getVisitorId();
    const trackUrl = BASE_URL + '/view/' + encodeURIComponent(refCode) + 
                     '?visitor_id=' + encodeURIComponent(visitorId);

    // Use GET request as specified
    safeFetch(trackUrl, {
      method: 'GET',
      headers: {
        'X-Visitor-ID': visitorId
      }
    }).then(function(response) {
      // Mark as tracked
      pageViewTracked = true;
      pageViewInProgress = false;
      
      // Store in sessionStorage
      try {
        sessionStorage.setItem(pageViewKey, Date.now().toString());
      } catch (e) {
        // Ignore
      }
      
      if (window.TRACKER_CONFIG?.DEBUG && response) {
        console.log('[Affiliate Tracker] ✅ Page view tracked');
      }
    }).catch(function(error) {
      pageViewInProgress = false;
      if (window.TRACKER_CONFIG?.DEBUG) {
        console.warn('[Affiliate Tracker] ⚠️ Page view tracking failed:', error);
      }
    });
  }

  // ========== STEP 4: TRACK CONVERSION ==========

  // Global flag to track if automatic conversion tracking is in progress or completed
  let automaticConversionInProgress = false;
  let automaticConversionCompleted = false;
  let trackConversionCalled = false; // Prevent double call
  
  // Helper function to update the exposed flag
  function updateAutomaticConversionFlag() {
    if (typeof window !== 'undefined' && window.AffiliateTracker) {
      window.AffiliateTracker._automaticConversionCompleted = automaticConversionCompleted;
      window.AffiliateTracker._automaticConversionInProgress = automaticConversionInProgress;
    }
  }

  /**
   * Step 4: Check if current page is a conversion page and track it
   * With duplicate prevention
   */
  function trackConversion() {
    // Prevent double call
    if (trackConversionCalled) {
      if (window.TRACKER_CONFIG?.DEBUG) {
        console.log('[Affiliate Tracker] trackConversion already called, skipping');
      }
      return;
    }
    
    trackConversionCalled = true;
    
    const refCode = getStoredRefCode();
    
    if (!refCode) {
      // No ref code, can't track conversion
      trackConversionCalled = false; // Reset if no ref code
      return;
    }
    
    // Mark that automatic conversion tracking is starting
    automaticConversionInProgress = true;
    updateAutomaticConversionFlag();

    // Extract order ID for duplicate prevention
    const rawOrderId = extractOrderId();
    const orderId = normalizeOrderId(rawOrderId);

    // STRICT duplicate prevention: Check if conversion was already sent for this URL + orderId
    // This prevents duplicates on page refresh
    // Check with normalized orderId and also check all possible variations
    const normalizedOrderId = orderId;
    const variationsToCheck = [normalizedOrderId, rawOrderId];
    if (rawOrderId && rawOrderId !== normalizedOrderId) {
      variationsToCheck.push(rawOrderId);
    }
    
    let alreadySent = false;
    for (let i = 0; i < variationsToCheck.length; i++) {
      if (hasConversionBeenSent(variationsToCheck[i])) {
        alreadySent = true;
        break;
      }
    }
    
    if (alreadySent) {
      if (window.TRACKER_CONFIG?.DEBUG) {
        console.log('[Affiliate Tracker] Conversion already tracked for this page/order:', orderId || 'generic');
      }
      return; // Already sent for this page/order combination, skip
    }

    // ULTRA-STRICT conversion page detection - only track on actual conversion pages
    // Requires either:
    // 1. Order ID present (strongest indicator)
    // 2. URL contains very specific conversion keywords (thank-you, order-confirmation, etc.)
    // 3. Multiple strong indicators together (URL + DOM + content)
    const currentUrl = window.location.href.toLowerCase();
    const currentPath = window.location.pathname.toLowerCase();
    let isConversionPage = false;
    let matchedKeyword = null;
    let confidenceLevel = 0; // Track confidence: 0 = low, 1 = medium, 2 = high

    // CRITICAL: If order_id is found, it's a strong indicator (but not enough alone)
    const hasOrderId = !!orderId;
    if (hasOrderId) {
      confidenceLevel += 1;
      if (window.TRACKER_CONFIG?.DEBUG) {
        console.log('[Affiliate Tracker] Order ID found, increasing confidence:', orderId);
      }
    }

    // Method 1: Check URL for VERY STRICT conversion keywords
    // Only the most specific keywords that clearly indicate conversion pages
    const ultraStrictKeywords = ['thank-you', 'thankyou', 'order-confirmation', 'order-success', 
                                 'purchase-complete', 'checkout-success', 'receipt', 'order-complete'];
    
    // Remove ambiguous keywords like 'success', 'complete', 'confirmation' - they appear on product pages too
    let urlMatch = false;
    for (let i = 0; i < ultraStrictKeywords.length; i++) {
      const keyword = ultraStrictKeywords[i].toLowerCase();
      // Must be in path, not just anywhere
      if (currentPath.indexOf(keyword) !== -1 || 
          currentUrl.indexOf('/' + keyword + '/') !== -1 ||
          currentUrl.indexOf('/' + keyword) === currentUrl.length - keyword.length - 1) {
        urlMatch = true;
        matchedKeyword = keyword;
        confidenceLevel += 2; // URL match is strong indicator
        if (window.TRACKER_CONFIG?.DEBUG) {
          console.log('[Affiliate Tracker] URL match found:', keyword);
        }
        break;
      }
    }
    
    if (urlMatch) {
      isConversionPage = true;
    }

    // Method 2: Check DOM elements (classes, IDs) - STRICT patterns only
    // Only check for elements that are clearly conversion-related
    if (!isConversionPage) {
      try {
        const strictConversionSelectors = [
          '[class*="order-confirmation"]',
          '[class*="order-success"]',
          '[class*="thank-you"]',
          '[class*="thankyou"]',
          '[class*="purchase-complete"]',
          '[class*="checkout-success"]',
          '[id*="order-confirmation"]',
          '[id*="order-success"]',
          '[id*="thank-you"]',
          '[id*="thankyou"]',
          '[id*="purchase-complete"]',
          '[id*="checkout-success"]',
          '.order-confirmation',
          '.order-success',
          '.thank-you',
          '.thankyou',
          '#order-confirmation',
          '#order-success',
          '#thank-you',
          '#thankyou'
        ];
        
        for (let i = 0; i < strictConversionSelectors.length; i++) {
          if (document.querySelector(strictConversionSelectors[i])) {
            isConversionPage = true;
            matchedKeyword = 'dom-element';
            if (window.TRACKER_CONFIG?.DEBUG) {
              console.log('[Affiliate Tracker] Conversion page detected by DOM selector:', strictConversionSelectors[i]);
            }
            break;
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }

    // Method 3: Check page content for STRICT conversion phrases
    // Only phrases that clearly indicate a completed purchase
    // Requires MULTIPLE phrases to match (very strict)
    if (!isConversionPage) {
      try {
        const pageText = (document.body?.innerText || document.body?.textContent || '').toLowerCase();
        const strictConversionPhrases = [
          'thank you for your order',
          'order confirmed',
          'order successful',
          'purchase complete',
          'your order has been placed',
          'your order has been received',
          'замовлення прийнято',
          'замовлення підтверджено',
          'дякуємо за замовлення',
          'замовлення успішно оформлено',
          'order number',
          'order #',
          'confirmation number',
          'order confirmation'
        ];
        
        // Require at least 2 phrases to match (very strict)
        let phraseMatches = 0;
        const matchedPhrases = [];
        for (let i = 0; i < strictConversionPhrases.length; i++) {
          if (pageText.indexOf(strictConversionPhrases[i]) !== -1) {
            phraseMatches++;
            matchedPhrases.push(strictConversionPhrases[i]);
          }
        }
        
        // Need at least 2 phrases AND order_id for content-based detection
        if (phraseMatches >= 2 && hasOrderId) {
          isConversionPage = true;
          matchedKeyword = 'page-content';
          confidenceLevel += 1;
          if (window.TRACKER_CONFIG?.DEBUG) {
            console.log('[Affiliate Tracker] Conversion page detected by content (2+ phrases + order_id):', matchedPhrases);
          }
        } else if (phraseMatches >= 3) {
          // Or 3+ phrases without order_id (very strict)
          isConversionPage = true;
          matchedKeyword = 'page-content';
          confidenceLevel += 1;
          if (window.TRACKER_CONFIG?.DEBUG) {
            console.log('[Affiliate Tracker] Conversion page detected by content (3+ phrases):', matchedPhrases);
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }

    // Method 4: Check meta tags and structured data - STRICT only
    // Only check for order/purchase completion indicators
    if (!isConversionPage) {
      try {
        // Check meta tags - only for order status
        const metaTags = document.querySelectorAll('meta[property], meta[name]');
        for (let i = 0; i < metaTags.length; i++) {
          const property = (metaTags[i].getAttribute('property') || metaTags[i].getAttribute('name') || '').toLowerCase();
          // Only match if it's clearly about order completion
          if ((property.indexOf('order') !== -1 && (property.indexOf('status') !== -1 || property.indexOf('complete') !== -1)) ||
              (property.indexOf('purchase') !== -1 && property.indexOf('complete') !== -1)) {
            isConversionPage = true;
            matchedKeyword = 'meta-tag';
            if (window.TRACKER_CONFIG?.DEBUG) {
              console.log('[Affiliate Tracker] Conversion page detected by meta tag:', property);
            }
            break;
          }
        }
        
        // Check JSON-LD structured data - only for completed orders
        if (!isConversionPage) {
          const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
          for (let i = 0; i < jsonLdScripts.length; i++) {
            try {
              const data = JSON.parse(jsonLdScripts[i].textContent);
              const dataStr = JSON.stringify(data).toLowerCase();
              // Only match if it's clearly about order completion
              if ((dataStr.indexOf('order') !== -1 && (dataStr.indexOf('status') !== -1 || dataStr.indexOf('complete') !== -1)) ||
                  (dataStr.indexOf('purchase') !== -1 && dataStr.indexOf('complete') !== -1)) {
                isConversionPage = true;
                matchedKeyword = 'json-ld';
                if (window.TRACKER_CONFIG?.DEBUG) {
                  console.log('[Affiliate Tracker] Conversion page detected by JSON-LD');
                }
                break;
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }

    // FINAL CHECK: Require minimum confidence level
    // Confidence levels:
    // - 0-1: Not enough evidence, skip
    // - 2: Medium confidence (URL match OR order_id + content)
    // - 3+: High confidence (multiple indicators)
    
    if (!isConversionPage || confidenceLevel < 2) {
      if (window.TRACKER_CONFIG?.DEBUG) {
        console.log('[Affiliate Tracker] Page not detected as conversion page', {
          isConversionPage: isConversionPage,
          confidenceLevel: confidenceLevel,
          hasOrderId: hasOrderId,
          matchedKeyword: matchedKeyword
        });
      }
      // Mark that automatic tracking is not in progress (page not detected as conversion)
      automaticConversionInProgress = false;
      updateAutomaticConversionFlag();
      return;
    }
    
    if (window.TRACKER_CONFIG?.DEBUG) {
      console.log('[Affiliate Tracker] ✅ Conversion page confirmed', {
        confidenceLevel: confidenceLevel,
        matchedKeyword: matchedKeyword,
        hasOrderId: hasOrderId
      });
    }

    // Send conversion tracking
    const visitorId = getVisitorId();
    const conversionUrl = BASE_URL + '/conversion';

    // Try to extract order value from page (multiple methods)
    let orderValue = 0;
    
    try {
      // Method 1: Check if order value is provided in TRACKER_CONFIG
      if (window.TRACKER_CONFIG?.ORDER_VALUE !== undefined) {
        orderValue = parseFloat(window.TRACKER_CONFIG.ORDER_VALUE);
        if (!isNaN(orderValue)) {
          if (window.TRACKER_CONFIG?.DEBUG) {
            console.log('[Affiliate Tracker] Order value from config:', orderValue);
          }
        }
      }
      
      // Method 2: Check data attribute on body or specific element
      if (orderValue === 0) {
        const orderValueAttr = document.body?.getAttribute('data-order-value') || 
                              document.querySelector('[data-order-value]')?.getAttribute('data-order-value');
        if (orderValueAttr) {
          orderValue = parseFloat(orderValueAttr.replace(/[^0-9.]/g, ''));
          if (!isNaN(orderValue) && window.TRACKER_CONFIG?.DEBUG) {
            console.log('[Affiliate Tracker] Order value from data attribute:', orderValue);
          }
        }
      }
      
      // Method 3: Extract from URL parameters
      if (orderValue === 0) {
        const urlParams = new URLSearchParams(window.location.search);
        const urlTotal = urlParams.get('total') || urlParams.get('amount') || urlParams.get('order_value');
        if (urlTotal) {
          orderValue = parseFloat(urlTotal.replace(/[^0-9.]/g, ''));
          if (!isNaN(orderValue) && window.TRACKER_CONFIG?.DEBUG) {
            console.log('[Affiliate Tracker] Order value from URL:', orderValue);
          }
        }
      }
      
      // Method 4: UNIVERSAL extraction from DOM elements (works on any e-commerce site)
      // ONLY on confirmed conversion pages (we already verified isConversionPage)
      if (orderValue === 0) {
        // Priority list of selectors (most common e-commerce patterns)
        // Only very specific selectors that appear on confirmation pages
        const totalSelectors = [
          '#order-total',
          '#orderTotal',
          '#order_total',
          '#total-amount',
          '#totalAmount',
          '#grand-total',
          '#grandTotal',
          '[data-order-total]',
          '[data-total]',
          '.order-total',
          '.orderTotal',
          '.total-amount',
          '.grand-total',
          '[class*="order-total"]',
          '[class*="grand-total"]'
        ];
        
        // AVOID generic selectors like '#total', '.total', '.amount' - they appear on product pages too
        
        for (let i = 0; i < totalSelectors.length; i++) {
          try {
            const el = document.querySelector(totalSelectors[i]);
            if (el) {
              const text = el.textContent || el.innerText || el.value || el.getAttribute('value') || '';
              // Try multiple patterns
              const patterns = [
                /\$?\s*([\d,]+\.?\d*)/,  // $123.45 or 123.45
                /([\d,]+\.?\d*)\s*\$/,  // 123.45 $
                /([\d,]+\.?\d*)/        // Just number
              ];
              
              for (let j = 0; j < patterns.length; j++) {
                const match = text.match(patterns[j]);
                if (match && match[1]) {
                  const value = parseFloat(match[1].replace(/,/g, ''));
                  if (!isNaN(value) && value > 0 && value < 1000000) { // Sanity check: reasonable price
                    orderValue = value;
                    if (window.TRACKER_CONFIG?.DEBUG) {
                      console.log('[Affiliate Tracker] Order value from element:', orderValue, 'selector:', totalSelectors[i]);
                    }
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
      }
      
      // Method 5: Extract from page text (comprehensive patterns)
      // ONLY use very specific patterns that indicate order total (not product prices)
      if (orderValue === 0) {
        try {
          const pageText = document.body ? (document.body.innerText || document.body.textContent) : '';
          
          // STRICT price patterns - only patterns that clearly indicate order total
          // Avoid generic patterns that match product prices
          const strictPricePatterns = [
            // English - must include "order" or "total" context
            /(?:order[_\s]?total|grand[_\s]?total|total[_\s]?amount)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
            /(?:total|amount)[:\s]*\$?\s*([\d,]+\.?\d*)\s*(?:for[_\s]?your[_\s]?order|order)/i,
            // Ukrainian - must include "замовлення" context
            /(?:сума[_\s]?замовлення|загальна[_\s]?сума|підсумок[_\s]?замовлення)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
            /(?:сума[_\s]?замовлення|загальна[_\s]?сума)[:\s]*([\d,]+\.?\d*)\s*грн/i,
            // Russian - must include "заказ" context
            /(?:сумма[_\s]?заказа|итого[_\s]?по[_\s]?заказу)[:\s]*\$?\s*([\d,]+\.?\d*)/i
          ];
          
          const foundValues = [];
          for (let i = 0; i < strictPricePatterns.length; i++) {
            const matches = pageText.match(strictPricePatterns[i]);
            if (matches) {
              const value = parseFloat((matches[1] || '').replace(/[^0-9.]/g, ''));
              if (!isNaN(value) && value > 0 && value < 1000000) {
                foundValues.push(value);
              }
            }
          }
          
          if (foundValues.length > 0) {
            // Use the largest reasonable value (likely the total)
            orderValue = Math.max(...foundValues);
            if (window.TRACKER_CONFIG?.DEBUG) {
              console.log('[Affiliate Tracker] Order value from page text (strict patterns):', orderValue);
            }
          }
        } catch (e) {
          // Ignore errors
        }
      }
      
      // Method 6: Extract from meta tags and structured data
      if (orderValue === 0) {
        try {
          // Check meta tags
          const metaTags = document.querySelectorAll('meta[property], meta[name]');
          for (let i = 0; i < metaTags.length; i++) {
            const property = (metaTags[i].getAttribute('property') || metaTags[i].getAttribute('name') || '').toLowerCase();
            if (property.indexOf('price') !== -1 || property.indexOf('amount') !== -1 || property.indexOf('total') !== -1) {
              const content = metaTags[i].getAttribute('content') || '';
              const match = content.match(/([\d,]+\.?\d*)/);
              if (match) {
                const value = parseFloat(match[1].replace(/,/g, ''));
                if (!isNaN(value) && value > 0 && value < 1000000) {
                  orderValue = value;
                  if (window.TRACKER_CONFIG?.DEBUG) {
                    console.log('[Affiliate Tracker] Order value from meta tag:', orderValue);
                  }
                  break;
                }
              }
            }
          }
          
          // Check JSON-LD structured data
          if (orderValue === 0) {
            const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
            for (let i = 0; i < jsonLdScripts.length; i++) {
              try {
                const data = JSON.parse(jsonLdScripts[i].textContent);
                // Look for price, totalPrice, orderTotal, etc.
                const priceFields = ['price', 'totalPrice', 'orderTotal', 'total', 'amount', 'grandTotal'];
                for (let j = 0; j < priceFields.length; j++) {
                  if (data[priceFields[j]]) {
                    const value = parseFloat(data[priceFields[j]]);
                    if (!isNaN(value) && value > 0 && value < 1000000) {
                      orderValue = value;
                      if (window.TRACKER_CONFIG?.DEBUG) {
                        console.log('[Affiliate Tracker] Order value from JSON-LD:', orderValue);
                      }
                      break;
                    }
                  }
                }
                if (orderValue > 0) break;
              } catch (e) {
                // Ignore JSON parse errors
              }
            }
          }
        } catch (e) {
          // Ignore errors
        }
      }
    } catch (e) {
      if (window.TRACKER_CONFIG?.DEBUG) {
        console.error('[Affiliate Tracker] Error extracting order value:', e);
      }
    }
    
    // Final check - ensure we have a valid number
    if (isNaN(orderValue) || orderValue < 0) {
      orderValue = 0;
    }

    // Send conversion using multiple methods for maximum compatibility
    
    // Method 1: Try POST request first (preferred)
    // Send data in MULTIPLE formats for maximum compatibility
    const sendConversionPOST = function() {
      // Create request body with all possible field names
      const requestBody = {
        unique_code: refCode,
        code: refCode,  // Alternative field name
        order_value: orderValue,
        value: orderValue,  // Alternative field name
        amount: orderValue,  // Alternative field name
        total: orderValue,  // Alternative field name
        visitor_id: visitorId,
        visitorId: visitorId  // Alternative field name
      };
      
      // Add normalized order_id if available
      if (orderId) {
        requestBody.order_id = orderId;
        requestBody.orderId = orderId;
        requestBody.order_number = orderId;
      }
      
      if (window.TRACKER_CONFIG?.DEBUG) {
        console.log('[Affiliate Tracker] 📤 Sending conversion (POST):', {
          url: conversionUrl,
          body: requestBody
        });
      }
      
      return safeFetch(conversionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Visitor-ID': visitorId
        },
        body: JSON.stringify(requestBody)
      });
    };
    
    // Method 2: Fallback to GET request with image pixel (works everywhere)
    const sendConversionGET = function() {
      const params = new URLSearchParams({
        code: refCode,
        value: orderValue || '0',
        visitor_id: visitorId
      });
      if (orderId) params.append('order_id', orderId);
      
      // Create image pixel for tracking (works even with CORS issues)
      const img = new Image();
      img.src = BASE_URL.replace('/conversion', '') + '/conversion?' + params.toString();
      img.style.display = 'none';
      img.width = 1;
      img.height = 1;
      document.body.appendChild(img);
      
      // Return a fake response object for consistency
      return Promise.resolve({ ok: true, status: 200 });
    };
    
    // Track if conversion was sent to prevent duplicate GET requests
    let conversionSent = false;
    
    // Mark as in progress BEFORE sending request
    markConversionAsSent(orderId);
    if (rawOrderId && rawOrderId !== orderId) {
      markConversionAsSent(rawOrderId);
    }
    
    // Try POST first, fallback to GET if POST fails
    sendConversionPOST().then(function(response) {
      if (response && (response.ok || response.status === 200)) {
        // Success with POST - mark as sent and DON'T send GET
        conversionSent = true;
        automaticConversionCompleted = true;
        automaticConversionInProgress = false;
        updateAutomaticConversionFlag();
        
        // Clone response before parsing (response can only be read once)
        const responseClone = response.clone();
        
        // Try to parse response for logging (don't block on this)
        responseClone.json().then(function(data) {
          if (window.TRACKER_CONFIG?.DEBUG) {
            console.log('[Affiliate Tracker] ✅ Conversion tracked (POST):', {
              refCode: refCode,
              orderValue: orderValue,
              orderId: orderId || 'none',
              keyword: matchedKeyword,
              response: data
            });
          }
        }).catch(function() {
          // Response might not be JSON, that's OK
          if (window.TRACKER_CONFIG?.DEBUG) {
            console.log('[Affiliate Tracker] ✅ Conversion tracked (POST, no response body)');
          }
        });
      } else {
        // POST failed, try GET fallback ONLY if not already sent
        if (!conversionSent) {
          if (window.TRACKER_CONFIG?.DEBUG) {
            console.warn('[Affiliate Tracker] ⚠️ POST failed (status:', response?.status, '), trying GET fallback...');
          }
          sendConversionGET();
          automaticConversionCompleted = true;
          automaticConversionInProgress = false;
          updateAutomaticConversionFlag();
          
          if (window.TRACKER_CONFIG?.DEBUG) {
            console.log('[Affiliate Tracker] ✅ Conversion tracked (GET fallback):', {
              refCode: refCode,
              orderValue: orderValue
            });
          }
        }
      }
    }).catch(function(error) {
      // POST completely failed, use GET fallback ONLY if not already sent
      if (!conversionSent) {
        if (window.TRACKER_CONFIG?.DEBUG) {
          console.warn('[Affiliate Tracker] ❌ POST error, using GET fallback:', error);
        }
        sendConversionGET();
        automaticConversionCompleted = true;
        automaticConversionInProgress = false;
        updateAutomaticConversionFlag();
        
        if (window.TRACKER_CONFIG?.DEBUG) {
          console.log('[Affiliate Tracker] ✅ Conversion tracked (GET fallback after error)');
        }
      } else {
        automaticConversionInProgress = false;
        updateAutomaticConversionFlag();
      }
    });
  }

  // ========== INITIALIZATION ==========

  // Global flags on window object to prevent double initialization across multiple script executions
  // This is critical for GTM where the script might be executed multiple times
  if (typeof window !== 'undefined') {
    window._affiliateTrackerInitialized = window._affiliateTrackerInitialized || false;
    window._affiliateTrackerInitInProgress = window._affiliateTrackerInitInProgress || false;
    window._affiliateTrackerInstanceId = window._affiliateTrackerInstanceId || Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  }
  
  // Local flags (for this execution context)
  let trackerInitialized = false;
  let initInProgress = false;

  /**
   * Send verification ping to confirm tracker is installed
   * This helps the system detect if tracker is active on the website
   */
  function sendVerificationPing() {
    try {
      const refCode = getStoredRefCode();
      const domain = window.location.hostname;
      const version = '1.0.0'; // Tracker version
      
      const verifyUrl = BASE_URL.replace('/conversion', '').replace('/view', '') + '/verify?' + 
        new URLSearchParams({
          code: refCode || '',
          domain: domain,
          version: version,
          timestamp: Date.now()
        }).toString();
      
      // Send verification ping (fire and forget)
      safeFetch(verifyUrl, {
        method: 'GET',
        headers: {
          'X-Tracker-Version': version
        }
      }).then(function(response) {
        if (window.TRACKER_CONFIG?.DEBUG && response) {
          console.log('[Affiliate Tracker] ✅ Verification ping sent');
        }
      }).catch(function(error) {
        // Silent fail - don't break client site
      });
    } catch (e) {
      // Silent fail
    }
  }

  /**
   * Initialize tracker when page loads
   */
  function init() {
    // CRITICAL: Check global flags first (prevents double initialization even if script runs twice)
    if (typeof window !== 'undefined') {
      // If already initialized globally, skip completely
      if (window._affiliateTrackerInitialized) {
        if (window.TRACKER_CONFIG?.DEBUG) {
          console.log('[Affiliate Tracker] Tracker already initialized globally, skipping duplicate initialization');
        }
        return;
      }
      
      // If initialization is in progress, wait a bit and check again
      if (window._affiliateTrackerInitInProgress) {
        if (window.TRACKER_CONFIG?.DEBUG) {
          console.log('[Affiliate Tracker] Tracker initialization in progress, waiting...');
        }
        // Wait 100ms and try again (only once to prevent infinite loop)
        setTimeout(function() {
          if (!window._affiliateTrackerInitialized) {
            init();
          }
        }, 100);
        return;
      }
      
      // Mark as in progress globally
      window._affiliateTrackerInitInProgress = true;
    }
    
    // Also check local flags
    if (trackerInitialized || initInProgress) {
      if (window.TRACKER_CONFIG?.DEBUG) {
        console.log('[Affiliate Tracker] Tracker already initialized locally, skipping');
      }
      if (typeof window !== 'undefined') {
        window._affiliateTrackerInitInProgress = false;
      }
      return;
    }
    
    initInProgress = true;
    
    try {
      // Step 0: Send verification ping to confirm tracker is installed
      sendVerificationPing();
      
      // Step 1: Capture referral code from URL
      captureReferral();

      // Step 2: Identify/get visitor ID
      identifyVisitor();

      // Step 3: Track page view
      trackPageView();

      // Step 4: Check for conversion (with slight delay to ensure page is loaded)
      setTimeout(function() {
        trackConversion();
      }, 500);
      
      // Mark as initialized (both locally and globally)
      trackerInitialized = true;
      if (typeof window !== 'undefined') {
        window._affiliateTrackerInitialized = true;
        window._affiliateTrackerInitInProgress = false;
      }
      
      // Send periodic verification pings (every 5 minutes) to keep tracker status active
      // Only set up interval once (check if already exists)
      if (typeof window !== 'undefined' && !window._affiliateTrackerPingInterval) {
        window._affiliateTrackerPingInterval = setInterval(function() {
          sendVerificationPing();
        }, 5 * 60 * 1000); // 5 minutes
      }
      
    } catch (error) {
      if (window.TRACKER_CONFIG?.DEBUG) {
        console.error('[Affiliate Tracker] Error during initialization:', error);
      }
      // Reset flags on error
      if (typeof window !== 'undefined') {
        window._affiliateTrackerInitInProgress = false;
      }
    } finally {
      initInProgress = false;
    }
  }

  // ========== AUTO-EXECUTE ==========

  // CRITICAL: Check if tracker is already initialized globally before setting up listeners
  // This prevents duplicate initialization even if script is loaded multiple times
  if (typeof window !== 'undefined' && window._affiliateTrackerInitialized) {
    if (window.TRACKER_CONFIG?.DEBUG) {
      console.log('[Affiliate Tracker] Tracker already initialized, skipping auto-execute');
    }
    return; // Exit immediately if already initialized
  }

  // Prevent multiple event listeners using global flag
  if (typeof window !== 'undefined') {
    window._affiliateTrackerDomReadyListenerAdded = window._affiliateTrackerDomReadyListenerAdded || false;
  }

  // Run initialization when DOM is ready
  if (document.readyState === 'loading') {
    if (typeof window === 'undefined' || !window._affiliateTrackerDomReadyListenerAdded) {
      if (typeof window !== 'undefined') {
        window._affiliateTrackerDomReadyListenerAdded = true;
      }
      document.addEventListener('DOMContentLoaded', function() {
        // Double-check before initializing
        if (typeof window === 'undefined' || !window._affiliateTrackerInitialized) {
          init();
        }
      }, { once: true }); // Use once option to ensure listener is only called once
    }
  } else {
    // DOM already loaded - check again before initializing
    if (typeof window === 'undefined' || !window._affiliateTrackerInitialized) {
      init();
    }
  }
  
  // Also prevent multiple window load listeners
  if (typeof window !== 'undefined' && !window._affiliateTrackerLoadListenerAdded) {
    window._affiliateTrackerLoadListenerAdded = true;
    window.addEventListener('load', function() {
      // Only init if not already initialized (check both local and global flags)
      if ((typeof window === 'undefined' || !window._affiliateTrackerInitialized) && 
          !trackerInitialized && !initInProgress) {
        init();
      }
    }, { once: true }); // Use once option
  }

  // ========== OPTIONAL: EXPOSE MANUAL API ==========

  /**
   * Manual conversion tracking function
   * Can be called from client site: window.AffiliateTracker.trackConversionManually(orderValue, orderId)
   */
  function trackConversionManually(customOrderValue, customOrderId) {
    const refCode = getStoredRefCode();
    
    if (!refCode) {
      if (window.TRACKER_CONFIG?.DEBUG) {
        console.warn('[Affiliate Tracker] Cannot track conversion manually: no referral code found');
      }
      return false;
    }
    
    // Check if automatic conversion tracking is completed (successfully tracked)
    // Allow manual tracking if automatic didn't complete (e.g., page not detected as conversion page)
    if (automaticConversionCompleted) {
      if (window.TRACKER_CONFIG?.DEBUG) {
        console.log('[Affiliate Tracker] Automatic conversion tracking already completed, skipping manual call');
      }
      return false;
    }
    
    // If automatic tracking is in progress, wait a bit and check again
    if (automaticConversionInProgress) {
      // Wait 200ms and check again
      return new Promise((resolve) => {
        setTimeout(() => {
          if (automaticConversionCompleted) {
            if (window.TRACKER_CONFIG?.DEBUG) {
              console.log('[Affiliate Tracker] Automatic conversion tracking completed during wait, skipping manual call');
            }
            resolve(false);
          } else {
            // Automatic didn't complete, proceed with manual tracking
            resolve(trackConversionManuallyInternal(customOrderValue, customOrderId));
          }
        }, 200);
      });
    }
    
    // Automatic not in progress, proceed with manual tracking
    return trackConversionManuallyInternal(customOrderValue, customOrderId);
  }
  
  function trackConversionManuallyInternal(customOrderValue, customOrderId) {
    const refCode = getStoredRefCode();
    
    if (!refCode) {
      if (window.TRACKER_CONFIG?.DEBUG) {
        console.warn('[Affiliate Tracker] Cannot track conversion manually: no referral code found');
      }
      return false;
    }
    
    // Normalize order ID to ensure consistency
    const rawOrderId = customOrderId || extractOrderId();
    const orderId = normalizeOrderId(rawOrderId);
    const orderValue = customOrderValue !== undefined ? parseFloat(customOrderValue) : 0;
    
    // Check if already sent - check all variations
    const variationsToCheck = [orderId];
    if (rawOrderId && rawOrderId !== orderId) {
      variationsToCheck.push(rawOrderId);
    }
    
    let alreadySent = false;
    for (let i = 0; i < variationsToCheck.length; i++) {
      if (hasConversionBeenSent(variationsToCheck[i])) {
        alreadySent = true;
        break;
      }
    }
    
    if (alreadySent) {
      if (window.TRACKER_CONFIG?.DEBUG) {
        console.log('[Affiliate Tracker] Conversion already tracked, skipping manual call');
      }
      return false;
    }
    
    // Use the same sending logic
    const visitorId = getVisitorId();
    const conversionUrl = BASE_URL + '/conversion';
    
    // Send POST request
    safeFetch(conversionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Visitor-ID': visitorId
      },
      body: JSON.stringify({
        unique_code: refCode,
        order_value: orderValue,
        visitor_id: visitorId,
        order_id: orderId || undefined
      })
    }).then(function(response) {
      if (response && (response.ok || response.status === 200)) {
        // Mark all variations as sent
        markConversionAsSent(orderId);
        if (rawOrderId && rawOrderId !== orderId) {
          markConversionAsSent(rawOrderId);
        }
        if (window.TRACKER_CONFIG?.DEBUG) {
          console.log('[Affiliate Tracker] ✅ Manual conversion tracked:', {
            refCode: refCode,
            orderValue: orderValue,
            orderId: orderId || 'none',
            rawOrderId: rawOrderId || 'none'
          });
        }
      }
    }).catch(function(error) {
      // Fallback to GET
      const params = new URLSearchParams({
        code: refCode,
        value: orderValue || '0',
        visitor_id: visitorId
      });
      if (orderId) params.append('order_id', orderId);
      
      const img = new Image();
      img.src = BASE_URL.replace('/conversion', '') + '/conversion?' + params.toString();
      img.style.display = 'none';
      document.body.appendChild(img);
      // Mark all variations as sent
      markConversionAsSent(orderId);
      if (rawOrderId && rawOrderId !== orderId) {
        markConversionAsSent(rawOrderId);
      }
    });
    
    return true;
  }

  // Expose manual tracking functions for advanced usage
  // CRITICAL: Only create if it doesn't already exist (prevents overwriting existing instance)
  if (typeof window !== 'undefined') {
    // If AffiliateTracker already exists, merge new functions but keep existing state
    if (window.AffiliateTracker) {
      if (window.TRACKER_CONFIG?.DEBUG) {
        console.log('[Affiliate Tracker] AffiliateTracker already exists, merging functions');
      }
      // Merge functions but preserve existing state
      window.AffiliateTracker.trackView = trackPageView;
      window.AffiliateTracker.trackConversion = trackConversion;
      window.AffiliateTracker.trackConversionManually = trackConversionManually;
      window.AffiliateTracker.getVisitorId = getVisitorId;
      window.AffiliateTracker.getRefCode = getStoredRefCode;
      window.AffiliateTracker.captureReferral = captureReferral;
      window.AffiliateTracker.setConfig = function(config) {
        // Allow runtime configuration updates
        if (config.BASE_URL) {
          window.TRACKER_CONFIG = window.TRACKER_CONFIG || {};
          window.TRACKER_CONFIG.BASE_URL = config.BASE_URL;
        }
        if (config.CONVERSION_KEYWORD) {
          window.TRACKER_CONFIG = window.TRACKER_CONFIG || {};
          window.TRACKER_CONFIG.CONVERSION_KEYWORD = config.CONVERSION_KEYWORD;
        }
        if (config.ORDER_VALUE !== undefined) {
          window.TRACKER_CONFIG = window.TRACKER_CONFIG || {};
          window.TRACKER_CONFIG.ORDER_VALUE = config.ORDER_VALUE;
        }
      };
      // Update flags
      updateAutomaticConversionFlag();
    } else {
      // Create new instance
      window.AffiliateTracker = {
        trackView: trackPageView,
        trackConversion: trackConversion,
        trackConversionManually: trackConversionManually,
        getVisitorId: getVisitorId,
        getRefCode: getStoredRefCode,
        captureReferral: captureReferral,
        sendVerificationPing: sendVerificationPing,
        _automaticConversionCompleted: false,
        _automaticConversionInProgress: false,
        setConfig: function(config) {
          // Allow runtime configuration updates
          if (config.BASE_URL) {
            window.TRACKER_CONFIG = window.TRACKER_CONFIG || {};
            window.TRACKER_CONFIG.BASE_URL = config.BASE_URL;
          }
          if (config.CONVERSION_KEYWORD) {
            window.TRACKER_CONFIG = window.TRACKER_CONFIG || {};
            window.TRACKER_CONFIG.CONVERSION_KEYWORD = config.CONVERSION_KEYWORD;
          }
          if (config.ORDER_VALUE !== undefined) {
            window.TRACKER_CONFIG = window.TRACKER_CONFIG || {};
            window.TRACKER_CONFIG.ORDER_VALUE = config.ORDER_VALUE;
          }
        }
      };
      // Initialize flags
      updateAutomaticConversionFlag();
    }
  }
})();
