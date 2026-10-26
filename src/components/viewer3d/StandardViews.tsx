import React from 'react';
import { Button } from '../common/Button';

export type CameraViewPreset = 'ISO' | 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM';

export interface StandardViewsProps {
  onSelectView: (view: CameraViewPreset) => void;
  activeView?: CameraViewPreset | null;
}

export const StandardViews: React.FC<StandardViewsProps> = ({
  onSelectView,
  activeView,
}) => {
  const views: CameraViewPreset[] = ['ISO', 'FRONT', 'BACK', 'LEFT', 'RIGHT', 'TOP', 'BOTTOM'];

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded bg-dark-900/90 border border-dark-750 backdrop-blur">
      <span className="text-[10px] font-mono text-dark-500 uppercase px-2 font-semibold">VIEW:</span>
      {views.map((v) => (
        <Button
          key={v}
          size="sm"
          variant={activeView === v ? 'primary' : 'secondary'}
          className="px-2 py-1 text-[11px] font-mono h-7"
          onClick={() => onSelectView(v)}
        >
          {v}
        </Button>
      ))}
    </div>
  );
};
