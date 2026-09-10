import React, { useState } from 'react';
import { MissionMetrics } from '../types';
import { Scale, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Play, RotateCcw } from 'lucide-react';
import { runReproducibleBenchmark } from '../services/api';

interface BaselineComparisonProps {
  metrics: MissionMetrics | null;
}

type BenchmarkStatus = 'READY' | 'RUNNING' | 'COMPLETE' | 'FAILED';

export const BaselineComparison: React.FC<BaselineComparisonProps> = ({ metrics }) => {
  const comp = metrics?.baseline_comparison;
  const baseline = comp?.baseline;
  const mira = comp?.mira;

  const [benchmarkStatus, setBenchmarkStatus] = useState<BenchmarkStatus>('READY');
  const [lastRunTime, setLastRunTime] = useState<string | null>(null);
  const [benchResult, setBenchResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunBenchmark = async () => {
    if (benchmarkStatus === 'RUNNING') return;
    try {
      setBenchmarkStatus('RUNNING');
      setError(null);
      const data = await runReproducibleBenchmark(20, 42);
      if (data && data.baseline && data.mira) {
        setBenchResult(data);
        setBenchmarkStatus('COMPLETE');
        setLastRunTime(new Date().toLocaleTimeString());
      } else {
        const msg = data?.detail || data?.error || 'Benchmark service returned an incomplete response.';
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        setBenchmarkStatus('FAILED');
      }
    } catch (e: any) {
      console.error('Benchmark execution error:', e);
      setError(e?.message || 'Network error connecting to benchmark service.');
      setBenchmarkStatus('FAILED');
    }
  };

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
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Badge */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs font-mono border">
            <span
              className={`h-2 w-2 rounded-full ${
                benchmarkStatus === 'RUNNING'
                  ? 'bg-purple-400 animate-ping'
                  : benchmarkStatus === 'COMPLETE'
                  ? 'bg-emerald-400'
                  : benchmarkStatus === 'FAILED'
                  ? 'bg-rose-400'
                  : 'bg-slate-400'
              }`}
            />
            <span
              className={
                benchmarkStatus === 'RUNNING'
                  ? 'text-purple-300 font-bold'
                  : benchmarkStatus === 'COMPLETE'
                  ? 'text-emerald-300 font-bold'
                  : benchmarkStatus === 'FAILED'
                  ? 'text-rose-300 font-bold'
                  : 'text-slate-400'
              }
            >
              {benchmarkStatus === 'RUNNING'
                ? 'BENCHMARK RUNNING'
                : benchmarkStatus === 'COMPLETE'
                ? `COMPLETE ${lastRunTime ? `(${lastRunTime})` : ''}`
                : benchmarkStatus === 'FAILED'
                ? 'RUN FAILED'
                : 'READY'}
            </span>
          </div>

          {/* Benchmark Trigger Button */}
          <button
            onClick={handleRunBenchmark}
            disabled={benchmarkStatus === 'RUNNING'}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold shadow-md shadow-purple-600/25 transition cursor-pointer disabled:opacity-50"
          >
            {benchmarkStatus === 'RUNNING' ? (
              <RotateCcw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            <span>
              {benchmarkStatus === 'RUNNING' ? 'EVALUATING 20 TRIALS...' : 'RUN BENCHMARK (20 TRIALS, SEED=42)'}
            </span>
          </button>

          {comp && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-xl text-emerald-400 text-xs font-mono">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Risk: -{comp.risk_reduction_pct}%</span>
              </div>
              {comp.risk_exposure_reduction_pct !== undefined && (
                <div className="flex items-center space-x-1.5 bg-sky-500/10 border border-sky-500/30 px-2.5 py-1 rounded-xl text-sky-300 text-xs font-mono">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Exposure: -{comp.risk_exposure_reduction_pct}%</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error notification banner if any */}
      {error && (
        <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-3.5 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>Benchmark Notice: {error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-slate-400 hover:text-white text-xs font-mono underline ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Reproducible Benchmark Results Banner if Run */}
      {benchResult && benchResult.baseline && benchResult.mira && (
        <div className="bg-purple-950/30 border border-purple-800/60 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-mono text-purple-200">
              <span className="font-bold text-white">REPRODUCIBLE MONTE CARLO BENCHMARK:</span>
              <span>{benchResult.num_trials} TRIALS (Fixed Seed: {benchResult.random_seed})</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
              (benchResult.mira.total_collisions ?? 0) === 0
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}>
              {(benchResult.mira.total_collisions ?? 0) === 0
                ? 'VERIFIED 0 MIRA COLLISIONS'
                : `${benchResult.mira.total_collisions} MIRA COLLISIONS`}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950/80 border border-rose-900/50">
              <div className="font-bold text-rose-400 mb-2">Shortest-Path Baseline:</div>
              <div className="space-y-1 text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Success Rate:</span>
                  <span className="font-bold text-rose-300">{benchResult.baseline.success_rate_pct ?? 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Collisions:</span>
                  <span className="font-bold text-rose-400">{benchResult.baseline.total_collisions ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Near Misses:</span>
                  <span className="text-amber-400">{benchResult.baseline.total_near_misses ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mean Risk Score:</span>
                  <span>{benchResult.baseline.mean_risk ?? 0} / 100</span>
                </div>
                {benchResult.baseline.mean_risk_exposure !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Risk Exposure (&gt;30):</span>
                    <span className="text-rose-400">{benchResult.baseline.mean_risk_exposure} pts</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-emerald-900/50">
              <div className="font-bold text-emerald-400 mb-2">MIRA Risk-Aware Governor:</div>
              <div className="space-y-1 text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Success Rate:</span>
                  <span className="font-bold text-emerald-300">{benchResult.mira.success_rate_pct ?? 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Collisions:</span>
                  <span className="font-bold text-emerald-400">{benchResult.mira.total_collisions ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Near Misses:</span>
                  <span className="text-emerald-400">{benchResult.mira.total_near_misses ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mean Risk Score:</span>
                  <span>{benchResult.mira.mean_risk ?? 0} / 100</span>
                </div>
                {benchResult.mira.mean_risk_exposure !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Risk Exposure (&gt;30):</span>
                    <span className="text-emerald-400">{benchResult.mira.mean_risk_exposure} pts</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Deterministic Scenario Breakdown if returned */}
          {benchResult.scenario_breakdown && (
            <div className="mt-4 pt-3 border-t border-purple-900/40">
              <div className="text-xs font-bold text-purple-200 font-mono mb-2 flex items-center gap-1.5">
                <span>DETERMINISTIC SCENARIO BENCHMARK BREAKDOWN:</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] font-mono">
                  <thead>
                    <tr className="border-b border-purple-900/60 text-slate-400">
                      <th className="pb-1.5 font-semibold">Scenario Profile</th>
                      <th className="pb-1.5 font-semibold text-center">Baseline Collisions</th>
                      <th className="pb-1.5 font-semibold text-center">Baseline Mean Risk</th>
                      <th className="pb-1.5 font-semibold text-center">MIRA Collisions</th>
                      <th className="pb-1.5 font-semibold text-center">MIRA Mean Risk</th>
                      <th className="pb-1.5 font-semibold text-right">Risk Reduction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-900/30">
                    {Object.entries(benchResult.scenario_breakdown).map(([scKey, sc]: [string, any]) => (
                      <tr key={scKey} className="hover:bg-purple-900/20">
                        <td className="py-2 pr-3">
                          <div className="font-semibold text-white">{sc.name}</div>
                          <div className="text-[10px] text-slate-400 font-sans">{sc.description}</div>
                        </td>
                        <td className="py-2 text-center text-rose-400 font-bold">{sc.baseline_collisions ?? 0}</td>
                        <td className="py-2 text-center text-rose-300">{sc.baseline_risk ?? 0}</td>
                        <td className="py-2 text-center text-emerald-400 font-bold">{sc.mira_collisions ?? 0}</td>
                        <td className="py-2 text-center text-emerald-300">{sc.mira_risk ?? 0}</td>
                        <td className="py-2 text-right">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                            -{sc.risk_reduction_pct ?? 0}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

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
                <span className="text-slate-500">Risk Exposure (&gt;30 threshold):</span>
                <span className="text-rose-400 font-bold">{baseline?.risk_exposure ?? '--'} pts</span>
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
                <span className={mira?.success ? 'text-emerald-400 font-bold flex items-center gap-1' : 'text-amber-400 font-bold flex items-center gap-1'}>
                  {mira?.success ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                  {mira?.success ? 'MISSION COMPLETED' : 'SAFE FALLBACK / RECOVERY'}
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
                <span className="text-slate-500">Risk Exposure (&gt;30 threshold):</span>
                <span className="text-emerald-400 font-bold">{mira?.risk_exposure ?? '--'} pts</span>
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
            For only a slight variance in route distance ({((mira?.distance ?? 0) - (baseline?.distance ?? 0)) >= 0 ? `+${((mira?.distance ?? 0) - (baseline?.distance ?? 0)).toFixed(1)}m` : `${((mira?.distance ?? 0) - (baseline?.distance ?? 0)).toFixed(1)}m`}), MIRA eliminates collisions, mitigates toxic corridors, and safeguards autonomous mission delivery.
          </div>
        </div>
      </div>
    </div>
  );
};
