import React from 'react';
import { SimulationState } from '../types';
import { Terminal, Cpu, Database, Network, ShieldCheck, Binary, Activity } from 'lucide-react';

interface EvaluatorModeProps {
  state: SimulationState | null;
  onClose: () => void;
}

export const EvaluatorMode: React.FC<EvaluatorModeProps> = ({ state, onClose }) => {
  const risk = state?.risk;
  const decision = state?.decision;
  const metrics = state?.metrics;
  const activeRoute = state?.candidate_routes.find((r) => r.id === decision?.selected_route_id)
    || state?.candidate_routes[0];

  return (
    <div className="bg-slate-950/95 border-2 border-sky-500/50 rounded-2xl p-6 shadow-2xl space-y-5 text-slate-200 font-mono text-xs backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Terminal className="h-5 w-5 text-sky-400" />
          <div>
            <h2 className="text-sm font-bold text-white tracking-wider uppercase flex items-center gap-2">
              MIRA Evaluator Diagnostic Console
              <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">
                JUDGE INSPECTION
              </span>
            </h2>
            <p className="text-[10px] text-slate-400 font-sans">
              Internal mathematical parameters, feature weights, Isolation Forest anomaly vectors, and route matrices.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs transition cursor-pointer"
        >
          Exit Evaluator Mode
        </button>
      </div>

      {/* Grid: 4 Analytical Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Panel 1: Mathematical Risk Decomposition */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="text-[11px] font-bold text-sky-400 flex items-center gap-1.5 uppercase">
            <Binary className="h-4 w-4" /> 1. Risk Formula
          </div>
          <p className="text-[10px] text-slate-400 font-sans">
            R_phys = 0.25B + 0.25S + 0.15C + 0.25O + 0.1E
          </p>

          <div className="space-y-1 text-[11px] bg-slate-950 p-2 rounded-lg border border-slate-850 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">0.25 × Batt ({risk?.battery_risk.toFixed(1)}):</span>
              <span className="text-white">{((risk?.battery_risk ?? 0) * 0.25).toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">0.25 × Sens ({risk?.sensor_risk.toFixed(1)}):</span>
              <span className="text-white">{((risk?.sensor_risk ?? 0) * 0.25).toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">0.15 × Comm ({risk?.communication_risk.toFixed(1)}):</span>
              <span className="text-white">{((risk?.communication_risk ?? 0) * 0.15).toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">0.25 × Obst ({risk?.obstacle_risk.toFixed(1)}):</span>
              <span className="text-white">{((risk?.obstacle_risk ?? 0) * 0.25).toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">0.10 × Env ({risk?.environment_risk.toFixed(1)}):</span>
              <span className="text-white">{((risk?.environment_risk ?? 0) * 0.1).toFixed(1)}</span>
            </div>
            <div className="border-t border-slate-800 pt-1 flex justify-between text-sky-300 font-bold">
              <span>R_physical Subtotal:</span>
              <span>{risk?.physical_risk ?? 0}</span>
            </div>
            <div className="flex justify-between text-purple-400">
              <span>Context Multiplier:</span>
              <span>× {risk?.context_multiplier ?? 1.0}</span>
            </div>
            <div className="border-t border-slate-800 pt-1 flex justify-between font-bold text-emerald-400">
              <span>Composite Score:</span>
              <span>{risk?.composite_risk.toFixed(1)} / 100</span>
            </div>
          </div>
        </div>

        {/* Panel 2: Isolation Forest Anomaly Detection */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="text-[11px] font-bold text-purple-400 flex items-center gap-1.5 uppercase">
            <Cpu className="h-4 w-4" /> 2. AI Isolation Forest
          </div>
          <p className="text-[10px] text-slate-400 font-sans">
            Unsupervised 9-dim telemetry feature vector classifier.
          </p>

          <div className="space-y-1.5 text-[11px] bg-slate-950 p-2 rounded-lg border border-slate-850">
            <div className="flex justify-between">
              <span className="text-slate-400">Anomaly Score:</span>
              <span className="text-purple-300 font-bold">{risk?.anomaly_score.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Contamination Ratio:</span>
              <span className="text-slate-300">0.05 (95% inlier)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Classification:</span>
              <span className={risk?.is_anomaly ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                {risk?.is_anomaly ? 'OUTLIER DETECTED' : 'INLIER (NORMAL)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Advisory Delta:</span>
              <span className="text-amber-400">
                {risk?.is_anomaly ? `+${Math.min(15, ((risk.anomaly_score ?? 0) * 10.0)).toFixed(1)} pts` : '+0.0 pts'}
              </span>
            </div>
          </div>
        </div>

        {/* Panel 3: Route Scoring Matrix */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase">
            <Network className="h-4 w-4" /> 3. Route Objective
          </div>
          <p className="text-[10px] text-slate-400 font-sans">
            J(R) = 1.0·Dist + 1.6·Haz + 1.4·Clr + 0.5·Eng
          </p>

          <div className="space-y-1.5 text-[11px] bg-slate-950 p-2 rounded-lg border border-slate-850">
            <div className="flex justify-between">
              <span className="text-slate-400">Path Length:</span>
              <span className="text-white">{activeRoute?.length ?? 0} m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Hazard Cost:</span>
              <span className="text-amber-400">{activeRoute?.hazard_cost ?? activeRoute?.risk_cost ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Clearance Cost:</span>
              <span className="text-emerald-400">{activeRoute?.clearance_cost ?? 0}</span>
            </div>
            <div className="border-t border-slate-800 pt-1 flex justify-between font-bold text-sky-400">
              <span>Total Cost J(R):</span>
              <span>{activeRoute?.total_score ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Panel 4: Edge Compute Profiler */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 uppercase">
            <Activity className="h-4 w-4" /> 4. Edge Profiler
          </div>
          <p className="text-[10px] text-slate-400 font-sans">
            Live OS process resource & sub-millisecond latencies.
          </p>

          <div className="space-y-1.5 text-[11px] bg-slate-950 p-2 rounded-lg border border-slate-850">
            <div className="flex justify-between">
              <span className="text-slate-400">Process CPU %:</span>
              <span className="text-sky-300 font-bold">{state?.compute_metrics?.cpu_percent ?? 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Resident RAM:</span>
              <span className="text-purple-300 font-bold">{state?.compute_metrics?.memory_mb ?? 0} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Risk Engine:</span>
              <span className="text-white">{state?.compute_metrics?.risk_eval_ms ?? 0} ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">AI Forest Eval:</span>
              <span className="text-white">{state?.compute_metrics?.anomaly_eval_ms ?? 0} ms</span>
            </div>
            <div className="border-t border-slate-800 pt-1 flex justify-between font-bold text-emerald-400">
              <span>Total 2Hz Cycle:</span>
              <span>{state?.compute_metrics?.total_cycle_ms ?? 0} ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Governor State Machine Visualizer */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
        <div className="text-[11px] font-bold text-white mb-2 uppercase flex items-center gap-2">
          <Activity className="h-4 w-4 text-sky-400" />
          Safety Governor Active State Machine Node
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-[10px]">
          {['CONTINUE', 'SLOW_DOWN', 'REPLAN', 'DEGRADED_AUTONOMY', 'RETURN_TO_SAFE_ZONE', 'EMERGENCY_STOP'].map((action) => {
            const isCurrent = decision?.action === action;
            return (
              <div
                key={action}
                className={`py-2 px-1 rounded-lg border transition-all ${
                  isCurrent
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold shadow-md shadow-sky-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                {action.replace(/_/g, ' ')}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

