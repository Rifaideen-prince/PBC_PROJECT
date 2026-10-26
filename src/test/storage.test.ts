import { describe, it, expect, beforeEach } from 'vitest';
import { storageService, db } from '../services/storageService';
import { Experiment } from '../types/experiment';

describe('IndexedDB Storage Service', () => {
  beforeEach(async () => {
    await db.experiments.clear();
  });

  const mockExperiment: Experiment = {
    id: 'exp-test-01',
    name: 'Packaging Foam Test',
    sampleMaterial: 'Packaging foam',
    targetDurationSeconds: 900,
    createdAt: '2026-10-21T10:00:00.000Z',
    updatedAt: '2026-10-21T10:00:00.000Z',
    status: 'completed',
    checklistConfirmed: true,
    operator: 'Researcher A',
    notes: 'Initial test notes',
    readings: [
      { sequence: 1, elapsedMs: 0, receivedAt: '', referenceTempC: 75.0, sampleTempC: 75.0, ambientTempC: 24.0, humidityPercent: 50.0, isValidReference: true, isValidSample: true, isValidAmbient: true, isValidHumidity: true },
      { sequence: 2, elapsedMs: 1000, receivedAt: '', referenceTempC: 74.8, sampleTempC: 74.9, ambientTempC: 24.0, humidityPercent: 50.0, isValidReference: true, isValidSample: true, isValidAmbient: true, isValidHumidity: true },
    ],
  };

  it('saves and retrieves an experiment with complete raw readings', async () => {
    await storageService.saveExperiment(mockExperiment);
    const retrieved = await storageService.getExperiment('exp-test-01');

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe('exp-test-01');
    expect(retrieved?.sampleMaterial).toBe('Packaging foam');
    expect(retrieved?.readings.length).toBe(2);
    expect(retrieved?.readings[1].referenceTempC).toBe(74.8);
  });

  it('safely updates metadata without altering immutable sensor readings', async () => {
    await storageService.saveExperiment(mockExperiment);

    await storageService.updateExperimentMetadata('exp-test-01', {
      name: 'Renamed Packaging Foam Test',
      operator: 'Senior Scientist B',
      notes: 'Updated calibration notes',
    });

    const updated = await storageService.getExperiment('exp-test-01');
    expect(updated?.name).toBe('Renamed Packaging Foam Test');
    expect(updated?.operator).toBe('Senior Scientist B');
    expect(updated?.notes).toBe('Updated calibration notes');

    // Crucial: Sensor readings must remain completely identical
    expect(updated?.readings.length).toBe(2);
    expect(updated?.readings[0].sampleTempC).toBe(75.0);
    expect(updated?.readings[1].sampleTempC).toBe(74.9);
  });

  it('deletes an experiment from storage', async () => {
    await storageService.saveExperiment(mockExperiment);
    await storageService.deleteExperiment('exp-test-01');

    const retrieved = await storageService.getExperiment('exp-test-01');
    expect(retrieved).toBeUndefined();
  });

  it('exports and validates JSON backup format', async () => {
    await storageService.saveExperiment(mockExperiment);
    const jsonStr = await storageService.exportExperimentJSON('exp-test-01');

    const parsed = JSON.parse(jsonStr);
    expect(parsed.version).toBe('1.0.0');
    expect(parsed.system).toBe('THERMALAB');
    expect(parsed.experiment.id).toBe('exp-test-01');
    expect(parsed.experiment.readings.length).toBe(2);
  });

  it('imports JSON backup without silently overwriting an existing experiment ID', async () => {
    await storageService.saveExperiment(mockExperiment);

    // Prepare JSON with same ID
    const backupJson = JSON.stringify({
      version: '1.0.0',
      experiment: mockExperiment,
    });

    const imported = await storageService.importExperimentJSON(backupJson);
    // Should have assigned a new non-conflicting ID
    expect(imported.id).not.toBe('exp-test-01');
    expect(imported.name).toContain('(Imported)');

    // Original experiment must still exist untouched
    const original = await storageService.getExperiment('exp-test-01');
    expect(original).toBeDefined();
    expect(original?.name).toBe('Packaging Foam Test');
  });
});
