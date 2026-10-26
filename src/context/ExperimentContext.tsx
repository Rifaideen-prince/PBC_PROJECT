import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Experiment, ExperimentChecklist, ExperimentMetadata, ExperimentStatus, InsulationMaterial } from '../types/experiment';
import { SensorReading } from '../types/sensor';
import { serialService } from '../services/serialService';
import { storageService } from '../services/storageService';
import { createDemoBubbleWrapExperiment, createDemoPackagingFoamExperiment } from '../services/demoDataService';

interface ExperimentContextValue {
  currentExperiment: Experiment | null;
  status: ExperimentStatus;
  elapsedSeconds: number;
  checklist: ExperimentChecklist;
  isChecklistConfirmed: boolean;
  isDemoMode: boolean;
  setupExperiment: (meta: {
    name: string;
    sampleMaterial: InsulationMaterial;
    targetDurationSeconds: number;
    waterVolumeMl?: number | null;
    targetInitialTemperatureC?: number | null;
    insulationThicknessMm?: number | null;
    insulationLayers?: number | null;
    operator?: string;
    notes?: string;
  }) => void;
  updateChecklist: (key: keyof ExperimentChecklist, value: boolean) => void;
  confirmAllChecklist: () => void;
  startRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  saveExperiment: () => Promise<Experiment | null>;
  discardExperiment: () => void;
  loadSavedExperiment: (id: string) => Promise<void>;
  enableDemoMode: () => Promise<void>;
  disableDemoMode: () => void;
  allStoredExperiments: Experiment[];
  refreshStoredExperiments: () => Promise<void>;
}

const defaultChecklist: ExperimentChecklist = {
  referenceContainerPrepared: false,
  testContainerPrepared: false,
  probesPositionedCorrectly: false,
  waterConditionsChecked: false,
  sampleConfirmed: false,
};

const ExperimentContext = createContext<ExperimentContextValue | undefined>(undefined);

export const ExperimentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentExperiment, setCurrentExperiment] = useState<Experiment | null>(null);
  const [status, setStatus] = useState<ExperimentStatus>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [checklist, setChecklist] = useState<ExperimentChecklist>(defaultChecklist);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [allStoredExperiments, setAllStoredExperiments] = useState<Experiment[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef = useRef<ExperimentStatus>('idle');
  statusRef.current = status;

  // Refresh saved experiments from IndexedDB
  const refreshStoredExperiments = useCallback(async () => {
    try {
      const stored = await storageService.getAllExperiments();
      setAllStoredExperiments(stored);
    } catch (err) {
      console.error('Failed to load experiments from IndexedDB', err);
    }
  }, []);

  useEffect(() => {
    refreshStoredExperiments();
  }, [refreshStoredExperiments]);

  // Handle hardware disconnection during active recording
  useEffect(() => {
    const unsub = serialService.subscribeStatus((connState) => {
      if ((connState === 'disconnected' || connState === 'error') && statusRef.current === 'recording') {
        setStatus('paused');
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    });
    return unsub;
  }, []);

  // Subscribe to live serial sensor stream
  useEffect(() => {
    const unsub = serialService.subscribeReading((reading: SensorReading) => {
      if (statusRef.current === 'recording') {
        setCurrentExperiment(prev => {
          if (!prev) return null;
          return {
            ...prev,
            readings: [...prev.readings, reading],
          };
        });
      }
    });
    return unsub;
  }, []);

  // Timer tick for recording
  useEffect(() => {
    if (status === 'recording') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status]);

  const setupExperiment = useCallback((meta: {
    name: string;
    sampleMaterial: InsulationMaterial;
    targetDurationSeconds: number;
    waterVolumeMl?: number | null;
    targetInitialTemperatureC?: number | null;
    insulationThicknessMm?: number | null;
    insulationLayers?: number | null;
    operator?: string;
    notes?: string;
  }) => {
    const newExp: Experiment = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: meta.name.trim() || `Experiment ${new Date().toLocaleTimeString()}`,
      sampleMaterial: meta.sampleMaterial,
      targetDurationSeconds: meta.targetDurationSeconds,
      waterVolumeMl: meta.waterVolumeMl ?? null,
      targetInitialTemperatureC: meta.targetInitialTemperatureC ?? null,
      insulationThicknessMm: meta.insulationThicknessMm ?? null,
      insulationLayers: meta.insulationLayers ?? null,
      operator: meta.operator ?? '',
      notes: meta.notes ?? '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startedAt: null,
      endedAt: null,
      status: 'idle',
      checklistConfirmed: false,
      isDemo: isDemoMode,
      readings: [],
    };
    setCurrentExperiment(newExp);
    setStatus('idle');
    setElapsedSeconds(0);
    setChecklist(defaultChecklist);
  }, [isDemoMode]);

  const updateChecklist = useCallback((key: keyof ExperimentChecklist, value: boolean) => {
    setChecklist(prev => ({ ...prev, [key]: value }));
  }, []);

  const confirmAllChecklist = useCallback(() => {
    setChecklist({
      referenceContainerPrepared: true,
      testContainerPrepared: true,
      probesPositionedCorrectly: true,
      waterConditionsChecked: true,
      sampleConfirmed: true,
    });
    setCurrentExperiment(prev => prev ? { ...prev, checklistConfirmed: true } : null);
  }, []);

  const isChecklistConfirmed = Object.values(checklist).every(Boolean);

  const startRecording = useCallback(() => {
    if (!currentExperiment) return;
    setStatus('recording');
    setCurrentExperiment(prev => prev ? {
      ...prev,
      startedAt: prev.startedAt || new Date().toISOString(),
      status: 'recording',
      checklistConfirmed: isChecklistConfirmed,
    } : null);
  }, [currentExperiment, isChecklistConfirmed]);

  const pauseRecording = useCallback(() => {
    setStatus('paused');
    setCurrentExperiment(prev => prev ? { ...prev, status: 'paused' } : null);
  }, []);

  const resumeRecording = useCallback(() => {
    setStatus('recording');
    setCurrentExperiment(prev => prev ? { ...prev, status: 'recording' } : null);
  }, []);

  const stopRecording = useCallback(() => {
    setStatus('completed');
    setCurrentExperiment(prev => prev ? {
      ...prev,
      endedAt: new Date().toISOString(),
      status: 'completed',
    } : null);
  }, []);

  const saveExperiment = useCallback(async (): Promise<Experiment | null> => {
    if (!currentExperiment) return null;
    const finalExp: Experiment = {
      ...currentExperiment,
      status: status === 'recording' || status === 'paused' ? 'completed' : currentExperiment.status,
      endedAt: currentExperiment.endedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await storageService.saveExperiment(finalExp);
    await refreshStoredExperiments();
    return finalExp;
  }, [currentExperiment, status, refreshStoredExperiments]);

  const discardExperiment = useCallback(() => {
    setStatus('idle');
    setCurrentExperiment(null);
    setElapsedSeconds(0);
    setChecklist(defaultChecklist);
  }, []);

  const loadSavedExperiment = useCallback(async (id: string) => {
    const exp = await storageService.getExperiment(id);
    if (exp) {
      setCurrentExperiment(exp);
      setStatus(exp.status);
      const firstT = exp.readings.length > 0 ? exp.readings[0].elapsedMs : 0;
      const lastT = exp.readings.length > 0 ? exp.readings[exp.readings.length - 1].elapsedMs : 0;
      setElapsedSeconds(Math.max(0, Math.floor((lastT - firstT) / 1000)));
    }
  }, []);

  const enableDemoMode = useCallback(async () => {
    setIsDemoMode(true);
    // Seed demo experiments if not already in IndexedDB
    const demoA = createDemoBubbleWrapExperiment();
    const demoB = createDemoPackagingFoamExperiment();
    await storageService.saveExperiment(demoA);
    await storageService.saveExperiment(demoB);
    await refreshStoredExperiments();
    setCurrentExperiment(demoA);
    setStatus('completed');
    setElapsedSeconds(900);
  }, [refreshStoredExperiments]);

  const disableDemoMode = useCallback(() => {
    setIsDemoMode(false);
    if (currentExperiment?.isDemo) {
      setCurrentExperiment(null);
      setStatus('idle');
      setElapsedSeconds(0);
    }
  }, [currentExperiment]);

  return (
    <ExperimentContext.Provider
      value={{
        currentExperiment,
        status,
        elapsedSeconds,
        checklist,
        isChecklistConfirmed,
        isDemoMode,
        setupExperiment,
        updateChecklist,
        confirmAllChecklist,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        saveExperiment,
        discardExperiment,
        loadSavedExperiment,
        enableDemoMode,
        disableDemoMode,
        allStoredExperiments,
        refreshStoredExperiments,
      }}
    >
      {children}
    </ExperimentContext.Provider>
  );
};

export function useExperiment(): ExperimentContextValue {
  const ctx = useContext(ExperimentContext);
  if (!ctx) {
    throw new Error('useExperiment must be used within an ExperimentProvider');
  }
  return ctx;
}
