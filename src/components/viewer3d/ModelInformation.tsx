import React from 'react';
import { Box, Layers, Triangle } from 'lucide-react';

export interface ModelStats {
  filename: string;
  vertexCount: number;
  faceCount: number;
  triangleCount: number;
  dimensions?: { x: number; y: number; z: number };
}

export interface ModelInformationProps {
  stats: ModelStats | null;
  loading: boolean;
}

export const ModelInformation: React.FC<ModelInformationProps> = ({
  stats,
  loading,
}) => {
  if (loading) {
    return (
      <div className="p-3 rounded bg-dark-900/80 border border-dark-750 font-mono text-xs text-dark-400 flex items-center gap-2">
        <span className="animate-spin h-3.5 w-3.5 border-2 border-cyan-500 border-t-transparent rounded-full" />
        <span>Parsing OBJ geometry & computing bounding envelope...</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-3 rounded bg-dark-900/80 border border-dark-750 font-mono text-xs text-dark-500">
        No active 3D model loaded
      </div>
    );
  }

  return (
    <div className="p-3 rounded bg-dark-900/90 border border-dark-750 backdrop-blur font-mono text-xs space-y-2">
      <div className="flex items-center justify-between pb-1.5 border-b border-dark-750">
        <span className="text-dark-400">OBJECT:</span>
        <span className="text-cyan-400 font-semibold truncate max-w-[180px]" title={stats.filename}>
          {stats.filename}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-dark-300">
        <div className="flex items-center gap-1.5" title="Total unique vertices">
          <Layers size={13} className="text-dark-500" />
          <span>{stats.vertexCount.toLocaleString()} <span className="text-[10px] text-dark-500">verts</span></span>
        </div>
        <div className="flex items-center gap-1.5" title="Polygonal faces">
          <Box size={13} className="text-dark-500" />
          <span>{stats.faceCount.toLocaleString()} <span className="text-[10px] text-dark-500">faces</span></span>
        </div>
        <div className="flex items-center gap-1.5" title="Rendered triangles">
          <Triangle size={13} className="text-dark-500" />
          <span>{stats.triangleCount.toLocaleString()} <span className="text-[10px] text-dark-500">tris</span></span>
        </div>
      </div>

      {stats.dimensions && (
        <div className="pt-1.5 border-t border-dark-750 flex items-center justify-between text-[11px] text-dark-400">
          <span>BOUNDS (X × Y × Z):</span>
          <span className="text-dark-200">
            {stats.dimensions.x.toFixed(1)} × {stats.dimensions.y.toFixed(1)} × {stats.dimensions.z.toFixed(1)} mm
          </span>
        </div>
      )}
    </div>
  );
};
