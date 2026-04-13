/**
 * Application Constants
 * Centralized enum values and configuration
 * 
 * These are fallback values used when dynamic configs are not yet loaded
 * For dynamic values, use the configManager utility module instead
 */

// User Roles
const ROLES = {
  ADMIN: 'admin',
  SELLER: 'seller',
  BUYER: 'buyer',
  AGENT: 'agent',
};

const SELLER_ROLES = [ROLES.ADMIN, ROLES.SELLER, ROLES.AGENT];
const ADMIN_ROLES = [ROLES.ADMIN];
const BUYER_ROLES = [ROLES.BUYER];

// User Verification Status
const VERIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVE: 'approve',
  REJECT: 'reject',
};

// Property Status
const PROPERTY_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  SOLD: 'sold',
};

// Property types — must stay in sync with propertyModel.propertyType enum
const PROPERTY_TYPES = [
  'Farmhouse',
  'Farmland',
  'Agriculture Land',
  'Resort',
  'Flat',
  'House',
  'Plot',
  'Villa',
  'Apartment',
  'Commercial',
  'Other',
];

// Lead Status
const LEAD_STATUS = {
  VIEWED: 'viewed',
  INTERESTED: 'interested',
  CONTACTED: 'contacted',
  UNINTERESTED: 'uninterested',
};

// Geographic Constraints
const GEO_CONSTRAINTS = {
  MIN_LATITUDE: -90,
  MAX_LATITUDE: 90,
  MIN_LONGITUDE: -180,
  MAX_LONGITUDE: 180,
};

// API Configuration
const API_CONFIG = {
  MAX_IMAGES_PER_PROPERTY: 10,
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  DEFAULT_RADIUS_KM: 5,
};

// Validation Constraints
const CONSTRAINTS = {
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 5000,
  DETAILS_MAX_LENGTH: 1000,
  PASSWORD_MIN_LENGTH: 6,
  AGE_MIN: 1,
  AGE_MAX: 150,
};

/**
 * DEPRECATED: Use configManager.getSystemConfigValues() instead
 * This function is kept for backward compatibility
 */
const getPropertyTypesFromDB = async () => {
  const { getSystemConfigValues } = require('./configManager');
  try {
    const types = await getSystemConfigValues('PROPERTY_TYPES');
    return types.length > 0 ? types : PROPERTY_TYPES;
  } catch (error) {
    console.error('Error fetching property types from DB, using defaults:', error.message);
    return PROPERTY_TYPES;
  }
};

/**
 * DEPRECATED: Use configManager.getSystemConfigValues() instead
 * This function is kept for backward compatibility
 */
const getRolesFromDB = async () => {
  const { getSystemConfigValues } = require('./configManager');
  try {
    const roles = await getSystemConfigValues('ROLES');
    return roles.length > 0 ? roles : Object.values(ROLES);
  } catch (error) {
    console.error('Error fetching roles from DB, using defaults:', error.message);
    return Object.values(ROLES);
  }
};

module.exports = {
  ROLES,
  SELLER_ROLES,
  ADMIN_ROLES,
  BUYER_ROLES,
  VERIFICATION_STATUS,
  PROPERTY_STATUS,
  PROPERTY_TYPES,
  LEAD_STATUS,
  GEO_CONSTRAINTS,
  API_CONFIG,
  CONSTRAINTS,
  getPropertyTypesFromDB,
  getRolesFromDB,
};
