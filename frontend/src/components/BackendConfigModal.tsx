import React, { useState, useEffect } from 'react';
import { X, Globe, Wifi, CheckCircle2, AlertTriangle, RefreshCw, Server } from 'lucide-react';
import { getApiBase, setApiBase, testBackendHealth } from '../services/api';

interface BackendConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
}

export const BackendConfigModal: React.FC<BackendConfigModalProps> = ({
  isOpen,
  onClose,
  isConnected,
}) => {
  const [url, setUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; latencyMs?: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl(getApiBase());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testBackendHealth(url);
    setIsTesting(false);
    setTestResult(res);
  };

  const handleSave = () => {
    setApiBase(url.trim());
    onClose();
  };

  const handleResetDefault = () => {
    setUrl('https://mira-backend.onrender.com');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">MIRA Cloud Backend Link</h3>
              <p className="text-xs text-slate-400">Render API &amp; 2.0 Hz WebSocket Telemetry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Live Connection Status Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center space-x-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="font-mono text-slate-300">Live Status:</span>
              <strong className={isConnected ? 'text-emerald-400' : 'text-amber-400'}>
                {isConnected ? 'ONLINE & STREAMING (2 Hz)' : 'DISCONNECTED / WAKING UP'}
              </strong>
            </div>
            <div className="font-mono text-[11px] text-slate-400 flex items-center gap-1">
              <Wifi className="h-3 w-3 text-sky-400" />
              <span>WSS + REST</span>
            </div>
          </div>

          {/* Render Free-tier wakeup notice */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200/90 text-[11px] leading-relaxed flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300">Render Free-Tier Advisory:</strong> If the service has been idle for &gt;15 minutes, Render spins down instances. The first connection triggers a cold-boot that takes ~30–45s to complete. Click <strong>Ping / Wake Up</strong> below to start warm-up.
            </div>
          </div>

          {/* Backend URL Input */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-medium">Backend API Endpoint URL</label>
            <div className="relative">
              <Globe className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://mira-backend.onrender.com"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 text-[11px]">Presets:</span>
            <button
              onClick={handleResetDefault}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 font-mono text-[10px] border border-slate-700 transition cursor-pointer"
            >
              mira-backend.onrender.com
            </button>
            <button
              onClick={() => setUrl('http://127.0.0.1:8000')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] border border-slate-700 transition cursor-pointer"
            >
              Localhost (127.0.0.1:8000)
            </button>
          </div>

          {/* Test Health Result Box */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-[11px] font-mono flex items-start space-x-2 ${
                testResult.ok
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="leading-snug">
                <div>{testResult.message}</div>
                {testResult.latencyMs !== undefined && (
                  <div className="text-[10px] opacity-75 mt-0.5">Roundtrip Latency: {testResult.latencyMs} ms</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={handleTest}
            disabled={isTesting}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin text-sky-400' : ''}`} />
            <span>{isTesting ? 'Pinging...' : 'Ping / Wake Up'}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition cursor-pointer"
            >
              Save &amp; Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
