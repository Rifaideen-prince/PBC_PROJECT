import { Experiment } from '../types/experiment';
import { MaterialMetrics, RankingCriterion, MaterialRankResult, CompatibilityCheckResult, TimeAlignedComparisonPoint } from '../types/analysis';
import {
  calculateTemperatureDrop,
  calculateCoolingRate,
  calculateCoolingRateReduction,
  getInitialAndFinalReadings,
  rankMaterials,
} from '../utils/calculations';
import { alignComparisonRuns, validateRunCompatibility } from '../utils/timeAlignment';

export class AnalysisService {
  /**
   * Computes comprehensive metrics for an experimental run
   */
  public computeMetrics(exp: Experiment): {
    sampleMetrics: MaterialMetrics;
    referenceMetrics: MaterialMetrics;
  } {
    const sampleBounds = getInitialAndFinalReadings(exp.readings, 'sampleTempC');
    const refBounds = getInitialAndFinalReadings(exp.readings, 'referenceTempC');

    const sampleDrop = calculateTemperatureDrop(sampleBounds.initial, sampleBounds.final);
    const refDrop = calculateTemperatureDrop(refBounds.initial, refBounds.final);

    const sampleRate = calculateCoolingRate(sampleBounds.initial, sampleBounds.final, sampleBounds.elapsedSeconds);
    const refRate = calculateCoolingRate(refBounds.initial, refBounds.final, refBounds.elapsedSeconds);

    const reductionResult = calculateCoolingRateReduction(refRate, sampleRate);

    const sampleMetrics: MaterialMetrics = {
      materialName: exp.sampleMaterial,
      initialTempC: sampleBounds.initial,
      finalTempC: sampleBounds.final,
      totalDropC: sampleDrop,
      durationMinutes: Number((sampleBounds.elapsedSeconds / 60).toFixed(2)),
      coolingRateCPerMin: sampleRate,
      coolingRateReductionPercent: reductionResult.reductionPercent,
      referenceCoolingRateCPerMin: refRate,
      isReductionValid: reductionResult.isValid,
      reductionInvalidReason: reductionResult.reason,
      notes: exp.notes,
    };

    const refMetrics: MaterialMetrics = {
      materialName: 'Uninsulated Reference',
      initialTempC: refBounds.initial,
      finalTempC: refBounds.final,
      totalDropC: refDrop,
      durationMinutes: Number((refBounds.elapsedSeconds / 60).toFixed(2)),
      coolingRateCPerMin: refRate,
      coolingRateReductionPercent: 0,
      referenceCoolingRateCPerMin: refRate,
      isReductionValid: true,
    };

    return { sampleMetrics, referenceMetrics: refMetrics };
  }

  /**
   * Generates time-aligned dataset for the 3-graph comparison layout
   */
  public generateComparativeDataset(
    bubbleWrapExp: Experiment | null,
    packagingFoamExp: Experiment | null,
    stepSeconds = 2
  ): TimeAlignedComparisonPoint[] {
    return alignComparisonRuns(bubbleWrapExp, packagingFoamExp, stepSeconds);
  }

  /**
   * Validates compatibility between two comparison experiments
   */
  public checkCompatibility(
    bubbleWrapExp: Experiment | null,
    packagingFoamExp: Experiment | null
  ): CompatibilityCheckResult {
    return validateRunCompatibility(bubbleWrapExp, packagingFoamExp);
  }

  /**
   * Ranks compared materials based on selected criterion
   */
  public getRanking(
    metrics: MaterialMetrics[],
    criterion: RankingCriterion
  ): MaterialRankResult[] {
    return rankMaterials(metrics, criterion);
  }
}

export const analysisService = new AnalysisService();
