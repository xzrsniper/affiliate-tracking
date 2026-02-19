import { TrackerVerification } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Check if Lehko Track is installed on a domain.
 * Used by: Setup (websites), Dashboard (links code_connected).
 * 1. Verification ping (TrackerVerification) - primary
 * 2. HTML scrape for tracker indicators - fallback
 */
export async function checkTrackerInstallation(domain) {
  if (!domain) return false;

  const normalizedDomain = domain.replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase().split('/')[0];

  const isLocalhost = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(normalizedDomain);
  if (isLocalhost) return false;

  try {
    const domainsToCheck = [normalizedDomain];
    if (!normalizedDomain.startsWith('www.')) domainsToCheck.push('www.' + normalizedDomain);
    else domainsToCheck.push(normalizedDomain.replace(/^www\./, ''));
    
    // Check verification ping (last 10 minutes)
    const recentVerification = await TrackerVerification.findOne({
      where: {
        domain: { [Op.in]: domainsToCheck },
        last_seen: { [Op.gte]: new Date(Date.now() - 10 * 60 * 1000) }
      },
      order: [['last_seen', 'DESC']]
    });
    if (recentVerification) {
      console.log('[Tracker Check] Found verification ping for domain:', normalizedDomain);
      return true;
    }
    
    // Also check if any website with this domain is marked as connected
    const { Website } = await import('../models/index.js');
    const website = await Website.findOne({
      where: {
        domain: { [Op.in]: domainsToCheck },
        is_connected: true
      }
    });
    if (website) {
      console.log('[Tracker Check] Found connected website for domain:', normalizedDomain);
      return true;
    }
  } catch (e) {
    console.error('[Tracker Check Error]', e);
  }

  const clean = domain.replace(/^https?:\/\//i, '').replace(/\/+$/, '').split('/')[0];
  const urls = [`https://${clean}`, `http://${clean}`];
  const trackerIndicators = [
    'pixel.js', 'LehkoTrack', 'window.LehkoTrack', 'api/track', 'BASE_URL',
    '_lehkoPixelInit'
  ];

  for (const url of urls) {
    let timeoutId = null;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LehkoTrack/1.0)', 'Accept': 'text/html,*/*' }
      });
      if (timeoutId) clearTimeout(timeoutId);
      if (!response.ok) continue;
      const html = (await response.text()).toLowerCase();
      const found = trackerIndicators.some(ind => html.includes(ind.toLowerCase()));
      if (found) return true;
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }
  return false;
}
