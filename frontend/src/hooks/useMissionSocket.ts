import { useState, useEffect, useRef } from 'react';
import { SimulationState } from '../types';
import { getApiBase } from '../services/api';

export interface RiskPoint {
  time: string;
  timestamp: number;
  risk: number;
  battery: number;
  sensor: number;
  comm: number;
  is_anomaly: boolean;
}

export function getWebSocketUrl(): string {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL as string;
  }
  const apiBase = getApiBase();
  if (apiBase.startsWith('https://')) {
    return `${apiBase.replace(/^https:\/\//, 'wss://')}/ws`;
  }
  if (apiBase.startsWith('http://')) {
    return `${apiBase.replace(/^http:\/\//, 'ws://')}/ws`;
  }
  return 'wss://mira-backend.onrender.com/ws';
}

export function useMissionSocket() {
  const [state, setState] = useState<SimulationState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [history, setHistory] = useState<RiskPoint[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let unmounted = false;

    function connect() {
      try {
        const url = getWebSocketUrl();
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          if (unmounted) return;
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          if (unmounted) return;
          try {
            const data: SimulationState = JSON.parse(event.data);
            setState(data);

            const now = new Date();
            const timeStr = `${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

            setHistory((prev) => {
              const next = [
                ...prev,
                {
                  time: timeStr,
                  timestamp: data.telemetry.timestamp,
                  risk: data.risk.composite_risk,
                  battery: data.telemetry.battery,
                  sensor: data.telemetry.sensor_health,
                  comm: data.risk.communication_risk,
                  is_anomaly: data.risk.is_anomaly,
                },
              ];
              // Keep last 40 data points
              return next.length > 40 ? next.slice(next.length - 40) : next;
            });
          } catch (e) {
            console.error('Error parsing WebSocket message', e);
          }
        };

        ws.onerror = () => {
          setIsConnected(false);
        };

        ws.onclose = () => {
          setIsConnected(false);
          if (!unmounted) {
            reconnectTimeoutRef.current = window.setTimeout(connect, 1500);
          }
        };
      } catch (err) {
        setIsConnected(false);
        if (!unmounted) {
          reconnectTimeoutRef.current = window.setTimeout(connect, 2000);
        }
      }
    }

    const handleUrlChange = () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
      connect();
    };
    window.addEventListener('mira_backend_url_changed', handleUrlChange);

    connect();

    return () => {
      unmounted = true;
      window.removeEventListener('mira_backend_url_changed', handleUrlChange);
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  return { state, isConnected, history };
}
