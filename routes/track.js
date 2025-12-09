import express from 'express';
import { Link, Click, Conversion } from '../models/index.js';
import { getVisitorFingerprint, getClientIP } from '../utils/fingerprint.js';
import { Op } from 'sequelize';

const router = express.Router();

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
  try {
    // Accept multiple field names for flexibility
    const unique_code = req.body.unique_code || req.body.code || req.query.code;
    const order_value = req.body.order_value || req.body.value || req.body.amount || req.body.total || req.query.value;
    const visitor_id = req.body.visitor_id || req.body.visitorId || req.headers['x-visitor-id'];
    const order_id = req.body.order_id || req.body.orderId || req.body.order_number;

    // Log incoming request for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[Conversion Request Received]', {
        body: req.body,
        query: req.query,
        headers: {
          'x-visitor-id': req.headers['x-visitor-id'],
          'content-type': req.headers['content-type']
        }
      });
    }

    if (!unique_code) {
      console.warn('[Conversion Error] Missing unique_code', { body: req.body });
      return res.status(400).json({ 
        error: 'unique_code is required',
        received: Object.keys(req.body)
      });
    }

    // Find link by unique code
    const link = await Link.findOne({ where: { unique_code } });
    if (!link) {
      console.warn('[Conversion Error] Link not found', { unique_code });
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
          .replace(/[^\d.,-]/g, '') // Remove everything except digits, dots, commas, minus
          .replace(/,/g, '') // Remove commas (thousand separators)
          .replace(/^-/, ''); // Remove leading minus (negative prices not supported)
        
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

    // Check for duplicate conversions (if order_id provided)
    let isDuplicate = false;
    let existingConversion = null;
    
    if (order_id) {
      try {
        // Check if conversion with same order_id already exists for this link
        existingConversion = await Conversion.findOne({
          where: {
            link_id: link.id,
            order_id: order_id
          }
        });
        
        if (existingConversion) {
          isDuplicate = true;
          console.log('[Conversion Warning] Duplicate conversion detected - order_id already exists', {
            existing_id: existingConversion.id,
            order_id: order_id,
            link_id: link.id
          });
          
          // Return existing conversion instead of creating a new one
          return res.json({ 
            success: true, 
            message: 'Conversion already tracked (duplicate prevented)',
            conversion_id: existingConversion.id,
            order_value: existingConversion.order_value,
            link_id: link.id,
            unique_code: unique_code,
            is_duplicate: true
          });
        }
      } catch (checkError) {
        // If order_id field doesn't exist or query fails, log but continue
        console.warn('[Conversion Warning] Could not check for duplicates by order_id:', checkError.message);
        // Continue without duplicate check
      }
    } else {
      // If no order_id, check for conversions in last 5 seconds (fallback duplicate prevention)
      const recentConversion = await Conversion.findOne({
        where: {
          link_id: link.id,
          created_at: {
            [Op.gte]: new Date(Date.now() - 5000) // Last 5 seconds
          }
        },
        order: [['created_at', 'DESC']]
      });
      
      if (recentConversion) {
        isDuplicate = true;
        console.log('[Conversion Warning] Possible duplicate detected (no order_id, but recent conversion exists)', {
          existing_id: recentConversion.id,
          time_diff: Date.now() - new Date(recentConversion.created_at).getTime()
        });
        
        // Still create conversion but log warning (admin can review)
      }
    }

    // Record conversion
    // Only include order_id if it's provided (don't send null explicitly)
    const conversionData = {
      link_id: link.id,
      order_value: parsedOrderValue
    };
    
    // Try to add order_id if provided, but don't fail if field doesn't exist
    if (order_id) {
      conversionData.order_id = order_id;
    }
    
    let conversion;
    try {
      conversion = await Conversion.create(conversionData);
    } catch (createError) {
      // If order_id field doesn't exist, try without it
      if (createError.message && createError.message.includes('order_id')) {
        console.warn('[Conversion Warning] order_id field not available, creating without it:', createError.message);
        delete conversionData.order_id;
        conversion = await Conversion.create(conversionData);
      } else {
        throw createError;
      }
    }

    // Log for debugging
    console.log('[✅ Conversion Tracked Successfully]', {
      conversion_id: conversion.id,
      link_id: link.id,
      unique_code: unique_code,
      order_value: parsedOrderValue,
      order_id: order_id || 'none',
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

    // Check for duplicate conversions (if order_id provided)
    if (finalOrderId) {
      try {
        const existingConversion = await Conversion.findOne({
          where: {
            link_id: link.id,
            order_id: finalOrderId
          }
        });
        
        if (existingConversion) {
          console.log('[Conversion Pixel Warning] Duplicate conversion detected - order_id already exists', {
            existing_id: existingConversion.id,
            order_id: finalOrderId,
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
    
    if (finalOrderId) {
      conversionData.order_id = finalOrderId;
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
        order_id: finalOrderId || 'none',
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
    const { code, value, visitor_id, order_id } = req.query;

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

    // Check for duplicate conversions (if order_id provided)
    if (order_id) {
      try {
        const existingConversion = await Conversion.findOne({
          where: {
            link_id: link.id,
            order_id: order_id
          }
        });
        
        if (existingConversion) {
          console.log('[Conversion GET Warning] Duplicate conversion detected - order_id already exists', {
            existing_id: existingConversion.id,
            order_id: order_id,
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

    // Record conversion
    // Only include order_id if it's provided (don't send null explicitly)
    const conversionData = {
      link_id: link.id,
      order_value: parsedOrderValue
    };
    
    if (order_id) {
      conversionData.order_id = order_id;
    }
    
    let conversion;
    try {
      conversion = await Conversion.create(conversionData);
    } catch (createError) {
      // If order_id field doesn't exist, try without it
      if (createError.message && createError.message.includes('order_id')) {
        console.warn('[Conversion GET Warning] order_id field not available, creating without it:', createError.message);
        delete conversionData.order_id;
        conversion = await Conversion.create(conversionData);
      } else {
        throw createError;
      }
    }

    // Log for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[Conversion Tracked via GET]', {
        link_id: link.id,
        unique_code: code,
        order_value: parsedOrderValue,
        order_id: order_id || 'none'
      });
    }

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

export default router;