import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { ExperimentStatus } from '../../types/experiment';
import { Play, Pause, Square, Save, Trash2, Download, AlertTriangle } from 'lucide-react';

export interface ExperimentControlsProps {
  status: ExperimentStatus;
  readingCount: number;
  hasHardwareConnection: boolean;
  isChecklistConfirmed: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSave: () => void;
  onDiscard: () => void;
  onExport: () => void;
}

export const ExperimentControls: React.FC<ExperimentControlsProps> = ({
  status,
  readingCount,
  hasHardwareConnection,
  isChecklistConfirmed,
  onStart,
  onPause,
  onResume,
  onStop,
  onSave,
  onDiscard,
  onExport,
}) => {
  const [showStopModal, setShowStopModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        {/* START Button */}
        {status === 'idle' && (
          <Button
            variant="primary"
            icon={<Play size={15} />}
            disabled={!hasHardwareConnection || !isChecklistConfirmed}
            onClick={onStart}
            title={
              !hasHardwareConnection
                ? 'Connect ESP32 hardware or enable Demo Mode first'
                : !isChecklistConfirmed
                ? 'Confirm all apparatus checklist items before starting'
                : 'Begin live temperature data acquisition'
            }
          >
            Start Recording
          </Button>
        )}

        {/* PAUSE Button */}
        {status === 'recording' && (
          <Button
            variant="secondary"
            icon={<Pause size={15} className="text-amber-400" />}
            onClick={onPause}
          >
            Pause Recording
          </Button>
        )}

        {/* RESUME Button */}
        {status === 'paused' && (
          <Button
            variant="primary"
            icon={<Play size={15} />}
            onClick={onResume}
          >
            Resume Recording
          </Button>
        )}

        {/* STOP Button */}
        {(status === 'recording' || status === 'paused') && (
          <Button
            variant="danger"
            icon={<Square size={15} />}
            onClick={() => setShowStopModal(true)}
          >
            Stop Test
          </Button>
        )}

        {/* SAVE Button */}
        {status === 'completed' && readingCount > 0 && (
          <Button
            variant="success"
            icon={<Save size={15} />}
            onClick={onSave}
          >
            Save to Storage
          </Button>
        )}

        {/* EXPORT READINGS Button */}
        {readingCount > 0 && (
          <Button
            variant="outline"
            icon={<Download size={14} />}
            onClick={onExport}
          >
            Export Readings ({readingCount})
          </Button>
        )}

        {/* DISCARD Button */}
        {status !== 'idle' && (
          <Button
            variant="ghost"
            icon={<Trash2 size={14} className="text-dark-400 hover:text-danger-400" />}
            onClick={() => setShowDiscardModal(true)}
            className="hover:text-danger-400"
          >
            Discard
          </Button>
        )}
      </div>

      {/* Stop Confirmation Modal */}
      <Modal
        isOpen={showStopModal}
        onClose={() => setShowStopModal(false)}
        title="Stop Experiment Recording"
        subtitle="Finalize data acquisition for this run"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowStopModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setShowStopModal(false);
                onStop();
              }}
            >
              Stop & Finalize
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p>
            Are you sure you want to stop this experimental recording session?
          </p>
          <div className="p-3 rounded bg-dark-850 border border-dark-750 font-mono text-xs text-dark-300">
            Collected: <span className="text-white font-bold">{readingCount} valid telemetry points</span>.
            Stopping will finalize the time boundary without deleting collected measurements.
          </div>
        </div>
      </Modal>

      {/* Discard Confirmation Modal */}
      <Modal
        isOpen={showDiscardModal}
        onClose={() => setShowDiscardModal(false)}
        title="Discard Unsaved Experiment"
        subtitle="Destructive action warning"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowDiscardModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setShowDiscardModal(false);
                onDiscard();
              }}
            >
              Confirm Discard
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start gap-2.5 p-3 rounded bg-danger-500/10 border border-danger-500/30 text-danger-300 text-xs">
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5 text-danger-400" />
            <span>
              This will permanently delete all {readingCount} recorded measurements in the current session.
              This operation cannot be undone.
            </span>
          </div>
          <p className="text-xs text-dark-400">
            If you wish to keep these readings, click Cancel and then Save or Export Readings first.
          </p>
        </div>
      </Modal>
    </>
  );
};
