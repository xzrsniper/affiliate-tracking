import express from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth.js';
import { User } from '../models/index.js';

const router = express.Router();

function getRedirectUri(req) {
  if (process.env.GOOGLE_SHEETS_OAUTH_REDIRECT_URI) {
    return process.env.GOOGLE_SHEETS_OAUTH_REDIRECT_URI;
  }
  // Must match exactly what you put in Google Cloud Console.
  return `${req.protocol}://${req.get('host')}/api/google-sheets/oauth/callback`;
}

function getFrontendUrl(req) {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;
  return `${req.protocol}://${req.get('host')}`;
}

router.get('/status', authenticate, async (req, res) => {
  res.json({
    connected: !!req.user.google_sheets_refresh_token,
    connected_at: req.user.google_sheets_connected_at || null,
    email: req.user.google_sheets_email || null
  });
});

// Disconnect (clear user's refresh token)
router.post('/disconnect', authenticate, async (req, res) => {
  req.user.google_sheets_refresh_token = null;
  req.user.google_sheets_connected_at = null;
  req.user.google_sheets_email = null;
  await req.user.save();

  res.json({ success: true });
});

// Create Google auth URL for the current user
router.get('/connect', authenticate, async (req, res) => {
  let google;
  try {
    ({ google } = await import('googleapis'));
  } catch (importError) {
    return res.status(500).json({
      error: 'Google Sheets module is not available on this server. Run npm install and restart API.'
    });
  }

  const clientId = process.env.GOOGLE_SHEETS_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_SHEETS_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(500).json({
      error: 'GOOGLE_SHEETS_OAUTH_NOT_CONFIGURED'
    });
  }

  const redirectUri = getRedirectUri(req);
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  // Signed state to safely identify user in callback without relying on Authorization header.
  const state = jwt.sign(
    { userId: req.user.id },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const scopes = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
    state,
    include_granted_scopes: true
  });

  res.json({ url });
});

// OAuth callback (Google redirects back here)
router.get('/oauth/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      const frontendUrl = getFrontendUrl(req);
      return res.redirect(`${frontendUrl}/settings?googleConnected=0&err=${encodeURIComponent(String(error))}`);
    }

    if (!code || !state) {
      const frontendUrl = getFrontendUrl(req);
      return res.redirect(`${frontendUrl}/settings?googleConnected=0&err=missing_params`);
    }

    let decoded;
    try {
      decoded = jwt.verify(state, process.env.JWT_SECRET);
    } catch {
      const frontendUrl = getFrontendUrl(req);
      return res.redirect(`${frontendUrl}/settings?googleConnected=0&err=invalid_state`);
    }

    const userId = decoded?.userId;
    if (!userId) {
      const frontendUrl = getFrontendUrl(req);
      return res.redirect(`${frontendUrl}/settings?googleConnected=0&err=invalid_user`);
    }

    const user = await User.findByPk(userId);
    if (!user) {
      const frontendUrl = getFrontendUrl(req);
      return res.redirect(`${frontendUrl}/settings?googleConnected=0&err=user_not_found`);
    }

    let google;
    try {
      ({ google } = await import('googleapis'));
    } catch {
      const frontendUrl = getFrontendUrl(req);
      return res.redirect(`${frontendUrl}/settings?googleConnected=0&err=googleapis_missing`);
    }

    const clientId = process.env.GOOGLE_SHEETS_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_SHEETS_OAUTH_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      const frontendUrl = getFrontendUrl(req);
      return res.redirect(`${frontendUrl}/settings?googleConnected=0&err=oauth_not_configured`);
    }

    const redirectUri = getRedirectUri(req);
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const tokenResponse = await oauth2Client.getToken(String(code));
    const refreshToken = tokenResponse?.tokens?.refresh_token;

    if (!refreshToken) {
      const frontendUrl = getFrontendUrl(req);
      return res.redirect(`${frontendUrl}/settings?googleConnected=0&err=no_refresh_token`);
    }

    user.google_sheets_refresh_token = refreshToken;
    user.google_sheets_connected_at = new Date();
    user.google_sheets_email = user.email;
    await user.save();

    const frontendUrl = getFrontendUrl(req);
    return res.redirect(`${frontendUrl}/settings?googleConnected=1`);
  } catch (e) {
    console.error('Google OAuth callback error:', e);
    const frontendUrl = getFrontendUrl(req);
    return res.redirect(`${frontendUrl}/settings?googleConnected=0&err=callback_error`);
  }
});

export default router;

