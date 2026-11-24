const { verifyToken, findUserById } = require('../services/authService');

/**
 * JWT Authentication Middleware
 * Validates 'Authorization: Bearer <token>' header and attaches user to req.user
 */
const protect = async (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided in request header.'
    });
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.'
      });
    }

    const user = await findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.'
      });
    }

    const { password: _, ...userWithoutPass } = user;
    req.user = userWithoutPass;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Invalid token signature.'
    });
  }
};

module.exports = { protect };
