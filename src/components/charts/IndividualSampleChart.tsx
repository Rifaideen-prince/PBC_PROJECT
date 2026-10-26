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
import { TimeAlignedComparisonPoint } from '../../types/analysis';
import { formatElapsedSeconds } from '../../utils/formatting';

export interface IndividualSampleChartProps {
  data: TimeAlignedComparisonPoint[];
  sampleKey: 'bubbleWrapTempC' | 'packagingFoamTempC';
  sampleLabel: string;
  sampleColor?: string;
  height?: number | string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-900 border border-dark-700 p-2.5 rounded shadow-xl font-mono text-xs space-y-1">
        <p className="text-dark-400 font-semibold border-b border-dark-750 pb-1">
          Time: {formatElapsedSeconds(Number(label))}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={`tooltip-${index}`} style={{ color: entry.color }} className="flex justify-between gap-3">
            <span>{entry.name}:</span>
            <span className="font-bold">{entry.value !== null ? `${Number(entry.value).toFixed(2)} °C` : '--'}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const IndividualSampleChart: React.FC<IndividualSampleChartProps> = ({
  data,
  sampleKey,
  sampleLabel,
  sampleColor = '#00e5ff',
  height = 200,
}) => {
  const yDomain = React.useMemo(() => {
    const vals = data
      .flatMap(p => [p.avgReferenceTempC, p[sampleKey]])
      .filter((v): v is number => v !== null && Number.isFinite(v));

    if (vals.length === 0) return [20, 80];
    const min = Math.floor(Math.min(...vals) - 2);
    const max = Math.ceil(Math.max(...vals) + 2);
    return [Math.max(0, min), max];
  }, [data, sampleKey]);

  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center border border-dashed border-dark-700/80 rounded bg-dark-900/30 text-dark-500 font-mono text-xs"
      >
        <span>No run data available</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }} className="pt-1">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 15, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#182233" />
          <XAxis
            dataKey="elapsedSeconds"
            tickFormatter={(sec) => formatElapsedSeconds(sec)}
            stroke="#64748b"
            fontSize={10}
            tickLine={false}
          />
          <YAxis
            domain={yDomain}
            stroke="#64748b"
            fontSize={10}
            tickLine={false}
            unit="°C"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={28}
            formatter={(value) => (
              <span className="text-[11px] font-mono text-dark-300 font-medium">
                {value}
              </span>
            )}
          />
          <Line
            type="monotone"
            dataKey="avgReferenceTempC"
            name="Avg Reference"
            stroke="#f59e0b"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey={sampleKey}
            name={sampleLabel}
            stroke={sampleColor}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
