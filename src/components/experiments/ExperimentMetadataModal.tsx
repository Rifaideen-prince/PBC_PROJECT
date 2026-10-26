import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Experiment } from '../../types/experiment';
import { storageService } from '../../services/storageService';

export interface ExperimentMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  experiment: Experiment | null;
  onSaved: () => void;
}

export const ExperimentMetadataModal: React.FC<ExperimentMetadataModalProps> = ({
  isOpen,
  onClose,
  experiment,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [operator, setOperator] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (experiment) {
      setName(experiment.name);
      setOperator(experiment.operator || '');
      setNotes(experiment.notes || '');
      setError(null);
    }
  }, [experiment]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!experiment) return;

    try {
      setIsSaving(true);
      setError(null);
      await storageService.updateExperimentMetadata(experiment.id, {
        name: name.trim() || experiment.name,
        operator: operator.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!experiment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Experiment Metadata"
      subtitle="Modify descriptive tags without altering raw telemetry measurements"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} loading={isSaving}>
            Save Changes
          </Button>
        </>
      }
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-mono text-dark-300 uppercase mb-1">
            Experiment Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-dark-900 border border-dark-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-dark-300 uppercase mb-1">
            Operator / Experimenter
          </label>
          <input
            type="text"
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            className="w-full bg-dark-900 border border-dark-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-dark-300 uppercase mb-1">
            Scientific Notes & Observations
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-dark-900 border border-dark-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        {error && (
          <div className="p-2 rounded bg-danger-500/10 border border-danger-500/30 text-danger-400 text-xs">
            {error}
          </div>
        )}

        <div className="text-[11px] text-dark-500 font-mono">
          Note: Sensor readings ({experiment.readings.length} points) are immutable and strictly preserved.
        </div>
      </form>
    </Modal>
  );
};
