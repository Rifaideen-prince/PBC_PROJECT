import React from 'react';
import { ModelViewer } from '../components/viewer3d/ModelViewer';
import { Badge } from '../components/common/Badge';

export const ModelViewerPage: React.FC = () => {
  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="p-4 rounded bg-dark-900 border border-dark-750 flex items-center justify-between flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold font-mono text-white uppercase tracking-wider">
              3D Physical Apparatus Inspection
            </h1>
            <Badge variant="cyan" size="sm">THREE.JS • OBJ ENGINE</Badge>
          </div>
          <p className="text-xs text-dark-400 mt-0.5">
            Interactive CAD geometric inspection of the dual-container thermal testing rig and sensor immersion geometry
          </p>
        </div>
      </div>

      {/* 3D Model Viewer Canvas Component */}
      <div className="flex-1 min-h-0">
        <ModelViewer />
      </div>
    </div>
  );
};
