import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Thermometer, Droplets, ArrowRightLeft } from 'lucide-react';
import { formatTemperature, formatHumidity } from '../../utils/formatting';

export interface SensorCardProps {
  type: 'reference' | 'sample' | 'ambient' | 'humidity' | 'difference';
  value: number | null | undefined;
  status?: 'optimal' | 'warning' | 'error' | 'disconnected';
  stale?: boolean;
  materialName?: string;
}

export const SensorCard: React.FC<SensorCardProps> = ({
  type,
  value,
  status = 'disconnected',
  stale = false,
  materialName,
}) => {
  const config = {
    reference: {
      title: 'Reference Water Temp',
      subtitle: 'DS18B20 • Uninsulated Container',
      icon: Thermometer,
      accentColor: 'text-cyan-400',
      badgeColor: 'cyan' as const,
      format: (v: number | null | undefined) => formatTemperature(v),
    },
    sample: {
      title: `Test Water Temp ${materialName ? `(${materialName})` : ''}`,
      subtitle: 'DS18B20 • Insulated Container',
      icon: Thermometer,
      accentColor: 'text-cyan-400',
      badgeColor: 'cyan' as const,
      format: (v: number | null | undefined) => formatTemperature(v),
    },
    ambient: {
      title: 'Ambient Temperature',
      subtitle: 'DHT22 • Air Baseline',
      icon: Thermometer,
      accentColor: 'text-dark-300',
      badgeColor: 'neutral' as const,
      format: (v: number | null | undefined) => formatTemperature(v, 1),
    },
    humidity: {
      title: 'Relative Humidity',
      subtitle: 'DHT22 • Ambient RH',
      icon: Droplets,
      accentColor: 'text-dark-300',
      badgeColor: 'neutral' as const,
      format: (v: number | null | undefined) => formatHumidity(v, 1),
    },
    difference: {
      title: 'Temperature Difference',
      subtitle: 'Delta (Reference - Test)',
      icon: ArrowRightLeft,
      accentColor: 'text-cyan-300',
      badgeColor: 'cyan' as const,
      format: (v: number | null | undefined) => {
        if (v === null || v === undefined) return '--';
        return `${v > 0 ? '+' : ''}${v.toFixed(2)} °C`;
      },
    },
  }[type];

  const Icon = config.icon;
  const isAvailable = value !== null && value !== undefined && Number.isFinite(value);

  const getStatusBadge = () => {
    if (stale) return <Badge variant="amber" size="sm">STALE</Badge>;
    if (!isAvailable) return <Badge variant="neutral" size="sm">NO DATA</Badge>;
    if (status === 'optimal') return <Badge variant="success" size="sm">NORMAL</Badge>;
    if (status === 'warning') return <Badge variant="amber" size="sm">WARNING</Badge>;
    if (status === 'error') return <Badge variant="danger" size="sm">ERROR</Badge>;
    return <Badge variant="neutral" size="sm">OFFLINE</Badge>;
  };

  return (
    <Card className="hover:border-dark-600 transition-colors">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-dark-300 uppercase tracking-wider">
              {config.title}
            </span>
            {getStatusBadge()}
          </div>
          <p className="text-[11px] text-dark-500 font-mono">{config.subtitle}</p>
        </div>
        <div className="p-2 rounded bg-dark-800 border border-dark-750 text-dark-400">
          <Icon size={18} className={config.accentColor} />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <div className="font-mono text-3xl font-bold tracking-tight text-white">
          {config.format(value)}
        </div>
        {type === 'difference' && isAvailable && (
          <span className="text-[11px] font-mono text-dark-400">
            {value! > 0 ? 'Ref warmer' : value! < 0 ? 'Sample warmer' : 'Equal'}
          </span>
        )}
      </div>
    </Card>
  );
};
