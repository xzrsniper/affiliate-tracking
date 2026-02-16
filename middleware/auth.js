import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

// Verify JWT token and attach user to request
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // For admin routes, we need password_hash to check if user can access admin panel
    const includePasswordHash = req.path && req.path.startsWith('/api/admin');
    
    const user = await User.findByPk(decoded.userId, {
      attributes: includePasswordHash ? undefined : { exclude: ['password_hash'] }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.is_banned) {
      return res.status(403).json({ error: 'Account is banned' });
    }

    req.user = user;
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

// Check if user is super admin
export const requireSuperAdmin = async (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Access denied. Super admin required.' });
  }
  
  // Check if user has password_hash (registered via email, not Google OAuth)
  // Admin panel is only accessible to users registered via email
  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'email', 'password_hash', 'role']
  });
  
  if (!user || !user.password_hash) {
    return res.status(403).json({ 
      error: 'Access denied. Admin panel is only accessible to users registered via email, not Google OAuth.' 
    });
  }
  
  // Check if user is the owner/client (only one specific email can access admin panel)
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  if (ADMIN_EMAIL && user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({ 
      error: 'Access denied. Admin panel is only accessible to the owner.' 
    });
  }
  
  next();
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Try to get user from database, but don't fail if DB is unavailable
        try {
          const user = await User.findByPk(decoded.userId, {
            attributes: { exclude: ['password_hash'] }
          });

          if (user && !user.is_banned) {
            req.user = user;
          }
        } catch (dbError) {
          // If database is not available, just continue without user
          if (dbError.name === 'SequelizeConnectionError' || dbError.name === 'SequelizeDatabaseError' || dbError.message?.includes('database')) {
            console.warn('⚠️  Database not available in optionalAuth, continuing without user');
          } else {
            // Re-throw if it's not a database error
            throw dbError;
          }
        }
      } catch (tokenError) {
        // Continue without authentication if token is invalid
        // This is expected for optional auth
      }
    }
    next();
  } catch (error) {
    // Continue without authentication on any error
    next();
  }
};
