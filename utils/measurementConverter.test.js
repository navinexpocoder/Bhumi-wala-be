/**
 * Unit Tests for Measurement Converter Utility
 * Tests all conversion functions and validation
 */

const {
  convert,
  batchConvert,
  getSupportedConversions,
  acreToHectare,
  hectareToAcre,
  bighaToAcre,
  acreToBigha,
  squareMeterToAcre,
  acreToSquareMeter,
  CONVERSION_FACTORS,
  UNITS,
} = require('../utils/measurementConverter');

describe('Measurement Converter - Individual Functions', () => {
  describe('acreToHectare', () => {
    test('should convert 1 acre to hectare', () => {
      const result = acreToHectare(1);
      expect(result).toBeCloseTo(0.4047, 3);
    });

    test('should convert 5 acres to hectares', () => {
      const result = acreToHectare(5);
      expect(result).toBeCloseTo(2.0234, 3);
    });

    test('should handle 0 acres', () => {
      const result = acreToHectare(0);
      expect(result).toBe(0);
    });
  });

  describe('hectareToAcre', () => {
    test('should convert 1 hectare to acre', () => {
      const result = hectareToAcre(1);
      expect(result).toBeCloseTo(2.4711, 3);
    });

    test('should convert 2.0234 hectares to acres', () => {
      const result = hectareToAcre(2.0234);
      expect(result).toBeCloseTo(5, 2);
    });

    test('should handle 0 hectares', () => {
      const result = hectareToAcre(0);
      expect(result).toBe(0);
    });
  });

  describe('bighaToAcre', () => {
    test('should convert 1 bigha to acre', () => {
      const result = bighaToAcre(1);
      expect(result).toBe(0.25);
    });

    test('should convert 4 bighas to acres', () => {
      const result = bighaToAcre(4);
      expect(result).toBe(1);
    });

    test('should handle decimal bighas', () => {
      const result = bighaToAcre(2.5);
      expect(result).toBeCloseTo(0.625, 2);
    });
  });

  describe('acreToBigha', () => {
    test('should convert 0.25 acre to bigha', () => {
      const result = acreToBigha(0.25);
      expect(result).toBe(1);
    });

    test('should convert 1 acre to bighas', () => {
      const result = acreToBigha(1);
      expect(result).toBe(4);
    });

    test('should convert 2 acres to bighas', () => {
      const result = acreToBigha(2);
      expect(result).toBe(8);
    });
  });

  describe('squareMeterToAcre', () => {
    test('should convert 4047 square meters to acre', () => {
      const result = squareMeterToAcre(4047);
      expect(result).toBeCloseTo(1, 2);
    });

    test('should convert 1000 square meters', () => {
      const result = squareMeterToAcre(1000);
      expect(result).toBeCloseTo(0.2471, 4);
    });

    test('should handle 0 square meters', () => {
      const result = squareMeterToAcre(0);
      expect(result).toBe(0);
    });
  });

  describe('acreToSquareMeter', () => {
    test('should convert 1 acre to square meters', () => {
      const result = acreToSquareMeter(1);
      expect(result).toBeCloseTo(4047, 0);
    });

    test('should convert 0.5 acres to square meters', () => {
      const result = acreToSquareMeter(0.5);
      expect(result).toBeCloseTo(2023.5, 0);
    });

    test('should handle decimal results', () => {
      const result = acreToSquareMeter(0.1);
      expect(result).toBeCloseTo(404.7, 1);
    });
  });
});

describe('Measurement Converter - Generic Convert Function', () => {
  describe('Basic conversions', () => {
    test('should convert acre to hectare', () => {
      const result = convert(1, 'acre', 'hectare');
      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(0.4047, 3);
    });

    test('should convert hectare to acre', () => {
      const result = convert(1, 'hectare', 'acre');
      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(2.4711, 3);
    });

    test('should convert bigha to acre', () => {
      const result = convert(1, 'bigha', 'acre');
      expect(result.success).toBe(true);
      expect(result.value).toBe(0.25);
    });

    test('should convert square_meter to acre', () => {
      const result = convert(4047, 'square_meter', 'acre');
      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(1, 2);
    });
  });

  describe('Case insensitivity', () => {
    test('should handle uppercase units', () => {
      const result = convert(1, 'ACRE', 'HECTARE');
      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(0.4047, 3);
    });

    test('should handle mixed case units', () => {
      const result = convert(1, 'AcRe', 'HeCtARe');
      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(0.4047, 3);
    });

    test('should trim whitespace', () => {
      const result = convert(1, '  acre  ', '  hectare  ');
      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(0.4047, 3);
    });
  });

  describe('Indirect conversions (through pivot)', () => {
    test('should convert bigha to hectare (through acre)', () => {
      const result = convert(4, 'bigha', 'hectare');
      expect(result.success).toBe(true);
      // 4 bigha = 1 acre = 0.4047 hectare
      expect(result.value).toBeCloseTo(0.4047, 3);
    });

    test('should convert square_meter to hectare (through acre)', () => {
      const result = convert(40470, 'square_meter', 'hectare');
      expect(result.success).toBe(true);
      // Approximately 10 acres = ~4.047 hectares
      expect(result.value).toBeCloseTo(4.047, 2);
    });

    test('should convert bigha to square_meter (through acre)', () => {
      const result = convert(1, 'bigha', 'square_meter');
      expect(result.success).toBe(true);
      // 1 bigha = 0.25 acre ≈ 1011.75 sqm
      expect(result.value).toBeCloseTo(1011.75, 0);
    });
  });

  describe('Same unit conversion', () => {
    test('should return same value when converting to same unit', () => {
      const result = convert(5, 'acre', 'acre');
      expect(result.success).toBe(true);
      expect(result.value).toBe(5);
    });

    test('should work for all unit types', () => {
      const units = ['acre', 'hectare', 'bigha', 'square_meter'];
      units.forEach((unit) => {
        const result = convert(10, unit, unit);
        expect(result.success).toBe(true);
        expect(result.value).toBe(10);
      });
    });
  });

  describe('Error handling', () => {
    test('should reject null value', () => {
      const result = convert(null, 'acre', 'hectare');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid value');
    });

    test('should reject undefined value', () => {
      const result = convert(undefined, 'acre', 'hectare');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid value');
    });

    test('should reject NaN value', () => {
      const result = convert(NaN, 'acre', 'hectare');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid value');
    });

    test('should reject negative values', () => {
      const result = convert(-5, 'acre', 'hectare');
      expect(result.success).toBe(false);
      expect(result.error).toContain('negative');
    });

    test('should reject invalid fromUnit', () => {
      const result = convert(1, 'invalid_unit', 'hectare');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid source unit');
    });

    test('should reject invalid toUnit', () => {
      const result = convert(1, 'acre', 'invalid_unit');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid target unit');
    });
  });

  describe('Precision', () => {
    test('should maintain precision to 4 decimal places', () => {
      const result = convert(1.23456, 'acre', 'hectare');
      expect(result.success).toBe(true);
      // Should be rounded to 4 places
      expect(result.value.toString().split('.')[1]?.length).toBeLessThanOrEqual(4);
    });

    test('should handle very small values', () => {
      const result = convert(0.0001, 'acre', 'hectare');
      expect(result.success).toBe(true);
      expect(result.value).toBeGreaterThan(0);
    });

    test('should handle very large values', () => {
      const result = convert(1000000, 'acre', 'hectare');
      expect(result.success).toBe(true);
      expect(result.value).toBeGreaterThan(0);
    });
  });
});

describe('Batch Conversion', () => {
  test('should convert multiple values', () => {
    const conversions = [
      { value: 1, fromUnit: 'acre', toUnit: 'hectare' },
      { value: 4, fromUnit: 'bigha', toUnit: 'acre' },
      { value: 4047, fromUnit: 'square_meter', toUnit: 'acre' },
    ];

    const results = batchConvert(conversions);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(3);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(true);
    expect(results[2].success).toBe(true);
  });

  test('should include index in results', () => {
    const conversions = [
      { value: 1, fromUnit: 'acre', toUnit: 'hectare' },
      { value: 2, fromUnit: 'acre', toUnit: 'hectare' },
    ];

    const results = batchConvert(conversions);
    expect(results[0].index).toBe(0);
    expect(results[1].index).toBe(1);
  });

  test('should handle mixed valid and invalid conversions', () => {
    const conversions = [
      { value: 1, fromUnit: 'acre', toUnit: 'hectare' },
      { value: -1, fromUnit: 'acre', toUnit: 'hectare' },
      { value: 1, fromUnit: 'invalid', toUnit: 'hectare' },
    ];

    const results = batchConvert(conversions);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(false);
    expect(results[2].success).toBe(false);
  });

  test('should reject non-array input', () => {
    const result = batchConvert('not an array');
    expect(result.success).toBe(false);
    expect(result.error).toContain('array');
  });
});

describe('getSupportedConversions', () => {
  test('should return supported units', () => {
    const data = getSupportedConversions();
    expect(data.supportedUnits).toContain('acre');
    expect(data.supportedUnits).toContain('hectare');
    expect(data.supportedUnits).toContain('bigha');
    expect(data.supportedUnits).toContain('square_meter');
  });

  test('should include conversion factors', () => {
    const data = getSupportedConversions();
    expect(Array.isArray(data.conversions)).toBe(true);
    expect(data.conversions.length).toBeGreaterThan(0);
    expect(data.conversions[0]).toHaveProperty('from');
    expect(data.conversions[0]).toHaveProperty('to');
    expect(data.conversions[0]).toHaveProperty('factor');
  });

  test('should include unit labels', () => {
    const data = getSupportedConversions();
    expect(data.unitLabels).toHaveProperty('acre');
    expect(data.unitLabels).toHaveProperty('hectare');
    expect(data.unitLabels).toHaveProperty('bigha');
    expect(data.unitLabels).toHaveProperty('square_meter');
  });
});

describe('Conversion Constants', () => {
  test('UNITS should have all expected units', () => {
    expect(UNITS.ACRE).toBe('acre');
    expect(UNITS.HECTARE).toBe('hectare');
    expect(UNITS.BIGHA).toBe('bigha');
    expect(UNITS.SQUARE_METER).toBe('square_meter');
  });

  test('CONVERSION_FACTORS should have all expected factors', () => {
    expect(CONVERSION_FACTORS.ACRE_TO_HECTARE).toBeCloseTo(0.4047, 3);
    expect(CONVERSION_FACTORS.BIGHA_TO_ACRE).toBe(0.25);
    expect(CONVERSION_FACTORS.SQUARE_METER_TO_ACRE).toBeCloseTo(0.000247, 6);
  });
});
