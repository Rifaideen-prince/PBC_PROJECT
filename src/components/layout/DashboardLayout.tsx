import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useExperiment } from '../../context/ExperimentContext';

export const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { isDemoMode } = useExperiment();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-dark-950 text-dark-200">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {/* Main Container */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <Topbar />

        {/* Global Demo Banner */}
        {isDemoMode && (
          <div className="bg-amber-950/40 border-b border-amber-500/30 px-4 py-1 text-center text-xs font-mono text-amber-300 flex items-center justify-center gap-2 flex-shrink-0">
            <span className="font-bold">DEMO DATA — NOT REAL SENSOR MEASUREMENTS</span>
            <span className="text-amber-400/80">| Synthetic Newton Cooling Model Active</span>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-dark-950/60">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
