import React from 'react';
import { Button } from '../common/Button';
import { Grid, Compass, Focus, RotateCcw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export type RenderMode = 'solid' | 'wireframe' | 'solid-wire';

export interface RenderingControlsProps {
  renderMode: RenderMode;
  onRenderModeChange: (mode: RenderMode) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showAxes: boolean;
  onToggleAxes: () => void;
  onFitView: () => void;
  onResetCamera: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleFullscreen: () => void;
}

export const RenderingControls: React.FC<RenderingControlsProps> = ({
  renderMode,
  onRenderModeChange,
  showGrid,
  onToggleGrid,
  showAxes,
  onToggleAxes,
  onFitView,
  onResetCamera,
  onZoomIn,
  onZoomOut,
  onToggleFullscreen,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded bg-dark-900/90 border border-dark-750 backdrop-blur font-mono text-xs">
      {/* Rendering Modes */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-dark-500 uppercase px-1.5 font-semibold">MODE:</span>
        <Button
          size="sm"
          variant={renderMode === 'solid' ? 'primary' : 'secondary'}
          className="text-[11px] px-2 py-1 h-7"
          onClick={() => onRenderModeChange('solid')}
        >
          SOLID
        </Button>
        <Button
          size="sm"
          variant={renderMode === 'wireframe' ? 'primary' : 'secondary'}
          className="text-[11px] px-2 py-1 h-7"
          onClick={() => onRenderModeChange('wireframe')}
        >
          WIRE
        </Button>
        <Button
          size="sm"
          variant={renderMode === 'solid-wire' ? 'primary' : 'secondary'}
          className="text-[11px] px-2 py-1 h-7"
          onClick={() => onRenderModeChange('solid-wire')}
        >
          SOLID+WIRE
        </Button>
      </div>

      {/* Helper Toggles & View Controls */}
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant={showGrid ? 'outline' : 'secondary'}
          icon={<Grid size={14} />}
          onClick={onToggleGrid}
          className="h-7 px-2"
          title="Toggle Technical Ground Grid"
        >
          GRID
        </Button>

        <Button
          size="sm"
          variant={showAxes ? 'outline' : 'secondary'}
          icon={<Compass size={14} />}
          onClick={onToggleAxes}
          className="h-7 px-2"
          title="Toggle XYZ Axes Indicator"
        >
          AXES
        </Button>

        <Button
          size="sm"
          variant="secondary"
          icon={<Focus size={14} />}
          onClick={onFitView}
          className="h-7 px-2"
          title="Fit Model to Viewport"
        >
          FIT
        </Button>

        <Button
          size="sm"
          variant="secondary"
          icon={<RotateCcw size={14} />}
          onClick={onResetCamera}
          className="h-7 px-2"
          title="Reset Camera Pose"
        >
          RESET
        </Button>

        <Button
          size="sm"
          variant="ghost"
          icon={<ZoomIn size={14} />}
          onClick={onZoomIn}
          className="h-7 w-7 p-0"
          title="Zoom In"
        />

        <Button
          size="sm"
          variant="ghost"
          icon={<ZoomOut size={14} />}
          onClick={onZoomOut}
          className="h-7 w-7 p-0"
          title="Zoom Out"
        />

        <Button
          size="sm"
          variant="ghost"
          icon={<Maximize2 size={14} />}
          onClick={onToggleFullscreen}
          className="h-7 w-7 p-0"
          title="Toggle Fullscreen"
        />
      </div>
    </div>
  );
};
