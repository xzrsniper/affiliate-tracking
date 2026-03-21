/**
 * Shared tracking redirect: record click + 302 to original_url with ref & click_id.
 * Used by GET /r/:code, GET /track/:code, and GET /api/links/go/:code (SPA / Nginx fallback).
 */
import { Link, Click } from '../models/index.js';
import { getVisitorFingerprint, getClientIP } from './fingerprint.js';
import { Op } from 'sequelize';

export async function runTrackingRedirect(req, res, unique_code) {
  const link = await Link.findOne({ where: { unique_code } });

  if (!link) {
    res.status(404).send('Link not found');
    return;
  }

  const visitorFingerprint = getVisitorFingerprint(req);
  const ipAddress = getClientIP(req);
  let clickId = null;

  try {
    const veryRecentClick = await Click.findOne({
      where: {
        link_id: link.id,
        visitor_fingerprint: visitorFingerprint,
        created_at: {
          [Op.gte]: new Date(Date.now() - 1000)
        }
      },
      order: [['created_at', 'DESC']]
    });

    if (!veryRecentClick) {
      const newClick = await Click.create({
        link_id: link.id,
        visitor_fingerprint: visitorFingerprint,
        ip_address: ipAddress
      });
      clickId = newClick.id;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Tracking] ✅ Click tracked: link ${link.id}, click_id: ${newClick.id}`);
      }
    } else {
      clickId = veryRecentClick.id;
      if (process.env.NODE_ENV === 'development') {
        const timeDiff = Date.now() - new Date(veryRecentClick.created_at).getTime();
        console.log(`[Tracking] ⚠️ Duplicate click prevented (within ${timeDiff}ms)`);
      }
    }
  } catch (trackError) {
    console.error('Tracking error:', trackError);
  }

  const cookieOpts = {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 30 * 60 * 1000,
    path: '/'
  };
  res.cookie('aff_ref_code', unique_code, cookieOpts);

  try {
    const targetUrl = new URL(link.original_url);
    targetUrl.searchParams.set('ref', unique_code);
    if (clickId) {
      targetUrl.searchParams.set('click_id', clickId.toString());
    }
    res.redirect(302, targetUrl.toString());
  } catch (urlError) {
    const separator = link.original_url.includes('?') ? '&' : '?';
    let redirectUrl = link.original_url + separator + 'ref=' + encodeURIComponent(unique_code);
    if (clickId) {
      redirectUrl += '&click_id=' + clickId.toString();
    }
    res.redirect(302, redirectUrl);
  }
}
