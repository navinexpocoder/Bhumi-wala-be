const DynamicConfig = require('../models/dynamicConfigModel');
const ResponseFormatter = require('../utils/responseFormatter');
const logger = require('../config/logger');

/**
 * Get all configs
 * @route GET /api/config
 * @access Public
 */
exports.getConfigs = async (req, res) => {
  try {
    const { configType, skip = 0, limit = 50 } = req.query;
    const query = { isActive: true };

    if (configType) query.configType = configType;

    const configs = await DynamicConfig.find(query)
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await DynamicConfig.countDocuments(query);

    return ResponseFormatter.success(res, 'Configurations retrieved', {
      configs,
      pagination: {
        total,
        skip: parseInt(skip),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Get configs error:', error);
    ResponseFormatter.serverError(res, 'Error fetching configurations', error.message);
  }
};

/**
 * Get config by key
 * @route GET /api/config/:configKey
 * @access Public
 */
exports.getConfigByKey = async (req, res) => {
  try {
    const config = await DynamicConfig.findOne({ configKey: req.params.configKey, isActive: true });

    if (!config) {
      return ResponseFormatter.notFound(res, 'Configuration not found');
    }

    return ResponseFormatter.success(res, 'Configuration retrieved', { config });
  } catch (error) {
    logger.error('Get config by key error:', error);
    ResponseFormatter.serverError(res, 'Error fetching configuration', error.message);
  }
};

/**
 * Get theme configuration
 * @route GET /api/config/type/theme
 * @access Public
 */
exports.getThemeConfig = async (req, res) => {
  try {
    const config = await DynamicConfig.findOne({ configKey: 'theme', isActive: true });

    if (!config) {
      return ResponseFormatter.notFound(res, 'Theme configuration not found');
    }

    return ResponseFormatter.success(res, 'Theme configuration retrieved', {
      theme: config.theme,
    });
  } catch (error) {
    logger.error('Get theme config error:', error);
    ResponseFormatter.serverError(res, 'Error fetching theme configuration', error.message);
  }
};

/**
 * Get feature flags
 * @route GET /api/config/features
 * @access Public
 */
exports.getFeatureFlags = async (req, res) => {
  try {
    const config = await DynamicConfig.findOne({ configKey: 'features', isActive: true });

    if (!config) {
      return ResponseFormatter.notFound(res, 'Feature flags not found');
    }

    return ResponseFormatter.success(res, 'Feature flags retrieved', {
      features: config.features,
    });
  } catch (error) {
    logger.error('Get feature flags error:', error);
    ResponseFormatter.serverError(res, 'Error fetching feature flags', error.message);
  }
};

/**
 * Create or update config
 * @route POST /api/config
 * @access Private (Admin)
 */
exports.createOrUpdateConfig = async (req, res) => {
  try {
    const { configKey, configType, configValue, description, theme, features, emailConfig, brand, seoConfig } = req.body;

    if (!configKey) {
      return ResponseFormatter.validationError(res, ['Config key is required']);
    }

    const configData = {
      configKey,
      configType: configType || 'other',
      description: description || '',
      ...(configValue && { configValue }),
      ...(theme && { theme }),
      ...(features && { features }),
      ...(emailConfig && { emailConfig }),
      ...(brand && { brand }),
      ...(seoConfig && { seoConfig }),
      updatedBy: req.user.id,
    };

    const config = await DynamicConfig.findOneAndUpdate(
      { configKey },
      configData,
      { new: true, upsert: true, runValidators: true }
    );

    logger.info(`Configuration updated: ${configKey}`);
    return ResponseFormatter.success(res, 'Configuration saved successfully', { config });
  } catch (error) {
    logger.error('Create/update config error:', error);
    ResponseFormatter.serverError(res, 'Error saving configuration', error.message);
  }
};

/**
 * Update theme
 * @route PUT /api/config/theme
 * @access Private (Admin)
 */
exports.updateTheme = async (req, res) => {
  try {
    const { primaryColor, secondaryColor, accentColor, darkMode, fontFamily, fontSize } = req.body;

    const config = await DynamicConfig.findOneAndUpdate(
      { configKey: 'theme' },
      {
        configKey: 'theme',
        configType: 'theme',
        theme: {
          primaryColor,
          secondaryColor,
          accentColor,
          darkMode,
          fontFamily,
          fontSize,
        },
        updatedBy: req.user.id,
      },
      { new: true, upsert: true, runValidators: true }
    );

    logger.info('Theme configuration updated');
    return ResponseFormatter.success(res, 'Theme updated successfully', { theme: config.theme });
  } catch (error) {
    logger.error('Update theme error:', error);
    ResponseFormatter.serverError(res, 'Error updating theme', error.message);
  }
};

/**
 * Update feature flags
 * @route PUT /api/config/features
 * @access Private (Admin)
 */
exports.updateFeatures = async (req, res) => {
  try {
    const features = req.body;

    const config = await DynamicConfig.findOneAndUpdate(
      { configKey: 'features' },
      {
        configKey: 'features',
        configType: 'feature',
        features,
        updatedBy: req.user.id,
      },
      { new: true, upsert: true, runValidators: true }
    );

    logger.info('Feature flags updated');
    return ResponseFormatter.success(res, 'Features updated successfully', { features: config.features });
  } catch (error) {
    logger.error('Update features error:', error);
    ResponseFormatter.serverError(res, 'Error updating features', error.message);
  }
};

/**
 * Delete config
 * @route DELETE /api/config/:id
 * @access Private (Admin)
 */
exports.deleteConfig = async (req, res) => {
  try {
    const config = await DynamicConfig.findByIdAndDelete(req.params.id);

    if (!config) {
      return ResponseFormatter.notFound(res, 'Configuration not found');
    }

    logger.info(`Configuration deleted: ${config.configKey}`);
    return ResponseFormatter.success(res, 'Configuration deleted successfully');
  } catch (error) {
    logger.error('Delete config error:', error);
    ResponseFormatter.serverError(res, 'Error deleting configuration', error.message);
  }
};
