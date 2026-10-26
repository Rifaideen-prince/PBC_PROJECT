import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { useSerial } from '../../context/SerialContext';
import { formatDateTime } from '../../utils/formatting';
import { Cpu, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

export const ConnectionStatus: React.FC = () => {
  const {
    connectionState,
    connectionError,
    deviceInfo,
    diagnostics,
  } = useSerial();

  const getStatusIcon = (status: 'optimal' | 'warning' | 'error' | 'disconnected') => {
    switch (status) {
      case 'optimal':
        return <CheckCircle2 size={14} className="text-success-400" />;
      case 'warning':
        return <AlertTriangle size={14} className="text-amber-400" />;
      case 'error':
        return <XCircle size={14} className="text-danger-400" />;
      default:
        return <span className="h-2 w-2 rounded-full bg-dark-600 inline-block" />;
    }
  };

  const getStatusBadge = (status: 'optimal' | 'warning' | 'error' | 'disconnected') => {
    switch (status) {
      case 'optimal':
        return <Badge variant="success" size="sm">VALID</Badge>;
      case 'warning':
        return <Badge variant="amber" size="sm">WARNING</Badge>;
      case 'error':
        return <Badge variant="danger" size="sm">FAULT</Badge>;
      default:
        return <Badge variant="neutral" size="sm">UNAVAILABLE</Badge>;
    }
  };

  return (
    <Card
      title="Hardware Diagnostics"
      subtitle="ESP32 Controller & Digital Probe Telemetry"
      headerAction={
        connectionState === 'connected' ? (
          <Badge variant="cyan" size="sm" pulse>ONLINE</Badge>
        ) : (
          <Badge variant="neutral" size="sm">OFFLINE</Badge>
        )
      }
    >
      <div className="space-y-4">
        {/* Device Information */}
        <div className="flex items-center justify-between p-2.5 rounded bg-dark-900/60 border border-dark-750">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-cyan-400" />
            <span className="text-xs font-mono text-dark-300">
              {deviceInfo ? deviceInfo.device : 'ESP32 Dev Module (USB-Serial)'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-dark-400">
            {deviceInfo?.firmwareVersion ? `v${deviceInfo.firmwareVersion}` : '115200 Baud'}
          </span>
        </div>

        {/* Diagnostic Probes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Reference DS18B20 */}
          <div className="p-3 rounded bg-dark-900/40 border border-dark-750 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-dark-400">REF PROBE (DS18B20)</span>
              {getStatusIcon(diagnostics.referenceStatus)}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-dark-200">Reference Water</span>
              {getStatusBadge(diagnostics.referenceStatus)}
            </div>
          </div>

          {/* Test DS18B20 */}
          <div className="p-3 rounded bg-dark-900/40 border border-dark-750 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-dark-400">TEST PROBE (DS18B20)</span>
              {getStatusIcon(diagnostics.sampleStatus)}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-dark-200">Insulated Test Water</span>
              {getStatusBadge(diagnostics.sampleStatus)}
            </div>
          </div>

          {/* DHT22 */}
          <div className="p-3 rounded bg-dark-900/40 border border-dark-750 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-dark-400">AMBIENT SENSOR (DHT22)</span>
              {getStatusIcon(diagnostics.ambientStatus)}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-dark-200">Air Temp & Humidity</span>
              {getStatusBadge(diagnostics.ambientStatus)}
            </div>
          </div>
        </div>

        {/* Timestamps & Telemetry counters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-dark-400 pt-1 border-t border-dark-750">
          <div className="flex justify-between">
            <span>Last Valid Water Reading:</span>
            <span className="text-dark-200">
              {diagnostics.lastValidReadingTime ? diagnostics.lastValidReadingTime.toLocaleTimeString() : '--'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Last Ambient Reading:</span>
            <span className="text-dark-200">
              {diagnostics.lastAmbientReadingTime ? diagnostics.lastAmbientReadingTime.toLocaleTimeString() : '--'}
            </span>
          </div>
        </div>

        {/* Connection Error Message */}
        {connectionError && (
          <div className="p-2.5 rounded bg-danger-500/10 border border-danger-500/30 text-danger-400 text-xs flex items-start gap-2">
            <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block uppercase">Serial Error</span>
              <span>{connectionError}</span>
            </div>
          </div>
        )}

        {/* Notice regarding Arduino Serial Monitor */}
        <div className="flex items-center gap-1.5 text-[11px] text-dark-500">
          <Info size={13} className="text-dark-400 flex-shrink-0" />
          <span>Note: Close Arduino IDE Serial Monitor before initiating Web Serial connection.</span>
        </div>
      </div>
    </Card>
  );
};
