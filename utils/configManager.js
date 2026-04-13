const UIConfig = require('../models/uiConfigModel');
const SystemConfig = require('../models/systemConfigModel');

/**
 * In-memory cache for configurations
 * TTL (Time To Live) in milliseconds
 * Cache is refreshed every 5 minutes for UI config and 10 minutes for System config
 */
const cache = {
  uiConfigs: new Map(),
  systemConfigs: new Map(),
  lastFetched: {
    ui: 0,
    system: 0,
  },
};

const CACHE_TTL = {
  UI_CONFIG: 5 * 60 * 1000, // 5 minutes
  SYSTEM_CONFIG: 10 * 60 * 1000, // 10 minutes
};

/**
 * Get UI configuration by key with caching
 * @param {string} key - Configuration key
 * @returns {Promise<Object>} Configuration object
 */
const getUIConfigCached = async (key) => {
  try {
    const now = Date.now();

    // Check if cache is still valid
    if (
      cache.uiConfigs.has(key) &&
      now - cache.lastFetched.ui < CACHE_TTL.UI_CONFIG
    ) {
      return cache.uiConfigs.get(key);
    }

    // Fetch from database
    const config = await UIConfig.findOne({ configKey: key, isActive: true });

    if (config) {
      cache.uiConfigs.set(key, config);
      cache.lastFetched.ui = now;
    } else {
      // Cache miss - store null to avoid repeated DB queries
      cache.uiConfigs.set(key, null);
    }

    return config;
  } catch (error) {
    console.error(`Error fetching UI config '${key}':`, error.message);
    return null;
  }
};

/**
 * Get all UI configurations with caching
 * @returns {Promise<Array>} All UI configurations
 */
const getAllUIConfigsCached = async () => {
  try {
    const cacheKey = '_all_';
    const now = Date.now();

    if (
      cache.uiConfigs.has(cacheKey) &&
      now - cache.lastFetched.ui < CACHE_TTL.UI_CONFIG
    ) {
      return cache.uiConfigs.get(cacheKey);
    }

    const configs = await UIConfig.find({ isActive: true });
    cache.uiConfigs.set(cacheKey, configs);
    cache.lastFetched.ui = now;

    return configs;
  } catch (error) {
    console.error('Error fetching all UI configs:', error.message);
    return [];
  }
};

/**
 * Get system configuration by key with caching
 * @param {string} key - Configuration key
 * @returns {Promise<Object>} Configuration object
 */
const getSystemConfigCached = async (key) => {
  try {
    const now = Date.now();

    if (
      cache.systemConfigs.has(key) &&
      now - cache.lastFetched.system < CACHE_TTL.SYSTEM_CONFIG
    ) {
      return cache.systemConfigs.get(key);
    }

    const config = await SystemConfig.findOne({ configKey: key, isActive: true });

    if (config) {
      cache.systemConfigs.set(key, config);
      cache.lastFetched.system = now;
    } else {
      cache.systemConfigs.set(key, null);
    }

    return config;
  } catch (error) {
    console.error(`Error fetching system config '${key}':`, error.message);
    return null;
  }
};

/**
 * Get all system configurations with caching
 * @returns {Promise<Array>} All system configurations
 */
const getAllSystemConfigsCached = async () => {
  try {
    const cacheKey = '_all_';
    const now = Date.now();

    if (
      cache.systemConfigs.has(cacheKey) &&
      now - cache.lastFetched.system < CACHE_TTL.SYSTEM_CONFIG
    ) {
      return cache.systemConfigs.get(cacheKey);
    }

    const configs = await SystemConfig.find({ isActive: true });
    cache.systemConfigs.set(cacheKey, configs);
    cache.lastFetched.system = now;

    return configs;
  } catch (error) {
    console.error('Error fetching all system configs:', error.message);
    return [];
  }
};

/**
 * Get formatted system config (array of values)
 * Useful for getting just the values from a system config
 * @param {string} key - Configuration key
 * @returns {Promise<Array>} Array of values
 */
const getSystemConfigValues = async (key) => {
  try {
    const config = await getSystemConfigCached(key);
    if (!config || !config.configValues) {
      return [];
    }
    return config.configValues.map((item) => item.value);
  } catch (error) {
    console.error(`Error getting system config values for '${key}':`, error.message);
    return [];
  }
};

/**
 * Invalidate cache for a specific config
 * @param {string} type - 'ui' or 'system'
 * @param {string} key - Optional specific key to invalidate
 */
const invalidateCache = (type, key = null) => {
  if (type === 'ui') {
    if (key) {
      cache.uiConfigs.delete(key);
    } else {
      cache.uiConfigs.clear();
      cache.lastFetched.ui = 0;
    }
  } else if (type === 'system') {
    if (key) {
      cache.systemConfigs.delete(key);
    } else {
      cache.systemConfigs.clear();
      cache.lastFetched.system = 0;
    }
  }
};

/**
 * Clear all caches
 */
const clearAllCaches = () => {
  cache.uiConfigs.clear();
  cache.systemConfigs.clear();
  cache.lastFetched.ui = 0;
  cache.lastFetched.system = 0;
};

module.exports = {
  getUIConfigCached,
  getAllUIConfigsCached,
  getSystemConfigCached,
  getAllSystemConfigsCached,
  getSystemConfigValues,
  invalidateCache,
  clearAllCaches,
};
