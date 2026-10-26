import { SensorReading } from '../types/sensor';
import { Experiment } from '../types/experiment';
import { TimeAlignedComparisonPoint, CompatibilityCheckResult } from '../types/analysis';

/**
 * Finds the value at a specific elapsed seconds mark using nearest-neighbor / bounded linear interpolation.
 * NEVER extrapolates outside the minimum and maximum elapsed times of the readings.
 * Returns null if no valid data point exists within tolerance.
 */
export function getInterpolatedValueAtTime(
  readings: SensorReading[],
  elapsedSeconds: number,
  field: 'referenceTempC' | 'sampleTempC',
  maxGapSeconds = 15
): number | null {
  if (!readings || readings.length === 0) return null;

  // Filter only readings that have valid numbers for this field
  const validPoints = readings
    .filter(r => r[field] !== null && Number.isFinite(r[field]))
    .map(r => ({ t: r.elapsedMs / 1000, v: r[field] as number }))
    .sort((a, b) => a.t - b.t);

  if (validPoints.length === 0) return null;

  const firstT = validPoints[0].t;
  const lastT = validPoints[validPoints.length - 1].t;

  // Never extrapolate beyond bounds
  if (elapsedSeconds < firstT || elapsedSeconds > lastT) {
    return null;
  }

  // Exact match
  const exact = validPoints.find(p => Math.abs(p.t - elapsedSeconds) < 0.05);
  if (exact) return Number(exact.v.toFixed(3));

  // Find surrounding points for bounded linear interpolation
  let before: { t: number; v: number } | null = null;
  let after: { t: number; v: number } | null = null;

  for (let i = 0; i < validPoints.length; i++) {
    if (validPoints[i].t <= elapsedSeconds) {
      before = validPoints[i];
    } else {
      after = validPoints[i];
      break;
    }
  }

  if (!before || !after) {
    return before ? Number(before.v.toFixed(3)) : null;
  }

  // Check if gap is within acceptable scientific tolerance
  const gap = after.t - before.t;
  if (gap > maxGapSeconds) {
    // Gap too large to safely interpolate
    return null;
  }

  // Linear interpolation
  const fraction = (elapsedSeconds - before.t) / (after.t - before.t);
  const interpolated = before.v + fraction * (after.v - before.v);
  return Number(interpolated.toFixed(3));
}

/**
 * Builds time-aligned comparison points across Bubble Wrap run, Packaging Foam run, and Average Reference
 */
export function alignComparisonRuns(
  bubbleWrapExp: Experiment | null,
  packagingFoamExp: Experiment | null,
  stepSeconds = 1
): TimeAlignedComparisonPoint[] {
  if (!bubbleWrapExp && !packagingFoamExp) return [];

  // Determine maximum overlapping duration
  const durations: number[] = [];
  if (bubbleWrapExp && bubbleWrapExp.readings.length > 0) {
    const maxT = Math.max(...bubbleWrapExp.readings.map(r => r.elapsedMs / 1000));
    durations.push(maxT);
  }
  if (packagingFoamExp && packagingFoamExp.readings.length > 0) {
    const maxT = Math.max(...packagingFoamExp.readings.map(r => r.elapsedMs / 1000));
    durations.push(maxT);
  }

  if (durations.length === 0) return [];
  const maxTime = Math.max(...durations);

  const points: TimeAlignedComparisonPoint[] = [];

  for (let t = 0; t <= maxTime; t += stepSeconds) {
    const bubbleRef = bubbleWrapExp
      ? getInterpolatedValueAtTime(bubbleWrapExp.readings, t, 'referenceTempC')
      : null;
    const foamRef = packagingFoamExp
      ? getInterpolatedValueAtTime(packagingFoamExp.readings, t, 'referenceTempC')
      : null;

    // Calculate Average Reference Curve
    let avgRef: number | null = null;
    if (bubbleRef !== null && foamRef !== null) {
      avgRef = Number(((bubbleRef + foamRef) / 2).toFixed(3));
    } else if (bubbleRef !== null) {
      avgRef = bubbleRef;
    } else if (foamRef !== null) {
      avgRef = foamRef;
    }

    const bubbleSample = bubbleWrapExp
      ? getInterpolatedValueAtTime(bubbleWrapExp.readings, t, 'sampleTempC')
      : null;
    const foamSample = packagingFoamExp
      ? getInterpolatedValueAtTime(packagingFoamExp.readings, t, 'sampleTempC')
      : null;

    const diffBubble = (avgRef !== null && bubbleSample !== null)
      ? Number((avgRef - bubbleSample).toFixed(3))
      : null;
    const diffFoam = (avgRef !== null && foamSample !== null)
      ? Number((avgRef - foamSample).toFixed(3))
      : null;

    points.push({
      elapsedSeconds: t,
      avgReferenceTempC: avgRef,
      bubbleWrapTempC: bubbleSample,
      packagingFoamTempC: foamSample,
      diffBubbleWrapC: diffBubble,
      diffPackagingFoamC: diffFoam,
    });
  }

  return points;
}

/**
 * Validates scientific compatibility between two experimental runs prior to comparison
 */
export function validateRunCompatibility(
  runA: Experiment | null,
  runB: Experiment | null
): CompatibilityCheckResult {
  const warnings: string[] = [];

  if (!runA || !runB) {
    return {
      isCompatible: false,
      warnings: ['Both Bubble Wrap and Packaging Foam runs must be selected for dual-sample comparison.'],
      referenceRunCount: (runA ? 1 : 0) + (runB ? 1 : 0),
      initialTempDiffC: 0,
      durationDiffSec: 0,
    };
  }

  // Duration difference
  const durA = runA.readings.length > 0 ? (runA.readings[runA.readings.length - 1].elapsedMs - runA.readings[0].elapsedMs) / 1000 : 0;
  const durB = runB.readings.length > 0 ? (runB.readings[runB.readings.length - 1].elapsedMs - runB.readings[0].elapsedMs) / 1000 : 0;
  const durationDiffSec = Math.abs(durA - durB);

  if (durationDiffSec > 120) {
    warnings.push(`Experiment durations differ significantly (${Math.round(durA)}s vs ${Math.round(durB)}s). Comparison limited to overlapping period.`);
  }

  // Initial water temperature difference
  const initA = runA.readings.find(r => r.sampleTempC !== null)?.sampleTempC ?? null;
  const initB = runB.readings.find(r => r.sampleTempC !== null)?.sampleTempC ?? null;
  const initialTempDiffC = (initA !== null && initB !== null) ? Math.abs(initA - initB) : 0;

  if (initialTempDiffC > 3.0) {
    warnings.push(`Initial water temperatures deviate by ${initialTempDiffC.toFixed(1)} °C (${initA?.toFixed(1)} °C vs ${initB?.toFixed(1)} °C). Heat transfer rates may exhibit baseline offset.`);
  }

  // Water volume
  let waterVolumeDiffMl: number | undefined;
  if (runA.waterVolumeMl && runB.waterVolumeMl) {
    waterVolumeDiffMl = Math.abs(runA.waterVolumeMl - runB.waterVolumeMl);
    if (waterVolumeDiffMl > 10) {
      warnings.push(`Water volumes differ by ${waterVolumeDiffMl} mL (${runA.waterVolumeMl} mL vs ${runB.waterVolumeMl} mL), affecting thermal mass.`);
    }
  }

  return {
    isCompatible: warnings.length === 0,
    warnings,
    referenceRunCount: 2,
    initialTempDiffC,
    durationDiffSec,
    waterVolumeDiffMl,
  };
}
