import React from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { CheckSquare, Square, CheckCheck, AlertCircle } from 'lucide-react';
import { ExperimentChecklist as ChecklistType } from '../../types/experiment';

export interface ExperimentChecklistProps {
  checklist: ChecklistType;
  onChange: (key: keyof ChecklistType, val: boolean) => void;
  onConfirmAll: () => void;
  isConfirmed: boolean;
  disabled?: boolean;
}

export const ExperimentChecklist: React.FC<ExperimentChecklistProps> = ({
  checklist,
  onChange,
  onConfirmAll,
  isConfirmed,
  disabled = false,
}) => {
  const items: Array<{ key: keyof ChecklistType; label: string; desc: string }> = [
    {
      key: 'referenceContainerPrepared',
      label: 'Reference Container Prepared',
      desc: 'Standard uninsulated container clean, dry, and positioned at identical bench distance.',
    },
    {
      key: 'testContainerPrepared',
      label: 'Test Container Prepared',
      desc: 'Sample insulation (Bubble Wrap / Foam) secured uniformly around test vessel walls.',
    },
    {
      key: 'probesPositionedCorrectly',
      label: 'DS18B20 Probes Immersed Correctly',
      desc: 'Both probes submerged to equal geometric centroid depth without wall contact.',
    },
    {
      key: 'waterConditionsChecked',
      label: 'Warm Water Thermal Equilibrium',
      desc: 'Identical warm water volume poured simultaneously into both vessels.',
    },
    {
      key: 'sampleConfirmed',
      label: 'Sample Material Configuration Verified',
      desc: 'Insulation material layers and thickness accurately entered in metadata setup.',
    },
  ];

  return (
    <Card
      title="Pre-Recording Verification Checklist"
      subtitle="Operator verification of laboratory physical setup prior to telemetry acquisition"
      headerAction={
        isConfirmed ? (
          <span className="text-xs font-mono text-success-400 font-semibold flex items-center gap-1">
            <CheckCheck size={14} /> ALL VERIFIED
          </span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={disabled}
            icon={<CheckCheck size={14} />}
            onClick={onConfirmAll}
          >
            Confirm All
          </Button>
        )
      }
    >
      <div className="space-y-3">
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.key}
              onClick={() => !disabled && onChange(item.key, !checklist[item.key])}
              className={`flex items-start gap-3 p-2.5 rounded border transition-colors cursor-pointer select-none ${
                checklist[item.key]
                  ? 'bg-dark-900/60 border-cyan-500/40 text-dark-200'
                  : 'bg-dark-900/20 border-dark-750 text-dark-400 hover:border-dark-700'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div className="mt-0.5 flex-shrink-0 text-cyan-400">
                {checklist[item.key] ? <CheckSquare size={16} /> : <Square size={16} className="text-dark-600" />}
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-dark-200">{item.label}</p>
                <p className="text-[11px] text-dark-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded bg-dark-900/40 border border-dark-750 text-[11px] text-dark-400">
          <AlertCircle size={14} className="text-amber-400 flex-shrink-0" />
          <span>
            Physical verification notice: Physical apparatus geometry is manually affirmed by the operator. THERMALAB does not claim automatic sensor-based verification of container boundary conditions.
          </span>
        </div>
      </div>
    </Card>
  );
};
