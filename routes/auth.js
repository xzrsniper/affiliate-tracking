import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { generateToken } from '../utils/jwt.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Google OAuth Login
router.post('/google', async (req, res, next) => {
  try {
    // Логуємо весь request для діагностики
    console.log('═══════════════════════════════════════════════════════');
    console.log('📥 POST /api/auth/google - Request received');
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
    console.log('📥 Request body type:', typeof req.body);
    console.log('📥 Request body is null?', req.body === null);
    console.log('📥 Request body is undefined?', req.body === undefined);
    console.log('📥 Request body keys:', Object.keys(req.body || {}));
    console.log('📥 Request headers content-type:', req.headers['content-type']);
    console.log('═══════════════════════════════════════════════════════');
    
    // Перевіряємо, чи body порожній
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('❌ Request body is empty or null!');
      return res.status(400).json({ 
        error: 'Request body is empty',
        debug: {
          bodyIsNull: req.body === null,
          bodyIsUndefined: req.body === undefined,
          bodyType: typeof req.body,
          bodyKeys: Object.keys(req.body || {})
        }
      });
    }
    
    const { idToken, userInfo, googleId, accessToken } = req.body;

    console.log('📥 Extracted values:', {
      hasIdToken: !!idToken,
      hasUserInfo: !!userInfo,
      hasAccessToken: !!accessToken,
      userInfoType: typeof userInfo,
      userInfoIsObject: userInfo && typeof userInfo === 'object',
      userInfoIsArray: Array.isArray(userInfo),
      userInfoKeys: userInfo && typeof userInfo === 'object' && !Array.isArray(userInfo) ? Object.keys(userInfo) : null,
      userInfoValue: userInfo
    });

    let googleUser;

    // Якщо є userInfo (з OAuth2 flow), використовуємо його напряму
    // Це найнадійніший спосіб, оскільки userInfo вже отримано на frontend
    if (userInfo && typeof userInfo === 'object' && !Array.isArray(userInfo) && Object.keys(userInfo).length > 0) {
      console.log('🔍 Checking userInfo:', JSON.stringify(userInfo, null, 2));
      const userId = userInfo.id || userInfo.sub;
      const userEmail = userInfo.email;
      
      console.log('🔍 userId:', userId, 'userEmail:', userEmail);
      
      if (userId || userEmail) {
        googleUser = {
          sub: String(userId || userEmail), // Переконуємося, що це рядок
          email: String(userEmail || ''),
          name: userInfo.name || null,
          picture: userInfo.picture || null
        };
        console.log('✅ Using userInfo from request. Email:', googleUser.email, 'Sub:', googleUser.sub);
      } else {
        console.error('❌ userInfo provided but missing id/sub/email. Full userInfo:', JSON.stringify(userInfo, null, 2));
        return res.status(400).json({ error: 'userInfo must contain id, sub, or email field', received: userInfo });
      }
    }
    // Якщо є accessToken (з OAuth2 Token Client), отримуємо userInfo на backend
    else if (accessToken) {
      try {
        console.log('📡 Fetching userInfo from Google API using accessToken...');
        // Отримуємо userInfo через access token
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        
        if (userInfoResponse.ok) {
          const userInfoData = await userInfoResponse.json();
          googleUser = {
            sub: userInfoData.id,
            email: userInfoData.email,
            name: userInfoData.name,
            picture: userInfoData.picture
          };
          console.log('✅ UserInfo retrieved from Google API:', googleUser.email);
        } else {
          const errorText = await userInfoResponse.text();
          console.error('❌ Failed to get userInfo from Google API:', errorText);
          return res.status(401).json({ error: 'Invalid Google access token' });
        }
      } catch (fetchError) {
        console.error('❌ Google token verification error:', fetchError);
        return res.status(401).json({ error: 'Failed to verify Google token' });
      }
    }
    // Якщо є idToken (з Google Sign-In), перевіряємо його
    else if (idToken) {
      try {
        console.log('📡 Verifying idToken with Google...');
        const tokenInfoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        
        if (tokenInfoResponse.ok) {
          googleUser = await tokenInfoResponse.json();
          console.log('✅ idToken verified:', googleUser.email);
        } else {
          console.error('❌ Failed to verify idToken');
          return res.status(401).json({ error: 'Invalid Google idToken' });
        }
      } catch (fetchError) {
        console.error('❌ Google token verification error:', fetchError);
        return res.status(401).json({ error: 'Failed to verify Google token' });
      }
    } else {
      console.error('❌ No valid Google token or userInfo provided.');
      console.error('❌ Full request body:', JSON.stringify(req.body, null, 2));
      console.error('❌ Request headers content-type:', req.headers['content-type']);
      return res.status(400).json({ 
        error: 'Google access token, id token, or userInfo is required',
        debug: {
          hasIdToken: !!idToken,
          hasUserInfo: !!userInfo,
          hasAccessToken: !!accessToken,
          bodyKeys: Object.keys(req.body || {}),
          bodyType: typeof req.body,
          bodyString: JSON.stringify(req.body)
        }
      });
    }

    // Перевірка, чи отримано googleUser
    if (!googleUser || !googleUser.sub || !googleUser.email) {
      console.error('❌ Invalid googleUser data:', googleUser);
      return res.status(400).json({ error: 'Failed to get user information from Google' });
    }

      // Check if user exists by Google ID
      let user = await User.findOne({ where: { google_id: googleUser.sub } });

      if (!user) {
        // Check if user exists by email (in case they registered with email first)
        user = await User.findOne({ where: { email: googleUser.email } });
        
        if (user) {
          // Link Google account to existing user
          user.google_id = googleUser.sub;
          await user.save();
        } else {
          // Create new user
          user = await User.create({
            email: googleUser.email,
            password_hash: null, // No password for Google OAuth users
            google_id: googleUser.sub,
            role: 'user',
            link_limit: 3,
            is_banned: false
          });
        }
      }

      // Check if banned
      if (user.is_banned) {
        return res.status(403).json({ error: 'Account is banned' });
      }

      // Generate token
      const token = generateToken(user.id);

      res.json({
        message: 'Google login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          link_limit: user.link_limit,
          is_banned: user.is_banned
        }
      });
  } catch (error) {
    console.error('Google OAuth error:', error);
    next(error);
  }
});

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      password_hash,
      role: 'user',
      link_limit: 3, // Default limit
      is_banned: false
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        link_limit: user.link_limit,
        is_banned: user.is_banned
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user has password (not Google-only user)
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Please sign in with Google' });
    }

    // Check if banned
    if (user.is_banned) {
      return res.status(403).json({ error: 'Account is banned' });
    }

    // Verify password - ensure password_hash is a string
    const passwordHashStr = String(user.password_hash || '');
    if (!passwordHashStr) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isValid = await bcrypt.compare(String(password), passwordHashStr);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        link_limit: user.link_limit,
        is_banned: user.is_banned
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      link_limit: req.user.link_limit,
      is_banned: req.user.is_banned,
      created_at: req.user.created_at
    }
  });
});

// Change password
router.put('/change-password', authenticate, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Get user with password hash
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has a password (not Google OAuth only user)
    if (!user.password_hash) {
      return res.status(400).json({ error: 'Please sign in with Google or set a password first' });
    }

    // Ensure current_password is a string
    const currentPasswordStr = String(current_password || '');
    const passwordHashStr = String(user.password_hash || '');

    // Verify current password
    const isValid = await bcrypt.compare(currentPasswordStr, passwordHashStr);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Ensure new_password is a string
    const newPasswordStr = String(new_password || '');

    // Hash new password
    const password_hash = await bcrypt.hash(newPasswordStr, 10);

    // Update password
    user.password_hash = password_hash;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
