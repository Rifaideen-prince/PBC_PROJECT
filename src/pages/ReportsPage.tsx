import React, { useState, useMemo, useRef } from 'react';
import { useExperiment } from '../context/ExperimentContext';
import { reportService, ScientificReportData } from '../services/reportService';
import { exportService } from '../services/exportService';
import { storageService } from '../services/storageService';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { LiveTemperatureChart } from '../components/charts/LiveTemperatureChart';
import { ExperimentMetadataModal } from '../components/experiments/ExperimentMetadataModal';
import { formatDateTime, formatElapsedSeconds, formatTemperature, formatCoolingRate, formatPercentage } from '../utils/formatting';
import {
  Printer,
  Download,
  FileSpreadsheet,
  Upload,
  Edit,
  FileText,
  BookOpen,
  AlertCircle,
  FlaskConical,
  CheckCircle2,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { allStoredExperiments, refreshStoredExperiments, enableDemoMode } = useExperiment();
  const [selectedExpId, setSelectedExpId] = useState<string>('');
  const [editingExp, setEditingExp] = useState<any | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-select first experiment if available
  useMemo(() => {
    if (allStoredExperiments.length > 0 && !selectedExpId) {
      setSelectedExpId(allStoredExperiments[0].id);
    }
  }, [allStoredExperiments, selectedExpId]);

  const selectedExp = useMemo(() => {
    return allStoredExperiments.find(e => e.id === selectedExpId) || null;
  }, [allStoredExperiments, selectedExpId]);

  const reportData: ScientificReportData | null = useMemo(() => {
    return selectedExp ? reportService.compileReport(selectedExp) : null;
  }, [selectedExp]);

  const handlePrint = () => {
    window.print();
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = await storageService.importExperimentJSON(text);
      await refreshStoredExperiments();
      setSelectedExpId(imported.id);
      setImportMessage(`Successfully restored "${imported.name}" with ${imported.readings.length} readings.`);
      setTimeout(() => setImportMessage(null), 5000);
    } catch (err) {
      alert(`Import failed: ${(err as Error).message}`);
    } finally {
      if (jsonInputRef.current) jsonInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden JSON file input */}
      <input
        type="file"
        ref={jsonInputRef}
        accept=".json"
        className="hidden"
        onChange={handleImportJSON}
      />

      {/* Top Header & Report Selection Bar (hidden when printing) */}
      <div className="no-print p-4 rounded bg-dark-900 border border-dark-750 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold font-mono text-white uppercase tracking-wider">
              Scientific Reports & Project Documentation
            </h1>
            <Badge variant="cyan" size="sm">REPORTS & EXPORTS</Badge>
          </div>
          <p className="text-xs text-dark-400 mt-0.5">
            Formal experimental documentation, data integrity export pipeline, and methodology disclosures
          </p>
        </div>

        {/* Experiment Selector and Quick Export Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {allStoredExperiments.length > 0 && (
            <select
              value={selectedExpId}
              onChange={(e) => setSelectedExpId(e.target.value)}
              className="bg-dark-850 border border-dark-700 text-xs text-white rounded px-3 py-2 font-mono focus:outline-none focus:border-cyan-500"
            >
              {allStoredExperiments.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.sampleMaterial})
                </option>
              ))}
            </select>
          )}

          {selectedExp && (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={<Printer size={14} />}
                onClick={handlePrint}
              >
                Print / PDF Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<Edit size={14} />}
                onClick={() => setEditingExp(selectedExp)}
              >
                Edit Metadata
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<FileSpreadsheet size={14} />}
                onClick={() => exportService.exportRawReadingsCSV(selectedExp)}
                title="Download CSV with raw sensor readings"
              >
                Raw CSV
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<Download size={14} />}
                onClick={() => exportService.exportJSONBackup(selectedExp)}
                title="Download full JSON backup of metadata + readings"
              >
                JSON Backup
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            icon={<Upload size={14} />}
            onClick={() => jsonInputRef.current?.click()}
            title="Import previously saved JSON backup"
          >
            Import JSON
          </Button>
        </div>
      </div>

      {/* Import Notice */}
      {importMessage && (
        <div className="no-print p-3 rounded bg-success-500/10 border border-success-500/30 text-success-300 flex items-center gap-2 text-xs font-mono">
          <CheckCircle2 size={15} className="text-success-400 flex-shrink-0" />
          <span>{importMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      {selectedExp && reportData ? (
        <div className="space-y-6">
          {/* Printable Report Document Card */}
          <div className="print-page bg-dark-900 border border-dark-750 rounded p-6 sm:p-8 space-y-6 text-dark-200">
            {/* Report Header */}
            <div className="border-b border-dark-700 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold font-mono text-white tracking-wide uppercase">
                    THERMALAB EXPERIMENTAL REPORT
                  </h2>
                  <p className="text-xs text-cyan-400 font-mono mt-0.5">
                    Comparative Thermal Response Testing Platform • MSE Laboratory
                  </p>
                </div>
                <div className="text-right font-mono text-xs text-dark-400">
                  <p>DOC ID: {reportData.experiment.id}</p>
                  <p>GENERATED: {new Date().toLocaleDateString('en-GB')}</p>
                </div>
              </div>
            </div>

            {/* Experiment Metadata Summary Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded bg-dark-850 border border-dark-750 font-mono text-xs">
              <div>
                <span className="text-[10px] text-dark-500 uppercase block">Experiment Name</span>
                <span className="text-white font-semibold">{reportData.experiment.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-dark-500 uppercase block">Sample Material</span>
                <span className="text-cyan-400 font-semibold">{reportData.experiment.sampleMaterial}</span>
              </div>
              <div>
                <span className="text-[10px] text-dark-500 uppercase block">Recorded At</span>
                <span className="text-dark-300">{formatDateTime(reportData.experiment.createdAt)}</span>
              </div>
              <div>
                <span className="text-[10px] text-dark-500 uppercase block">Operator</span>
                <span className="text-dark-300">{reportData.experiment.operator || 'MSE Student Team'}</span>
              </div>
              <div>
                <span className="text-[10px] text-dark-500 uppercase block">Water Volume</span>
                <span className="text-dark-300">{reportData.experiment.waterVolumeMl ? `${reportData.experiment.waterVolumeMl} mL` : 'Not recorded'}</span>
              </div>
              <div>
                <span className="text-[10px] text-dark-500 uppercase block">Insulation Thickness</span>
                <span className="text-dark-300">{reportData.experiment.insulationThicknessMm ? `${reportData.experiment.insulationThicknessMm} mm` : 'Not recorded'}</span>
              </div>
              <div>
                <span className="text-[10px] text-dark-500 uppercase block">Number of Layers</span>
                <span className="text-dark-300">{reportData.experiment.insulationLayers ? `${reportData.experiment.insulationLayers}` : 'Not recorded'}</span>
              </div>
              <div>
                <span className="text-[10px] text-dark-500 uppercase block">Duration</span>
                <span className="text-dark-300">{reportData.sampleMetrics.durationMinutes} minutes</span>
              </div>
            </div>

            {/* Calculated Results Table */}
            <div>
              <h3 className="text-sm font-semibold font-mono text-white uppercase tracking-wider mb-2.5">
                Observed Thermal Response Metrics
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border border-dark-750 rounded">
                  <thead className="bg-dark-850 text-dark-400 uppercase text-[11px]">
                    <tr className="border-b border-dark-750">
                      <th className="p-2.5">Container Configuration</th>
                      <th className="p-2.5">Initial Temp</th>
                      <th className="p-2.5">Final Temp</th>
                      <th className="p-2.5">Total Drop (ΔT)</th>
                      <th className="p-2.5">Cooling Rate</th>
                      <th className="p-2.5">Cooling-Rate Reduction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-800">
                    <tr>
                      <td className="p-2.5 font-semibold text-amber-400">Uninsulated Reference</td>
                      <td className="p-2.5">{formatTemperature(reportData.referenceMetrics.initialTempC)}</td>
                      <td className="p-2.5">{formatTemperature(reportData.referenceMetrics.finalTempC)}</td>
                      <td className="p-2.5">{formatTemperature(reportData.referenceMetrics.totalDropC)}</td>
                      <td className="p-2.5 font-bold">{formatCoolingRate(reportData.referenceMetrics.coolingRateCPerMin)}</td>
                      <td className="p-2.5 text-dark-500">Baseline (0%)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-cyan-400">{reportData.experiment.sampleMaterial} (Test)</td>
                      <td className="p-2.5">{formatTemperature(reportData.sampleMetrics.initialTempC)}</td>
                      <td className="p-2.5">{formatTemperature(reportData.sampleMetrics.finalTempC)}</td>
                      <td className="p-2.5">{formatTemperature(reportData.sampleMetrics.totalDropC)}</td>
                      <td className="p-2.5 font-bold">{formatCoolingRate(reportData.sampleMetrics.coolingRateCPerMin)}</td>
                      <td className="p-2.5 font-bold text-success-400">
                        {reportData.sampleMetrics.isReductionValid
                          ? formatPercentage(reportData.sampleMetrics.coolingRateReductionPercent)
                          : 'N/A'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Embedded Graph Preview in Report */}
            <div>
              <h3 className="text-sm font-semibold font-mono text-white uppercase tracking-wider mb-2">
                Cooling Response Curve
              </h3>
              <div className="p-3 bg-dark-950 rounded border border-dark-750">
                <LiveTemperatureChart
                  readings={reportData.experiment.readings}
                  sampleMaterial={reportData.experiment.sampleMaterial}
                  height={280}
                />
              </div>
            </div>

            {/* Scientific Conclusion Section */}
            <div className="p-4 rounded bg-dark-850 border border-dark-750 space-y-2">
              <h3 className="text-xs font-semibold font-mono text-cyan-400 uppercase tracking-wider">
                Empirical Scientific Conclusion
              </h3>
              <p className="text-xs text-dark-200 leading-relaxed">
                {reportData.conclusion}
              </p>
            </div>

            {/* Experimental Limitations Section */}
            <div className="space-y-2 pt-2 border-t border-dark-750">
              <h3 className="text-xs font-semibold font-mono text-dark-400 uppercase tracking-wider">
                Scientific Limitations & Boundary Conditions
              </h3>
              <ul className="list-disc list-inside space-y-1 text-xs text-dark-400">
                {reportData.limitations.map((lim, i) => (
                  <li key={i}>{lim}</li>
                ))}
              </ul>
            </div>

            {/* Signature Block for Academic Validation */}
            <div className="pt-6 border-t border-dark-700 grid grid-cols-2 gap-8 text-xs font-mono text-dark-400">
              <div>
                <p>Experimenter Signature: __________________________</p>
                <p className="mt-1">Date: ____________________</p>
              </div>
              <div className="text-right">
                <p>Academic Supervisor: __________________________</p>
                <p className="mt-1">Materials Science & Engineering Department</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon="help"
          title="No Experiment Selected For Reporting"
          description="Select a recorded experiment from the dropdown menu above or generate a test experiment to review empirical reports and export data."
          actionText="Load Benchmark Demo Runs"
          onAction={enableDemoMode}
        />
      )}

      {/* B. Academic Project Documentation & Methodology (Always visible below report) */}
      <div className="no-print space-y-5 pt-4">
        <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
          Platform Architecture & Scientific Methodology Reference
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Methodology */}
          <Card title="Experimental Principle & Procedure" subtitle="Comparative water cooling transient protocol">
            <div className="space-y-3 text-xs text-dark-300 leading-relaxed">
              <p>
                <strong>Objective:</strong> Characterize the empirical heat retention efficacy of polymer packaging insulation (Bubble Wrap vs. Packaging Foam) relative to an identical uninsulated control vessel under laboratory ambient cooling.
              </p>
              <p>
                <strong>Procedure:</strong> Warm water (target 75 °C, 250 mL) is dispensed into both vessels simultaneously. Temperature decay is monitored at 1 Hz using waterproof DS18B20 digital temperature sensors located at identical central immersion depths. Ambient conditions are tracked using a calibrated DHT22 digital relative humidity and temperature sensor.
              </p>
              <p>
                <strong>Thermal Equations:</strong>
                <span className="block font-mono text-dark-200 bg-dark-900 p-2 rounded border border-dark-750 my-1">
                  ΔT = T_initial - T_final<br />
                  Cooling Rate = (T_initial - T_final) / Elapsed Time (min)<br />
                  Reduction % = ((Rate_ref - Rate_sample) / Rate_ref) × 100
                </span>
              </p>
            </div>
          </Card>

          {/* Hardware Telemetry Spec */}
          <Card title="Hardware Telemetry Specification" subtitle="ESP32 Serial 115200 Web Serial Protocol">
            <div className="space-y-3 text-xs text-dark-300 leading-relaxed font-mono">
              <p className="text-dark-400">
                Incoming telemetry arrives as newline-delimited JSON messages over USB-Serial:
              </p>
              <pre className="p-2.5 rounded bg-dark-900 border border-dark-750 text-[11px] text-cyan-300 overflow-x-auto">
{`{
  "type": "reading",
  "sequence": 42,
  "elapsed_ms": 42000,
  "reference_temp": 58.42,
  "sample_temp": 57.91,
  "ambient_temp": 25.4,
  "humidity": 46.2
}`}
              </pre>
              <p className="text-dark-400">
                Sentinel value filtering: -127.0 °C (DS18B20 disconnect) and +85.0 °C (uninitialized power-on reset) are systematically detected and flagged as invalid, preserving statistical integrity.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Metadata Edit Modal */}
      <ExperimentMetadataModal
        isOpen={!!editingExp}
        onClose={() => setEditingExp(null)}
        experiment={editingExp}
        onSaved={refreshStoredExperiments}
      />
    </div>
  );
};
