import express from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { Link, Click, Conversion, TrackerVerification, Website, LinkClick } from '../models/index.js';
import { getVisitorFingerprint, getClientIP } from '../utils/fingerprint.js';
import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ── Short config codes (in-memory, expire after 10 min) ─────────────────
const configCodes = new Map();

function generateShortCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function storeConfigCode(token) {
  const code = generateShortCode();
  configCodes.set(code, { token, created: Date.now() });
  // Cleanup expired codes (older than 10 min)
  for (const [k, v] of configCodes) {
    if (Date.now() - v.created > 10 * 60 * 1000) configCodes.delete(k);
  }
  return code;
}

/**
 * GET /api/track/cfg/:code
 * Resolve short config code to full JWT token for Visual Mapper
 */
router.get('/cfg/:code', (req, res) => {
  const entry = configCodes.get(req.params.code);
  if (!entry || Date.now() - entry.created > 10 * 60 * 1000) {
    configCodes.delete(req.params.code);
    return res.status(404).json({ error: 'Code expired or not found' });
  }
  res.json({ success: true, token: entry.token });
});

/**
 * GET /api/track/mapper/:code
 * Serve a self-contained JS file that injects the Visual Mapper onto ANY page.
 * Usage: user pastes in browser console on the target site:
 *   fetch('https://server/api/track/mapper/CODE').then(r=>r.text()).then(eval)
 * Or simpler one-liner:
 *   var s=document.createElement('script');s.src='https://server/api/track/mapper/CODE';document.head.appendChild(s)
 */
router.get('/mapper/:code', (req, res) => {
  const entry = configCodes.get(req.params.code);
  if (!entry || Date.now() - entry.created > 10 * 60 * 1000) {
    configCodes.delete(req.params.code);
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    return res.send('console.error("[LehkoTrack] Код закінчився або не знайдений. Згенеруйте новий в адмінці.");alert("Код закінчився. Згенеруйте новий в адмінці LehkoTrack.");');
  }

  const token = entry.token;
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    return res.send('console.error("[LehkoTrack] Токен невалідний.");');
  }

  const serverOrigin = `${req.protocol}://${req.get('host')}`;

  // Serve a JS that: sets global config, loads pixel.js in config mode
  const script = `
(function() {
  if (window.__lehkoMapperLoaded) { console.log('[LehkoTrack] Mapper already loaded'); return; }
  window.__lehkoMapperLoaded = true;

  // Set config so pixel.js knows where the server is
  window.__lehkoConfig = window.__lehkoConfig || {};
  window.__lehkoConfig.siteId = window.__lehkoConfig.siteId || '${decoded.websiteId}';
  window.__lehkoConfig.baseUrl = '${serverOrigin}';

  // Save token to sessionStorage so mapper persists across page navigations
  try { sessionStorage.setItem('lehko_mapper_token', '${token}'); } catch (e) {}

  // Inject URL params so pixel.js detects config mode
  var url = new URL(location.href);
  url.searchParams.set('lehko_mode', 'configure');
  url.searchParams.set('token', '${token}');
  history.replaceState(null, '', url.toString());

  // Remove existing pixel.js instance if any
  window.__lehkoTrackLoaded = false;

  // Load pixel.js fresh
  var s = document.createElement('script');
  s.src = '${serverOrigin}/pixel.js?t=' + Date.now();
  s.onerror = function() {
    // Try alternative path
    s.src = '${serverOrigin}/api/track/pixel.js?t=' + Date.now();
    document.head.appendChild(s);
  };
  document.head.appendChild(s);
  console.log('[LehkoTrack] Visual Mapper завантажено! Оберіть кнопку ліду.');
})();
`;

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.send(script);
});

/**
 * GET /api/track/pixel.js
 * Serve pixel.js tracker file (workaround for React Router intercepting /pixel.js)
 * This allows pixel.js to be accessed via /api/track/pixel.js when Nginx is not configured
 */
router.get('/pixel.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.sendFile(path.join(__dirname, '..', 'public', 'pixel.js'));
});

/**
 * GET /api/track/config
 * Public config for Universal Tracker (pixel.js?site=ID). Returns success URLs, price selector, static price.
 */
router.get('/config', async (req, res, next) => {
  try {
    const siteId = req.query.site || req.query.id;
    if (!siteId) {
      return res.json({
        success: true,
        conversionUrls: [],
        priceSelector: null,
        staticPrice: null,
        purchaseButtonSelectors: null
      });
    }
    const website = await Website.findByPk(siteId, { attributes: ['id', 'conversion_urls', 'price_selector', 'static_price', 'purchase_button_selector', 'cart_button_selector'] });
    if (!website) {
      return res.json({
        success: true,
        conversionUrls: [],
        priceSelector: null,
        staticPrice: null,
        purchaseButtonSelector: null,
        cartButtonSelector: null
      });
    }
    let conversionUrls = [];
    try {
      if (website.conversion_urls) {
        const parsed = typeof website.conversion_urls === 'string' ? JSON.parse(website.conversion_urls) : website.conversion_urls;
        conversionUrls = Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {}
    res.json({
      success: true,
      conversionUrls,
      priceSelector: website.price_selector || null,
      staticPrice: website.static_price != null ? parseFloat(website.static_price) : null,
      purchaseButtonSelector: website.purchase_button_selector || null,
      cartButtonSelector: website.cart_button_selector || null
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/track/save-selector
 * Called by pixel.js in configuration mode (Visual Event Mapper).
 * Validates the short-lived configure token and saves CSS selectors to the website.
 *
 * Body: { token, selector, priceSelector?, cartSelector? }
 */
router.post('/save-selector', async (req, res, next) => {
  try {
    const { token, selector, priceSelector, cartSelector } = req.body;

    if (!token || (!selector && !cartSelector)) {
      return res.status(400).json({ error: 'token and at least one selector are required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid or expired configuration token' });
    }

    if (decoded.purpose !== 'configure' || !decoded.websiteId) {
      return res.status(401).json({ error: 'Invalid token purpose' });
    }

    const website = await Website.findByPk(decoded.websiteId);
    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    if (selector !== undefined) {
      website.purchase_button_selector = selector || null;
    }
    if (priceSelector !== undefined) {
      website.price_selector = priceSelector || null;
    }
    if (cartSelector !== undefined) {
      website.cart_button_selector = cartSelector || null;
    }
    await website.save();

    console.log('[Visual Mapper] Selectors saved', {
      websiteId: website.id,
      domain: website.domain,
      buttonSelector: selector,
      priceSelector: priceSelector || null,
      cartSelector: cartSelector || null
    });

    res.json({ success: true, message: 'Selectors saved successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/track/link-click
 * Auto-event: every click on <a> on client site. keepalive recommended.
 * Body: code (ref), visitor_id, url, text, id, class (element id/class)
 */
router.post('/link-click', async (req, res, next) => {
  try {
    const code = req.body.code || req.body.ref || req.query.code;
    const visitor_id = req.body.visitor_id || req.body.visitorId || req.headers['x-visitor-id'];
    const url = req.body.url || req.body.href;
    const text = req.body.text || req.body.link_text || req.body.innerText;
    const id = req.body.id || req.body.element_id;
    const className = req.body.class || req.body.className || req.body.element_class;
    const domain = req.body.domain || (typeof window !== 'undefined' ? window.location?.hostname : null);

    if (!code) {
      return res.status(400).json({ error: 'code (ref) required' });
    }
    const link = await Link.findOne({ where: { unique_code: code } });
    if (!link) {
      return res.status(200).json({ success: true, stored: false });
    }
    await LinkClick.create({
      link_id: link.id,
      visitor_id: visitor_id || null,
      url: url || null,
      link_text: text || null,
      element_id: id || null,
      element_class: className || null,
      domain: domain || null
    });
    res.status(201).json({ success: true, stored: true });
  } catch (error) {
    next(error);
  }
});

/**
 * Normalize order ID - remove prefixes like "ORDER-", "INV-", etc.
 * This ensures consistent order_id format for duplicate prevention
 */
const normalizeOrderId = (id) => {
  if (!id) return null;
  const str = String(id).trim();
  const normalized = str.replace(/^(ORDER[-_]?|INV[-_]?|INVOICE[-_]?|TRANS[-_]?|TXN[-_]?)/i, '');
  const digitsOnly = normalized.match(/\d+/);
  return digitsOnly ? digitsOnly[0] : normalized;
};

/**
 * GET /api/track/verify
 * Verification endpoint - tracker sends periodic pings to confirm it's installed
 * This allows the system to accurately detect if tracker is active on a website
 * 
 * Query params:
 * - code: (optional) Tracking code for verification
 * - domain: (optional) Website domain
 * - version: (optional) Tracker version
 */
router.get('/verify', async (req, res, next) => {
  try {
    const { code, domain, version, site_id } = req.query;
    
    // Normalize domain
    const normalizedDomain = domain ? domain.replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase() : null;
    
    // Log all verification attempts for debugging
    console.log('[Tracker Verification Request]', {
      domain: normalizedDomain,
      site_id: site_id || 'N/A',
      code: code || 'N/A',
      version: version || 'unknown',
      timestamp: new Date().toISOString()
    });
    
    // If site_id provided, update website connection status directly
    if (site_id) {
      try {
        const website = await Website.findByPk(site_id);
        if (website) {
          // Update website connection status
          const wasConnected = website.is_connected;
          website.is_connected = true;
          await website.save();
          
          console.log('[Tracker Verification] Website updated:', {
            site_id: site_id,
            website_domain: website.domain,
            was_connected: wasConnected,
            now_connected: true
          });
          
          // Also create verification record for the website domain
          if (website.domain) {
            const websiteDomain = website.domain.replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase();
            const [verification] = await TrackerVerification.findOrCreate({
              where: { domain: websiteDomain },
              defaults: {
                domain: websiteDomain,
                code: code || null,
                version: version || 'universal',
                last_seen: new Date()
              }
            });
            verification.last_seen = new Date();
            if (code) verification.code = code;
            if (version) verification.version = version;
            await verification.save();
            
            console.log('[Tracker Verification] Verification record updated for website domain:', websiteDomain);
          }
        } else {
          console.warn('[Tracker Verification] Website not found for site_id:', site_id);
        }
      } catch (e) {
        console.error('[Verification: Website update error]', e);
      }
    }
    
    if (normalizedDomain) {
      // Find or create verification record
      const [verification, created] = await TrackerVerification.findOrCreate({
        where: { domain: normalizedDomain },
        defaults: {
          domain: normalizedDomain,
          code: code || null,
          version: version || 'unknown',
          last_seen: new Date()
        }
      });
      
      if (!created) {
        // Update existing record
        verification.last_seen = new Date();
        if (code) verification.code = code;
        if (version) verification.version = version;
        await verification.save();
      }
      
      console.log('[Tracker Verification] Verification record:', {
        domain: normalizedDomain,
        created: created,
        last_seen: verification.last_seen
      });
      
      // Also check if this domain matches any website and update its status
      try {
        const domainsToCheck = [normalizedDomain];
        if (!normalizedDomain.startsWith('www.')) domainsToCheck.push('www.' + normalizedDomain);
        else domainsToCheck.push(normalizedDomain.replace(/^www\./, ''));
        
        const websites = await Website.findAll({
          where: {
            domain: { [Op.in]: domainsToCheck }
          }
        });
        
        for (const website of websites) {
          const wasConnected = website.is_connected;
          website.is_connected = true;
          await website.save();
          
          console.log('[Tracker Verification] Website matched by domain:', {
            website_id: website.id,
            website_domain: website.domain,
            request_domain: normalizedDomain,
            was_connected: wasConnected,
            now_connected: true
          });
        }
      } catch (e) {
        console.error('[Tracker Verification] Error matching websites:', e);
      }
    }
    
    res.json({ 
      success: true, 
      verified: true,
      message: 'Tracker verified',
      service: 'LehkoTrack',
      timestamp: new Date().toISOString(),
      domain: normalizedDomain,
      site_id: site_id || null
    });
  } catch (error) {
    // Still return success to not break tracker
    console.error('[Tracker Verification Error]', error);
    res.json({ 
      success: true, 
      verified: true,
      message: 'Tracker verified',
      service: 'LehkoTrack'
    });
  }
});

/**
 * GET /api/track/view/ping
 * Ping endpoint to check if tracker is installed (legacy, kept for compatibility)
 * Returns simple response to verify tracker connectivity
 */
router.get('/view/ping', async (req, res, next) => {
  try {
    res.json({ 
      success: true, 
      message: 'Tracker is installed',
      service: 'LehkoTrack'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/track/test
 * Test endpoint to verify tracker is working correctly
 * Returns detailed information about tracker status
 */
router.get('/test', async (req, res, next) => {
  try {
    const { code, domain } = req.query;
    
    // Check if verification ping was received recently
    let verificationStatus = null;
    if (domain) {
      const normalizedDomain = domain.replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase();
      const recentVerification = await TrackerVerification.findOne({
        where: {
          domain: normalizedDomain,
          last_seen: {
            [Op.gte]: new Date(Date.now() - 10 * 60 * 1000) // Within last 10 minutes
          }
        },
        order: [['last_seen', 'DESC']]
      });
      
      if (recentVerification) {
        verificationStatus = {
          found: true,
          last_seen: recentVerification.last_seen,
          version: recentVerification.version,
          code: recentVerification.code
        };
      } else {
        verificationStatus = {
          found: false,
          message: 'No verification ping received in last 10 minutes'
        };
      }
    }
    
    res.json({
      success: true,
      message: 'Tracker test endpoint',
      service: 'LehkoTrack',
      timestamp: new Date().toISOString(),
      verification: verificationStatus,
      endpoints: {
        verify: '/api/track/verify',
        view: '/api/track/view/:code',
        conversion: '/api/track/conversion',
        conversionPixel: '/api/track/conversion-pixel'
      },
      tracker_file: '/pixel.js'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/track/view/:code
 * Track a page view/click
 * This is called by the JS pixel on client domains
 * 
 * Query params:
 * - visitor_id: (optional) Visitor fingerprint from localStorage
 * 
 * Logic:
 * - Look up Link by unique_code
 * - Check if visitor_fingerprint exists in Clicks table for this link
 * - If NO -> It's a unique click
 * - Save the click to DB
 */
router.get('/view/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const visitorId = req.query.visitor_id || req.headers['x-visitor-id'];

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    // Find link by unique code
    const link = await Link.findOne({ where: { unique_code: code } });
    
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    // Get or generate visitor fingerprint
    const visitorFingerprint = visitorId || getVisitorFingerprint(req);
    const ipAddress = getClientIP(req);

    // IMPORTANT: Primary click tracking happens in redirect.js when user clicks the tracking link
    // This endpoint is ONLY for verification - we don't create new clicks here to prevent duplicates
    // Check if this visitor_fingerprint already exists for this link
    const existingClick = await Click.findOne({
      where: {
        link_id: link.id,
        visitor_fingerprint: visitorFingerprint
      },
      order: [['created_at', 'DESC']] // Get the most recent one
    });

    const isUniqueClick = !existingClick;
    
    // DO NOT create a new click here - clicks are already tracked in redirect.js
    // This endpoint is only for verification/statistics purposes
    // Creating clicks here would cause double-counting

    // Return success with click type info
    res.json({ 
      success: true, 
      message: 'Click tracked',
      is_unique: isUniqueClick,
      link_id: link.id
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/track/conversion
 * Track a conversion (purchase)
 * UNIVERSAL endpoint - accepts data in various formats from any e-commerce platform
 * 
 * Body (flexible formats):
 * - unique_code: (required) The tracking link code
 * - code: (alternative) The tracking link code
 * - order_value: (optional) The purchase amount (any format)
 * - value: (alternative) The purchase amount
 * - amount: (alternative) The purchase amount
 * - total: (alternative) The purchase amount
 * - visitor_id: (optional) Visitor fingerprint
 * - visitor_id: (alternative) Visitor fingerprint
 * - order_id: (optional) Order ID for duplicate prevention
 */
router.post('/conversion', async (req, res, next) => {
  const unique_code = req.body.unique_code || req.body.code || req.query.code;
  // Use ?? instead of || so that numeric 0 is not lost (0 is falsy with ||)
  const order_value = req.body.order_value ?? req.body.value ?? req.body.amount ?? req.body.total ?? req.query.value;
  const visitor_id = req.body.visitor_id || req.body.visitorId || req.headers['x-visitor-id'];
  const order_id = req.body.order_id || req.body.orderId || req.body.order_number;
  const click_id = req.body.click_id || req.body.clickId || null;
  const event_type = (req.body.event_type === 'lead' || req.body.event_type === 'sale' || req.body.event_type === 'cart') ? req.body.event_type : 'sale';

  console.log('[Conversion] POST received', {
    unique_code: unique_code || '(missing)',
    order_value: order_value,
    order_id: order_id,
    click_id: click_id,
    event_type: event_type,
    has_visitor_id: !!visitor_id
  });

  try {
    if (!unique_code) {
      console.warn('[Conversion] Rejected: missing unique_code', { body: req.body });
      return res.status(400).json({ 
        error: 'unique_code is required',
        received: Object.keys(req.body)
      });
    }

    const link = await Link.findOne({ where: { unique_code } });
    if (!link) {
      console.warn('[Conversion] Rejected: link not found', { unique_code });
      return res.status(404).json({ error: 'Link not found', unique_code });
    }

    // Get visitor fingerprint
    const visitorFingerprint = visitor_id || getVisitorFingerprint(req);

    // UNIVERSAL order value parsing - handles ANY format
    let parsedOrderValue = 0;
    if (order_value !== undefined && order_value !== null && order_value !== '') {
      try {
        // Convert to string and clean
        let cleaned = String(order_value);
        
        // Remove common currency symbols and formatting
        cleaned = cleaned
          .replace(/[^\d.,-]/g, ''); // Remove everything except digits, dots, commas, minus
        
        // Handle comma as decimal separator (e.g. "1499,50" → "1499.50")
        // If there's exactly one comma and no dots, and 1-2 digits after comma → it's a decimal
        if (/^\d+,\d{1,2}$/.test(cleaned)) {
          cleaned = cleaned.replace(',', '.');
        } else {
          cleaned = cleaned.replace(/,/g, ''); // Remove commas (thousand separators)
        }
        cleaned = cleaned.replace(/^-/, ''); // Remove leading minus (negative prices not supported)
        
        parsedOrderValue = parseFloat(cleaned) || 0;
        
        // Sanity check: reasonable price range
        if (parsedOrderValue < 0 || parsedOrderValue > 10000000) {
          parsedOrderValue = 0;
        }
      } catch (e) {
        console.warn('[Conversion Warning] Could not parse order_value', { order_value, error: e.message });
        parsedOrderValue = 0;
      }
    }

    const normalizedOrderId = normalizeOrderId(order_id);
    
    // Check for duplicate conversions (if order_id provided)
    let isDuplicate = false;
    let existingConversion = null;
    
    // Use transaction with lock to prevent race conditions
    const conversion = await sequelize.transaction(async (t) => {
      if (normalizedOrderId) {
        try {
          // Check if conversion with same normalized order_id already exists for this link
          // Use transaction lock to prevent race conditions
          // Use raw query with FOR UPDATE lock for MySQL to prevent race conditions
          const lockQuery = `
            SELECT * FROM conversions 
            WHERE link_id = ? 
            AND (order_id = ? ${order_id && order_id !== normalizedOrderId ? 'OR order_id = ?' : ''})
            LIMIT 1
            FOR UPDATE
          `;
          const lockParams = order_id && order_id !== normalizedOrderId 
            ? [link.id, normalizedOrderId, order_id]
            : [link.id, normalizedOrderId];
          
          const lockResults = await sequelize.query(lockQuery, {
            replacements: lockParams,
            type: QueryTypes.SELECT,
            transaction: t
          });
          
          if (lockResults && lockResults.length > 0) {
            existingConversion = await Conversion.findByPk(lockResults[0].id, { transaction: t });
          } else {
            existingConversion = null;
          }
          
          if (existingConversion) {
            isDuplicate = true;
            console.log('[Conversion Warning] Duplicate conversion detected - order_id already exists', {
              existing_id: existingConversion.id,
              order_id: normalizedOrderId,
              original_order_id: order_id,
              link_id: link.id
            });
            
            // Return existing conversion instead of creating a new one
            throw { isDuplicate: true, existingConversion };
          }
        } catch (checkError) {
          // If it's our duplicate error, re-throw it
          if (checkError.isDuplicate) {
            throw checkError;
          }
          // If order_id field doesn't exist or query fails, log but continue
          console.warn('[Conversion Warning] Could not check for duplicates by order_id:', checkError.message);
          // Continue without duplicate check
        }
      } else {
        // No order_id: block duplicate same event_type from same link (lead: 15s, sale: 3s)
        const dedupSeconds = event_type === 'lead' ? 15 : 3;
        const recentResults = await sequelize.query(`
          SELECT * FROM conversions 
          WHERE link_id = ? 
          AND event_type = ?
          AND created_at >= DATE_SUB(NOW(), INTERVAL ? SECOND)
          ORDER BY created_at DESC
          LIMIT 1
          FOR UPDATE
        `, {
          replacements: [link.id, event_type, dedupSeconds],
          type: QueryTypes.SELECT,
          transaction: t
        });
        
        const recentConversion = recentResults && recentResults.length > 0
          ? await Conversion.findByPk(recentResults[0].id, { transaction: t })
          : null;
        
        if (recentConversion) {
          console.log('[Conversion Warning] Duplicate blocked (same event_type within ' + dedupSeconds + 's)', {
            existing_id: recentConversion.id,
            event_type: event_type,
            time_diff: Date.now() - new Date(recentConversion.created_at).getTime()
          });
          throw { isDuplicate: true, existingConversion: recentConversion };
        }
      }

      const conversionData = {
        link_id: link.id,
        order_value: parsedOrderValue,
        event_type: event_type
      };
      
      const finalNormalizedOrderId = normalizedOrderId || null;
      if (finalNormalizedOrderId) {
        conversionData.order_id = finalNormalizedOrderId;
      }
      
      if (click_id) {
        const clickIdNum = parseInt(click_id);
        if (!isNaN(clickIdNum) && clickIdNum > 0) {
          conversionData.click_id = clickIdNum;
        }
      }
      
      try {
        return await Conversion.create(conversionData, { transaction: t });
      } catch (createError) {
        if (createError.message && (createError.message.includes('order_id') || createError.message.includes('click_id') || createError.message.includes('event_type'))) {
          console.warn('[Conversion Warning] Some fields not available, creating without them:', createError.message);
          delete conversionData.order_id;
          delete conversionData.click_id;
          delete conversionData.event_type;
          return await Conversion.create(conversionData, { transaction: t });
        } else {
          throw createError;
        }
      }
    });

    // Log for debugging
    console.log('[✅ Conversion Tracked Successfully]', {
      conversion_id: conversion.id,
      link_id: link.id,
      unique_code: unique_code,
      order_value: parsedOrderValue,
      order_id: normalizedOrderId || order_id || 'none',
      click_id: click_id || 'none',
      visitor_id: visitorFingerprint,
      is_duplicate: isDuplicate,
      timestamp: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      message: 'Conversion tracked successfully',
      conversion_id: conversion.id,
      order_value: parsedOrderValue,
      link_id: link.id,
      unique_code: unique_code
    });
  } catch (error) {
    // Handle duplicate error from transaction
    if (error.isDuplicate && error.existingConversion) {
      console.log('[Conversion Warning] Duplicate conversion prevented by transaction lock', {
        existing_id: error.existingConversion.id,
        order_id: normalizedOrderId || order_id,
        link_id: link.id
      });
      
      return res.json({ 
        success: true, 
        message: 'Conversion already tracked (duplicate prevented)',
        conversion_id: error.existingConversion.id,
        order_value: error.existingConversion.order_value,
        link_id: link.id,
        unique_code: unique_code,
        is_duplicate: true
      });
    }
    
    console.error('[❌ Conversion Error]', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    next(error);
  }
});

/**
 * GET /api/track/conversion-pixel
 * Track a conversion via pixel image (NO CODE NEEDED - uses cookie!)
 * 
 * This endpoint automatically detects tracking code from cookie set during redirect.
 * Perfect for minimal integration - client only needs to add one line!
 * 
 * Query params:
 * - order_value: (optional) The purchase amount
 * - order_id: (optional) Order ID for duplicate prevention
 * - code: (optional) Manual override if cookie not available
 * 
 * Usage:
 * <img src="https://your-backend.com/api/track/conversion-pixel?order_value=299.99&order_id=12345" width="1" height="1">
 */
router.get('/conversion-pixel', async (req, res, next) => {
  try {
    const { order_value, value, order_id, orderId, code } = req.query;
    
    // Try to get tracking code from cookie (set during redirect)
    let trackingCode = req.cookies?.aff_ref_code || code;
    
    // If no code in cookie or query, return pixel silently (don't break client site)
    if (!trackingCode) {
      const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.set('Content-Type', 'image/gif');
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.send(pixel);
    }

    // Find link by unique code
    const link = await Link.findOne({ where: { unique_code: trackingCode } });
    if (!link) {
      // Still return pixel to not break client site
      const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.set('Content-Type', 'image/gif');
      return res.send(pixel);
    }

    // Get visitor fingerprint
    const visitorFingerprint = getVisitorFingerprint(req);

    // Parse order value (accept both order_value and value)
    const orderValueStr = order_value || value;
    let parsedOrderValue = 0;
    if (orderValueStr !== undefined && orderValueStr !== null && orderValueStr !== '') {
      const cleaned = String(orderValueStr).replace(/[^\d.,-]/g, '').replace(/,/g, '');
      parsedOrderValue = parseFloat(cleaned) || 0;
    }

    // Get order_id for duplicate prevention (accept both order_id and orderId from query)
    const finalOrderId = order_id || orderId || null;
    const normalizedFinalOrderId = normalizeOrderId(finalOrderId);

    // Check for duplicate conversions (if order_id provided)
    if (normalizedFinalOrderId) {
      try {
        const existingConversion = await Conversion.findOne({
          where: {
            link_id: link.id,
            [Op.or]: [
              { order_id: normalizedFinalOrderId },
              ...(finalOrderId && finalOrderId !== normalizedFinalOrderId ? [{ order_id: finalOrderId }] : [])
            ]
          }
        });
        
        if (existingConversion) {
          console.log('[Conversion Pixel Warning] Duplicate conversion detected - order_id already exists', {
            existing_id: existingConversion.id,
            order_id: normalizedFinalOrderId,
            original_order_id: finalOrderId,
            link_id: link.id
          });
          
          // Return pixel silently (don't break client site)
          const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
          res.set('Content-Type', 'image/gif');
          res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
          return res.send(pixel);
        }
      } catch (checkError) {
        // If order_id field doesn't exist, skip duplicate check
        console.warn('[Conversion Pixel Warning] Could not check for duplicates by order_id:', checkError.message);
      }
    }

    // Record conversion
    // Only include order_id if it's provided (don't send null explicitly)
    const conversionData = {
      link_id: link.id,
      order_value: parsedOrderValue
    };
    
    // Use normalized order_id for consistency
    if (normalizedFinalOrderId) {
      conversionData.order_id = normalizedFinalOrderId;
    }
    
    let conversion;
    try {
      conversion = await Conversion.create(conversionData);
    } catch (createError) {
      // If order_id field doesn't exist, try without it
      if (createError.message && createError.message.includes('order_id')) {
        console.warn('[Conversion Pixel Warning] order_id field not available, creating without it:', createError.message);
        delete conversionData.order_id;
        conversion = await Conversion.create(conversionData);
      } else {
        throw createError;
      }
    }

    // Log for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[✅ Conversion Tracked via Pixel (Cookie-based)]', {
        link_id: link.id,
        unique_code: trackingCode,
        order_value: parsedOrderValue,
        order_id: normalizedFinalOrderId || finalOrderId || 'none',
        source: 'cookie-based-pixel'
      });
    }

    // Return 1x1 transparent pixel
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set('Content-Type', 'image/gif');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(pixel);
  } catch (error) {
    // Still return pixel on error to not break client site
    console.error('[Conversion Pixel Error]', error);
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set('Content-Type', 'image/gif');
    res.send(pixel);
  }
});

/**
 * GET /api/track/conversion
 * Track a conversion via GET request (for image pixels, fallback methods)
 * 
 * Query params:
 * - code: (required) The tracking link code
 * - value: (optional) The purchase amount
 * - visitor_id: (optional) Visitor fingerprint
 * - order_id: (optional) Order ID
 */
router.get('/conversion', async (req, res, next) => {
  try {
    const code = req.query.code || req.query.ref;
    const { value, visitor_id, order_id } = req.query;
    const event_type = (req.query.event_type === 'lead' || req.query.event_type === 'sale' || req.query.event_type === 'cart') ? req.query.event_type : 'sale';

    if (!code) {
      // Return 1x1 transparent pixel for image tracking
      const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.set('Content-Type', 'image/gif');
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.send(pixel);
    }

    // Find link by unique code
    const link = await Link.findOne({ where: { unique_code: code } });
    if (!link) {
      // Still return pixel to not break client site
      const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.set('Content-Type', 'image/gif');
      return res.send(pixel);
    }

    // Get visitor fingerprint
    const visitorFingerprint = visitor_id || getVisitorFingerprint(req);

    // Parse order value
    let parsedOrderValue = 0;
    if (value !== undefined && value !== null && value !== '') {
      const cleaned = String(value).replace(/[^\d.-]/g, '');
      parsedOrderValue = parseFloat(cleaned) || 0;
    }

    // Normalize order_id
    const normalizedOrderIdGet = normalizeOrderId(order_id);
    
    // Check for duplicate conversions (if order_id provided)
    if (normalizedOrderIdGet) {
      try {
        const existingConversion = await Conversion.findOne({
          where: {
            link_id: link.id,
            [Op.or]: [
              { order_id: normalizedOrderIdGet },
              ...(order_id && order_id !== normalizedOrderIdGet ? [{ order_id: order_id }] : [])
            ]
          }
        });
        
        if (existingConversion) {
          console.log('[Conversion GET Warning] Duplicate conversion detected - order_id already exists', {
            existing_id: existingConversion.id,
            order_id: normalizedOrderIdGet,
            original_order_id: order_id,
            link_id: link.id
          });
          
          // Return pixel silently (don't break client site)
          const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
          res.set('Content-Type', 'image/gif');
          res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
          return res.send(pixel);
        }
      } catch (checkError) {
        // If order_id field doesn't exist, skip duplicate check
        console.warn('[Conversion GET Warning] Could not check for duplicates by order_id:', checkError.message);
      }
    }

    const conversionData = {
      link_id: link.id,
      order_value: parsedOrderValue,
      event_type: event_type
    };
    
    if (normalizedOrderIdGet) {
      conversionData.order_id = normalizedOrderIdGet;
    }
    
    let conversion;
    try {
      conversion = await Conversion.create(conversionData);
    } catch (createError) {
      if (createError.message && (createError.message.includes('order_id') || createError.message.includes('event_type'))) {
        console.warn('[Conversion GET Warning] Some fields not available:', createError.message);
        delete conversionData.order_id;
        delete conversionData.event_type;
        conversion = await Conversion.create(conversionData);
      } else {
        throw createError;
      }
    }

    console.log('[Conversion Tracked via GET]', {
      link_id: link.id,
      unique_code: code,
      order_value: parsedOrderValue,
      event_type: event_type,
      order_id: normalizedOrderIdGet || order_id || 'none'
    });

    // Return 1x1 transparent pixel
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set('Content-Type', 'image/gif');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(pixel);
  } catch (error) {
    // Still return pixel on error to not break client site
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set('Content-Type', 'image/gif');
    res.send(pixel);
  }
});

/**
 * POST /api/track/conversion-server
 * Server-Side API Integration (API-First Tracking)
 * 
 * Supports both server-side calls (from backend) and client-side calls (from GTM/browser)
 * 
 * Body parameters:
 * - order_id: (required) Order ID for duplicate prevention
 * - order_value: (required) Purchase amount
 * - amount: (alternative) Purchase amount
 * - value: (alternative) Purchase amount
 * - ref_code: (optional) Tracking code - if not provided, will try to get from cookie
 * - customer_email: (optional) Customer email - used to find ref if cookie/ref_code not available
 * - customer_id: (optional) Customer ID
 * - timestamp: (optional) Order timestamp
 * - metadata: (optional) Additional order data
 * 
 * Cookie support:
 * - aff_ref_code: Automatically read from cookie if ref_code not provided in body
 * 
 * Usage examples:
 * 
 * 1. Server-side (Node.js):
 *    fetch('https://lehko.space/api/track/conversion-server', {
 *      method: 'POST',
 *      headers: { 'Content-Type': 'application/json' },
 *      body: JSON.stringify({
 *        order_id: '12345',
 *        order_value: 299.99,
 *        ref_code: 'ABC123' // or rely on cookie
 *      })
 *    });
 * 
 * 2. GTM Custom HTML:
 *    fetch('https://lehko.space/api/track/conversion-server', {
 *      method: 'POST',
 *      headers: { 'Content-Type': 'application/json' },
 *      credentials: 'include', // Important: sends cookies
 *      body: JSON.stringify({
 *        order_id: {{Order ID}},
 *        order_value: {{Order Value}}
 *      })
 *    });
 */
router.post('/conversion-server', async (req, res, next) => {
  try {
    const {
      order_id,
      orderId,
      order_value,
      amount,
      value,
      ref_code,
      refCode,
      customer_email,
      customerEmail,
      customer_id,
      customerId,
      timestamp,
      metadata,
      click_id,
      clickId
    } = req.body;

    // Get order_id (support multiple formats)
    const finalOrderId = order_id || orderId;
    if (!finalOrderId) {
      return res.status(400).json({
        error: 'order_id is required',
        message: 'Order ID is required for duplicate prevention'
      });
    }

    // Get order_value (support multiple formats)
    const orderValueStr = order_value || amount || value;
    if (orderValueStr === undefined || orderValueStr === null || orderValueStr === '') {
      return res.status(400).json({
        error: 'order_value is required',
        message: 'Order value (amount) is required'
      });
    }

    // Parse order value
    let parsedOrderValue = 0;
    try {
      const cleaned = String(orderValueStr).replace(/[^\d.,-]/g, '').replace(/,/g, '');
      parsedOrderValue = parseFloat(cleaned) || 0;
      if (parsedOrderValue < 0 || parsedOrderValue > 10000000) {
        parsedOrderValue = 0;
      }
    } catch (e) {
      return res.status(400).json({
        error: 'Invalid order_value format',
        message: 'Order value must be a valid number'
      });
    }

    // Find tracking code (priority: ref_code in body > cookie > customer_email lookup)
    let trackingCode = ref_code || refCode || req.cookies?.aff_ref_code;

    // If no tracking code found, try to find via customer_email (last 24 hours)
    if (!trackingCode && (customer_email || customerEmail)) {
      try {
        const email = customer_email || customerEmail;
        const recentClick = await Click.findOne({
          where: {
            created_at: {
              [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          order: [['created_at', 'DESC']],
          include: [{
            model: Link,
            required: true
          }]
        });

        if (recentClick?.Link) {
          trackingCode = recentClick.Link.unique_code;
          console.log(`[Conversion Server] Found ref via customer_email lookup: ${trackingCode}`);
        }
      } catch (lookupError) {
        console.warn('[Conversion Server] Customer email lookup failed:', lookupError);
      }
    }

    if (!trackingCode) {
      return res.status(400).json({
        error: 'Tracking code not found',
        message: 'No tracking code found. Ensure user clicked tracking link first, or provide ref_code in request.',
        hint: 'Tracking code can be provided via: 1) ref_code in body, 2) aff_ref_code cookie, 3) customer_email lookup'
      });
    }

    // Find link by tracking code
    const link = await Link.findOne({ where: { unique_code: trackingCode } });
    if (!link) {
      return res.status(404).json({
        error: 'Link not found',
        message: `Tracking link with code "${trackingCode}" not found`
      });
    }

    // Normalize order_id for duplicate prevention
    const normalizedOrderId = normalizeOrderId(finalOrderId);

    // Check for duplicate conversions using transaction lock
    const conversion = await sequelize.transaction(async (t) => {
      if (normalizedOrderId) {
        try {
          const lockQuery = `
            SELECT * FROM conversions 
            WHERE link_id = ? 
            AND (order_id = ? ${finalOrderId && finalOrderId !== normalizedOrderId ? 'OR order_id = ?' : ''})
            LIMIT 1
            FOR UPDATE
          `;
          const lockParams = finalOrderId && finalOrderId !== normalizedOrderId
            ? [link.id, normalizedOrderId, finalOrderId]
            : [link.id, normalizedOrderId];

          const lockResults = await sequelize.query(lockQuery, {
            replacements: lockParams,
            type: QueryTypes.SELECT,
            transaction: t
          });

          if (lockResults && lockResults.length > 0) {
            const existingConversion = await Conversion.findByPk(lockResults[0].id, { transaction: t });
            console.log('[Conversion Server] Duplicate conversion detected', {
              existing_id: existingConversion.id,
              order_id: normalizedOrderId,
              link_id: link.id
            });

            return {
              isDuplicate: true,
              conversion: existingConversion
            };
          }
        } catch (checkError) {
          console.warn('[Conversion Server] Duplicate check failed:', checkError);
        }
      }

      // Create new conversion
      const conversionData = {
        link_id: link.id,
        order_value: parsedOrderValue
      };

      if (normalizedOrderId) {
        conversionData.order_id = normalizedOrderId;
      }

      // Add click_id if provided (for server-to-server tracking with click reference)
      const finalClickId = click_id || clickId;
      if (finalClickId) {
        const clickIdNum = parseInt(finalClickId);
        if (!isNaN(clickIdNum) && clickIdNum > 0) {
          conversionData.click_id = clickIdNum;
        }
      }

      try {
        const newConversion = await Conversion.create(conversionData, { transaction: t });
        return {
          isDuplicate: false,
          conversion: newConversion
        };
      } catch (createError) {
        if (createError.message && (createError.message.includes('order_id') || createError.message.includes('click_id'))) {
          delete conversionData.order_id;
          delete conversionData.click_id;
          const newConversion = await Conversion.create(conversionData, { transaction: t });
          return {
            isDuplicate: false,
            conversion: newConversion
          };
        }
        throw createError;
      }
    });

    // Handle duplicate
    if (conversion.isDuplicate) {
      return res.json({
        success: true,
        message: 'Conversion already tracked (duplicate prevented)',
        conversion_id: conversion.conversion.id,
        order_value: conversion.conversion.order_value,
        link_id: link.id,
        unique_code: trackingCode,
        is_duplicate: true
      });
    }

    // Log successful conversion
    console.log('[✅ Conversion Server Tracked Successfully]', {
      conversion_id: conversion.conversion.id,
      link_id: link.id,
      unique_code: trackingCode,
      order_value: parsedOrderValue,
      order_id: normalizedOrderId || finalOrderId,
      click_id: (click_id || clickId) || 'none',
      source: 'server-api',
      has_customer_email: !!(customer_email || customerEmail)
    });

    res.json({
      success: true,
      message: 'Conversion tracked successfully',
      conversion_id: conversion.conversion.id,
      order_value: parsedOrderValue,
      link_id: link.id,
      unique_code: trackingCode,
      order_id: normalizedOrderId || finalOrderId
    });
  } catch (error) {
    console.error('[❌ Conversion Server Error]', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    next(error);
  }
});

export default router;