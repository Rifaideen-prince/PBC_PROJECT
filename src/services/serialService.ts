import { ConnectionState } from '../types/serial';
import { SensorReading } from '../types/sensor';
import { SerialLineBuffer, parseSerialLine } from './serialParser';

// Web Serial API types declaration for browsers
interface SerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
  getInfo(): { usbVendorId?: number; usbProductId?: number };
  addEventListener(type: string, listener: (ev: Event) => void): void;
  removeEventListener(type: string, listener: (ev: Event) => void): void;
}

interface SerialNavigator extends Navigator {
  serial?: {
    requestPort(options?: { filters?: Array<{ usbVendorId?: number; usbProductId?: number }> }): Promise<SerialPort>;
    getPorts(): Promise<SerialPort[]>;
    addEventListener(type: string, listener: (ev: Event) => void): void;
    removeEventListener(type: string, listener: (ev: Event) => void): void;
  };
}

export type ReadingCallback = (reading: SensorReading) => void;
export type StatusCallback = (state: ConnectionState, message?: string) => void;
export type DeviceInfoCallback = (device: string, firmwareVersion: string) => void;

export class SerialService {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<string> | null = null;
  private readableStreamClosed: Promise<void> | null = null;
  private lineBuffer = new SerialLineBuffer();
  private keepReading = false;
  private connectionState: ConnectionState = 'disconnected';

  private onReadingCallbacks = new Set<ReadingCallback>();
  private onStatusCallbacks = new Set<StatusCallback>();
  private onDeviceInfoCallbacks = new Set<DeviceInfoCallback>();

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  public subscribeReading(cb: ReadingCallback): () => void {
    this.onReadingCallbacks.add(cb);
    return () => this.onReadingCallbacks.delete(cb);
  }

  public subscribeStatus(cb: StatusCallback): () => void {
    this.onStatusCallbacks.add(cb);
    // immediately emit current state
    cb(this.connectionState);
    return () => this.onStatusCallbacks.delete(cb);
  }

  public subscribeDeviceInfo(cb: DeviceInfoCallback): () => void {
    this.onDeviceInfoCallbacks.add(cb);
    return () => this.onDeviceInfoCallbacks.delete(cb);
  }

  private updateStatus(state: ConnectionState, message?: string) {
    this.connectionState = state;
    for (const cb of this.onStatusCallbacks) {
      cb(state, message);
    }
  }

  public async connect(): Promise<boolean> {
    if (!this.isSupported()) {
      this.updateStatus('error', 'Web Serial API is not supported in this browser. Please use Google Chrome or Microsoft Edge on desktop.');
      return false;
    }

    if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
      return true;
    }

    try {
      this.updateStatus('connecting', 'Requesting serial port...');
      const serialNav = navigator as SerialNavigator;
      const port = await serialNav.serial!.requestPort();
      this.port = port;

      await port.open({ baudRate: 115200 });
      this.lineBuffer.clear();
      this.keepReading = true;
      this.updateStatus('connected', 'ESP32 connected at 115200 baud.');

      // Start continuous background read loop
      this.startReadLoop();
      return true;
    } catch (err) {
      const errMsg = (err as Error).name === 'NotFoundError'
        ? 'No serial port selected by user.'
        : `Connection failed: ${(err as Error).message}`;
      this.updateStatus('error', errMsg);
      this.disconnect();
      return false;
    }
  }

  private async startReadLoop(): Promise<void> {
    if (!this.port || !this.port.readable) return;

    try {
      const textDecoder = new TextDecoderStream();
      this.readableStreamClosed = (this.port.readable as any).pipeTo(textDecoder.writable);
      this.reader = textDecoder.readable.getReader();

      while (this.keepReading && this.reader) {
        const { value, done } = await this.reader.read();
        if (done) {
          break;
        }
        if (value) {
          const lines = this.lineBuffer.pushChunk(value);
          for (const line of lines) {
            const res = parseSerialLine(line);
            if (res.reading) {
              for (const cb of this.onReadingCallbacks) {
                cb(res.reading);
              }
            } else if (res.statusMessage) {
              for (const cb of this.onDeviceInfoCallbacks) {
                cb(res.statusMessage.device || 'THERMALAB-ESP32', res.statusMessage.firmware_version || '1.0.0');
              }
            }
          }
        }
      }
    } catch (err) {
      if (this.keepReading) {
        this.updateStatus('error', `Hardware read error: ${(err as Error).message}`);
      }
    } finally {
      this.cleanUpReader();
    }
  }

  private async cleanUpReader(): Promise<void> {
    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch {
        // ignore already closed
      }
      this.reader = null;
    }
    if (this.readableStreamClosed) {
      try {
        await this.readableStreamClosed;
      } catch {
        // ignore
      }
      this.readableStreamClosed = null;
    }
  }

  public async disconnect(): Promise<void> {
    this.keepReading = false;
    await this.cleanUpReader();

    if (this.port) {
      try {
        await this.port.close();
      } catch {
        // ignore
      }
      this.port = null;
    }

    this.lineBuffer.clear();
    this.updateStatus('disconnected', 'Serial port disconnected.');
  }
}

// Global singleton instance for entire application lifetime
export const serialService = new SerialService();
