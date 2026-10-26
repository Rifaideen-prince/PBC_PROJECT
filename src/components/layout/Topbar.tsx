import React from 'react';
import {
  Usb,
  Radio,
  Clock,
  FlaskConical,
  Play,
  Pause,
  AlertTriangle,
} from 'lucide-react';
import { useSerial } from '../../context/SerialContext';
import { useExperiment } from '../../context/ExperimentContext';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatElapsedSeconds } from '../../utils/formatting';
import { useNavigate } from 'react-router-dom';

export const Topbar: React.FC = () => {
  const {
    connectionState,
    connect,
    disconnect,
    diagnostics,
  } = useSerial();

  const {
    status,
    elapsedSeconds,
    isDemoMode,
    enableDemoMode,
    disableDemoMode,
  } = useExperiment();

  const navigate = useNavigate();

  return (
    <header className="h-16 bg-dark-900 border-b border-dark-700/80 flex items-center justify-between px-4 sm:px-6 z-20 flex-shrink-0">
      {/* Left: System Status Pill Indicators */}
      <div className="flex items-center gap-3 overflow-x-auto py-1">
        {/* ESP32 Hardware Connection */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-dark-850 border border-dark-750">
          <Usb size={14} className={connectionState === 'connected' ? 'text-cyan-400' : 'text-dark-500'} />
          <span className="text-[11px] font-mono text-dark-400 uppercase">ESP32:</span>
          {connectionState === 'connected' ? (
            <Badge variant="cyan" size="sm" pulse>CONNECTED</Badge>
          ) : connectionState === 'connecting' ? (
            <Badge variant="amber" size="sm">CONNECTING...</Badge>
          ) : (
            <Badge variant="neutral" size="sm">DISCONNECTED</Badge>
          )}
        </div>

        {/* Sensors Status */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded bg-dark-850 border border-dark-750 text-[11px] font-mono">
          <span className="text-dark-500">PROBES:</span>
          <span title="Reference DS18B20" className="flex items-center gap-1">
            <span className={`h-1.5 w-1.5 rounded-full ${diagnostics.referenceStatus === 'optimal' ? 'bg-cyan-400' : 'bg-dark-600'}`} />
            <span className={diagnostics.referenceStatus === 'optimal' ? 'text-dark-200' : 'text-dark-500'}>REF</span>
          </span>
          <span className="text-dark-700">|</span>
          <span title="Test DS18B20" className="flex items-center gap-1">
            <span className={`h-1.5 w-1.5 rounded-full ${diagnostics.sampleStatus === 'optimal' ? 'bg-cyan-400' : 'bg-dark-600'}`} />
            <span className={diagnostics.sampleStatus === 'optimal' ? 'text-dark-200' : 'text-dark-500'}>TEST</span>
          </span>
          <span className="text-dark-700">|</span>
          <span title="DHT22 Ambient & Humidity" className="flex items-center gap-1">
            <span className={`h-1.5 w-1.5 rounded-full ${diagnostics.ambientStatus === 'optimal' ? 'bg-cyan-400' : 'bg-dark-600'}`} />
            <span className={diagnostics.ambientStatus === 'optimal' ? 'text-dark-200' : 'text-dark-500'}>DHT22</span>
          </span>
        </div>

        {/* Experiment State */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-dark-850 border border-dark-750">
          <Radio size={14} className={status === 'recording' ? 'text-danger-500 animate-pulse' : 'text-dark-500'} />
          <span className="text-[11px] font-mono text-dark-400 uppercase">EXP:</span>
          {status === 'recording' ? (
            <Badge variant="danger" size="sm" pulse>RECORDING</Badge>
          ) : status === 'paused' ? (
            <Badge variant="amber" size="sm">PAUSED</Badge>
          ) : status === 'completed' ? (
            <Badge variant="success" size="sm">COMPLETED</Badge>
          ) : (
            <Badge variant="neutral" size="sm">IDLE</Badge>
          )}
          {status !== 'idle' && (
            <span className="text-xs font-mono text-dark-300 ml-1 flex items-center gap-1">
              <Clock size={12} className="text-dark-500" />
              {formatElapsedSeconds(elapsedSeconds)}
            </span>
          )}
        </div>
      </div>

      {/* Right: Actions and Demo Toggle */}
      <div className="flex items-center gap-3">
        {/* Demo Mode Button */}
        {isDemoMode ? (
          <div className="flex items-center gap-2">
            <span className="hidden lg:inline text-[11px] text-amber-400 font-mono font-medium">
              DEMO DATA — NOT REAL SENSOR MEASUREMENTS
            </span>
            <Button
              variant="outline"
              size="sm"
              icon={<FlaskConical size={14} className="text-amber-400" />}
              onClick={disableDemoMode}
              className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
            >
              Exit Demo
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            icon={<FlaskConical size={14} />}
            onClick={enableDemoMode}
            title="Load deterministic benchmark cooling curves for testing without hardware"
          >
            Demo Mode
          </Button>
        )}

        {/* Context Primary Action Button */}
        {connectionState === 'disconnected' ? (
          <Button
            variant="outline"
            size="sm"
            icon={<Usb size={14} />}
            onClick={() => connect()}
          >
            Connect ESP32
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => disconnect()}
            className="text-dark-400 hover:text-danger-400"
          >
            Disconnect
          </Button>
        )}

        {/* Quick Navigate to Live Experiment if recording or paused */}
        {status === 'recording' && (
          <Button
            variant="danger"
            size="sm"
            icon={<Play size={14} />}
            onClick={() => navigate('/live')}
          >
            Live Monitor
          </Button>
        )}
        {status === 'paused' && (
          <Button
            variant="secondary"
            size="sm"
            icon={<Pause size={14} className="text-amber-400" />}
            onClick={() => navigate('/live')}
          >
            Resume Live
          </Button>
        )}
      </div>
    </header>
  );
};
