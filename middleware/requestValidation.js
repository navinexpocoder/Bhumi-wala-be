/**
 * Request Validation Middleware
 * Sanitizes and validates incoming request data
 */

const { sanitizeInput } = require('../utils/helpers');
const ResponseFormatter = require('../utils/responseFormatter');

/**
 * Sanitize request body - removes dangerous characters
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
const sanitizeRequestBody = (req, res, next) => {
  try {
    if (req.body && typeof req.body === 'object') {
      for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
          req.body[key] = sanitizeInput(req.body[key]);
        }
      }
    }
    next();
  } catch (error) {
    console.error('Sanitization error:', error);
    ResponseFormatter.serverError(res, 'Error processing request', error.message);
  }
};

/**
 * Validate request has required fields
 * @param {array} requiredFields - Array of field names that must be present
 * @returns {function} Middleware function
 */
const validateRequiredFields = (requiredFields) => {
  return (req, res, next) => {
    const errors = [];

    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        errors.push(`${field} is required`);
      }
    }

    if (errors.length > 0) {
      return ResponseFormatter.validationError(res, errors);
    }

    next();
  };
};

/**
 * Validate request query parameters
 * @param {object} rules - Validation rules { fieldName: { type: 'string', min: 3 } }
 * @returns {function} Middleware function
 */
const validateQueryParams = (rules) => {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rule] of Object.entries(rules)) {
      const value = req.query[field];

      if (rule.required && (value === undefined || value === '')) {
        errors.push(`Query parameter '${field}' is required`);
        continue;
      }

      if (value !== undefined && value !== '') {
        if (rule.type === 'number') {
          if (isNaN(value)) {
            errors.push(`Query parameter '${field}' must be a number`);
          }
        }

        if (rule.type === 'email') {
          const emailRegex = /^\S+@\S+\.\S+$/;
          if (!emailRegex.test(value)) {
            errors.push(`Query parameter '${field}' must be a valid email`);
          }
        }

        if (rule.min !== undefined && value.length < rule.min) {
          errors.push(`Query parameter '${field}' must be at least ${rule.min} characters`);
        }

        if (rule.max !== undefined && value.length > rule.max) {
          errors.push(`Query parameter '${field}' must be at most ${rule.max} characters`);
        }
      }
    }

    if (errors.length > 0) {
      return ResponseFormatter.validationError(res, errors);
    }

    next();
  };
};

/**
 * Prevent MIME type attacks - validate Content-Type
 * @param {array} allowedTypes - Allowed MIME types (e.g., ['application/json'])
 * @returns {function} Middleware function
 */
const checkContentType = (allowedTypes = ['application/json']) => {
  return (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'DELETE' && req.body) {
      const contentType = req.get('Content-Type');

      if (!contentType || !allowedTypes.some((type) => contentType.includes(type))) {
        return ResponseFormatter.validationError(
          res,
          `Content-Type must be one of: ${allowedTypes.join(', ')}`
        );
      }
    }

    next();
  };
};

/**
 * Rate limiting helper (basic implementation)
 * For production, use express-rate-limit package
 * @param {number} maxRequests - Max requests per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {function} Middleware function
 */
const createRateLimiter = (maxRequests = 100, windowMs = 60000) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = `${req.ip}-${req.path}`;
    const now = Date.now();
    const userRequests = requests.get(key) || [];

    // Remove old requests outside window
    const recentRequests = userRequests.filter((time) => now - time < windowMs);

    if (recentRequests.length >= maxRequests) {
      return ResponseFormatter.error(
        res,
        `Too many requests. Please try again in ${Math.ceil(windowMs / 1000)} seconds`,
        429
      );
    }

    recentRequests.push(now);
    requests.set(key, recentRequests);

    next();
  };
};

module.exports = {
  sanitizeRequestBody,
  validateRequiredFields,
  validateQueryParams,
  checkContentType,
  createRateLimiter,
};
