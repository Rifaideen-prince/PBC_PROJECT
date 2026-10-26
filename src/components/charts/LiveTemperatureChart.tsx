import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { SensorReading } from '../../types/sensor';
import { formatElapsedSeconds } from '../../utils/formatting';

export interface LiveTemperatureChartProps {
  readings: SensorReading[];
  sampleMaterial?: string;
  height?: number | string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-900 border border-dark-700 p-2.5 rounded shadow-xl font-mono text-xs space-y-1">
        <p className="text-dark-400 font-semibold border-b border-dark-750 pb-1">
          Time: {formatElapsedSeconds(Number(label))} ({label}s)
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={`tooltip-${index}`} style={{ color: entry.color }} className="flex justify-between gap-4">
            <span>{entry.name}:</span>
            <span className="font-bold">{entry.value !== null ? `${Number(entry.value).toFixed(2)} °C` : '--'}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const LiveTemperatureChart: React.FC<LiveTemperatureChartProps> = ({
  readings,
  sampleMaterial = 'Insulated Sample',
  height = 360,
}) => {
  // Format readings into chart points
  const chartData = React.useMemo(() => {
    return readings.map(r => ({
      timeSec: Math.round(r.elapsedMs / 1000),
      reference: r.referenceTempC,
      sample: r.sampleTempC,
    }));
  }, [readings]);

  // Compute nice Y-domain
  const yDomain = React.useMemo(() => {
    const validVals = readings
      .flatMap(r => [r.referenceTempC, r.sampleTempC])
      .filter((v): v is number => v !== null && Number.isFinite(v));

    if (validVals.length === 0) return [20, 80];
    const min = Math.floor(Math.min(...validVals) - 2);
    const max = Math.ceil(Math.max(...validVals) + 2);
    return [Math.max(0, min), max];
  }, [readings]);

  if (chartData.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex flex-col items-center justify-center border border-dashed border-dark-700/80 rounded bg-dark-900/30 text-dark-500 font-mono text-xs"
      >
        <span>No temperature telemetry data available yet</span>
        <span className="text-[11px] text-dark-600 mt-1">Start recording to capture real-time DS18B20 water cooling curves</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }} className="pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
          <XAxis
            dataKey="timeSec"
            tickFormatter={(sec) => formatElapsedSeconds(sec)}
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            domain={yDomain}
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            unit="°C"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => (
              <span className="text-xs font-mono text-dark-300 font-medium tracking-wide">
                {value}
              </span>
            )}
          />
          <Line
            type="monotone"
            dataKey="reference"
            name="Reference (Uninsulated)"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="sample"
            name={`Test Container (${sampleMaterial})`}
            stroke="#00e5ff"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
