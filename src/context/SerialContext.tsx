import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { ConnectionState } from '../types/serial';
import { SensorReading, SensorDiagnostics } from '../types/sensor';
import { serialService } from '../services/serialService';

interface SerialContextValue {
  isSupported: boolean;
  connectionState: ConnectionState;
  connectionError: string | null;
  deviceInfo: { device: string; firmwareVersion: string } | null;
  latestReading: SensorReading | null;
  diagnostics: SensorDiagnostics;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  tempDifference: number | null; // reference - sample
}

const SerialContext = createContext<SerialContextValue | undefined>(undefined);

export const SerialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<{ device: string; firmwareVersion: string } | null>(null);
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null);
  const [diagnostics, setDiagnostics] = useState<SensorDiagnostics>({
    referenceStatus: 'disconnected',
    sampleStatus: 'disconnected',
    ambientStatus: 'disconnected',
    humidityStatus: 'disconnected',
    lastValidReadingTime: null,
    lastAmbientReadingTime: null,
    totalPacketsReceived: 0,
    droppedPackets: 0,
  });

  const lastReadingRef = useRef<SensorReading | null>(null);
  const isSupported = useMemo(() => serialService.isSupported(), []);

  useEffect(() => {
    const unsubStatus = serialService.subscribeStatus((state, msg) => {
      setConnectionState(state);
      if (state === 'error' && msg) {
        setConnectionError(msg);
      } else if (state === 'connected') {
        setConnectionError(null);
      } else if (state === 'disconnected') {
        setLatestReading(null);
        setDiagnostics(prev => ({
          ...prev,
          referenceStatus: 'disconnected',
          sampleStatus: 'disconnected',
          ambientStatus: 'disconnected',
          humidityStatus: 'disconnected',
        }));
      }
    });

    const unsubDevice = serialService.subscribeDeviceInfo((device, firmwareVersion) => {
      setDeviceInfo({ device, firmwareVersion });
    });

    const unsubReading = serialService.subscribeReading((reading) => {
      lastReadingRef.current = reading;
      setLatestReading(reading);

      setDiagnostics(prev => {
        const now = new Date();
        const refOk = reading.isValidReference && reading.referenceTempC !== null;
        const sampleOk = reading.isValidSample && reading.sampleTempC !== null;
        const ambOk = reading.isValidAmbient && reading.ambientTempC !== null;
        const humOk = reading.isValidHumidity && reading.humidityPercent !== null;

        return {
          ...prev,
          referenceStatus: refOk ? 'optimal' : 'warning',
          sampleStatus: sampleOk ? 'optimal' : 'warning',
          ambientStatus: ambOk ? 'optimal' : (prev.lastAmbientReadingTime ? 'warning' : 'disconnected'),
          humidityStatus: humOk ? 'optimal' : (prev.lastAmbientReadingTime ? 'warning' : 'disconnected'),
          lastValidReadingTime: (refOk || sampleOk) ? now : prev.lastValidReadingTime,
          lastAmbientReadingTime: (ambOk || humOk) ? now : prev.lastAmbientReadingTime,
          totalPacketsReceived: prev.totalPacketsReceived + 1,
        };
      });
    });

    return () => {
      unsubStatus();
      unsubDevice();
      unsubReading();
    };
  }, []);

  const connect = async () => {
    return await serialService.connect();
  };

  const disconnect = async () => {
    await serialService.disconnect();
  };

  const tempDifference = useMemo(() => {
    if (!latestReading || latestReading.referenceTempC === null || latestReading.sampleTempC === null) {
      return null;
    }
    return Number((latestReading.referenceTempC - latestReading.sampleTempC).toFixed(2));
  }, [latestReading]);

  return (
    <SerialContext.Provider
      value={{
        isSupported,
        connectionState,
        connectionError,
        deviceInfo,
        latestReading,
        diagnostics,
        connect,
        disconnect,
        tempDifference,
      }}
    >
      {children}
    </SerialContext.Provider>
  );
};

export function useSerial(): SerialContextValue {
  const ctx = useContext(SerialContext);
  if (!ctx) {
    throw new Error('useSerial must be used within a SerialProvider');
  }
  return ctx;
}
