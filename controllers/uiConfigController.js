const ResponseFormatter = require("../utils/responseFormatter");
const UIConfig = require("../models/uiConfigModel");
const SystemConfig = require("../models/systemConfigModel");

// @desc    Get all UI configurations
// @route   GET /api/ui-config
// @access  Public
exports.getUIConfig = async (req, res) => {
  try {
    const { category } = req.query;

    let query = { isActive: true };
    if (category) {
      query.category = category;
    }

    const configs = await UIConfig.find(query);

    if (!configs || configs.length === 0) {
      return ResponseFormatter.success(res, { data: [] }, "No configurations found");
    }

    // Format configs for frontend
    const formattedConfigs = configs.reduce((acc, config) => {
      acc[config.configKey] = config.configValue;
      return acc;
    }, {});

    return ResponseFormatter.success(res, { data: formattedConfigs }, "UI configurations retrieved successfully");
  } catch (error) {
    return ResponseFormatter.internalServerError(res, error.message);
  }
};

// @desc    Get specific UI configuration by key
// @route   GET /api/ui-config/:key
// @access  Public
exports.getUIConfigByKey = async (req, res) => {
  try {
    const { key } = req.params;

    const config = await UIConfig.findOne({ configKey: key, isActive: true });

    if (!config) {
      return ResponseFormatter.notFound(res, `Configuration '${key}' not found`);
    }

    return ResponseFormatter.success(res, { data: config }, "Configuration retrieved successfully");
  } catch (error) {
    return ResponseFormatter.internalServerError(res, error.message);
  }
};

// @desc    Create or update UI configuration (Admin only)
// @route   POST /api/ui-config
// @access  Private (Admin)
exports.createOrUpdateUIConfig = async (req, res) => {
  try {
    const { configKey, configValue, description, category } = req.body;

    // Validation
    if (!configKey || !configValue) {
      return ResponseFormatter.validationError(res, ["configKey and configValue are required"]);
    }

    const config = await UIConfig.findOneAndUpdate(
      { configKey },
      {
        configKey,
        configValue,
        description,
        category,
        updatedBy: req.user._id,
      },
      { upsert: true, new: true, runValidators: true }
    );

    return ResponseFormatter.created(res, { data: config }, "Configuration saved successfully");
  } catch (error) {
    return ResponseFormatter.internalServerError(res, error.message);
  }
};

// @desc    Delete UI configuration (Admin only)
// @route   DELETE /api/ui-config/:key
// @access  Private (Admin)
exports.deleteUIConfig = async (req, res) => {
  try {
    const { key } = req.params;

    const config = await UIConfig.findOneAndDelete({ configKey: key });

    if (!config) {
      return ResponseFormatter.notFound(res, `Configuration '${key}' not found`);
    }

    return ResponseFormatter.success(res, { data: config }, "Configuration deleted successfully");
  } catch (error) {
    return ResponseFormatter.internalServerError(res, error.message);
  }
};

// @desc    Get all system configurations (Constants/Enums)
// @route   GET /api/system-config
// @access  Public
exports.getSystemConfig = async (req, res) => {
  try {
    const { category } = req.query;

    let query = { isActive: true };
    if (category) {
      query.category = category;
    }

    const configs = await SystemConfig.find(query);

    if (!configs || configs.length === 0) {
      return ResponseFormatter.success(res, { data: [] }, "No system configurations found");
    }

    // Format configs
    const formattedConfigs = configs.reduce((acc, config) => {
      acc[config.configKey] = config.configValues;
      return acc;
    }, {});

    return ResponseFormatter.success(res, { data: formattedConfigs }, "System configurations retrieved successfully");
  } catch (error) {
    return ResponseFormatter.internalServerError(res, error.message);
  }
};

// @desc    Get specific system configuration by key
// @route   GET /api/system-config/:key
// @access  Public
exports.getSystemConfigByKey = async (req, res) => {
  try {
    const { key } = req.params;

    const config = await SystemConfig.findOne({ configKey: key, isActive: true });

    if (!config) {
      return ResponseFormatter.notFound(res, `System configuration '${key}' not found`);
    }

    return ResponseFormatter.success(res, { data: config }, "System configuration retrieved successfully");
  } catch (error) {
    return ResponseFormatter.internalServerError(res, error.message);
  }
};

// @desc    Create or update system configuration (Admin only)
// @route   POST /api/system-config
// @access  Private (Admin)
exports.createOrUpdateSystemConfig = async (req, res) => {
  try {
    const { configKey, configValues, description, category } = req.body;

    // Validation
    if (!configKey || !configValues || !Array.isArray(configValues)) {
      return ResponseFormatter.validationError(res, [
        "configKey is required",
        "configValues must be an array",
      ]);
    }

    const config = await SystemConfig.findOneAndUpdate(
      { configKey },
      {
        configKey,
        configValues,
        description,
        category,
        updatedBy: req.user._id,
      },
      { upsert: true, new: true, runValidators: true }
    );

    return ResponseFormatter.created(res, { data: config }, "System configuration saved successfully");
  } catch (error) {
    return ResponseFormatter.internalServerError(res, error.message);
  }
};

// @desc    Delete system configuration (Admin only)
// @route   DELETE /api/system-config/:key
// @access  Private (Admin)
exports.deleteSystemConfig = async (req, res) => {
  try {
    const { key } = req.params;

    const config = await SystemConfig.findOneAndDelete({ configKey: key });

    if (!config) {
      return ResponseFormatter.notFound(res, `System configuration '${key}' not found`);
    }

    return ResponseFormatter.success(res, { data: config }, "System configuration deleted successfully");
  } catch (error) {
    return ResponseFormatter.internalServerError(res, error.message);
  }
};
