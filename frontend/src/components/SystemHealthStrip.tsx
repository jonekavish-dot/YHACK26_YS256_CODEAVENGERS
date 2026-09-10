import React from 'react';
import { SimulationState } from '../types';
import { Activity, Cpu, HardDrive, Clock, Shield } from 'lucide-react';

interface SystemHealthStripProps {
  state: SimulationState | null;
  isConnected: boolean;
}

export const SystemHealthStrip: React.FC<SystemHealthStripProps> = ({ state, isConnected }) => {
  const metrics = state?.compute_metrics;
  const cpuPercent = metrics?.cpu_percent ?? 0;
  const memMb = metrics?.memory_mb ?? 0;
  const cycleMs = metrics?.total_cycle_ms ?? 0;
  const action = state?.decision?.action ?? 'CONTINUE';

  return (
    <div className="w-full bg-slate-950/95 border-t border-slate-800/80 px-4 py-1.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-[11px] font-mono text-slate-400">
      {/* Telemetry link status & Team ID */}
      <div className="flex items-center space-x-3 shrink-0">
        <div className="flex items-center space-x-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className={`font-bold ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isConnected ? '2.0 Hz TELEMETRY' : 'DISCONNECTED'}
          </span>
        </div>

        <span className="text-slate-700">|</span>

        <span className="text-slate-500 inline-flex items-center gap-1">
          <Shield className="h-3 w-3 text-sky-500 inline" />
          <span>TEAM: <strong className="text-slate-300">YS526</strong></span>
        </span>
      </div>

      {/* Host-process edge compute telemetry */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[10px] text-slate-500 font-sans tracking-wide uppercase hidden sm:inline">
          Host Process:
        </span>

        {/* CPU */}
        <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px]">
          <Cpu className="h-3 w-3 text-sky-400" />
          <span className="text-slate-500">CPU</span>
          <span
            className={`font-bold ${
              cpuPercent > 80
                ? 'text-rose-400'
                : cpuPercent > 50
                ? 'text-amber-400'
                : 'text-sky-300'
            }`}
          >
            {cpuPercent}%
          </span>
        </div>

        {/* RAM */}
        <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px]">
          <HardDrive className="h-3 w-3 text-purple-400" />
          <span className="text-slate-500">RAM</span>
          <span className="text-purple-300 font-bold">{memMb}MB</span>
        </div>

        {/* Cycle Latency */}
        <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px]">
          <Clock className="h-3 w-3 text-emerald-400" />
          <span className="text-slate-500">CYCLE</span>
          <span className="text-emerald-300 font-bold">{cycleMs}ms</span>
        </div>

        {/* Active Governor Action */}
        <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px]">
          <Activity className="h-3 w-3 text-amber-400" />
          <span className="text-slate-500">GOVERNOR:</span>
          <span
            className={`font-bold ${
              action === 'EMERGENCY_STOP'
                ? 'text-rose-400'
                : action === 'RETURN_TO_SAFE_ZONE'
                ? 'text-amber-400'
                : action === 'REPLAN'
                ? 'text-sky-400'
                : 'text-emerald-400'
            }`}
          >
            {action}
          </span>
        </div>

        {/* Simulation step */}
        {state?.step_count !== undefined && (
          <div className="text-[10px] text-slate-500 inline px-1.5 py-0.5 rounded bg-slate-900/60 border border-slate-800/60">
            STEP #{state.step_count}
          </div>
        )}
      </div>
    </div>
  );
};
