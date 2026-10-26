/**
 * Validates DS18B20 probe temperature.
 * DS18B20 returns -127.0 °C upon wire disconnection, and 85.0 °C upon initial power-on reset before conversion.
 * Water temperatures in our experiment are warm water cooling between 0 °C and 100 °C.
 */
export function isValidDS18B20Reading(val: unknown): { isValid: boolean; value: number | null; error?: string } {
  if (val === null || val === undefined) {
    return { isValid: false, value: null, error: 'Sensor returned null/empty' };
  }
  const num = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(num)) {
    return { isValid: false, value: null, error: 'Value is not finite' };
  }

  // Sentinel detection
  if (Math.abs(num - (-127.0)) < 0.01) {
    return { isValid: false, value: null, error: 'DS18B20 disconnected sentinel (-127°C)' };
  }
  if (Math.abs(num - 85.0) < 0.01) {
    return { isValid: false, value: null, error: 'DS18B20 power-on reset sentinel (+85°C)' };
  }

  // Plausible physical water range (atmospheric pressure)
  if (num < 0 || num > 100) {
    return { isValid: false, value: null, error: `Value out of physical water range (${num}°C)` };
  }

  return { isValid: true, value: num };
}

/**
 * Validates DHT22 ambient temperature (-20°C to 60°C)
 */
export function isValidDHT22Temp(val: unknown): { isValid: boolean; value: number | null; error?: string } {
  if (val === null || val === undefined) {
    return { isValid: false, value: null, error: 'Ambient sensor returned null' };
  }
  const num = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(num)) {
    return { isValid: false, value: null, error: 'Ambient value is not finite' };
  }
  if (num < -20 || num > 60) {
    return { isValid: false, value: null, error: `Ambient temp out of physical bounds (${num}°C)` };
  }
  return { isValid: true, value: num };
}

/**
 * Validates DHT22 relative humidity (0% to 100%)
 */
export function isValidDHT22Humidity(val: unknown): { isValid: boolean; value: number | null; error?: string } {
  if (val === null || val === undefined) {
    return { isValid: false, value: null, error: 'Humidity sensor returned null' };
  }
  const num = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(num)) {
    return { isValid: false, value: null, error: 'Humidity value is not finite' };
  }
  if (num < 0 || num > 100) {
    return { isValid: false, value: null, error: `Relative humidity out of bounds (${num}%)` };
  }
  return { isValid: true, value: num };
}
