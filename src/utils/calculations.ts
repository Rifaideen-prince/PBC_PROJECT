import { MaterialMetrics, RankingCriterion, MaterialRankResult } from '../types/analysis';
import { SensorReading } from '../types/sensor';

/**
 * Calculates total temperature drop: Delta T = T_initial - T_final
 * Positive value represents cooling.
 */
export function calculateTemperatureDrop(initialTempC: number | null, finalTempC: number | null): number | null {
  if (initialTempC === null || finalTempC === null) return null;
  if (!Number.isFinite(initialTempC) || !Number.isFinite(finalTempC)) return null;
  return Number((initialTempC - finalTempC).toFixed(3));
}

/**
 * Calculates average cooling rate in °C per minute
 * Cooling Rate = (T_initial - T_final) / Elapsed Time (minutes)
 */
export function calculateCoolingRate(
  initialTempC: number | null,
  finalTempC: number | null,
  elapsedSeconds: number
): number | null {
  if (initialTempC === null || finalTempC === null) return null;
  if (!Number.isFinite(initialTempC) || !Number.isFinite(finalTempC)) return null;
  if (elapsedSeconds <= 0 || !Number.isFinite(elapsedSeconds)) return null;

  const elapsedMinutes = elapsedSeconds / 60;
  const drop = initialTempC - finalTempC;
  return Number((drop / elapsedMinutes).toFixed(3));
}

/**
 * Calculates temperature difference at time t:
 * Difference(t) = Reference(t) - Sample(t)
 * A positive value means reference water is warmer (i.e. sample is cooler or sample insulation retained less heat).
 * A negative value means sample water is warmer (insulation kept it hotter than uninsulated reference).
 */
export function calculateTemperatureDifference(
  refTempC: number | null,
  sampleTempC: number | null
): number | null {
  if (refTempC === null || sampleTempC === null) return null;
  if (!Number.isFinite(refTempC) || !Number.isFinite(sampleTempC)) return null;
  return Number((refTempC - sampleTempC).toFixed(3));
}

/**
 * Calculates Cooling-Rate Reduction (%):
 * ((Ref Cooling Rate - Sample Cooling Rate) / Ref Cooling Rate) * 100
 * Only calculated when reference cooling rate is strictly positive and sufficiently far from zero (> 0.001 °C/min).
 */
export function calculateCoolingRateReduction(
  refRate: number | null,
  sampleRate: number | null
): { reductionPercent: number | null; isValid: boolean; reason?: string } {
  if (refRate === null || sampleRate === null) {
    return { reductionPercent: null, isValid: false, reason: 'Missing reference or sample rate data' };
  }
  if (!Number.isFinite(refRate) || !Number.isFinite(sampleRate)) {
    return { reductionPercent: null, isValid: false, reason: 'Non-finite rate values' };
  }
  const MIN_SIGNIFICANT_RATE = 0.001; // °C/min
  if (refRate <= MIN_SIGNIFICANT_RATE) {
    return {
      reductionPercent: null,
      isValid: false,
      reason: `Reference cooling rate (${refRate.toFixed(3)} °C/min) is near zero or negative`,
    };
  }

  const reduction = ((refRate - sampleRate) / refRate) * 100;
  return {
    reductionPercent: Number(reduction.toFixed(2)),
    isValid: true,
  };
}

/**
 * Extracts initial and final valid readings for a specific sensor type from a sequence
 */
export function getInitialAndFinalReadings(
  readings: SensorReading[],
  key: 'referenceTempC' | 'sampleTempC'
): { initial: number | null; final: number | null; elapsedSeconds: number } {
  if (!readings || readings.length === 0) {
    return { initial: null, final: null, elapsedSeconds: 0 };
  }

  let initial: number | null = null;
  let final: number | null = null;
  let firstValidElapsedMs = 0;
  let lastValidElapsedMs = 0;

  for (let i = 0; i < readings.length; i++) {
    const val = readings[i][key];
    if (val !== null && Number.isFinite(val)) {
      if (initial === null) {
        initial = val;
        firstValidElapsedMs = readings[i].elapsedMs;
      }
      final = val;
      lastValidElapsedMs = readings[i].elapsedMs;
    }
  }

  const elapsedSeconds = Math.max(0, (lastValidElapsedMs - firstValidElapsedMs) / 1000);
  return { initial, final, elapsedSeconds };
}

/**
 * Ranks tested materials according to chosen scientific criterion
 */
export function rankMaterials(
  metricsList: MaterialMetrics[],
  criterion: RankingCriterion
): MaterialRankResult[] {
  if (!metricsList || metricsList.length === 0) return [];

  const valid = [...metricsList].filter(m => {
    if (criterion === 'final_temp') return m.finalTempC !== null;
    if (criterion === 'temp_drop') return m.totalDropC !== null;
    if (criterion === 'cooling_rate') return m.coolingRateCPerMin !== null;
    return false;
  });

  valid.sort((a, b) => {
    if (criterion === 'final_temp') {
      // Higher final temp = better heat retention
      return (b.finalTempC ?? 0) - (a.finalTempC ?? 0);
    }
    if (criterion === 'temp_drop') {
      // Lower total drop = better heat retention
      return (a.totalDropC ?? 0) - (b.totalDropC ?? 0);
    }
    if (criterion === 'cooling_rate') {
      // Lower cooling rate = better heat retention
      return (a.coolingRateCPerMin ?? 0) - (b.coolingRateCPerMin ?? 0);
    }
    return 0;
  });

  return valid.map((m, idx) => {
    let scoreValue = 0;
    let scoreFormatted = '';
    let interpretation = '';

    if (criterion === 'final_temp') {
      scoreValue = m.finalTempC ?? 0;
      scoreFormatted = `${scoreValue.toFixed(2)} °C`;
      interpretation = 'Higher final temperature denotes lower thermal loss';
    } else if (criterion === 'temp_drop') {
      scoreValue = m.totalDropC ?? 0;
      scoreFormatted = `${scoreValue.toFixed(2)} °C`;
      interpretation = 'Smaller temperature drop indicates superior thermal retention';
    } else {
      scoreValue = m.coolingRateCPerMin ?? 0;
      scoreFormatted = `${scoreValue.toFixed(3)} °C/min`;
      interpretation = 'Slower cooling rate demonstrates higher thermal resistance';
    }

    return {
      rank: idx + 1,
      materialName: m.materialName,
      scoreValue,
      scoreFormatted,
      criterion,
      interpretation,
    };
  });
}
