/**
 * Validation Utilities
 * Centralized validation functions to prevent code duplication
 */

const { GEO_CONSTRAINTS, CONSTRAINTS, PROPERTY_TYPES, ROLES } = require('./constants');

/**
 * Validate latitude and longitude coordinates
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {object} { isValid: boolean, error: string }
 */
const validateCoordinates = (latitude, longitude) => {
  const lat = parseFloat(latitude);
  const long = parseFloat(longitude);

  // Check if valid numbers
  if (isNaN(lat) || isNaN(long)) {
    return {
      isValid: false,
      error: 'Latitude and longitude must be valid numbers',
    };
  }

  // Validate latitude range
  if (lat < GEO_CONSTRAINTS.MIN_LATITUDE || lat > GEO_CONSTRAINTS.MAX_LATITUDE) {
    return {
      isValid: false,
      error: `Invalid latitude: ${lat}. Must be between ${GEO_CONSTRAINTS.MIN_LATITUDE} and ${GEO_CONSTRAINTS.MAX_LATITUDE}`,
    };
  }

  // Validate longitude range
  if (long < GEO_CONSTRAINTS.MIN_LONGITUDE || long > GEO_CONSTRAINTS.MAX_LONGITUDE) {
    return {
      isValid: false,
      error: `Invalid longitude: ${long}. Must be between ${GEO_CONSTRAINTS.MIN_LONGITUDE} and ${GEO_CONSTRAINTS.MAX_LONGITUDE}`,
    };
  }

  return {
    isValid: true,
    latitude: lat,
    longitude: long,
  };
};

/**
 * Validate price value
 * @param {number} price 
 * @returns {object} { isValid: boolean, error: string, price: number }
 */
const validatePrice = (price) => {
  const parsedPrice = parseFloat(price);

  if (isNaN(parsedPrice)) {
    return { isValid: false, error: 'Price must be a valid number' };
  }

  if (parsedPrice < 0) {
    return { isValid: false, error: 'Price cannot be negative' };
  }

  return { isValid: true, price: parsedPrice };
};

/**
 * Validate property type
 * @param {string} type 
 * @returns {object} { isValid: boolean, error: string }
 */
const validatePropertyType = (type) => {
  if (!PROPERTY_TYPES.includes(type)) {
    return {
      isValid: false,
      error: `Invalid property type. Allowed types: ${PROPERTY_TYPES.join(', ')}`,
    };
  }
  return { isValid: true };
};

/**
 * Validate radius in kilometers
 * @param {number} radius 
 * @returns {object} { isValid: boolean, error: string, radiusInMeters: number }
 */
const validateRadius = (radius) => {
  const radiusNum = parseFloat(radius);

  if (isNaN(radiusNum) || radiusNum <= 0) {
    return { isValid: false, error: 'Radius must be a positive number' };
  }

  return { isValid: true, radiusInMeters: radiusNum * 1000 };
};

/**
 * Validate pagination parameters
 * @param {number} page 
 * @param {number} limit 
 * @returns {object} { isValid: boolean, error: string, page: number, limit: number }
 */
const validatePagination = (page, limit) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;

  if (pageNum < 1) {
    return { isValid: false, error: 'Page must be greater than 0' };
  }

  if (limitNum < 1) {
    return { isValid: false, error: 'Limit must be greater than 0' };
  }

  if (limitNum > 100) {
    return { isValid: false, error: 'Limit cannot exceed 100' };
  }

  return { isValid: true, page: pageNum, limit: limitNum };
};

/**
 * Validate email format
 * @param {string} email 
 * @returns {boolean}
 */
const validateEmail = (email) => {
  const emailRegex = /^\S+@\S+\.\S+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 * @param {string} phone 
 * @returns {boolean}
 */
const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate user role
 * @param {string} role 
 * @returns {object} { isValid: boolean, error: string }
 */
const validateRole = (role) => {
  const validRoles = Object.values(ROLES);
  if (!validRoles.includes(role)) {
    return {
      isValid: false,
      error: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
    };
  }
  return { isValid: true };
};

/**
 * Validate price range (both min and max provided)
 * @param {number} minPrice 
 * @param {number} maxPrice 
 * @returns {object} { isValid: boolean, error: string, minPrice: number, maxPrice: number }
 */
const validatePriceRange = (minPrice, maxPrice) => {
  const min = parseFloat(minPrice);
  const max = parseFloat(maxPrice);

  if (isNaN(min) || isNaN(max)) {
    return { isValid: false, error: 'Min and max price must be valid numbers' };
  }

  if (min < 0 || max < 0) {
    return { isValid: false, error: 'Price values cannot be negative' };
  }

  if (min > max) {
    return { isValid: false, error: 'Minimum price cannot be greater than maximum price' };
  }

  return { isValid: true, minPrice: min, maxPrice: max };
};

module.exports = {
  validateCoordinates,
  validatePrice,
  validatePropertyType,
  validateRadius,
  validatePagination,
  validateEmail,
  validatePhoneNumber,
  validateRole,
  validatePriceRange,
};
