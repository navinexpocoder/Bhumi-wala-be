const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

/**
 * Socket.IO Authentication Middleware
 * Verifies JWT token from socket handshake
 */
module.exports = (socket, next) => {
  try {
    // Get token from auth header or query
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      logger.warn(`Socket connection attempted without token [${socket.id}]`);
      return next(new Error('Authentication token required'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Attach user info to socket
    socket.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    logger.info(`✓ Socket authenticated for user ${decoded.email}`);
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn(`Socket auth failed: Token expired [${socket.id}]`);
      return next(new Error('Token expired'));
    }
    if (error.name === 'JsonWebTokenError') {
      logger.warn(`Socket auth failed: Invalid token [${socket.id}]`);
      return next(new Error('Invalid token'));
    }
    logger.error(`Socket auth error: ${error.message}`);
    next(error);
  }
};
