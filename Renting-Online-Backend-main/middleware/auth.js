const jwt = require('jsonwebtoken');
const userModel = require('../models/User');

// Middleware to verify session
const verifySession = async (req, res, next) => {
  try {
    const token = req.cookies.authToken || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        sessionValid: false
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.getUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.',
        sessionValid: false
      });
    }
    
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account has been suspended.',
        sessionValid: false
      });
    }

    // An unverified account must not be able to use the API. This used to be
    // checked at login only, so a session minted anywhere else - registration,
    // a token refresh - sailed straight past the verification gate.
    if (user.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before using your account.',
        sessionValid: false
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token.',
      sessionValid: false
    });
  }
};

// Middleware to verify specific roles (accepts array)
const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Kiểm tra xem role của user có trong allowedRoles không
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        userRole: req.user.role,
        allowedRoles: allowedRoles
      });
    }
    
    next();
  };
};

module.exports = {
  verifySession,
  verifyRole
}