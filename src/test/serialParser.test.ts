import { describe, it, expect } from 'vitest';
import { parseSerialLine, SerialLineBuffer } from '../services/serialParser';

describe('Serial Protocol & Message Parser', () => {
  describe('parseSerialLine', () => {
    it('parses valid reading JSON line into SensorReading object', () => {
      const line = JSON.stringify({
        type: 'reading',
        sequence: 42,
        elapsed_ms: 42000,
        reference_temp: 58.42,
        sample_temp: 57.91,
        ambient_temp: 25.4,
        humidity: 46.2,
      });

      const result = parseSerialLine(line);
      expect(result.error).toBeUndefined();
      expect(result.reading).not.toBeNull();
      expect(result.reading?.sequence).toBe(42);
      expect(result.reading?.elapsedMs).toBe(42000);
      expect(result.reading?.referenceTempC).toBe(58.42);
      expect(result.reading?.sampleTempC).toBe(57.91);
      expect(result.reading?.ambientTempC).toBe(25.4);
      expect(result.reading?.humidityPercent).toBe(46.2);
      expect(result.reading?.isValidReference).toBe(true);
      expect(result.reading?.isValidSample).toBe(true);
      expect(result.reading?.isValidAmbient).toBe(true);
      expect(result.reading?.isValidHumidity).toBe(true);
    });

    it('rejects DS18B20 disconnection sentinel (-127.0 °C)', () => {
      const line = JSON.stringify({
        type: 'reading',
        sequence: 10,
        elapsed_ms: 10000,
        reference_temp: -127.0, // Disconnected probe!
        sample_temp: 65.4,
        ambient_temp: 24.0,
        humidity: 50.0,
      });

      const result = parseSerialLine(line);
      expect(result.reading).not.toBeNull();
      expect(result.reading?.referenceTempC).toBeNull();
      expect(result.reading?.isValidReference).toBe(false);
      expect(result.reading?.sampleTempC).toBe(65.4);
      expect(result.reading?.isValidSample).toBe(true);
    });

    it('rejects DS18B20 uninitialized power-on sentinel (+85.0 °C)', () => {
      const line = JSON.stringify({
        type: 'reading',
        sequence: 1,
        elapsed_ms: 1000,
        reference_temp: 85.0, // Power-on default register value!
        sample_temp: 72.0,
      });

      const result = parseSerialLine(line);
      expect(result.reading?.referenceTempC).toBeNull();
      expect(result.reading?.isValidReference).toBe(false);
      expect(result.reading?.sampleTempC).toBe(72.0);
    });

    it('gracefully handles malformed JSON without crashing', () => {
      const line = '{"type": "reading", "sequence": 42, "unclosed';
      const result = parseSerialLine(line);
      expect(result.reading).toBeNull();
      expect(result.error).toContain('Malformed JSON');
    });

    it('parses hardware status message', () => {
      const line = JSON.stringify({
        type: 'status',
        device: 'THERMALAB-ESP32',
        firmware_version: '1.0.0',
      });

      const result = parseSerialLine(line);
      expect(result.statusMessage?.device).toBe('THERMALAB-ESP32');
      expect(result.statusMessage?.firmware_version).toBe('1.0.0');
    });

    it('handles explicit null sensor values', () => {
      const line = JSON.stringify({
        type: 'reading',
        sequence: 5,
        elapsed_ms: 5000,
        reference_temp: null,
        sample_temp: 60.5,
        ambient_temp: null,
        humidity: null,
      });

      const result = parseSerialLine(line);
      expect(result.reading?.referenceTempC).toBeNull();
      expect(result.reading?.isValidReference).toBe(false);
      expect(result.reading?.sampleTempC).toBe(60.5);
      expect(result.reading?.isValidSample).toBe(true);
    });
  });

  describe('SerialLineBuffer', () => {
    it('buffers partial chunks across multiple reads and returns complete lines', () => {
      const buffer = new SerialLineBuffer();

      // Chunk 1 has first half of message
      const lines1 = buffer.pushChunk('{"type": "reading", "sequence": 1');
      expect(lines1).toEqual([]);

      // Chunk 2 finishes line 1 and starts line 2
      const lines2 = buffer.pushChunk(', "elapsed_ms": 1000}\n{"type": "reading", "seq');
      expect(lines2).toEqual(['{"type": "reading", "sequence": 1, "elapsed_ms": 1000}']);

      // Chunk 3 finishes line 2
      const lines3 = buffer.pushChunk('uence": 2}\r\n');
      expect(lines3).toEqual(['{"type": "reading", "sequence": 2}']);

      expect(buffer.getUnprocessed()).toBe('');
    });

    it('handles multiple newline-delimited lines in a single chunk', () => {
      const buffer = new SerialLineBuffer();
      const chunk = 'line1\nline2\nline3\n';
      const lines = buffer.pushChunk(chunk);
      expect(lines).toEqual(['line1', 'line2', 'line3']);
    });
  });
});
