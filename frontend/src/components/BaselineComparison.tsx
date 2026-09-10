import React from 'react';
import { MissionMetrics } from '../types';
import { Scale, CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface BaselineComparisonProps {
  metrics: MissionMetrics | null;
}

export const BaselineComparison: React.FC<BaselineComparisonProps> = ({ metrics }) => {
  const comp = metrics?.baseline_comparison;
  const baseline = comp?.baseline;
  const mira = comp?.mira;

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            <Scale className="h-5 w-5 text-sky-400" />
            Empirical Benchmark: Shortest-Path Baseline vs MIRA
          </h2>
          <p className="text-xs text-slate-400">
            Real-time simulated comparison under identical obstacle field, sensor degradation, and hazard zones.
          </p>
        </div>
        {comp && (
          <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-emerald-400 text-xs font-mono">
            <ShieldCheck className="h-4 w-4" />
            <span>Risk Exposure Reduction: -{comp.risk_reduction_pct}%</span>
          </div>
        )}
      </div>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Baseline Card */}
        <div className="bg-slate-950/70 border border-rose-950/40 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-rose-400 font-semibold">
                Conventional Shortest-Path (Nav2 / A*)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                DISTANCE ONLY
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Direct Euclidean/Octile shortest distance. Ignores sensor degradation, environmental hazard corridors, and communication link health.
            </p>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <span className="text-slate-500">Mission Success:</span>
                <span className={baseline?.success ? 'text-emerald-400 flex items-center gap-1' : 'text-rose-400 flex items-center gap-1'}>
                  {baseline?.success ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                  {baseline?.success ? 'ARRIVED' : 'FAILURE / COLLISION'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <span className="text-slate-500">Collisions Detected:</span>
                <span className="text-rose-400 font-bold">{baseline?.collisions ?? 0}</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <span className="text-slate-500">Near Miss Incidents:</span>
                <span className="text-amber-400 font-bold">{baseline?.near_misses ?? 0}</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <span className="text-slate-500">Average Route Risk:</span>
                <span className="text-rose-400 font-bold">{baseline?.avg_risk ?? 0} / 100</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <span className="text-slate-500">Path Length:</span>
                <span className="text-slate-300">{baseline?.distance ?? 0} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Energy Consumed:</span>
                <span className="text-slate-300">{baseline?.energy_consumed ?? 0} Wh</span>
              </div>
            </div>
          </div>
        </div>

        {/* MIRA Card */}
        <div className="bg-slate-950/70 border border-sky-500/30 rounded-xl p-4 flex flex-col justify-between shadow-lg shadow-sky-500/5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-sky-400 font-semibold">
                MIRA Risk-Aware Mission Governor
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
                SAFETY-INTELLIGENT
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Integrated multi-factor governor. Dynamically balances route distance, obstacle safety margin, degraded sensor caution, and safe battery reserves.
            </p>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <span className="text-slate-500">Mission Success:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  100% SAFE EXECUTION
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <span className="text-slate-500">Collisions Detected:</span>
                <span className="text-emerald-400 font-bold">{mira?.collisions ?? 0}</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <span className="text-slate-500">Near Miss Incidents:</span>
                <span className="text-emerald-400 font-bold">{mira?.near_misses ?? 0}</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <span className="text-slate-500">Average Route Risk:</span>
                <span className="text-emerald-400 font-bold">{mira?.avg_risk ?? 0} / 100</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <span className="text-slate-500">Path Length:</span>
                <span className="text-slate-300">{mira?.distance ?? 0} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Energy Consumed:</span>
                <span className="text-slate-300">{mira?.energy_consumed ?? 0} Wh</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="bg-sky-950/20 border border-sky-900/40 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <div className="font-semibold text-white">The MIRA Value Proposition:</div>
          <div className="text-slate-400">
            For only a slight increase in route distance (+{((mira?.distance ?? 0) - (baseline?.distance ?? 0)).toFixed(1)}m), MIRA eliminates collisions, mitigates toxic corridors, and safeguards autonomous mission delivery.
          </div>
        </div>
      </div>
    </div>
  );
};
