/**
 * Lehko Track - Google Tag Manager Integration
 * 
 * This script is designed to be loaded through Google Tag Manager (GTM)
 * It provides the same tracking functionality as tracker.js but optimized for GTM
 * 
 * Installation:
 * 1. Copy this code into a Custom HTML tag in GTM
 * 2. Set trigger: All Pages
 * 3. Set tag firing priority: High (to load early)
 */

(function() {
  'use strict';
  
  // Prevent duplicate initialization
  if (window._lehkoTrackerGTMInitialized) {
    return;
  }
  window._lehkoTrackerGTMInitialized = true;

  // Configuration - Update BASE_URL to your production backend
  const BASE_URL = window.TRACKER_CONFIG?.BASE_URL || 'https://lehko.space/api/track';
  const CONVERSION_KEYWORDS = window.TRACKER_CONFIG?.CONVERSION_KEYWORDS || 
    ['order', 'thank-you', 'thankyou', 'success', 'confirmation', 'complete', 'purchase'];
  
  // Storage keys
  const STORAGE_REF_CODE = 'aff_ref_code';
  const STORAGE_VISITOR_ID = 'lehko_visitor_id';
  
  // URL parameter for referral code
  const REF_PARAM = 'ref';
  
  // Cookie settings
  const COOKIE_DOMAIN = window.TRACKER_CONFIG?.COOKIE_DOMAIN || getRootDomain();
  const COOKIE_PATH = '/';
  const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

  /**
   * Get root domain for cookie sharing
   */
  function getRootDomain() {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length <= 2) {
      return hostname;
    }
    return '.' + parts.slice(-2).join('.');
  }

  /**
   * Set cookie
   */
  function setCookie(name, value, days) {
    try {
      const expires = new Date();
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
      const cookieString = name + '=' + encodeURIComponent(value) +
                          ';expires=' + expires.toUTCString() +
                          ';path=' + COOKIE_PATH +
                          ';SameSite=Lax';
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
   * Get cookie
   */
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

  /**
   * Get URL parameter
   */
  function getURLParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  /**
   * Generate visitor ID
   */
  function generateVisitorId() {
    return 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get or create visitor ID
   */
  function getVisitorId() {
    let visitorId = localStorage.getItem(STORAGE_VISITOR_ID);
    if (!visitorId) {
      visitorId = generateVisitorId();
      localStorage.setItem(STORAGE_VISITOR_ID, visitorId);
    }
    return visitorId;
  }

  /**
   * Capture referral code from URL
   */
  function captureReferral() {
    const refCode = getURLParameter(REF_PARAM);
    if (refCode) {
      // Save to both cookie and localStorage
      setCookie(STORAGE_REF_CODE, refCode, 365);
      localStorage.setItem(STORAGE_REF_CODE, refCode);
      
      if (window.TRACKER_CONFIG?.DEBUG) {
        console.log('[Lehko Tracker GTM] Referral code captured:', refCode);
      }
    }
  }

  /**
   * Track page view
   */
  function trackPageView() {
    const refCode = getURLParameter(REF_PARAM) || getCookie(STORAGE_REF_CODE) || localStorage.getItem(STORAGE_REF_CODE);
    if (!refCode) {
      return; // No tracking code, skip
    }

    const visitorId = getVisitorId();
    const url = BASE_URL + '/view/' + encodeURIComponent(refCode) + '?visitor_id=' + encodeURIComponent(visitorId);

    // Send tracking request
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url);
    } else {
      const img = new Image();
      img.src = url;
    }

    if (window.TRACKER_CONFIG?.DEBUG) {
      console.log('[Lehko Tracker GTM] Page view tracked:', refCode);
    }
  }

  /**
   * Track conversion
   */
  function trackConversion() {
    const refCode = getCookie(STORAGE_REF_CODE) || localStorage.getItem(STORAGE_REF_CODE);
    if (!refCode) {
      return; // No tracking code, skip
    }

    // Check if current page is a conversion page
    const currentPath = window.location.pathname.toLowerCase();
    const isConversionPage = CONVERSION_KEYWORDS.some(keyword => 
      currentPath.includes(keyword.toLowerCase())
    );

    if (!isConversionPage) {
      return; // Not a conversion page
    }

    const visitorId = getVisitorId();
    const url = BASE_URL + '/conversion?code=' + encodeURIComponent(refCode) + 
                '&visitor_id=' + encodeURIComponent(visitorId);

    // Send conversion tracking
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url);
    } else {
      const img = new Image();
      img.src = url;
    }

    if (window.TRACKER_CONFIG?.DEBUG) {
      console.log('[Lehko Tracker GTM] Conversion tracked:', refCode);
    }
  }

  /**
   * Send verification ping
   */
  function sendVerificationPing() {
    const refCode = getURLParameter(REF_PARAM) || getCookie(STORAGE_REF_CODE) || localStorage.getItem(STORAGE_REF_CODE);
    if (!refCode) {
      return;
    }

    const domain = window.location.hostname;
    const url = BASE_URL.replace('/api/track', '') + '/api/track/verify?code=' + encodeURIComponent(refCode) + 
                '&domain=' + encodeURIComponent(domain) + 
                '&version=gtm';

    if (navigator.sendBeacon) {
      navigator.sendBeacon(url);
    } else {
      const img = new Image();
      img.src = url;
    }
  }

  /**
   * Initialize tracker
   */
  function init() {
    try {
      // Step 1: Capture referral code
      captureReferral();

      // Step 2: Track page view
      trackPageView();

      // Step 3: Send verification ping
      sendVerificationPing();

      // Step 4: Check for conversion (with delay)
      setTimeout(function() {
        trackConversion();
      }, 500);

      if (window.TRACKER_CONFIG?.DEBUG) {
        console.log('[Lehko Tracker GTM] Tracker initialized');
      }
    } catch (error) {
      if (window.TRACKER_CONFIG?.DEBUG) {
        console.error('[Lehko Tracker GTM] Error:', error);
      }
    }
  }

  // Auto-execute when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Send periodic verification pings
  setInterval(function() {
    sendVerificationPing();
  }, 5 * 60 * 1000); // Every 5 minutes

})();
