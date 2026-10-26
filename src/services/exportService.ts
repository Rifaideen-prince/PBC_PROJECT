import { Experiment } from '../types/experiment';
import { analysisService } from './analysisService';

/**
 * Triggers a browser file download from a string or blob
 */
function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export class ExportService {
  /**
   * Generates and downloads raw readings CSV with proper headers and scientific units
   */
  public exportRawReadingsCSV(exp: Experiment): void {
    const headers = [
      'Sequence',
      'Elapsed_Time_Seconds',
      'Elapsed_Time_Formatted',
      'Device_Elapsed_ms',
      'Received_At_ISO',
      'Reference_Water_Temp_C',
      'Sample_Water_Temp_C',
      'Temp_Difference_Ref_Minus_Sample_C',
      'Ambient_Temp_C',
      'Relative_Humidity_Percent',
      'Reference_Valid',
      'Sample_Valid',
    ];

    const rows = exp.readings.map(r => {
      const elapsedSec = (r.elapsedMs / 1000).toFixed(2);
      const diff = (r.referenceTempC !== null && r.sampleTempC !== null)
        ? (r.referenceTempC - r.sampleTempC).toFixed(3)
        : '';

      const min = Math.floor(r.elapsedMs / 60000);
      const sec = Math.floor((r.elapsedMs % 60000) / 1000);
      const formatted = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

      return [
        r.sequence,
        elapsedSec,
        formatted,
        r.elapsedMs,
        r.receivedAt,
        r.referenceTempC !== null ? r.referenceTempC.toFixed(2) : '',
        r.sampleTempC !== null ? r.sampleTempC.toFixed(2) : '',
        diff,
        r.ambientTempC !== null ? r.ambientTempC.toFixed(1) : '',
        r.humidityPercent !== null ? r.humidityPercent.toFixed(1) : '',
        r.isValidReference ? 'YES' : 'NO',
        r.isValidSample ? 'YES' : 'NO',
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const safeName = exp.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    triggerDownload(csvContent, `thermalab_${safeName}_raw_readings.csv`, 'text/csv;charset=utf-8;');
  }

  /**
   * Generates and downloads summary results CSV for multiple experiments
   */
  public exportSummaryCSV(experiments: Experiment[]): void {
    const headers = [
      'Experiment_ID',
      'Name',
      'Material',
      'Status',
      'Created_At',
      'Water_Volume_mL',
      'Insulation_Thickness_mm',
      'Insulation_Layers',
      'Duration_Minutes',
      'Initial_Ref_Temp_C',
      'Final_Ref_Temp_C',
      'Ref_Drop_C',
      'Ref_Cooling_Rate_C_per_min',
      'Initial_Sample_Temp_C',
      'Final_Sample_Temp_C',
      'Sample_Drop_C',
      'Sample_Cooling_Rate_C_per_min',
      'Cooling_Rate_Reduction_Percent',
    ];

    const rows = experiments.map(exp => {
      const { sampleMetrics, referenceMetrics } = analysisService.computeMetrics(exp);
      return [
        `"${exp.id}"`,
        `"${exp.name.replace(/"/g, '""')}"`,
        `"${exp.sampleMaterial}"`,
        exp.status,
        exp.createdAt,
        exp.waterVolumeMl ?? '',
        exp.insulationThicknessMm ?? '',
        exp.insulationLayers ?? '',
        sampleMetrics.durationMinutes,
        referenceMetrics.initialTempC !== null ? referenceMetrics.initialTempC.toFixed(2) : '',
        referenceMetrics.finalTempC !== null ? referenceMetrics.finalTempC.toFixed(2) : '',
        referenceMetrics.totalDropC !== null ? referenceMetrics.totalDropC.toFixed(2) : '',
        referenceMetrics.coolingRateCPerMin !== null ? referenceMetrics.coolingRateCPerMin.toFixed(3) : '',
        sampleMetrics.initialTempC !== null ? sampleMetrics.initialTempC.toFixed(2) : '',
        sampleMetrics.finalTempC !== null ? sampleMetrics.finalTempC.toFixed(2) : '',
        sampleMetrics.totalDropC !== null ? sampleMetrics.totalDropC.toFixed(2) : '',
        sampleMetrics.coolingRateCPerMin !== null ? sampleMetrics.coolingRateCPerMin.toFixed(3) : '',
        sampleMetrics.isReductionValid && sampleMetrics.coolingRateReductionPercent !== null
          ? sampleMetrics.coolingRateReductionPercent.toFixed(2)
          : 'N/A',
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    triggerDownload(csvContent, `thermalab_experiments_summary_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
  }

  /**
   * Generates and downloads JSON backup of an experiment
   */
  public exportJSONBackup(exp: Experiment): void {
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      platform: 'THERMALAB — Smart Comparative Thermal Response Testing Platform',
      experiment: exp,
    };
    const jsonStr = JSON.stringify(backup, null, 2);
    const safeName = exp.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    triggerDownload(jsonStr, `thermalab_${safeName}_backup.json`, 'application/json');
  }
}

export const exportService = new ExportService();
