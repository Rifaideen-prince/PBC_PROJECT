import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSerial } from '../context/SerialContext';
import { useExperiment } from '../context/ExperimentContext';
import { SensorCard } from '../components/sensors/SensorCard';
import { ConnectionStatus } from '../components/sensors/ConnectionStatus';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { formatDateTime, formatElapsedSeconds } from '../utils/formatting';
import {
  Usb,
  Play,
  RotateCcw,
  Activity,
  Layers,
  CheckCircle,
  FlaskConical,
  ExternalLink,
  Trash2,
  FileDown,
} from 'lucide-react';
import { exportService } from '../services/exportService';
import { storageService } from '../services/storageService';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { connectionState, connect, latestReading, tempDifference, diagnostics } = useSerial();
  const {
    status,
    currentExperiment,
    resumeRecording,
    allStoredExperiments,
    refreshStoredExperiments,
    enableDemoMode,
    isDemoMode,
  } = useExperiment();

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Calculate real metrics from stored records only
  const totalSaved = allStoredExperiments.length;
  const completedCount = allStoredExperiments.filter(e => e.status === 'completed').length;
  const distinctMaterials = Array.from(new Set(allStoredExperiments.map(e => e.sampleMaterial)));

  // Context-sensitive primary action
  const renderPrimaryAction = () => {
    if (connectionState === 'disconnected') {
      return (
        <Button
          variant="primary"
          size="md"
          icon={<Usb size={16} />}
          onClick={() => connect()}
        >
          Connect ESP32
        </Button>
      );
    }
    if (status === 'recording') {
      return (
        <Button
          variant="danger"
          size="md"
          icon={<Activity size={16} />}
          onClick={() => navigate('/live')}
        >
          Open Live Experiment
        </Button>
      );
    }
    if (status === 'paused') {
      return (
        <Button
          variant="primary"
          size="md"
          icon={<Play size={16} />}
          onClick={() => {
            resumeRecording();
            navigate('/live');
          }}
        >
          Resume Experiment
        </Button>
      );
    }
    if (status === 'completed' && currentExperiment) {
      return (
        <Button
          variant="success"
          size="md"
          icon={<CheckCircle size={16} />}
          onClick={() => navigate('/live')}
        >
          Review and Save
        </Button>
      );
    }
    return (
      <Button
        variant="primary"
        size="md"
        icon={<Play size={16} />}
        onClick={() => navigate('/live')}
      >
        Start New Experiment
      </Button>
    );
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to permanently delete this experimental record from browser storage?')) {
      await storageService.deleteExperiment(id);
      await refreshStoredExperiments();
    }
  };

  return (
    <div className="space-y-6">
      {/* A. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded bg-dark-900 border border-dark-750">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-wider text-white font-mono uppercase">
              THERMALAB Control Center
            </h1>
            <Badge variant="cyan" size="sm">MSE-01</Badge>
          </div>
          <p className="text-xs text-dark-400 mt-1">
            Smart Comparative Thermal Response Testing Platform for Polymer-Based Materials
          </p>
        </div>
        <div className="flex items-center gap-3">
          {renderPrimaryAction()}
          {!isDemoMode && (
            <Button
              variant="outline"
              size="md"
              icon={<FlaskConical size={15} />}
              onClick={enableDemoMode}
              title="Explore platform with deterministic benchmark cooling datasets"
            >
              Load Demo Runs
            </Button>
          )}
        </div>
      </div>

      {/* B. Sensor Overview Cards */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-mono font-semibold text-dark-300 uppercase tracking-wider">
            Real-Time Sensor Telemetry
          </h2>
          <span className="text-[11px] font-mono text-dark-500">
            {connectionState === 'connected' ? 'Hardware Stream Active (115200 Baud)' : 'Awaiting Connection'}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <SensorCard
            type="reference"
            value={latestReading?.referenceTempC}
            status={diagnostics.referenceStatus}
          />
          <SensorCard
            type="sample"
            value={latestReading?.sampleTempC}
            status={diagnostics.sampleStatus}
            materialName={currentExperiment?.sampleMaterial}
          />
          <SensorCard
            type="ambient"
            value={latestReading?.ambientTempC}
            status={diagnostics.ambientStatus}
          />
          <SensorCard
            type="humidity"
            value={latestReading?.humidityPercent}
            status={diagnostics.humidityStatus}
          />
          <SensorCard
            type="difference"
            value={tempDifference}
            status={diagnostics.referenceStatus === 'optimal' && diagnostics.sampleStatus === 'optimal' ? 'optimal' : 'disconnected'}
          />
        </div>
      </div>

      {/* C. Connection Status & Quick Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Connection Diagnostics (2 Cols) */}
        <div className="lg:col-span-2">
          <ConnectionStatus />
        </div>

        {/* Quick Statistics (1 Col) */}
        <Card
          title="Laboratory Storage Metrics"
          subtitle="Empirical records stored in local IndexedDB database"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded bg-dark-900/60 border border-dark-750">
                <span className="text-2xl font-bold font-mono text-cyan-400 block">
                  {totalSaved}
                </span>
                <span className="text-[10px] font-mono text-dark-400 uppercase tracking-tight">
                  Saved Runs
                </span>
              </div>
              <div className="p-3 rounded bg-dark-900/60 border border-dark-750">
                <span className="text-2xl font-bold font-mono text-success-400 block">
                  {completedCount}
                </span>
                <span className="text-[10px] font-mono text-dark-400 uppercase tracking-tight">
                  Completed
                </span>
              </div>
              <div className="p-3 rounded bg-dark-900/60 border border-dark-750">
                <span className="text-2xl font-bold font-mono text-amber-400 block">
                  {distinctMaterials.length}
                </span>
                <span className="text-[10px] font-mono text-dark-400 uppercase tracking-tight">
                  Materials
                </span>
              </div>
            </div>

            <div className="p-3 rounded bg-dark-900/40 border border-dark-750 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-dark-400">
                <span>CONFIGURATIONS:</span>
                <span className="text-dark-200">
                  {distinctMaterials.length > 0 ? distinctMaterials.join(', ') : 'None'}
                </span>
              </div>
              <div className="flex justify-between text-dark-400">
                <span>DATABASE STATUS:</span>
                <span className="text-success-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-success-400 inline-block" />
                  IndexedDB Ready
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<Layers size={14} />}
                onClick={() => navigate('/analysis')}
                disabled={totalSaved === 0}
              >
                Compare In Analysis
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* E. Recent Experiments Section */}
      <Card
        title="Recent Experimental Records"
        subtitle="Historical tests recorded on this device"
        headerAction={
          totalSaved > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              icon={<FileDown size={14} />}
              onClick={() => exportService.exportSummaryCSV(allStoredExperiments)}
              title="Download CSV table of all experiments"
            >
              Export Summary CSV
            </Button>
          ) : undefined
        }
      >
        {allStoredExperiments.length === 0 ? (
          <EmptyState
            icon="database"
            title="No Experimental Records Saved Yet"
            description="Perform a physical cooling test with ESP32 sensors or load benchmark demo datasets to view comparative cooling dynamics."
            actionText="Start First Experiment"
            onAction={() => navigate('/live')}
            secondaryActionText="Load Demo Runs"
            onSecondaryAction={enableDemoMode}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-dark-700/80 text-dark-400 uppercase text-[11px]">
                  <th className="pb-2.5 font-semibold">Experiment Name</th>
                  <th className="pb-2.5 font-semibold">Material Tested</th>
                  <th className="pb-2.5 font-semibold">Recorded Date</th>
                  <th className="pb-2.5 font-semibold">Duration</th>
                  <th className="pb-2.5 font-semibold">Points</th>
                  <th className="pb-2.5 font-semibold">Status</th>
                  <th className="pb-2.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {allStoredExperiments.slice(0, 8).map((exp) => {
                  const durationSec = exp.readings.length > 0
                    ? Math.round((exp.readings[exp.readings.length - 1].elapsedMs - exp.readings[0].elapsedMs) / 1000)
                    : exp.targetDurationSeconds;

                  return (
                    <tr
                      key={exp.id}
                      className="hover:bg-dark-800/50 transition-colors group cursor-pointer"
                      onClick={() => navigate('/analysis')}
                    >
                      <td className="py-3 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span>{exp.name}</span>
                          {exp.isDemo && (
                            <Badge variant="amber" size="sm">DEMO</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-cyan-400 font-medium">
                        {exp.sampleMaterial}
                      </td>
                      <td className="py-3 text-dark-400">
                        {formatDateTime(exp.createdAt)}
                      </td>
                      <td className="py-3 text-dark-300">
                        {formatElapsedSeconds(durationSec)}
                      </td>
                      <td className="py-3 text-dark-400">
                        {exp.readings.length}
                      </td>
                      <td className="py-3">
                        {exp.status === 'completed' ? (
                          <Badge variant="success" size="sm">COMPLETED</Badge>
                        ) : exp.status === 'interrupted' ? (
                          <Badge variant="danger" size="sm">INTERRUPTED</Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">{exp.status.toUpperCase()}</Badge>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<ExternalLink size={13} />}
                            onClick={() => navigate('/analysis')}
                            title="Inspect in Analysis"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 size={13} className="text-dark-500 hover:text-danger-400" />}
                            onClick={(e) => handleDelete(exp.id, e)}
                            title="Delete experiment"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
