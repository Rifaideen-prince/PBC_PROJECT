export interface SensorReading {
  sequence: number;
  elapsedMs: number;
  receivedAt: string; // ISO timestamp in browser
  referenceTempC: number | null; // DS18B20 Reference Container water temp
  sampleTempC: number | null;    // DS18B20 Test Container water temp
  ambientTempC: number | null;   // DHT22 Ambient air temp
  humidityPercent: number | null; // DHT22 Relative humidity
  isValidReference: boolean;
  isValidSample: boolean;
  isValidAmbient: boolean;
  isValidHumidity: boolean;
  isStaleAmbient?: boolean;
}

export type SensorHealthStatus = 'optimal' | 'warning' | 'error' | 'disconnected';

export interface SensorDiagnostics {
  referenceStatus: SensorHealthStatus;
  sampleStatus: SensorHealthStatus;
  ambientStatus: SensorHealthStatus;
  humidityStatus: SensorHealthStatus;
  lastValidReadingTime: Date | null;
  lastAmbientReadingTime: Date | null;
  totalPacketsReceived: number;
  droppedPackets: number;
  lastErrorMessage?: string;
}
