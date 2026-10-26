export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export interface RawSerialReadingMessage {
  type: 'reading';
  sequence?: number;
  elapsed_ms?: number;
  reference_temp?: number | null;
  sample_temp?: number | null;
  ambient_temp?: number | null;
  humidity?: number | null;
}

export interface RawSerialStatusMessage {
  type: 'status';
  device?: string;
  firmware_version?: string;
}

export type RawSerialMessage = RawSerialReadingMessage | RawSerialStatusMessage;

export interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
  displayName?: string;
}
