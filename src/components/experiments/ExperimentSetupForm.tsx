import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { InsulationMaterial } from '../../types/experiment';
import { FlaskConical, Play } from 'lucide-react';

export interface SetupFormData {
  name: string;
  sampleMaterial: InsulationMaterial;
  targetDurationSeconds: number;
  waterVolumeMl?: number | null;
  targetInitialTemperatureC?: number | null;
  insulationThicknessMm?: number | null;
  insulationLayers?: number | null;
  operator?: string;
  notes?: string;
}

export interface ExperimentSetupFormProps {
  onSetup: (data: SetupFormData) => void;
  disabled?: boolean;
}

export const ExperimentSetupForm: React.FC<ExperimentSetupFormProps> = ({
  onSetup,
  disabled = false,
}) => {
  const [name, setName] = useState(`EXP-${new Date().toISOString().slice(0, 10)}-RUN`);
  const [materialChoice, setMaterialChoice] = useState<'Bubble wrap' | 'Packaging foam' | 'Other'>('Bubble wrap');
  const [customMaterial, setCustomMaterial] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [waterVolume, setWaterVolume] = useState<string>('250');
  const [initialTemp, setInitialTemp] = useState<string>('75');
  const [thickness, setThickness] = useState<string>('4.0');
  const [layers, setLayers] = useState<string>('2');
  const [operator, setOperator] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalMaterial = materialChoice === 'Other' ? (customMaterial.trim() || 'Custom Polymer') : materialChoice;

    onSetup({
      name: name.trim() || `Experiment-${Date.now()}`,
      sampleMaterial: finalMaterial,
      targetDurationSeconds: Math.max(60, durationMinutes * 60),
      waterVolumeMl: waterVolume ? Number(waterVolume) : null,
      targetInitialTemperatureC: initialTemp ? Number(initialTemp) : null,
      insulationThicknessMm: thickness ? Number(thickness) : null,
      insulationLayers: layers ? Number(layers) : null,
      operator: operator.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Card
      title="Experiment Configuration Setup"
      subtitle="Define sample material parameters and operational test conditions"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Experiment Name & Material */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-dark-300 uppercase mb-1">
              Experiment Identifier *
            </label>
            <input
              type="text"
              required
              disabled={disabled}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-dark-900 border border-dark-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono disabled:opacity-50"
              placeholder="e.g. EXP-2026-BW-RUN1"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-dark-300 uppercase mb-1">
              Test Insulation Material *
            </label>
            <div className="flex gap-2">
              <select
                disabled={disabled}
                value={materialChoice}
                onChange={(e) => setMaterialChoice(e.target.value as any)}
                className="flex-1 bg-dark-900 border border-dark-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              >
                <option value="Bubble wrap">Bubble wrap</option>
                <option value="Packaging foam">Packaging foam</option>
                <option value="Other">Other / Custom Polymer</option>
              </select>
              {materialChoice === 'Other' && (
                <input
                  type="text"
                  required
                  disabled={disabled}
                  value={customMaterial}
                  onChange={(e) => setCustomMaterial(e.target.value)}
                  placeholder="Material name"
                  className="w-1/2 bg-dark-900 border border-dark-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Target Duration & Water Volume */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-mono text-dark-300 uppercase mb-1">
              Target Duration (min) *
            </label>
            <input
              type="number"
              min="1"
              max="180"
              required
              disabled={disabled}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full bg-dark-900 border border-dark-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-dark-300 uppercase mb-1">
              Water Volume (mL)
            </label>
            <input
              type="number"
              min="10"
              max="2000"
              disabled={disabled}
              value={waterVolume}
              onChange={(e) => setWaterVolume(e.target.value)}
              className="w-full bg-dark-900 border border-dark-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono disabled:opacity-50"
              placeholder="e.g. 250"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-dark-300 uppercase mb-1">
              Target Initial Temp (°C)
            </label>
            <input
              type="number"
              min="20"
              max="99"
              disabled={disabled}
              value={initialTemp}
              onChange={(e) => setInitialTemp(e.target.value)}
              className="w-full bg-dark-900 border border-dark-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono disabled:opacity-50"
              placeholder="e.g. 75"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-dark-300 uppercase mb-1">
              Insulation Thickness (mm)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              disabled={disabled}
              value={thickness}
              onChange={(e) => setThickness(e.target.value)}
              className="w-full bg-dark-900 border border-dark-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono disabled:opacity-50"
              placeholder="e.g. 4.0"
            />
          </div>
        </div>

        {/* Row 3: Insulation Layers, Operator & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-mono text-dark-300 uppercase mb-1">
              Number of Layers
            </label>
            <input
              type="number"
              min="1"
              max="10"
              disabled={disabled}
              value={layers}
              onChange={(e) => setLayers(e.target.value)}
              className="w-full bg-dark-900 border border-dark-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono disabled:opacity-50"
              placeholder="e.g. 2"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-dark-300 uppercase mb-1">
              Operator / Experimenter
            </label>
            <input
              type="text"
              disabled={disabled}
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full bg-dark-900 border border-dark-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono disabled:opacity-50"
              placeholder="e.g. MSE Student Team"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-dark-300 uppercase mb-1">
              Experimental Notes
            </label>
            <input
              type="text"
              disabled={disabled}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-dark-900 border border-dark-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono disabled:opacity-50"
              placeholder="e.g. Double-wrapped with adhesive seam"
            />
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            disabled={disabled}
            icon={<Play size={15} />}
          >
            Initialize Experiment Session
          </Button>
        </div>
      </form>
    </Card>
  );
};
