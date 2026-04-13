/**
 * Measurement Calculator Controller
 * Handles land measurement unit conversions
 * Supports: Acre ↔ Hectare, Bigha ↔ Acre, Square Meter ↔ Acre
 */

const ResponseFormatter = require('../utils/responseFormatter');
const measurementConverter = require('../utils/measurementConverter');
const {
  validateMeasurement,
  validateMeasurementUnit,
  validateConversionRequest,
} = require('../utils/validation');

/**
 * @desc    Convert between measurement units
 * @route   POST /api/measurements/convert
 * @access  Public
 * @body    { value: number, fromUnit: string, toUnit: string }
 */
exports.convertMeasurement = async (req, res) => {
  try {
    const { value, fromUnit, toUnit } = req.body;

    // Validate request
    const validation = validateConversionRequest(value, fromUnit, toUnit);
    if (!validation.isValid) {
      return ResponseFormatter.validationError(res, validation.error);
    }

    // Perform conversion
    const result = measurementConverter.convert(
      validation.value,
      validation.fromUnit,
      validation.toUnit
    );

    if (!result.success) {
      return ResponseFormatter.validationError(res, result.error);
    }

    return ResponseFormatter.success(res, {
      conversion: {
        originalValue: validation.value,
        originalUnit: validation.fromUnit,
        convertedValue: result.value,
        convertedUnit: validation.toUnit,
        label: `${validation.value} ${measurementConverter.UNIT_LABELS[validation.fromUnit]} = ${result.value} ${measurementConverter.UNIT_LABELS[validation.toUnit]}`,
      },
    });
  } catch (error) {
    return ResponseFormatter.error(res, error.message);
  }
};

/**
 * @desc    Get supported measurement units and conversion options
 * @route   GET /api/measurements/supported
 * @access  Public
 */
exports.getSupportedUnits = async (req, res) => {
  try {
    const supportedData = measurementConverter.getSupportedConversions();

    return ResponseFormatter.success(res, {
      units: supportedData.supportedUnits,
      unitLabels: supportedData.unitLabels,
      conversions: supportedData.conversions.map((conv) => ({
        from: conv.from,
        to: conv.to,
        factor: conv.factor.toFixed(6),
        example: `1 ${measurementConverter.UNIT_LABELS[conv.from]} = ${conv.factor.toFixed(4)} ${measurementConverter.UNIT_LABELS[conv.to]}`,
      })),
    });
  } catch (error) {
    return ResponseFormatter.error(res, error.message);
  }
};

/**
 * @desc    Batch convert multiple measurements
 * @route   POST /api/measurements/batch-convert
 * @access  Public
 * @body    { conversions: array of { value, fromUnit, toUnit } }
 */
exports.batchConvertMeasurements = async (req, res) => {
  try {
    const { conversions } = req.body;

    // Validate input is array
    if (!Array.isArray(conversions)) {
      return ResponseFormatter.validationError(
        res,
        'conversions must be an array'
      );
    }

    if (conversions.length === 0) {
      return ResponseFormatter.validationError(
        res,
        'conversions array cannot be empty'
      );
    }

    if (conversions.length > 100) {
      return ResponseFormatter.validationError(
        res,
        'Maximum 100 conversions allowed per request'
      );
    }

    // Validate and convert each request
    const results = conversions.map((conv, index) => {
      const validation = validateConversionRequest(conv.value, conv.fromUnit, conv.toUnit);

      if (!validation.isValid) {
        return {
          index,
          success: false,
          error: validation.error,
          value: conv.value,
          fromUnit: conv.fromUnit,
          toUnit: conv.toUnit,
        };
      }

      const result = measurementConverter.convert(
        validation.value,
        validation.fromUnit,
        validation.toUnit
      );

      if (!result.success) {
        return {
          index,
          success: false,
          error: result.error,
          value: conv.value,
          fromUnit: conv.fromUnit,
          toUnit: conv.toUnit,
        };
      }

      return {
        index,
        success: true,
        originalValue: validation.value,
        originalUnit: validation.fromUnit,
        convertedValue: result.value,
        convertedUnit: validation.toUnit,
        label: `${validation.value} ${measurementConverter.UNIT_LABELS[validation.fromUnit]} = ${result.value} ${measurementConverter.UNIT_LABELS[validation.toUnit]}`,
      };
    });

    // Check if all conversions were successful
    const allSuccessful = results.every((r) => r.success);
    const failedCount = results.filter((r) => !r.success).length;

    return ResponseFormatter.success(res, {
      totalRequests: conversions.length,
      successCount: conversions.length - failedCount,
      failedCount,
      allSuccessful,
      results,
    });
  } catch (error) {
    return ResponseFormatter.error(res, error.message);
  }
};

/**
 * @desc    Quick convert specific common conversions
 * @route   GET /api/measurements/quick-convert
 * @access  Public
 * @query   { value: number, type: string }
 * Type examples: 'acre-to-hectare', 'bigha-to-acre', 'sqm-to-acre'
 */
exports.quickConvert = async (req, res) => {
  try {
    const { value, type } = req.query;

    // Validate value
    const valueValidation = validateMeasurement(value);
    if (!valueValidation.isValid) {
      return ResponseFormatter.validationError(res, valueValidation.error);
    }

    if (!type) {
      return ResponseFormatter.validationError(res, 'Conversion type is required');
    }

    const conversionMap = {
      'acre-to-hectare': { from: 'acre', to: 'hectare' },
      'hectare-to-acre': { from: 'hectare', to: 'acre' },
      'bigha-to-acre': { from: 'bigha', to: 'acre' },
      'acre-to-bigha': { from: 'acre', to: 'bigha' },
      'sqm-to-acre': { from: 'square_meter', to: 'acre' },
      'acre-to-sqm': { from: 'acre', to: 'square_meter' },
    };

    const conversion = conversionMap[type.toLowerCase()];
    if (!conversion) {
      return ResponseFormatter.validationError(
        res,
        `Invalid conversion type: ${type}. Supported types: ${Object.keys(conversionMap).join(', ')}`
      );
    }

    const result = measurementConverter.convert(
      valueValidation.value,
      conversion.from,
      conversion.to
    );

    if (!result.success) {
      return ResponseFormatter.validationError(res, result.error);
    }

    return ResponseFormatter.success(res, {
      originalValue: valueValidation.value,
      originalUnit: conversion.from,
      convertedValue: result.value,
      convertedUnit: conversion.to,
      conversionType: type,
      label: `${valueValidation.value} ${measurementConverter.UNIT_LABELS[conversion.from]} = ${result.value} ${measurementConverter.UNIT_LABELS[conversion.to]}`,
    });
  } catch (error) {
    return ResponseFormatter.error(res, error.message);
  }
};
