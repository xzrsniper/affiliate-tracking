import express from 'express';
import crypto from 'crypto';
import { User } from '../models/index.js';
import { generateToken, setAuthCookie, clearAuthCookie } from '../utils/jwt.js';
import { authenticate } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { hashToken } from '../utils/crypto.js';
import {
  hashPassword,
  verifyPassword,
  validateNewPassword,
  findUserBySecretToken,
  MIN_PASSWORD_LENGTH
} from '../utils/password.js';
import { sendVerificationEmail, sendPasswordChangeConfirmationEmail, sendPasswordResetEmail, addSubscriberToSendPulse } from '../services/email.js';

const router = express.Router();

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_CHANGE_TOKEN_TTL_MS = 60 * 60 * 1000;   // 1 hour
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;    // 1 hour

const authBurstLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, prefix: 'auth' });
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, prefix: 'login' });
const registerLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 8, prefix: 'register' });
const resetLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, prefix: 'reset' });

function publicUser(user, extra = {}) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    link_limit: user.link_limit,
    affiliate_commission_percent: user.affiliate_commission_percent,
    affiliate_balance: user.affiliate_balance,
    is_banned: user.is_banned,
    has_password: !!user.password_hash,
    ...extra
  };
}

function issueSession(res, user) {
  const token = generateToken(user.id);
  setAuthCookie(res, token);
  return token;
}

function newSecretToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function googleUserFromIdToken(idToken) {
  const tokenInfoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!tokenInfoResponse.ok) {
    throw Object.assign(new Error('Invalid Google idToken'), { status: 401 });
  }
  const googleUser = await tokenInfoResponse.json();
  const expectedAud = (
    process.env.GOOGLE_CLIENT_ID_PUBLIC ||
    process.env.GOOGLE_CLIENT_ID ||
    process.env.VITE_GOOGLE_CLIENT_ID ||
    ''
  ).trim();
  if (expectedAud && googleUser.aud && googleUser.aud !== expectedAud) {
    throw Object.assign(new Error('Invalid Google idToken audience'), { status: 401 });
  }
  return {
    sub: String(googleUser.sub || googleUser.user_id || ''),
    email: String(googleUser.email || ''),
    name: googleUser.name || null,
    picture: googleUser.picture || null
  };
}

async function googleUserFromAccessToken(accessToken) {
  const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!userInfoResponse.ok) {
    throw Object.assign(new Error('Invalid Google access token'), { status: 401 });
  }
  const userInfoData = await userInfoResponse.json();
  return {
    sub: String(userInfoData.id || userInfoData.sub || ''),
    email: String(userInfoData.email || ''),
    name: userInfoData.name || null,
    picture: userInfoData.picture || null
  };
}

router.post('/google', authBurstLimit, async (req, res, next) => {
  try {
    const { idToken, accessToken } = req.body || {};

    let googleUser;
    if (idToken) {
      googleUser = await googleUserFromIdToken(idToken);
    } else if (accessToken) {
      googleUser = await googleUserFromAccessToken(accessToken);
    } else {
      return res.status(400).json({ error: 'Google access token or id token is required' });
    }

    if (!googleUser.sub || !googleUser.email) {
      return res.status(400).json({ error: 'Failed to get user information from Google' });
    }

    let user = await User.findOne({ where: { google_id: googleUser.sub } });

    if (!user) {
      user = await User.findOne({ where: { email: googleUser.email } });

      if (user) {
        user.google_id = googleUser.sub;
        user.email_verified = true;
        user.email_verification_token = null;
        user.email_verification_expires_at = null;
        await user.save();
      } else {
        user = await User.create({
          email: googleUser.email,
          password_hash: null,
          google_id: googleUser.sub,
          role: 'user',
          link_limit: 3,
          is_banned: false,
          email_verified: true
        });

        addSubscriberToSendPulse(googleUser.email, {
          registration_date: new Date().toISOString(),
          auth_method: 'google'
        }).catch((err) => {
          console.error('SendPulse subscriber add failed (non-blocking):', err);
        });
      }
    }

    if (user.is_banned) {
      return res.status(403).json({ error: 'Account is banned' });
    }

    const token = issueSession(res, user);
    res.json({
      message: 'Google login successful',
      token,
      user: publicUser(user)
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Google OAuth error');
    next(error);
  }
});

router.post('/register', registerLimit, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const passwordError = validateNewPassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await hashPassword(password);
    const verificationToken = newSecretToken();
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

    const user = await User.create({
      email,
      password_hash,
      role: 'user',
      link_limit: 3,
      is_banned: false,
      email_verified: false,
      email_verification_token: hashToken(verificationToken),
      email_verification_expires_at: expiresAt
    });

    const lang = (req.body.lang || req.headers['accept-language'] || '').startsWith('en') ? 'en' : 'uk';
    const sendResult = await sendVerificationEmail(email, verificationToken, lang);

    if (!sendResult.ok) {
      console.error('Verification email send failed:', sendResult.error);
    }

    addSubscriberToSendPulse(email, { registration_date: new Date().toISOString() }).catch((err) => {
      console.error('SendPulse subscriber add failed (non-blocking):', err);
    });

    res.status(201).json({
      message: 'Check your email to verify your account',
      needVerification: true,
      email: user.email
    });
  } catch (error) {
    next(error);
  }
});

router.get('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'Token is required', code: 'MISSING_TOKEN' });
    }

    const user = await findUserBySecretToken(User, 'email_verification_token', token);
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired link', code: 'INVALID_TOKEN' });
    }
    if (user.email_verification_expires_at && new Date() > user.email_verification_expires_at) {
      return res.status(400).json({ error: 'Verification link expired', code: 'EXPIRED_TOKEN' });
    }

    user.email_verified = true;
    user.email_verification_token = null;
    user.email_verification_expires_at = null;
    await user.save();

    const jwtToken = issueSession(res, user);
    res.json({
      success: true,
      message: 'Email verified',
      token: jwtToken,
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
});

router.post('/resend-verification', resetLimit, async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.json({ success: true, message: 'If the email exists, a verification link has been sent' });
    }
    if (user.email_verified) {
      return res.json({ success: true, message: 'Email already verified' });
    }
    if (!user.password_hash) {
      return res.status(400).json({ error: 'Please sign in with Google' });
    }

    const verificationToken = newSecretToken();
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
    user.email_verification_token = hashToken(verificationToken);
    user.email_verification_expires_at = expiresAt;
    await user.save();

    const lang = (req.body.lang || req.headers['accept-language'] || '').startsWith('en') ? 'en' : 'uk';
    const sendResult = await sendVerificationEmail(email, verificationToken, lang);

    if (!sendResult.ok) {
      return res.status(500).json({ error: 'Failed to send email. Try again later.' });
    }
    res.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    next(error);
  }
});

router.post('/login', loginLimit, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    if (!user.password_hash) {
      return res.status(401).json({ error: 'Please sign in with Google', code: 'USE_GOOGLE_LOGIN' });
    }

    if (user.is_banned) {
      return res.status(403).json({ error: 'Account is banned', code: 'ACCOUNT_BANNED' });
    }

    if (!user.email_verified) {
      return res.status(403).json({
        error: 'Please verify your email before signing in',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const token = issueSession(res, user);
    res.json({
      message: 'Login successful',
      token,
      user: publicUser(user, { has_password: true })
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'email', 'role', 'link_limit', 'affiliate_commission_percent', 'affiliate_balance', 'is_banned', 'email_verified', 'created_at', 'password_hash']
  });
  res.json({
    user: publicUser(user || req.user, {
      email_verified: (user || req.user).email_verified,
      created_at: (user || req.user).created_at
    })
  });
});

router.put('/set-password', authenticate, async (req, res, next) => {
  try {
    const { new_password } = req.body || {};

    const passwordError = validateNewPassword(new_password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.password_hash) {
      return res.status(400).json({ error: 'Account already has a password. Use change-password instead.', code: 'USE_CHANGE_PASSWORD' });
    }

    user.password_hash = await hashPassword(new_password);
    await user.save();

    res.json({ success: true, message: 'Password set successfully' });
  } catch (error) {
    next(error);
  }
});

router.put('/change-password', authenticate, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body || {};

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    const passwordError = validateNewPassword(new_password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!user.password_hash) {
      return res.status(400).json({ error: 'Please sign in with Google or set a password first' });
    }

    const isValid = await verifyPassword(current_password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const pending_hash = await hashPassword(new_password);
    const token = newSecretToken();
    const expiresAt = new Date(Date.now() + PASSWORD_CHANGE_TOKEN_TTL_MS);

    user.pending_password_hash = pending_hash;
    user.password_change_token = hashToken(token);
    user.password_change_expires_at = expiresAt;
    await user.save();

    const lang = (req.body.lang || req.headers['accept-language'] || '').startsWith('en') ? 'en' : 'uk';
    const sendResult = await sendPasswordChangeConfirmationEmail(user.email, token, lang);

    if (!sendResult.ok) {
      console.error('Password change confirmation email failed:', sendResult.error);
      user.pending_password_hash = null;
      user.password_change_token = null;
      user.password_change_expires_at = null;
      await user.save();
      return res.status(500).json({ error: 'Failed to send confirmation email. Try again later.' });
    }

    res.json({
      success: true,
      needConfirmation: true,
      message: 'Check your email to confirm the password change'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/confirm-password-change', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'Token is required', code: 'MISSING_TOKEN' });
    }

    const user = await findUserBySecretToken(User, 'password_change_token', token);
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired link', code: 'INVALID_TOKEN' });
    }
    if (user.password_change_expires_at && new Date() > user.password_change_expires_at) {
      return res.status(400).json({ error: 'Confirmation link expired', code: 'EXPIRED_TOKEN' });
    }
    if (!user.pending_password_hash) {
      return res.status(400).json({ error: 'Invalid or already used link', code: 'INVALID_TOKEN' });
    }

    user.password_hash = user.pending_password_hash;
    user.pending_password_hash = null;
    user.password_change_token = null;
    user.password_change_expires_at = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/forgot-password', resetLimit, async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ where: { email } });

    if (user && user.password_hash) {
      const resetToken = newSecretToken();
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

      user.password_reset_token = hashToken(resetToken);
      user.password_reset_expires_at = expiresAt;
      await user.save();

      const lang = (req.body.lang || req.headers['accept-language'] || '').startsWith('en') ? 'en' : 'uk';
      const sendResult = await sendPasswordResetEmail(email, resetToken, lang);

      if (!sendResult.ok) {
        console.error('Password reset email send failed:', sendResult.error);
      }
    }

    res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    next(error);
  }
});

router.post('/reset-password', resetLimit, async (req, res, next) => {
  try {
    const { token, new_password } = req.body || {};
    if (!token || !new_password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    const passwordError = validateNewPassword(new_password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const user = await findUserBySecretToken(User, 'password_reset_token', token);

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired link', code: 'INVALID_TOKEN' });
    }

    if (user.password_reset_expires_at && new Date() > user.password_reset_expires_at) {
      return res.status(400).json({ error: 'Reset link expired', code: 'EXPIRED_TOKEN' });
    }

    user.password_hash = await hashPassword(new_password);
    user.password_reset_token = null;
    user.password_reset_expires_at = null;
    user.email_verified = true;
    user.email_verification_token = null;
    user.email_verification_expires_at = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
});

export { MIN_PASSWORD_LENGTH };
export default router;
