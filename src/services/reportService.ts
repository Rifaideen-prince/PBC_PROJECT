import { Experiment } from '../types/experiment';
import { analysisService } from './analysisService';

export interface ScientificReportData {
  title: string;
  subtitle: string;
  generatedAt: string;
  experiment: Experiment;
  sampleMetrics: ReturnType<typeof analysisService.computeMetrics>['sampleMetrics'];
  referenceMetrics: ReturnType<typeof analysisService.computeMetrics>['referenceMetrics'];
  conclusion: string;
  limitations: string[];
}

export class ReportService {
  /**
   * Generates a rigorous, scientifically grounded conclusion based strictly on real recorded measurements
   */
  public generateConclusion(exp: Experiment): string {
    const { sampleMetrics, referenceMetrics } = analysisService.computeMetrics(exp);

    if (
      sampleMetrics.initialTempC === null ||
      sampleMetrics.finalTempC === null ||
      referenceMetrics.initialTempC === null ||
      referenceMetrics.finalTempC === null
    ) {
      return 'The experiment does not contain sufficient continuous sensor recordings to derive an empirical conclusion. Please verify hardware connectivity and conduct a complete test run.';
    }

    const sampleDrop = sampleMetrics.totalDropC ?? 0;
    const refDrop = referenceMetrics.totalDropC ?? 0;
    const duration = sampleMetrics.durationMinutes;

    let conclusionText = `During the ${duration}-minute test period, the water temperature in the test container insulated with ${exp.sampleMaterial} decreased from ${sampleMetrics.initialTempC.toFixed(2)} °C to ${sampleMetrics.finalTempC.toFixed(2)} °C (total drop of ${sampleDrop.toFixed(2)} °C at an average rate of ${sampleMetrics.coolingRateCPerMin?.toFixed(3)} °C/min). `;

    conclusionText += `In comparison, the uninsulated reference container experienced a temperature decrease from ${referenceMetrics.initialTempC.toFixed(2)} °C to ${referenceMetrics.finalTempC.toFixed(2)} °C (total drop of ${refDrop.toFixed(2)} °C at ${referenceMetrics.coolingRateCPerMin?.toFixed(3)} °C/min). `;

    if (sampleMetrics.isReductionValid && sampleMetrics.coolingRateReductionPercent !== null) {
      const reduction = sampleMetrics.coolingRateReductionPercent;
      if (reduction > 0) {
        conclusionText += `The ${exp.sampleMaterial} configuration demonstrated an observed cooling-rate reduction of ${reduction.toFixed(1)}% relative to the uninsulated container under identical laboratory placement. `;
      } else if (reduction < 0) {
        conclusionText += `The ${exp.sampleMaterial} configuration exhibited a faster cooling rate (${Math.abs(reduction).toFixed(1)}% higher thermal loss) than the reference container. This unexpected response may be attributable to moisture absorption, thermal bridging, or convection drafts. `;
      } else {
        conclusionText += `The thermal response of the insulated configuration showed no statistically significant deviation from the uninsulated reference. `;
      }
    }

    conclusionText += 'Note: This result characterizes the empirical thermal response of the specific container and material assembly under ambient laboratory conditions, rather than the intrinsic material thermal conductivity (k-value).';

    return conclusionText;
  }

  public getScientificLimitations(): string[] {
    return [
      'Transient Boundary Convection: Ambient air velocity was not artificially regulated, allowing natural room convection currents to influence container walls.',
      'Surface Contact Resistance: Thermal contact resistance between the container outer wall and the insulation layer introduces interfacial thermal impedance that varies with wrapping tension.',
      'Container Thermal Mass: Heat capacity of the container vessel (glass/plastic) absorbs heat during initial equilibrium, slightly damping early transient rate measurements.',
      'Probe Placement Geometry: DS18B20 probes must maintain identical immersion depths (central geometric centroid) across both containers to avoid vertical thermal stratification artifacts.',
      'Configuration vs. Intrinsic Property: The measured metrics represent system-level thermal resistance (R_effective) rather than bulk material thermal conductivity (k).',
    ];
  }

  public compileReport(exp: Experiment): ScientificReportData {
    const { sampleMetrics, referenceMetrics } = analysisService.computeMetrics(exp);
    const conclusion = this.generateConclusion(exp);
    const limitations = this.getScientificLimitations();

    return {
      title: 'THERMALAB — Scientific Comparative Thermal Response Report',
      subtitle: 'Materials Science & Engineering Laboratory Investigation',
      generatedAt: new Date().toISOString(),
      experiment: exp,
      sampleMetrics,
      referenceMetrics,
      conclusion,
      limitations,
    };
  }
}

export const reportService = new ReportService();
