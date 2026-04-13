/**
 * Measurement Calculator Routes
 * Handles land measurement unit conversion endpoints
 */

const express = require('express');
const router = express.Router();
const {
  convertMeasurement,
  getSupportedUnits,
  batchConvertMeasurements,
  quickConvert,
} = require('../controllers/measurementController');

/**
 * @route   GET /api/measurements/supported
 * @desc    Get all supported measurement units and conversion options
 * @access  Public
 */
router.get('/supported', getSupportedUnits);

/**
 * @route   GET /api/measurements/quick-convert
 * @desc    Quick conversion for common conversions
 * @query   value (number), type (string)
 * @example /api/measurements/quick-convert?value=10&type=acre-to-hectare
 * @access  Public
 */
router.get('/quick-convert', quickConvert);

/**
 * @route   POST /api/measurements/convert
 * @desc    Convert between two measurement units
 * @body    { value: number, fromUnit: string, toUnit: string }
 * @example POST /api/measurements/convert
 *          { "value": 5, "fromUnit": "acre", "toUnit": "hectare" }
 * @access  Public
 */
router.post('/convert', convertMeasurement);

/**
 * @route   POST /api/measurements/batch-convert
 * @desc    Batch convert multiple measurements at once
 * @body    { conversions: array of { value, fromUnit, toUnit } }
 * @example POST /api/measurements/batch-convert
 *          { 
 *            "conversions": [
 *              { "value": 5, "fromUnit": "acre", "toUnit": "hectare" },
 *              { "value": 100, "fromUnit": "square_meter", "toUnit": "acre" }
 *            ]
 *          }
 * @access  Public
 */
router.post('/batch-convert', batchConvertMeasurements);

module.exports = router;
