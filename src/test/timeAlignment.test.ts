import { describe, it, expect } from 'vitest';
import { getInterpolatedValueAtTime, alignComparisonRuns, validateRunCompatibility } from '../utils/timeAlignment';
import { SensorReading } from '../types/sensor';
import { Experiment } from '../types/experiment';

describe('Time Alignment & Reference Averaging', () => {
  const sampleReadings: SensorReading[] = [
    { sequence: 1, elapsedMs: 0, receivedAt: '', referenceTempC: 75.0, sampleTempC: 75.0, ambientTempC: null, humidityPercent: null, isValidReference: true, isValidSample: true, isValidAmbient: false, isValidHumidity: false },
    { sequence: 2, elapsedMs: 10000, receivedAt: '', referenceTempC: 73.0, sampleTempC: 74.0, ambientTempC: null, humidityPercent: null, isValidReference: true, isValidSample: true, isValidAmbient: false, isValidHumidity: false },
    { sequence: 3, elapsedMs: 20000, receivedAt: '', referenceTempC: 71.0, sampleTempC: 73.0, ambientTempC: null, humidityPercent: null, isValidReference: true, isValidSample: true, isValidAmbient: false, isValidHumidity: false },
  ];

  describe('getInterpolatedValueAtTime', () => {
    it('returns exact value when elapsed second matches data point', () => {
      const val = getInterpolatedValueAtTime(sampleReadings, 10, 'referenceTempC');
      expect(val).toBe(73.0);
    });

    it('interpolates linearly between adjacent valid points', () => {
      // Halfway between 0s (75.0°C) and 10s (73.0°C) at 5s -> 74.0°C
      const val = getInterpolatedValueAtTime(sampleReadings, 5, 'referenceTempC');
      expect(val).toBe(74.0);
    });

    it('never extrapolates before the first data point', () => {
      const val = getInterpolatedValueAtTime(sampleReadings, -1, 'referenceTempC');
      expect(val).toBeNull();
    });

    it('never extrapolates beyond the last data point', () => {
      const val = getInterpolatedValueAtTime(sampleReadings, 21, 'referenceTempC');
      expect(val).toBeNull();
    });

    it('returns null if gap between points exceeds maxGapSeconds', () => {
      const gappedReadings: SensorReading[] = [
        { sequence: 1, elapsedMs: 0, receivedAt: '', referenceTempC: 75.0, sampleTempC: null, ambientTempC: null, humidityPercent: null, isValidReference: true, isValidSample: false, isValidAmbient: false, isValidHumidity: false },
        { sequence: 2, elapsedMs: 30000, receivedAt: '', referenceTempC: 70.0, sampleTempC: null, ambientTempC: null, humidityPercent: null, isValidReference: true, isValidSample: false, isValidAmbient: false, isValidHumidity: false },
      ];
      // Gap is 30s > maxGap (default 5s)
      const val = getInterpolatedValueAtTime(gappedReadings, 15, 'referenceTempC', 5);
      expect(val).toBeNull();
    });
  });

  describe('alignComparisonRuns', () => {
    it('aligns runs and computes average reference curve without zero substitution', () => {
      const expA: Experiment = {
        id: 'run-a',
        name: 'Bubble Wrap Run',
        sampleMaterial: 'Bubble wrap',
        targetDurationSeconds: 10,
        createdAt: '',
        updatedAt: '',
        status: 'completed',
        checklistConfirmed: true,
        readings: [
          { sequence: 1, elapsedMs: 0, receivedAt: '', referenceTempC: 75.0, sampleTempC: 75.0, ambientTempC: null, humidityPercent: null, isValidReference: true, isValidSample: true, isValidAmbient: false, isValidHumidity: false },
          { sequence: 2, elapsedMs: 5000, receivedAt: '', referenceTempC: 73.0, sampleTempC: 74.0, ambientTempC: null, humidityPercent: null, isValidReference: true, isValidSample: true, isValidAmbient: false, isValidHumidity: false },
        ],
      };

      const expB: Experiment = {
        id: 'run-b',
        name: 'Foam Run',
        sampleMaterial: 'Packaging foam',
        targetDurationSeconds: 10,
        createdAt: '',
        updatedAt: '',
        status: 'completed',
        checklistConfirmed: true,
        readings: [
          { sequence: 1, elapsedMs: 0, receivedAt: '', referenceTempC: 77.0, sampleTempC: 77.0, ambientTempC: null, humidityPercent: null, isValidReference: true, isValidSample: true, isValidAmbient: false, isValidHumidity: false },
          { sequence: 2, elapsedMs: 5000, receivedAt: '', referenceTempC: 75.0, sampleTempC: 76.5, ambientTempC: null, humidityPercent: null, isValidReference: true, isValidSample: true, isValidAmbient: false, isValidHumidity: false },
        ],
      };

      const points = alignComparisonRuns(expA, expB, 5);
      expect(points.length).toBe(2);

      // At t=0s: RefA=75.0, RefB=77.0 -> Avg Ref = 76.0
      expect(points[0].elapsedSeconds).toBe(0);
      expect(points[0].avgReferenceTempC).toBe(76.0);
      expect(points[0].bubbleWrapTempC).toBe(75.0);
      expect(points[0].packagingFoamTempC).toBe(77.0);

      // At t=5s: RefA=73.0, RefB=75.0 -> Avg Ref = 74.0
      expect(points[1].elapsedSeconds).toBe(5);
      expect(points[1].avgReferenceTempC).toBe(74.0);
    });
  });

  describe('validateRunCompatibility', () => {
    it('detects significant duration mismatch', () => {
      const expA: Experiment = {
        id: 'a', name: 'A', sampleMaterial: 'Bubble wrap', targetDurationSeconds: 900, createdAt: '', updatedAt: '', status: 'completed', checklistConfirmed: true,
        readings: [
          { sequence: 1, elapsedMs: 0, receivedAt: '', referenceTempC: 75, sampleTempC: 75, ambientTempC: null, humidityPercent: null, isValidReference: true, isValidSample: true, isValidAmbient: false, isValidHumidity: false },
          { sequence: 2, elapsedMs: 300000, receivedAt: '', referenceTempC: 60, sampleTempC: 65, ambientTempC: null, humidityPercent: null, isValidReference: true, isValidSample: true, isValidAmbient: false, isValidHumidity: false },
        ]
      };
      const expB: Experiment = {
        id: 'b', name: 'B', sampleMaterial: 'Packaging foam', targetDurationSeconds: 900, createdAt: '', updatedAt: '', status: 'completed', checklistConfirmed: true,
        readings: [
          { sequence: 1, elapsedMs: 0, receivedAt: '', referenceTempC: 75, sampleTempC: 75, ambientTempC: null, humidityPercent: null, isValidReference: true, isValidSample: true, isValidAmbient: false, isValidHumidity: false },
          { sequence: 2, elapsedMs: 900000, receivedAt: '', referenceTempC: 45, sampleTempC: 55, ambientTempC: null, humidityPercent: null, isValidReference: true, isValidSample: true, isValidAmbient: false, isValidHumidity: false },
        ]
      };

      const result = validateRunCompatibility(expA, expB);
      expect(result.isCompatible).toBe(false);
      expect(result.warnings.some(w => w.includes('durations differ'))).toBe(true);
    });
  });
});
