import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  GitCompare,
  Box,
  FileText,
  ChevronLeft,
  ChevronRight,
  Flame,
  FlaskConical,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useExperiment } from '../../context/ExperimentContext';
import { Badge } from '../common/Badge';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { isDemoMode, status } = useExperiment();

  const navItems = [
    { name: 'MAIN DASHBOARD', path: '/', icon: LayoutDashboard },
    { name: 'LIVE EXPERIMENT', path: '/live', icon: Activity, recordingBadge: status === 'recording' },
    { name: 'COMPARATIVE ANALYSIS', path: '/analysis', icon: GitCompare },
    { name: '3D MODEL VIEWER', path: '/viewer', icon: Box },
    { name: 'REPORTS & PROJECT INFO', path: '/reports', icon: FileText },
  ];

  return (
    <aside
      className={clsx(
        'relative flex flex-col flex-shrink-0 bg-dark-900 border-r border-dark-700/80 transition-all duration-200 z-30 select-none',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Branding Header */}
      <div className="flex items-center justify-between px-3.5 py-4 border-b border-dark-700/80 h-16">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-9 h-9 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex-shrink-0">
            <Flame size={20} className="text-cyan-400" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-mono text-sm font-bold tracking-wider text-white">THERMALAB</span>
              <span className="text-[10px] text-dark-400 truncate tracking-tight">Thermal Response Testing</span>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-1 rounded text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Demo Mode Notice */}
      {isDemoMode && !collapsed && (
        <div className="mx-3 mt-3 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] leading-tight flex items-start gap-1.5">
          <FlaskConical size={14} className="flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block uppercase">Demo Mode Active</span>
            <span>Simulated Newton cooling curves loaded.</span>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium tracking-wide transition-colors relative group',
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold'
                  : 'text-dark-300 hover:bg-dark-800/80 hover:text-white border border-transparent'
              )
            }
            title={collapsed ? item.name : undefined}
          >
            <item.icon size={18} className="flex-shrink-0" />
            {!collapsed && (
              <span className="flex-1 truncate uppercase font-sans text-xs">{item.name}</span>
            )}
            {!collapsed && item.recordingBadge && (
              <Badge variant="danger" size="sm" pulse>REC</Badge>
            )}
            {collapsed && item.recordingBadge && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-danger-500 animate-pulse" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-3 border-t border-dark-700/80 bg-dark-950/40 text-[10px] text-dark-500 space-y-1">
          <div className="flex justify-between font-mono">
            <span>PLATFORM</span>
            <span className="text-dark-400">MSE-THERMALAB</span>
          </div>
          <div className="flex justify-between font-mono">
            <span>FIRMWARE</span>
            <span className="text-dark-400">ESP32 115200</span>
          </div>
        </div>
      )}
    </aside>
  );
};
