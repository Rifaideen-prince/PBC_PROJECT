import { describe, it, expect } from 'vitest';
import {
  calculateTemperatureDrop,
  calculateCoolingRate,
  calculateTemperatureDifference,
  calculateCoolingRateReduction,
  getInitialAndFinalReadings,
  rankMaterials,
} from '../utils/calculations';
import { SensorReading } from '../types/sensor';
import { MaterialMetrics } from '../types/analysis';

describe('Calculation Utilities', () => {
  describe('calculateTemperatureDrop', () => {
    it('calculates Delta T correctly for cooling water', () => {
      expect(calculateTemperatureDrop(75.5, 50.2)).toBe(25.3);
      expect(calculateTemperatureDrop(80.0, 80.0)).toBe(0);
    });

    it('returns null if either initial or final reading is null', () => {
      expect(calculateTemperatureDrop(null, 50.0)).toBeNull();
      expect(calculateTemperatureDrop(75.0, null)).toBeNull();
      expect(calculateTemperatureDrop(null, null)).toBeNull();
    });

    it('returns null for non-finite values', () => {
      expect(calculateTemperatureDrop(NaN, 50.0)).toBeNull();
      expect(calculateTemperatureDrop(75.0, Infinity)).toBeNull();
    });
  });

  describe('calculateCoolingRate', () => {
    it('calculates cooling rate in °C per minute', () => {
      // 75°C to 45°C (drop of 30°C) over 600 seconds (10 minutes) -> 3.000 °C/min
      const rate = calculateCoolingRate(75.0, 45.0, 600);
      expect(rate).toBe(3.0);
    });

    it('returns null if elapsed seconds is 0 or negative', () => {
      expect(calculateCoolingRate(75.0, 45.0, 0)).toBeNull();
      expect(calculateCoolingRate(75.0, 45.0, -10)).toBeNull();
    });

    it('returns null when temperatures are missing', () => {
      expect(calculateCoolingRate(null, 50.0, 600)).toBeNull();
      expect(calculateCoolingRate(75.0, null, 600)).toBeNull();
    });
  });

  describe('calculateTemperatureDifference', () => {
    it('calculates difference between reference and sample at time t', () => {
      // Reference = 65°C, Sample = 70°C (Sample is 5°C warmer)
      // Diff = Ref - Sample = -5°C
      expect(calculateTemperatureDifference(65.0, 70.0)).toBe(-5.0);

      // Reference = 70°C, Sample = 65°C
      expect(calculateTemperatureDifference(70.0, 65.0)).toBe(5.0);
    });

    it('returns null if either sensor value is missing', () => {
      expect(calculateTemperatureDifference(null, 65.0)).toBeNull();
      expect(calculateTemperatureDifference(70.0, null)).toBeNull();
    });
  });

  describe('calculateCoolingRateReduction', () => {
    it('calculates percentage reduction in cooling rate', () => {
      // Ref cools at 2.0 °C/min, Sample cools at 1.5 °C/min
      // Reduction = ((2.0 - 1.5) / 2.0) * 100 = 25.0%
      const res = calculateCoolingRateReduction(2.0, 1.5);
      expect(res.isValid).toBe(true);
      expect(res.reductionPercent).toBe(25.0);
    });

    it('flags calculation invalid when reference cooling rate is zero or near zero', () => {
      const res = calculateCoolingRateReduction(0.0005, 1.0);
      expect(res.isValid).toBe(false);
      expect(res.reductionPercent).toBeNull();
      expect(res.reason).toContain('near zero or negative');
    });

    it('handles negative reduction correctly when sample cools faster than reference', () => {
      // Ref cools at 2.0 °C/min, Sample cools at 2.5 °C/min -> -25%
      const res = calculateCoolingRateReduction(2.0, 2.5);
      expect(res.isValid).toBe(true);
      expect(res.reductionPercent).toBe(-25.0);
    });

    it('returns invalid result when values are null', () => {
      const res = calculateCoolingRateReduction(null, 1.5);
      expect(res.isValid).toBe(false);
      expect(res.reductionPercent).toBeNull();
    });
  });

  describe('getInitialAndFinalReadings', () => {
    it('extracts initial and final valid values and ignores nulls', () => {
      const mockReadings: SensorReading[] = [
        { sequence: 1, elapsedMs: 0, receivedAt: '', referenceTempC: null, sampleTempC: null, ambientTempC: null, humidityPercent: null, isValidReference: false, isValidSample: false, isValidAmbient: false, isValidHumidity: false },
        { sequence: 2, elapsedMs: 1000, receivedAt: '', referenceTempC: 75.2, sampleTempC: 74.8, ambientTempC: null, humidityPercent: null, isValidReference: true, isValidSample: true, isValidAmbient: false, isValidHumidity: false },
        { sequence: 3, elapsedMs: 2000, receivedAt: '', referenceTempC: 74.5, sampleTempC: 74.3, ambientTempC: null, humidityPercent: null, isValidReference: true, isValidSample: true, isValidAmbient: false, isValidHumidity: false },
        { sequence: 4, elapsedMs: 3000, receivedAt: '', referenceTempC: null, sampleTempC: 73.9, ambientTempC: null, humidityPercent: null, isValidReference: false, isValidSample: true, isValidAmbient: false, isValidHumidity: false },
      ];

      const refBounds = getInitialAndFinalReadings(mockReadings, 'referenceTempC');
      expect(refBounds.initial).toBe(75.2);
      expect(refBounds.final).toBe(74.5);
      expect(refBounds.elapsedSeconds).toBe(1); // 2000 - 1000 ms

      const sampleBounds = getInitialAndFinalReadings(mockReadings, 'sampleTempC');
      expect(sampleBounds.initial).toBe(74.8);
      expect(sampleBounds.final).toBe(73.9);
      expect(sampleBounds.elapsedSeconds).toBe(2); // 3000 - 1000 ms
    });
  });

  describe('rankMaterials', () => {
    const metrics: MaterialMetrics[] = [
      { materialName: 'Bubble wrap', initialTempC: 75.0, finalTempC: 62.0, totalDropC: 13.0, durationMinutes: 15, coolingRateCPerMin: 0.866, coolingRateReductionPercent: 30, referenceCoolingRateCPerMin: 1.2, isReductionValid: true },
      { materialName: 'Packaging foam', initialTempC: 75.0, finalTempC: 66.0, totalDropC: 9.0, durationMinutes: 15, coolingRateCPerMin: 0.600, coolingRateReductionPercent: 50, referenceCoolingRateCPerMin: 1.2, isReductionValid: true },
      { materialName: 'Uninsulated Reference', initialTempC: 75.0, finalTempC: 57.0, totalDropC: 18.0, durationMinutes: 15, coolingRateCPerMin: 1.200, coolingRateReductionPercent: 0, referenceCoolingRateCPerMin: 1.2, isReductionValid: true },
    ];

    it('ranks by minimum cooling rate (slower cooling is rank 1)', () => {
      const ranked = rankMaterials(metrics, 'cooling_rate');
      expect(ranked[0].materialName).toBe('Packaging foam');
      expect(ranked[1].materialName).toBe('Bubble wrap');
      expect(ranked[2].materialName).toBe('Uninsulated Reference');
    });

    it('ranks by maximum final temperature (higher retention is rank 1)', () => {
      const ranked = rankMaterials(metrics, 'final_temp');
      expect(ranked[0].materialName).toBe('Packaging foam');
      expect(ranked[1].materialName).toBe('Bubble wrap');
      expect(ranked[2].materialName).toBe('Uninsulated Reference');
    });

    it('ranks by minimum temperature drop', () => {
      const ranked = rankMaterials(metrics, 'temp_drop');
      expect(ranked[0].materialName).toBe('Packaging foam');
      expect(ranked[1].materialName).toBe('Bubble wrap');
      expect(ranked[2].materialName).toBe('Uninsulated Reference');
    });
  });
});
