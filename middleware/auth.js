import { User } from '../models/index.js';
import { getRequestToken, verifyToken } from '../utils/jwt.js';
import { SENSITIVE_USER_ATTRIBUTES } from '../utils/password.js';

function isAdminApiRequest(req) {
  const url = (req.originalUrl || req.url || '').split('?')[0];
  return url.startsWith('/api/admin');
}

async function loadUserFromToken(req) {
  const token = getRequestToken(req);
  if (!token) return { error: 'No token provided', status: 401 };

  const decoded = verifyToken(token);
  const includeSensitive = isAdminApiRequest(req);

  const user = await User.findByPk(decoded.userId, {
    attributes: includeSensitive ? undefined : { exclude: SENSITIVE_USER_ATTRIBUTES }
  });

  if (!user) return { error: 'User not found', status: 401 };
  if (user.is_banned) return { error: 'Account is banned', status: 403 };

  return { user, decoded };
}

export const authenticate = async (req, res, next) => {
  try {
    const result = await loadUserFromToken(req);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    req.user = result.user;
    req.auth = result.decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication error' });
  }
};

export const requireSuperAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Access denied. Super admin required.' });
  }

  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'email', 'password_hash', 'role']
  });

  if (!user || !user.password_hash) {
    return res.status(403).json({
      error: 'Access denied. Admin panel is only accessible to users registered via email, not Google OAuth.'
    });
  }

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  if (ADMIN_EMAIL && user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({
      error: 'Access denied. Admin panel is only accessible to the owner.'
    });
  }

  next();
};

export const requireAdminOrAbove = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role === 'super_admin') {
    return requireSuperAdmin(req, res, next);
  }

  if (req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({ error: 'Access denied. Admin role required.' });
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = getRequestToken(req);
    if (!token) return next();

    try {
      const decoded = verifyToken(token);
      try {
        const user = await User.findByPk(decoded.userId, {
          attributes: { exclude: SENSITIVE_USER_ATTRIBUTES }
        });
        if (user && !user.is_banned) {
          req.user = user;
          req.auth = decoded;
        }
      } catch (dbError) {
        if (
          dbError.name === 'SequelizeConnectionError' ||
          dbError.name === 'SequelizeDatabaseError' ||
          dbError.message?.includes('database')
        ) {
          console.warn('⚠️  Database not available in optionalAuth, continuing without user');
        } else {
          throw dbError;
        }
      }
    } catch {
      // invalid/expired token — continue as anonymous
    }
    next();
  } catch {
    next();
  }
};
