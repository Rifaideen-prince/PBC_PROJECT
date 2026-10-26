import { SensorReading } from './sensor';

export type InsulationMaterial = 'Bubble wrap' | 'Packaging foam' | 'Uninsulated Reference' | string;

export type ExperimentStatus =
  | 'idle'
  | 'recording'
  | 'paused'
  | 'completed'
  | 'interrupted';

export interface ExperimentChecklist {
  referenceContainerPrepared: boolean;
  testContainerPrepared: boolean;
  probesPositionedCorrectly: boolean;
  waterConditionsChecked: boolean;
  sampleConfirmed: boolean;
}

export interface ExperimentMetadata {
  id: string;
  name: string;
  sampleMaterial: InsulationMaterial;
  customMaterialName?: string;
  targetDurationSeconds: number;
  waterVolumeMl?: number | null;
  targetInitialTemperatureC?: number | null;
  insulationThicknessMm?: number | null;
  insulationLayers?: number | null;
  operator?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  endedAt?: string | null;
  status: ExperimentStatus;
  checklistConfirmed: boolean;
  isDemo?: boolean;
}

export interface Experiment extends ExperimentMetadata {
  readings: SensorReading[];
}

export interface ExperimentSummaryStats {
  id: string;
  name: string;
  sampleMaterial: InsulationMaterial;
  createdAt: string;
  status: ExperimentStatus;
  durationSeconds: number;
  readingCount: number;
  initialReferenceTemp?: number | null;
  finalReferenceTemp?: number | null;
  initialSampleTemp?: number | null;
  finalSampleTemp?: number | null;
  isDemo?: boolean;
}
