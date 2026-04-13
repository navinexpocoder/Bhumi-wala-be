/**
 * Land Measurement Converter Utility
 * Handles conversions between different land measurement units
 * 
 * Conversion Factors (International Standard):
 * - 1 Acre = 0.404686 Hectare
 * - 1 Bigha = 0.25 Acre (2.5 Decimal)
 * - 1 Square Meter = 0.000247105 Acre
 */

/**
 * Conversion factors (base unit: Acre)
 * All conversions are relative to the Acre unit
 */
const CONVERSION_FACTORS = {
  ACRE_TO_HECTARE: 0.404686,
  BIGHA_TO_ACRE: 0.25,
  SQUARE_METER_TO_ACRE: 0.000247105,
};

/**
 * Supported measurement units
 */
const UNITS = {
  ACRE: 'acre',
  HECTARE: 'hectare',
  BIGHA: 'bigha',
  SQUARE_METER: 'square_meter',
};

/**
 * Unit display names for UI
 */
const UNIT_LABELS = {
  acre: 'Acre',
  hectare: 'Hectare',
  bigha: 'Bigha',
  square_meter: 'Square Meter (m²)',
};

/**
 * Convert Acre to Hectare
 * @param {number} acres - Value in acres
 * @returns {number} Value in hectares
 */
const acreToHectare = (acres) => {
  return parseFloat((acres * CONVERSION_FACTORS.ACRE_TO_HECTARE).toFixed(4));
};

/**
 * Convert Hectare to Acre
 * @param {number} hectares - Value in hectares
 * @returns {number} Value in acres
 */
const hectareToAcre = (hectares) => {
  return parseFloat((hectares / CONVERSION_FACTORS.ACRE_TO_HECTARE).toFixed(4));
};

/**
 * Convert Bigha to Acre
 * @param {number} bighas - Value in bighas
 * @returns {number} Value in acres
 */
const bighaToAcre = (bighas) => {
  return parseFloat((bighas * CONVERSION_FACTORS.BIGHA_TO_ACRE).toFixed(4));
};

/**
 * Convert Acre to Bigha
 * @param {number} acres - Value in acres
 * @returns {number} Value in bighas
 */
const acreToBigha = (acres) => {
  return parseFloat((acres / CONVERSION_FACTORS.BIGHA_TO_ACRE).toFixed(4));
};

/**
 * Convert Square Meter to Acre
 * @param {number} squareMeters - Value in square meters
 * @returns {number} Value in acres
 */
const squareMeterToAcre = (squareMeters) => {
  return parseFloat((squareMeters * CONVERSION_FACTORS.SQUARE_METER_TO_ACRE).toFixed(4));
};

/**
 * Convert Acre to Square Meter
 * @param {number} acres - Value in acres
 * @returns {number} Value in square meters
 */
const acreToSquareMeter = (acres) => {
  return parseFloat((acres / CONVERSION_FACTORS.SQUARE_METER_TO_ACRE).toFixed(2));
};

/**
 * Generic converter function
 * Converts from one unit to another
 * 
 * @param {number} value - The value to convert
 * @param {string} fromUnit - Source unit (acre, hectare, bigha, square_meter)
 * @param {string} toUnit - Target unit (acre, hectare, bigha, square_meter)
 * @returns {object} { success: boolean, value: number, error?: string }
 */
const convert = (value, fromUnit, toUnit) => {
  // Validation
  if (value === null || value === undefined || isNaN(value)) {
    return {
      success: false,
      error: 'Invalid value. Must be a valid number.',
    };
  }

  if (value < 0) {
    return {
      success: false,
      error: 'Value cannot be negative.',
    };
  }

  const normalizedFromUnit = fromUnit.toLowerCase().trim();
  const normalizedToUnit = toUnit.toLowerCase().trim();

  // Check if units are valid
  if (!Object.values(UNITS).includes(normalizedFromUnit)) {
    return {
      success: false,
      error: `Invalid source unit: ${fromUnit}. Supported units: acre, hectare, bigha, square_meter`,
    };
  }

  if (!Object.values(UNITS).includes(normalizedToUnit)) {
    return {
      success: false,
      error: `Invalid target unit: ${toUnit}. Supported units: acre, hectare, bigha, square_meter`,
    };
  }

  // Same unit - no conversion needed
  if (normalizedFromUnit === normalizedToUnit) {
    return {
      success: true,
      value: parseFloat(value.toFixed(4)),
    };
  }

  try {
    let result;

    // Define conversion matrix
    const conversions = {
      [`${UNITS.ACRE}-${UNITS.HECTARE}`]: () => acreToHectare(value),
      [`${UNITS.HECTARE}-${UNITS.ACRE}`]: () => hectareToAcre(value),
      [`${UNITS.BIGHA}-${UNITS.ACRE}`]: () => bighaToAcre(value),
      [`${UNITS.ACRE}-${UNITS.BIGHA}`]: () => acreToBigha(value),
      [`${UNITS.SQUARE_METER}-${UNITS.ACRE}`]: () => squareMeterToAcre(value),
      [`${UNITS.ACRE}-${UNITS.SQUARE_METER}`]: () => acreToSquareMeter(value),
    };

    // Handle conversions through Acre as pivot unit
    const conversionKey = `${normalizedFromUnit}-${normalizedToUnit}`;

    if (conversions[conversionKey]) {
      result = conversions[conversionKey]();
    } else {
      // Convert to Acre first, then to target unit
      let acreValue;

      // Convert to Acre
      if (normalizedFromUnit === UNITS.ACRE) {
        acreValue = value;
      } else if (normalizedFromUnit === UNITS.HECTARE) {
        acreValue = hectareToAcre(value);
      } else if (normalizedFromUnit === UNITS.BIGHA) {
        acreValue = bighaToAcre(value);
      } else if (normalizedFromUnit === UNITS.SQUARE_METER) {
        acreValue = squareMeterToAcre(value);
      }

      // Convert from Acre to target unit
      if (normalizedToUnit === UNITS.ACRE) {
        result = acreValue;
      } else if (normalizedToUnit === UNITS.HECTARE) {
        result = acreToHectare(acreValue);
      } else if (normalizedToUnit === UNITS.BIGHA) {
        result = acreToBigha(acreValue);
      } else if (normalizedToUnit === UNITS.SQUARE_METER) {
        result = acreToSquareMeter(acreValue);
      }
    }

    return {
      success: true,
      value: result,
    };
  } catch (error) {
    return {
      success: false,
      error: `Conversion failed: ${error.message}`,
    };
  }
};

/**
 * Get all available conversion options
 * Returns detailed info about supported conversions
 * 
 * @returns {object} Object with units and their descriptions
 */
const getSupportedConversions = () => {
  return {
    supportedUnits: Object.values(UNITS),
    conversions: [
      {
        from: UNITS.ACRE,
        to: UNITS.HECTARE,
        factor: CONVERSION_FACTORS.ACRE_TO_HECTARE,
      },
      {
        from: UNITS.HECTARE,
        to: UNITS.ACRE,
        factor: 1 / CONVERSION_FACTORS.ACRE_TO_HECTARE,
      },
      {
        from: UNITS.BIGHA,
        to: UNITS.ACRE,
        factor: CONVERSION_FACTORS.BIGHA_TO_ACRE,
      },
      {
        from: UNITS.ACRE,
        to: UNITS.BIGHA,
        factor: 1 / CONVERSION_FACTORS.BIGHA_TO_ACRE,
      },
      {
        from: UNITS.SQUARE_METER,
        to: UNITS.ACRE,
        factor: CONVERSION_FACTORS.SQUARE_METER_TO_ACRE,
      },
      {
        from: UNITS.ACRE,
        to: UNITS.SQUARE_METER,
        factor: 1 / CONVERSION_FACTORS.SQUARE_METER_TO_ACRE,
      },
    ],
    unitLabels: UNIT_LABELS,
  };
};

/**
 * Batch convert multiple values at once
 * 
 * @param {array} conversions - Array of { value, fromUnit, toUnit }
 * @returns {array} Array of conversion results
 */
const batchConvert = (conversions) => {
  if (!Array.isArray(conversions)) {
    return {
      success: false,
      error: 'Input must be an array of conversion objects',
    };
  }

  return conversions.map((conv, index) => {
    const result = convert(conv.value, conv.fromUnit, conv.toUnit);
    return {
      index,
      ...result,
      fromUnit: conv.fromUnit,
      toUnit: conv.toUnit,
    };
  });
};

module.exports = {
  // Main functions
  convert,
  batchConvert,
  getSupportedConversions,

  // Individual conversion functions
  acreToHectare,
  hectareToAcre,
  bighaToAcre,
  acreToBigha,
  squareMeterToAcre,
  acreToSquareMeter,

  // Constants
  CONVERSION_FACTORS,
  UNITS,
  UNIT_LABELS,
};
