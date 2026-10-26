import React, { useState } from 'react';
import { useSerial } from '../context/SerialContext';
import { useExperiment } from '../context/ExperimentContext';
import { ExperimentSetupForm, SetupFormData } from '../components/experiments/ExperimentSetupForm';
import { ExperimentChecklist } from '../components/experiments/ExperimentChecklist';
import { ExperimentControls } from '../components/experiments/ExperimentControls';
import { LiveTemperatureChart } from '../components/charts/LiveTemperatureChart';
import { SensorCard } from '../components/sensors/SensorCard';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { formatElapsedSeconds, formatTemperature, formatHumidity } from '../utils/formatting';
import { exportService } from '../services/exportService';
import {
  Clock,
  Radio,
  AlertTriangle,
  Usb,
  Save,
  CheckCircle2,
  FileDown,
} from 'lucide-react';

export const LiveExperimentPage: React.FC = () => {
  const { connectionState, latestReading, connect, diagnostics } = useSerial();
  const {
    currentExperiment,
    status,
    elapsedSeconds,
    checklist,
    isChecklistConfirmed,
    setupExperiment,
    updateChecklist,
    confirmAllChecklist,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    saveExperiment,
    discardExperiment,
    isDemoMode,
  } = useExperiment();

  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const handleSetup = (data: SetupFormData) => {
    setupExperiment(data);
    setSaveSuccessMessage(null);
  };

  const handleSave = async () => {
    const saved = await saveExperiment();
    if (saved) {
      setSaveSuccessMessage(`Experiment "${saved.name}" successfully saved to local IndexedDB.`);
      setTimeout(() => setSaveSuccessMessage(null), 6000);
    }
  };

  const handleExport = () => {
    if (currentExperiment && currentExperiment.readings.length > 0) {
      exportService.exportRawReadingsCSV(currentExperiment);
    }
  };

  const readings = currentExperiment?.readings || [];
  const readingCount = readings.length;

  return (
    <div className="space-y-6">
      {/* 1. Header Bar: Name, Material, Status, Elapsed Time */}
      <div className="p-4 rounded bg-dark-900 border border-dark-750 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold font-mono text-white uppercase tracking-wider">
              {currentExperiment ? currentExperiment.name : 'Live Experiment Acquisition'}
            </h1>
            {currentExperiment && (
              <Badge variant="cyan" size="sm">
                {currentExperiment.sampleMaterial}
              </Badge>
            )}
            {currentExperiment?.isDemo && (
              <Badge variant="amber" size="sm">DEMO</Badge>
            )}
          </div>
          <p className="text-xs text-dark-400">
            DS18B20 Dual-Container Cooling Response Acquisition • 115200 Baud Web Serial
          </p>
        </div>

        {/* Status & Timer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-dark-850 border border-dark-750 font-mono">
            <Clock size={16} className="text-cyan-400" />
            <div className="text-right">
              <span className="text-[10px] text-dark-400 block uppercase">Elapsed Time</span>
              <span className="text-sm font-bold text-white tracking-wider">
                {formatElapsedSeconds(elapsedSeconds)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-dark-850 border border-dark-750 font-mono">
            <Radio size={16} className={status === 'recording' ? 'text-danger-500 animate-pulse' : 'text-dark-500'} />
            <div className="text-right">
              <span className="text-[10px] text-dark-400 block uppercase">Status</span>
              <span className="text-xs font-bold uppercase tracking-wider">
                {status === 'recording' ? (
                  <span className="text-danger-400">Recording</span>
                ) : status === 'paused' ? (
                  <span className="text-amber-400">Paused</span>
                ) : status === 'completed' ? (
                  <span className="text-success-400">Stopped</span>
                ) : (
                  <span className="text-dark-400">Ready</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Disconnection Warning Banner during Recording */}
      {status === 'paused' && connectionState === 'disconnected' && !isDemoMode && (
        <div className="p-3.5 rounded bg-amber-500/10 border border-amber-500/40 text-amber-300 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-400 flex-shrink-0" />
            <span>
              <strong>Hardware Connection Interrupted:</strong> Telemetry was automatically paused to preserve data integrity. Reconnect the ESP32 serial port to resume recording.
            </span>
          </div>
          <Button variant="primary" size="sm" icon={<Usb size={14} />} onClick={() => connect()}>
            Reconnect ESP32
          </Button>
        </div>
      )}

      {/* Save Success Banner */}
      {saveSuccessMessage && (
        <div className="p-3 rounded bg-success-500/10 border border-success-500/30 text-success-300 flex items-center gap-2 text-xs font-mono">
          <CheckCircle2 size={16} className="text-success-400 flex-shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* 2. Top Large Temperature Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <SensorCard
          type="reference"
          value={latestReading?.referenceTempC ?? (readings.length > 0 ? readings[readings.length - 1].referenceTempC : null)}
          status={diagnostics.referenceStatus}
        />
        <SensorCard
          type="sample"
          value={latestReading?.sampleTempC ?? (readings.length > 0 ? readings[readings.length - 1].sampleTempC : null)}
          status={diagnostics.sampleStatus}
          materialName={currentExperiment?.sampleMaterial}
        />
        <SensorCard
          type="ambient"
          value={latestReading?.ambientTempC ?? (readings.length > 0 ? readings[readings.length - 1].ambientTempC : null)}
          status={diagnostics.ambientStatus}
        />
        <SensorCard
          type="humidity"
          value={latestReading?.humidityPercent ?? (readings.length > 0 ? readings[readings.length - 1].humidityPercent : null)}
          status={diagnostics.humidityStatus}
        />
      </div>

      {/* 3. Main Live Temperature Graph & Controls */}
      <Card
        title="Live Water Cooling Response Graph"
        subtitle="DS18B20 reference water vs. insulated test water temperature over elapsed time"
        headerAction={
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-dark-400">
              Readings: <strong className="text-white">{readingCount}</strong>
            </span>
            <ExperimentControls
              status={status}
              readingCount={readingCount}
              hasHardwareConnection={connectionState === 'connected' || isDemoMode}
              isChecklistConfirmed={isChecklistConfirmed}
              onStart={startRecording}
              onPause={pauseRecording}
              onResume={resumeRecording}
              onStop={stopRecording}
              onSave={handleSave}
              onDiscard={discardExperiment}
              onExport={handleExport}
            />
          </div>
        }
      >
        <div className="space-y-4">
          <LiveTemperatureChart
            readings={readings}
            sampleMaterial={currentExperiment?.sampleMaterial}
            height={420}
          />

          {/* Secondary Telemetry Strip: Ambient Baseline conditions */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded bg-dark-900/40 border border-dark-750 text-xs font-mono text-dark-400">
            <div className="flex items-center gap-4">
              <span>
                AMBIENT AIR: <strong className="text-dark-200">{formatTemperature(latestReading?.ambientTempC, 1)}</strong>
              </span>
              <span>
                HUMIDITY: <strong className="text-dark-200">{formatHumidity(latestReading?.humidityPercent, 1)}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span>SAMPLING: 1 Hz Water / 0.5 Hz Ambient</span>
              <span className="text-dark-600">|</span>
              <span>PORT: 115200 8N1</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Pre-Recording Setup and Verification (Visible when idle or preparing) */}
      {status === 'idle' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ExperimentSetupForm
            onSetup={handleSetup}
            disabled={status !== 'idle'}
          />
          <ExperimentChecklist
            checklist={checklist}
            onChange={updateChecklist}
            onConfirmAll={confirmAllChecklist}
            isConfirmed={isChecklistConfirmed}
            disabled={status !== 'idle'}
          />
        </div>
      )}
    </div>
  );
};
