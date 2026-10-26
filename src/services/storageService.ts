import Dexie, { type Table } from 'dexie';
import { Experiment, ExperimentMetadata } from '../types/experiment';

export class ThermalabDatabase extends Dexie {
  experiments!: Table<Experiment, string>;

  constructor() {
    super('ThermalabDB');
    this.version(1).stores({
      experiments: 'id, status, sampleMaterial, createdAt, isDemo',
    });
  }
}

export const db = new ThermalabDatabase();

export class StorageService {
  /**
   * Saves a full experiment including all raw readings
   */
  public async saveExperiment(experiment: Experiment): Promise<void> {
    await db.experiments.put(experiment);
  }

  /**
   * Retrieves an experiment by its unique ID
   */
  public async getExperiment(id: string): Promise<Experiment | undefined> {
    return await db.experiments.get(id);
  }

  /**
   * Gets all stored experiments, ordered by creation time descending
   */
  public async getAllExperiments(): Promise<Experiment[]> {
    return await db.experiments.orderBy('createdAt').reverse().toArray();
  }

  /**
   * Gets recent non-demo or all recent experiments
   */
  public async getRecentExperiments(limit = 10): Promise<Experiment[]> {
    return await db.experiments
      .orderBy('createdAt')
      .reverse()
      .limit(limit)
      .toArray();
  }

  /**
   * Gets saved experiments for a specific material
   */
  public async getExperimentsByMaterial(material: string): Promise<Experiment[]> {
    return await db.experiments
      .where('sampleMaterial')
      .equals(material)
      .reverse()
      .sortBy('createdAt');
  }

  /**
   * Safely updates ONLY metadata fields without altering or corrupting original sensor readings
   */
  public async updateExperimentMetadata(
    id: string,
    updates: Partial<Omit<ExperimentMetadata, 'id' | 'createdAt'>>
  ): Promise<void> {
    const existing = await db.experiments.get(id);
    if (!existing) {
      throw new Error(`Experiment with ID ${id} not found.`);
    }

    const updated: Experiment = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      // Preserve raw sensor readings strictly
      readings: existing.readings,
    };

    await db.experiments.put(updated);
  }

  /**
   * Deletes an experiment after user confirmation
   */
  public async deleteExperiment(id: string): Promise<void> {
    await db.experiments.delete(id);
  }

  /**
   * Exports an experiment as a formatted JSON string
   */
  public async exportExperimentJSON(id: string): Promise<string> {
    const exp = await db.experiments.get(id);
    if (!exp) {
      throw new Error(`Experiment ${id} not found.`);
    }
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      system: 'THERMALAB',
      experiment: exp,
    };
    return JSON.stringify(backup, null, 2);
  }

  /**
   * Validates and imports an experiment from a JSON string.
   * Prevents overwriting existing experiments silently by checking ID and generating a new one if necessary.
   */
  public async importExperimentJSON(jsonStr: string): Promise<Experiment> {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (err) {
      throw new Error(`Invalid JSON format: ${(err as Error).message}`);
    }

    const exp: Experiment = parsed.experiment ? parsed.experiment : parsed;

    if (!exp.id || !exp.name || !Array.isArray(exp.readings)) {
      throw new Error('Malformed experiment backup: Missing required fields (id, name, readings).');
    }

    // Check if ID already exists
    const existing = await db.experiments.get(exp.id);
    if (existing) {
      // Avoid silent overwrite: assign a distinct imported ID
      exp.id = `${exp.id}-imported-${Date.now()}`;
      exp.name = `${exp.name} (Imported)`;
    }

    exp.updatedAt = new Date().toISOString();
    await db.experiments.put(exp);
    return exp;
  }
}

export const storageService = new StorageService();
