import { Experiment } from '../types/experiment';
import { SensorReading } from '../types/sensor';

/**
 * Generates deterministic synthetic cooling curve according to Newton's Law of Cooling:
 * T(t) = T_ambient + (T_0 - T_ambient) * exp(-k * t)
 */
function generateCoolingSequence(
  durationSeconds: number,
  initialTempC: number,
  ambientTempC: number,
  humidityPercent: number,
  kRef: number,
  kSample: number
): SensorReading[] {
  const readings: SensorReading[] = [];
  const baseTime = new Date('2026-10-21T10:00:00Z').getTime();

  for (let sec = 0; sec <= durationSeconds; sec += 1) {
    // Physical cooling equation
    const refTemp = ambientTempC + (initialTempC - ambientTempC) * Math.exp(-kRef * sec);
    const sampleTemp = ambientTempC + (initialTempC - ambientTempC) * Math.exp(-kSample * sec);

    // Subtle deterministic micro-fluctuation (< 0.03°C) representing 12-bit DS18B20 ADC step
    const noiseRef = Math.sin(sec * 0.1) * 0.02;
    const noiseSample = Math.cos(sec * 0.12) * 0.02;

    readings.push({
      sequence: sec + 1,
      elapsedMs: sec * 1000,
      receivedAt: new Date(baseTime + sec * 1000).toISOString(),
      referenceTempC: Number((refTemp + noiseRef).toFixed(2)),
      sampleTempC: Number((sampleTemp + noiseSample).toFixed(2)),
      ambientTempC: Number((ambientTempC + Math.sin(sec * 0.02) * 0.1).toFixed(1)),
      humidityPercent: Number((humidityPercent + Math.cos(sec * 0.03) * 0.2).toFixed(1)),
      isValidReference: true,
      isValidSample: true,
      isValidAmbient: true,
      isValidHumidity: true,
    });
  }

  return readings;
}

export function createDemoBubbleWrapExperiment(): Experiment {
  const duration = 900; // 15 minutes
  const readings = generateCoolingSequence(
    duration,
    74.5, // Initial water temp
    24.2, // Ambient temp
    48.5, // Ambient humidity
    0.00160, // Reference cooling constant
    0.00108  // Bubble wrap cooling constant
  );

  return {
    id: 'demo-run-bubble-wrap-01',
    name: '[DEMO] Bubble Wrap Configuration Test',
    sampleMaterial: 'Bubble wrap',
    targetDurationSeconds: duration,
    waterVolumeMl: 250,
    targetInitialTemperatureC: 75.0,
    insulationThicknessMm: 4.0,
    insulationLayers: 2,
    operator: 'Dr. E. Vance / MSE Lab',
    notes: 'DEMO DATA — NOT REAL SENSOR MEASUREMENTS. Synthesized benchmark run for laboratory validation.',
    createdAt: '2026-10-21T10:00:00.000Z',
    updatedAt: '2026-10-21T10:15:00.000Z',
    startedAt: '2026-10-21T10:00:00.000Z',
    endedAt: '2026-10-21T10:15:00.000Z',
    status: 'completed',
    checklistConfirmed: true,
    isDemo: true,
    readings,
  };
}

export function createDemoPackagingFoamExperiment(): Experiment {
  const duration = 900; // 15 minutes
  const readings = generateCoolingSequence(
    duration,
    74.2, // Initial water temp
    24.3, // Ambient temp
    48.0, // Ambient humidity
    0.00162, // Reference cooling constant
    0.00078  // Packaging foam cooling constant (superior insulation)
  );

  return {
    id: 'demo-run-packaging-foam-01',
    name: '[DEMO] Packaging Foam Configuration Test',
    sampleMaterial: 'Packaging foam',
    targetDurationSeconds: duration,
    waterVolumeMl: 250,
    targetInitialTemperatureC: 75.0,
    insulationThicknessMm: 5.0,
    insulationLayers: 1,
    operator: 'Dr. E. Vance / MSE Lab',
    notes: 'DEMO DATA — NOT REAL SENSOR MEASUREMENTS. Synthesized benchmark run for laboratory validation.',
    createdAt: '2026-10-21T10:30:00.000Z',
    updatedAt: '2026-10-21T10:45:00.000Z',
    startedAt: '2026-10-21T10:30:00.000Z',
    endedAt: '2026-10-21T10:45:00.000Z',
    status: 'completed',
    checklistConfirmed: true,
    isDemo: true,
    readings,
  };
}
