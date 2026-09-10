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

      {/* Grid: 3 Analytical Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Panel 1: Mathematical Risk Decomposition */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
          <div className="text-[11px] font-bold text-sky-400 flex items-center gap-1.5 uppercase">
            <Binary className="h-4 w-4" /> 1. Risk Equation Vector
          </div>
          <p className="text-[10px] text-slate-400 font-sans">
            Normalized equation: Total = 0.2B + 0.2S + 0.15C + 0.2O + 0.1E + 0.15Crit
          </p>

          <div className="space-y-1.5 text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-850">
            <div className="flex justify-between">
              <span className="text-slate-400">0.20 × Battery ({risk?.battery_risk.toFixed(1)}):</span>
              <span className="text-white">{((risk?.battery_risk ?? 0) * 0.2).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">0.20 × Sensor ({risk?.sensor_risk.toFixed(1)}):</span>
              <span className="text-white">{((risk?.sensor_risk ?? 0) * 0.2).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">0.15 × Comm ({risk?.communication_risk.toFixed(1)}):</span>
              <span className="text-white">{((risk?.communication_risk ?? 0) * 0.15).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">0.20 × Obstacle ({risk?.obstacle_risk.toFixed(1)}):</span>
              <span className="text-white">{((risk?.obstacle_risk ?? 0) * 0.2).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">0.10 × Environment ({risk?.environment_risk.toFixed(1)}):</span>
              <span className="text-white">{((risk?.environment_risk ?? 0) * 0.1).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">0.15 × Criticality ({risk?.mission_criticality.toFixed(1)}):</span>
              <span className="text-white">{((risk?.mission_criticality ?? 0) * 0.15).toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-800 pt-1 flex justify-between font-bold text-sky-400">
              <span>Weighted Composite Score:</span>
              <span>{risk?.composite_risk.toFixed(1)} / 100</span>
            </div>
          </div>
        </div>

        {/* Panel 2: Isolation Forest Anomaly Detection */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
          <div className="text-[11px] font-bold text-purple-400 flex items-center gap-1.5 uppercase">
            <Cpu className="h-4 w-4" /> 2. AI Isolation Forest Model
          </div>
          <p className="text-[10px] text-slate-400 font-sans">
            Unsupervised outlier detection across 9-dimensional operational telemetry feature vector.
          </p>

          <div className="space-y-2 text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-850">
            <div className="flex justify-between">
              <span className="text-slate-400">Decision Function Score:</span>
              <span className="text-purple-300 font-bold">{risk?.anomaly_score.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Contamination Ratio:</span>
              <span className="text-slate-300">0.05 (95% inlier bound)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Anomaly Classification:</span>
              <span className={risk?.is_anomaly ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                {risk?.is_anomaly ? 'OUTLIER DETECTED' : 'INLIER (NORMAL)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Hybrid Penalty Applied:</span>
              <span className="text-amber-400">
                {risk?.is_anomaly ? `+${((risk.anomaly_score ?? 0) * 8.0).toFixed(1)} pts` : '+0.0 pts'}
              </span>
            </div>
          </div>
        </div>

        {/* Panel 3: Route Scoring Matrix */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
          <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase">
            <Network className="h-4 w-4" /> 3. Multi-Criteria Route Matrix
          </div>
          <p className="text-[10px] text-slate-400 font-sans">
            Objective function: Score = 1.0·Distance + 1.8·Risk + 0.5·Energy
          </p>

          <div className="space-y-1.5 text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-850">
            <div className="flex justify-between">
              <span className="text-slate-400">Evaluated Corridors:</span>
              <span className="text-white">{state?.candidate_routes.length ?? 0} candidate paths</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Selected Path Length:</span>
              <span className="text-white">{activeRoute?.length ?? 0} m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Integrated Hazard Cost:</span>
              <span className="text-white">{activeRoute?.risk_cost ?? 0} pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estimated Energy Cost:</span>
              <span className="text-white">{activeRoute?.energy_cost ?? 0} Wh</span>
            </div>
            <div className="border-t border-slate-800 pt-1 flex justify-between font-bold text-emerald-400">
              <span>A* Multi-Criteria Score:</span>
              <span>{activeRoute?.total_score ?? 0}</span>
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

