export interface TimeAlignedComparisonPoint {
  elapsedSeconds: number;
  avgReferenceTempC: number | null;
  bubbleWrapTempC: number | null;
  packagingFoamTempC: number | null;
  diffBubbleWrapC: number | null; // avgReference - bubbleWrap
  diffPackagingFoamC: number | null; // avgReference - packagingFoam
}

export interface MaterialMetrics {
  materialName: string;
  initialTempC: number | null;
  finalTempC: number | null;
  totalDropC: number | null;
  durationMinutes: number;
  coolingRateCPerMin: number | null;
  coolingRateReductionPercent: number | null; // relative to reference
  referenceCoolingRateCPerMin: number | null;
  isReductionValid: boolean;
  reductionInvalidReason?: string;
  notes?: string;
}

export type RankingCriterion = 'final_temp' | 'temp_drop' | 'cooling_rate';

export interface MaterialRankResult {
  rank: number;
  materialName: string;
  scoreValue: number;
  scoreFormatted: string;
  criterion: RankingCriterion;
  interpretation: string;
}

export interface CompatibilityCheckResult {
  isCompatible: boolean;
  warnings: string[];
  referenceRunCount: number;
  initialTempDiffC: number;
  durationDiffSec: number;
  ambientTempDiffC?: number;
  waterVolumeDiffMl?: number;
}
