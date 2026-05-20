/**
 * Shared tracking redirect: record click + 302 to destination with ref & click_id.
 * Supports A/B split-test variants when link.split_enabled.
 */
import { Link, Click } from '../models/index.js';
import { getVisitorFingerprint, getClientIP } from './fingerprint.js';
import { resolveSplitDestination } from './splitTest.js';
import { Op } from 'sequelize';

function appendRefParams(baseUrl, unique_code, clickId) {
  try {
    const targetUrl = new URL(baseUrl);
    targetUrl.searchParams.set('ref', unique_code);
    if (clickId) {
      targetUrl.searchParams.set('click_id', clickId.toString());
    }
    return targetUrl.toString();
  } catch {
    const separator = baseUrl.includes('?') ? '&' : '?';
    let redirectUrl = baseUrl + separator + 'ref=' + encodeURIComponent(unique_code);
    if (clickId) {
      redirectUrl += '&click_id=' + clickId.toString();
    }
    return redirectUrl;
  }
}

export async function runTrackingRedirect(req, res, unique_code) {
  const link = await Link.findOne({ where: { unique_code } });

  if (!link) {
    res.status(404).send('Link not found');
    return;
  }

  const split = await resolveSplitDestination(link);
  const destinationBase = split.destinationUrl || link.original_url;

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
        variant_id: split.variantId || null,
        visitor_fingerprint: visitorFingerprint,
        ip_address: ipAddress
      });
      clickId = newClick.id;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Tracking] ✅ Click tracked: link ${link.id}, variant ${split.variantId || '—'}, click_id: ${newClick.id}`);
      }
    } else {
      clickId = veryRecentClick.id;
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
  if (split.variantId) {
    res.cookie(`aff_variant_${link.id}`, String(split.variantId), cookieOpts);
  }

  res.redirect(302, appendRefParams(destinationBase, unique_code, clickId));
}
