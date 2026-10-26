import { SensorReading } from '../types/sensor';
import { RawSerialMessage } from '../types/serial';
import { isValidDS18B20Reading, isValidDHT22Temp, isValidDHT22Humidity } from '../utils/validation';

export class SerialLineBuffer {
  private buffer = '';

  /**
   * Appends an incoming raw text chunk and extracts all complete lines (delimited by \n or \r\n).
   * Leaves remaining partial line in the buffer.
   */
  public pushChunk(chunk: string): string[] {
    this.buffer += chunk;
    const lines: string[] = [];
    let newlineIndex = this.buffer.indexOf('\n');

    while (newlineIndex !== -1) {
      const line = this.buffer.slice(0, newlineIndex).trim();
      this.buffer = this.buffer.slice(newlineIndex + 1);
      if (line.length > 0) {
        lines.push(line);
      }
      newlineIndex = this.buffer.indexOf('\n');
    }

    return lines;
  }

  /**
   * Clears the current buffer
   */
  public clear(): void {
    this.buffer = '';
  }

  public getUnprocessed(): string {
    return this.buffer;
  }
}

export interface ParseResult {
  reading: SensorReading | null;
  statusMessage: { device?: string; firmware_version?: string } | null;
  error?: string;
  rawLine: string;
}

/**
 * Parses and validates a single line of serial JSON from ESP32
 */
export function parseSerialLine(line: string): ParseResult {
  const trimmed = line.trim();
  if (!trimmed) {
    return { reading: null, statusMessage: null, rawLine: line };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (err) {
    return {
      reading: null,
      statusMessage: null,
      error: `Malformed JSON: ${(err as Error).message}`,
      rawLine: line,
    };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return {
      reading: null,
      statusMessage: null,
      error: 'Message is not a JSON object',
      rawLine: line,
    };
  }

  const msg = parsed as RawSerialMessage;

  // Handle status message
  if (msg.type === 'status') {
    return {
      reading: null,
      statusMessage: {
        device: msg.device,
        firmware_version: msg.firmware_version,
      },
      rawLine: line,
    };
  }

  // Handle reading message
  if (msg.type === 'reading') {
    const refValidation = isValidDS18B20Reading(msg.reference_temp);
    const sampleValidation = isValidDS18B20Reading(msg.sample_temp);
    const ambValidation = isValidDHT22Temp(msg.ambient_temp);
    const humValidation = isValidDHT22Humidity(msg.humidity);

    const reading: SensorReading = {
      sequence: typeof msg.sequence === 'number' ? msg.sequence : 0,
      elapsedMs: typeof msg.elapsed_ms === 'number' ? msg.elapsed_ms : 0,
      receivedAt: new Date().toISOString(),
      referenceTempC: refValidation.isValid ? refValidation.value : null,
      sampleTempC: sampleValidation.isValid ? sampleValidation.value : null,
      ambientTempC: ambValidation.isValid ? ambValidation.value : null,
      humidityPercent: humValidation.isValid ? humValidation.value : null,
      isValidReference: refValidation.isValid,
      isValidSample: sampleValidation.isValid,
      isValidAmbient: ambValidation.isValid,
      isValidHumidity: humValidation.isValid,
    };

    return { reading, statusMessage: null, rawLine: line };
  }

  return {
    reading: null,
    statusMessage: null,
    error: `Unknown message type: ${(msg as { type?: string }).type}`,
    rawLine: line,
  };
}
