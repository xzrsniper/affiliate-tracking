import express from 'express';
import { Link, Click } from '../models/index.js';
import { getVisitorFingerprint, getClientIP } from '../utils/fingerprint.js';
import { Op } from 'sequelize';

const router = express.Router();

// Redirect tracking link
router.get('/:unique_code', async (req, res, next) => {
  try {
    const { unique_code } = req.params;

    // Find link by unique code
    const link = await Link.findOne({ where: { unique_code } });
    
    if (!link) {
      return res.status(404).send('Link not found');
    }

    // Track the click (PRIMARY tracking point)
    const visitorFingerprint = getVisitorFingerprint(req);
    const ipAddress = getClientIP(req);

    try {
      // Check if this exact click was already recorded (prevent duplicates)
      // Check for same visitor + link combination within last 10 seconds
      const recentClick = await Click.findOne({
        where: {
          link_id: link.id,
          visitor_fingerprint: visitorFingerprint,
          created_at: {
            [Op.gte]: new Date(Date.now() - 10000) // Within last 10 seconds
          }
        },
        order: [['created_at', 'DESC']]
      });

      // Only create if not a duplicate (same visitor + link within 10 seconds)
      // This prevents double-counting from:
      // - Rapid multiple clicks
      // - Browser refresh
      // - Both redirect.js and track.js trying to record (though track.js no longer creates)
      if (!recentClick) {
        await Click.create({
          link_id: link.id,
          visitor_fingerprint: visitorFingerprint,
          ip_address: ipAddress
        });
      } else {
        // Log duplicate attempt (for debugging)
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Tracking] Duplicate click prevented for link ${link.id}, visitor ${visitorFingerprint.substring(0, 20)}...`);
        }
      }
    } catch (trackError) {
      // Don't fail redirect if tracking fails, just log it
      console.error('Tracking error:', trackError);
    }

    // Set cookie with tracking code for cookie-based conversion tracking
    // This allows tracking conversions even without tracker.js on client site
    const cookieOptions = {
      httpOnly: false, // Allow JavaScript access (for flexibility)
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'Lax', // Allow cross-site requests
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    };
    
    // Get root domain for cookie sharing (if not localhost)
    let cookieDomain = null;
    if (process.env.COOKIE_DOMAIN) {
      cookieDomain = process.env.COOKIE_DOMAIN;
    }
    
    // Set cookie with tracking code
    res.cookie('aff_ref_code', unique_code, cookieOptions);
    
    // Set cookie with tracking code for cookie-based conversion tracking (NO CODE NEEDED!)
    // This cookie will be used by /api/track/conversion-pixel endpoint
    // Cookie expires in 30 days
    res.cookie('aff_ref_code', unique_code, {
      httpOnly: false, // Allow JavaScript access (for flexibility)
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'Lax', // Allow cross-site requests
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/'
    });

    // Redirect to original URL with ref parameter (for conversion tracking)
    try {
      const targetUrl = new URL(link.original_url);
      // Add ref parameter so tracker.js can track conversions
      targetUrl.searchParams.set('ref', unique_code);
      res.redirect(302, targetUrl.toString());
    } catch (urlError) {
      // If URL parsing fails, try simple string append
      const separator = link.original_url.includes('?') ? '&' : '?';
      res.redirect(302, link.original_url + separator + 'ref=' + encodeURIComponent(unique_code));
    }
  } catch (error) {
    next(error);
  }
});

export default router;
