/**
 * Formats seconds into MM:SS or HH:MM:SS format
 */
export function formatElapsedSeconds(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '00:00';
  const sec = Math.floor(totalSeconds % 60);
  const min = Math.floor((totalSeconds / 60) % 60);
  const hrs = Math.floor(totalSeconds / 3600);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(min)}:${pad(sec)}`;
  }
  return `${pad(min)}:${pad(sec)}`;
}

/**
 * Formats temperature in Celsius with consistent precision or placeholder
 */
export function formatTemperature(temp: number | null | undefined, precision = 2): string {
  if (temp === null || temp === undefined || !Number.isFinite(temp)) {
    return '--';
  }
  return `${temp.toFixed(precision)} °C`;
}

/**
 * Formats relative humidity with consistent precision or placeholder
 */
export function formatHumidity(hum: number | null | undefined, precision = 1): string {
  if (hum === null || hum === undefined || !Number.isFinite(hum)) {
    return '--';
  }
  return `${hum.toFixed(precision)} %`;
}

/**
 * Formats cooling rate in °C/min
 */
export function formatCoolingRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined || !Number.isFinite(rate)) {
    return '--';
  }
  return `${rate.toFixed(3)} °C/min`;
}

/**
 * Formats percentage or returns N/A with tooltip reason
 */
export function formatPercentage(pct: number | null | undefined): string {
  if (pct === null || pct === undefined || !Number.isFinite(pct)) {
    return 'N/A';
  }
  return `${pct.toFixed(2)} %`;
}

/**
 * Formats timestamp to readable technical date-time
 */
export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--';
    return d.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return '--';
  }
}
