import React, { useState, useMemo, useEffect } from 'react';
import { useExperiment } from '../context/ExperimentContext';
import { analysisService } from '../services/analysisService';
import { ComparisonChart } from '../components/charts/ComparisonChart';
import { IndividualSampleChart } from '../components/charts/IndividualSampleChart';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { RankingCriterion } from '../types/analysis';
import { formatTemperature, formatCoolingRate, formatPercentage } from '../utils/formatting';
import {
  GitCompare,
  Layers,
  Award,
  AlertTriangle,
  Info,
  RotateCcw,
  FlaskConical,
} from 'lucide-react';

export const AnalysisPage: React.FC = () => {
  const { allStoredExperiments, enableDemoMode, isDemoMode } = useExperiment();

  // Find stored experiments matching Bubble wrap and Packaging foam
  const bubbleWrapCandidates = useMemo(() => {
    return allStoredExperiments.filter(e => e.sampleMaterial.toLowerCase().includes('bubble'));
  }, [allStoredExperiments]);

  const packagingFoamCandidates = useMemo(() => {
    return allStoredExperiments.filter(e => e.sampleMaterial.toLowerCase().includes('foam'));
  }, [allStoredExperiments]);

  const [selectedBubbleId, setSelectedBubbleId] = useState<string>('');
  const [selectedFoamId, setSelectedFoamId] = useState<string>('');
  const [rankingCriterion, setRankingCriterion] = useState<RankingCriterion>('cooling_rate');

  // Auto-select initial candidates if available
  useEffect(() => {
    if (bubbleWrapCandidates.length > 0 && !selectedBubbleId) {
      setSelectedBubbleId(bubbleWrapCandidates[0].id);
    }
  }, [bubbleWrapCandidates, selectedBubbleId]);

  useEffect(() => {
    if (packagingFoamCandidates.length > 0 && !selectedFoamId) {
      setSelectedFoamId(packagingFoamCandidates[0].id);
    }
  }, [packagingFoamCandidates, selectedFoamId]);

  const bubbleExp = useMemo(() => {
    return allStoredExperiments.find(e => e.id === selectedBubbleId) || null;
  }, [allStoredExperiments, selectedBubbleId]);

  const foamExp = useMemo(() => {
    return allStoredExperiments.find(e => e.id === selectedFoamId) || null;
  }, [allStoredExperiments, selectedFoamId]);

  // Compute time-aligned dataset for 3-graph layout
  const comparisonData = useMemo(() => {
    return analysisService.generateComparativeDataset(bubbleExp, foamExp, 2);
  }, [bubbleExp, foamExp]);

  // Compute metrics
  const bubbleMetrics = useMemo(() => {
    return bubbleExp ? analysisService.computeMetrics(bubbleExp) : null;
  }, [bubbleExp]);

  const foamMetrics = useMemo(() => {
    return foamExp ? analysisService.computeMetrics(foamExp) : null;
  }, [foamExp]);

  // Compatibility validation
  const compatibility = useMemo(() => {
    return analysisService.checkCompatibility(bubbleExp, foamExp);
  }, [bubbleExp, foamExp]);

  // Material Rankings
  const rankings = useMemo(() => {
    const list = [];
    if (bubbleMetrics) list.push(bubbleMetrics.sampleMetrics);
    if (foamMetrics) list.push(foamMetrics.sampleMetrics);
    if (bubbleMetrics) list.push(bubbleMetrics.referenceMetrics);
    return analysisService.getRanking(list, rankingCriterion);
  }, [bubbleMetrics, foamMetrics, rankingCriterion]);

  const hasData = bubbleExp !== null || foamExp !== null;

  return (
    <div className="space-y-6">
      {/* Header & Run Selectors */}
      <div className="p-4 rounded bg-dark-900 border border-dark-750 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold font-mono text-white uppercase tracking-wider">
              Comparative Thermal Response Analysis
            </h1>
            <Badge variant="cyan" size="sm">3-GRAPH LAYOUT</Badge>
          </div>
          <p className="text-xs text-dark-400 mt-0.5">
            Empirical cooling dynamics comparison against normalized dual-run uninsulated reference
          </p>
        </div>

        {/* Candidate Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-dark-400">BUBBLE WRAP:</span>
            <select
              value={selectedBubbleId}
              onChange={(e) => setSelectedBubbleId(e.target.value)}
              className="bg-dark-850 border border-dark-700 text-xs text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="">-- Select Run --</option>
              {bubbleWrapCandidates.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.readings.length} pts)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-dark-400">PACKAGING FOAM:</span>
            <select
              value={selectedFoamId}
              onChange={(e) => setSelectedFoamId(e.target.value)}
              className="bg-dark-850 border border-dark-700 text-xs text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="">-- Select Run --</option>
              {packagingFoamCandidates.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.readings.length} pts)
                </option>
              ))}
            </select>
          </div>

          {!hasData && (
            <Button
              variant="outline"
              size="sm"
              icon={<FlaskConical size={14} />}
              onClick={enableDemoMode}
            >
              Load Demo Comparison
            </Button>
          )}
        </div>
      </div>

      {/* Compatibility Warnings if applicable */}
      {compatibility.warnings.length > 0 && hasData && (
        <div className="p-3.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1.5 font-mono">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <AlertTriangle size={15} />
            <span>SCIENTIFIC COMPATIBILITY WARNING:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-dark-300 pl-1">
            {compatibility.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {!hasData ? (
        <EmptyState
          icon="chart"
          title="No Comparative Runs Selected"
          description="Comparative analysis requires recorded runs for Bubble wrap and Packaging foam. Conduct live experiments with both materials or initialize demo mode to test the 3-graph analysis interface."
          actionText="Load Benchmark Demo Runs"
          onAction={enableDemoMode}
        />
      ) : (
        <>
          {/* THE MANDATORY THREE-GRAPH LAYOUT (Section 8) */}
          {/* LEFT COLUMN: Individual graphs | RIGHT/CENTRAL: One large comparison graph */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT COLUMN (4 Cols): Bubble wrap & Packaging foam individual graphs */}
            <div className="lg:col-span-4 space-y-5">
              {/* Top: Bubble Wrap Individual Graph */}
              <Card
                title="Bubble Wrap Response"
                subtitle="Average Reference vs Bubble Wrap Curve"
                headerAction={<Badge variant="cyan" size="sm">RUN A</Badge>}
              >
                <IndividualSampleChart
                  data={comparisonData}
                  sampleKey="bubbleWrapTempC"
                  sampleLabel="Bubble Wrap"
                  sampleColor="#00e5ff"
                  height={190}
                />
              </Card>

              {/* Bottom: Packaging Foam Individual Graph */}
              <Card
                title="Packaging Foam Response"
                subtitle="Average Reference vs Packaging Foam Curve"
                headerAction={<Badge variant="success" size="sm">RUN B</Badge>}
              >
                <IndividualSampleChart
                  data={comparisonData}
                  sampleKey="packagingFoamTempC"
                  sampleLabel="Packaging Foam"
                  sampleColor="#10b981"
                  height={190}
                />
              </Card>
            </div>

            {/* RIGHT / CENTRAL AREA (8 Cols): One large comparison graph */}
            <div className="lg:col-span-8">
              <Card
                title="Multi-Configuration Comparative Cooling Response"
                subtitle="Average Reference Curve • Bubble Wrap Configuration • Packaging Foam Configuration"
                headerAction={
                  <div className="flex items-center gap-2 font-mono text-xs text-dark-400">
                    <span>Alignment: Bounded 1s Grid</span>
                  </div>
                }
              >
                <ComparisonChart data={comparisonData} height={435} />
              </Card>
            </div>
          </div>

          {/* Calculated Performance Metrics & Material Rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Performance Metrics Table (8 Cols) */}
            <div className="lg:col-span-8">
              <Card
                title="Thermal Performance Metrics Table"
                subtitle="Empirical cooling rates and thermal reduction relative to reference"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-dark-700/80 text-dark-400 uppercase text-[11px]">
                        <th className="pb-2.5 font-semibold">Configuration</th>
                        <th className="pb-2.5 font-semibold">Initial T (°C)</th>
                        <th className="pb-2.5 font-semibold">Final T (°C)</th>
                        <th className="pb-2.5 font-semibold">Delta T (°C)</th>
                        <th className="pb-2.5 font-semibold">Cooling Rate</th>
                        <th className="pb-2.5 font-semibold">Rate Reduction</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-800">
                      {/* Reference Row */}
                      {bubbleMetrics && (
                        <tr className="hover:bg-dark-800/40">
                          <td className="py-2.5 font-semibold text-amber-400">
                            Uninsulated Reference
                          </td>
                          <td className="py-2.5 text-dark-300">
                            {formatTemperature(bubbleMetrics.referenceMetrics.initialTempC)}
                          </td>
                          <td className="py-2.5 text-dark-300">
                            {formatTemperature(bubbleMetrics.referenceMetrics.finalTempC)}
                          </td>
                          <td className="py-2.5 text-dark-300">
                            {formatTemperature(bubbleMetrics.referenceMetrics.totalDropC)}
                          </td>
                          <td className="py-2.5 text-white font-bold">
                            {formatCoolingRate(bubbleMetrics.referenceMetrics.coolingRateCPerMin)}
                          </td>
                          <td className="py-2.5 text-dark-500">
                            Baseline (0.00%)
                          </td>
                        </tr>
                      )}

                      {/* Bubble Wrap Row */}
                      {bubbleMetrics && (
                        <tr className="hover:bg-dark-800/40">
                          <td className="py-2.5 font-semibold text-cyan-400">
                            Bubble Wrap
                          </td>
                          <td className="py-2.5 text-dark-300">
                            {formatTemperature(bubbleMetrics.sampleMetrics.initialTempC)}
                          </td>
                          <td className="py-2.5 text-dark-300">
                            {formatTemperature(bubbleMetrics.sampleMetrics.finalTempC)}
                          </td>
                          <td className="py-2.5 text-dark-300">
                            {formatTemperature(bubbleMetrics.sampleMetrics.totalDropC)}
                          </td>
                          <td className="py-2.5 text-white font-bold">
                            {formatCoolingRate(bubbleMetrics.sampleMetrics.coolingRateCPerMin)}
                          </td>
                          <td className="py-2.5 text-success-400 font-bold">
                            {bubbleMetrics.sampleMetrics.isReductionValid
                              ? formatPercentage(bubbleMetrics.sampleMetrics.coolingRateReductionPercent)
                              : 'N/A'}
                          </td>
                        </tr>
                      )}

                      {/* Packaging Foam Row */}
                      {foamMetrics && (
                        <tr className="hover:bg-dark-800/40">
                          <td className="py-2.5 font-semibold text-emerald-400">
                            Packaging Foam
                          </td>
                          <td className="py-2.5 text-dark-300">
                            {formatTemperature(foamMetrics.sampleMetrics.initialTempC)}
                          </td>
                          <td className="py-2.5 text-dark-300">
                            {formatTemperature(foamMetrics.sampleMetrics.finalTempC)}
                          </td>
                          <td className="py-2.5 text-dark-300">
                            {formatTemperature(foamMetrics.sampleMetrics.totalDropC)}
                          </td>
                          <td className="py-2.5 text-white font-bold">
                            {formatCoolingRate(foamMetrics.sampleMetrics.coolingRateCPerMin)}
                          </td>
                          <td className="py-2.5 text-success-400 font-bold">
                            {foamMetrics.sampleMetrics.isReductionValid
                              ? formatPercentage(foamMetrics.sampleMetrics.coolingRateReductionPercent)
                              : 'N/A'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 pt-2.5 border-t border-dark-800 text-[11px] text-dark-500 font-mono flex items-center gap-1.5">
                  <Info size={13} className="text-dark-400 flex-shrink-0" />
                  <span>
                    Cooling rate reduction % = ((Ref Rate - Sample Rate) / Ref Rate) × 100. Positive percentage denotes reduced heat loss.
                  </span>
                </div>
              </Card>
            </div>

            {/* Material Ranking & Criterion Selector (4 Cols) */}
            <div className="lg:col-span-4">
              <Card
                title="Material Ranking"
                subtitle="Configurable thermal retention ranking"
                headerAction={
                  <select
                    value={rankingCriterion}
                    onChange={(e) => setRankingCriterion(e.target.value as any)}
                    className="bg-dark-850 border border-dark-700 text-[11px] text-white rounded px-2 py-1 font-mono focus:outline-none"
                  >
                    <option value="cooling_rate">Min Cooling Rate</option>
                    <option value="final_temp">Max Final Temp</option>
                    <option value="temp_drop">Min Temp Drop</option>
                  </select>
                }
              >
                <div className="space-y-3">
                  {rankings.map((res) => (
                    <div
                      key={res.materialName}
                      className="p-3 rounded bg-dark-900/60 border border-dark-750 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-7 h-7 rounded bg-dark-800 text-cyan-400 font-mono font-bold text-sm">
                          #{res.rank}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">{res.materialName}</p>
                          <p className="text-[10px] text-dark-400 font-mono mt-0.5">{res.interpretation}</p>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-bold text-cyan-400">
                        {res.scoreFormatted}
                      </span>
                    </div>
                  ))}

                  <div className="p-2.5 rounded bg-dark-900/30 text-[11px] text-dark-500 font-mono">
                    Evaluation reflects observed heat retention of the complete container-insulation assembly under tested laboratory ambient conditions.
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
