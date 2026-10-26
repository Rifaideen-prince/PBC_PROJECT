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

export interface ComparisonChartProps {
  data: TimeAlignedComparisonPoint[];
  height?: number | string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-900 border border-dark-700 p-3 rounded shadow-2xl font-mono text-xs space-y-1.5 min-w-[220px]">
        <div className="flex justify-between items-center text-dark-400 font-semibold border-b border-dark-750 pb-1">
          <span>Elapsed: {formatElapsedSeconds(Number(label))}</span>
          <span className="text-[10px] text-dark-500">{label}s</span>
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={`tooltip-${index}`} className="flex justify-between items-center text-xs">
            <span style={{ color: entry.color }} className="font-medium">
              {entry.name}:
            </span>
            <span className="font-bold text-white">
              {entry.value !== null && entry.value !== undefined
                ? `${Number(entry.value).toFixed(2)} °C`
                : '--'}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  data,
  height = 420,
}) => {
  const yDomain = React.useMemo(() => {
    const vals = data
      .flatMap(p => [p.avgReferenceTempC, p.bubbleWrapTempC, p.packagingFoamTempC])
      .filter((v): v is number => v !== null && Number.isFinite(v));

    if (vals.length === 0) return [20, 80];
    const min = Math.floor(Math.min(...vals) - 2);
    const max = Math.ceil(Math.max(...vals) + 2);
    return [Math.max(0, min), max];
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex flex-col items-center justify-center border border-dashed border-dark-700/80 rounded bg-dark-900/30 text-dark-500 font-mono text-xs p-6"
      >
        <span className="text-dark-300 font-semibold mb-1">Comparative Dataset Not Populated</span>
        <span>Select or record both Bubble Wrap and Packaging Foam experiments to generate the multi-curve response</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }} className="pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1c2536" />
          <XAxis
            dataKey="elapsedSeconds"
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
            height={40}
            formatter={(value) => (
              <span className="text-xs font-mono text-dark-200 font-medium tracking-wide">
                {value}
              </span>
            )}
          />

          {/* Curve 1: Average Reference (Baseline) */}
          <Line
            type="monotone"
            dataKey="avgReferenceTempC"
            name="Average Reference (Uninsulated)"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={false}
          />

          {/* Curve 2: Bubble Wrap Configuration */}
          <Line
            type="monotone"
            dataKey="bubbleWrapTempC"
            name="Bubble Wrap Configuration"
            stroke="#00e5ff"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />

          {/* Curve 3: Packaging Foam Configuration */}
          <Line
            type="monotone"
            dataKey="packagingFoamTempC"
            name="Packaging Foam Configuration"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
