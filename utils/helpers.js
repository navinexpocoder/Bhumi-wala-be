/**
 * Helper Utilities
 * Common utility functions used across the application
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude  
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert degrees to radians
 * @param {number} degrees 
 * @returns {number} Radians
 */
const toRad = (degrees) => {
  return (degrees * Math.PI) / 180;
};

/**
 * Calculate pagination skip and take values
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} { skip: number, limit: number }
 */
const calculatePagination = (page = 1, limit = 10) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  return {
    skip,
    limit: parseInt(limit),
  };
};

/**
 * Build MongoDB sort object from sort parameter
 * @param {string} sort - Sort parameter (e.g., 'price-asc', 'newest')
 * @returns {object} MongoDB sort object
 */
const buildSortObject = (sort) => {
  const sortOption = {};

  switch (sort) {
    case 'price-asc':
      sortOption.price = 1;
      break;
    case 'price-desc':
      sortOption.price = -1;
      break;
    case 'newest':
      sortOption.createdAt = -1;
      break;
    case 'oldest':
      sortOption.createdAt = 1;
      break;
    default:
      sortOption.createdAt = -1; // Default: newest first
  }

  return sortOption;
};

/**
 * Build MongoDB query object from filter parameters
 * @param {object} filters - Filter parameters
 * @returns {object} MongoDB query object
 */
const buildFilterQuery = (filters = {}) => {
  const query = {};

  // Status filter
  if (filters.status) {
    query.status = filters.status;
  }

  // Property type filter
  if (filters.propertyType) {
    query.propertyType = filters.propertyType;
  }

  // Price range filter
  if (filters.minPrice || filters.maxPrice) {
    query.price = {};
    if (filters.minPrice) query.price.$gte = parseFloat(filters.minPrice);
    if (filters.maxPrice) query.price.$lte = parseFloat(filters.maxPrice);
  }

  // Seller filter
  if (filters.sellerId) {
    query.sellerId = filters.sellerId;
  }

  return query;
};

/**
 * Build geospatial query for nearby properties
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {number} radiusInMeters 
 * @param {object} additionalFilters - Additional query filters
 * @returns {object} MongoDB geospatial query
 */
const buildGeoQuery = (latitude, longitude, radiusInMeters, additionalFilters = {}) => {
  return {
    ...additionalFilters,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude], // GeoJSON format
        },
        $maxDistance: radiusInMeters,
      },
    },
  };
};

/**
 * Format GeoJSON coordinates for database storage
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {object} GeoJSON formatted object
 */
const formatGeoJSON = (latitude, longitude) => {
  return {
    type: 'Point',
    coordinates: [longitude, latitude], // GeoJSON format: [longitude, latitude]
  };
};

/**
 * Add distance information to items (for geospatial queries)
 * @param {array} items - Array of items with location
 * @param {number} refLatitude - Reference latitude
 * @param {number} refLongitude - Reference longitude
 * @returns {array} Items with distance field added
 */
const addDistanceToItems = (items, refLatitude, refLongitude) => {
  return items.map((item) => {
    const propLong = item.location?.coordinates?.[0];
    const propLat = item.location?.coordinates?.[1];

    if (propLong !== undefined && propLat !== undefined) {
      const distance = calculateDistance(refLatitude, refLongitude, propLat, propLong);
      return {
        ...item.toObject?.() || item,
        distance: parseFloat(distance.toFixed(2)),
      };
    }

    return item.toObject?.() || item;
  });
};

/**
 * Sanitize user input - remove dangerous characters
 * @param {string} input 
 * @returns {string} Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Check if user has required role
 * @param {string} userRole - User's role
 * @param {array} requiredRoles - Array of required roles
 * @returns {boolean}
 */
const hasRole = (userRole, requiredRoles) => {
  return requiredRoles.includes(userRole);
};

/**
 * Check if user owns the resource
 * @param {string} userId - User ID from token
 * @param {string} resourceOwnerId - Resource owner ID
 * @returns {boolean}
 */
const isResourceOwner = (userId, resourceOwnerId) => {
  if (userId == null || resourceOwnerId == null) {
    return false;
  }
  return userId.toString() === resourceOwnerId.toString();
};

/**
 * Coerce request/body values to a boolean for Mongoose Boolean fields.
 * Avoids CastError from "" or legacy risk strings like "Low".
 * @param {*} value
 * @param {boolean} defaultValue
 * @returns {boolean}
 */
const parseBooleanInput = (value, defaultValue = false) => {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase();
    if (s === '') return false;
    if (['false', '0', 'no'].includes(s)) return false;
    if (['true', '1', 'yes'].includes(s)) return true;
    if (s === 'low') return false;
    if (s === 'medium' || s === 'high') return true;
    return defaultValue;
  }
  if (typeof value === 'number') return value !== 0;
  return Boolean(value);
};

module.exports = {
  calculateDistance,
  calculatePagination,
  buildSortObject,
  buildFilterQuery,
  buildGeoQuery,
  formatGeoJSON,
  addDistanceToItems,
  sanitizeInput,
  hasRole,
  isResourceOwner,
  parseBooleanInput,
};
