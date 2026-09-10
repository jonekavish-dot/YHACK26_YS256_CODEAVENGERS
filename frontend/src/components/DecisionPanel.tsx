import React from 'react';
import { MissionDecision, Route } from '../types';
import { ShieldCheck, Shuffle, AlertCircle, RefreshCw, CornerUpLeft, Ban, CheckCircle2 } from 'lucide-react';

interface DecisionPanelProps {
  decision: MissionDecision | null;
  activeRoute: Route | undefined;
  candidateRoutes: Route[];
}

export const DecisionPanel: React.FC<DecisionPanelProps> = ({
  decision,
  activeRoute,
  candidateRoutes,
}) => {
  const action = decision?.action ?? 'CONTINUE';
  const mode = decision?.mode ?? 'NORMAL';
  const explanation = decision?.explanation;

  const actionConfig = {
    CONTINUE: {
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      icon: CheckCircle2,
      title: 'CONTINUE MISSION',
    },
    SLOW_DOWN: {
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
      icon: AlertCircle,
      title: 'SLOW DOWN',
    },
    REPLAN: {
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/30',
      icon: Shuffle,
      title: 'AUTONOMOUS REPLAN',
    },
    DEGRADED_AUTONOMY: {
      color: 'text-amber-400',
      bg: 'bg-amber-500/15 border-amber-500/40',
      icon: RefreshCw,
      title: 'DEGRADED AUTONOMY',
    },
    RETURN_TO_SAFE_ZONE: {
      color: 'text-purple-400',
      bg: 'bg-purple-500/15 border-purple-500/40',
      icon: CornerUpLeft,
      title: 'RETURN TO SAFE ZONE',
    },
    EMERGENCY_STOP: {
      color: 'text-rose-500',
      bg: 'bg-rose-500/20 border-rose-500/50',
      icon: Ban,
      title: 'EMERGENCY STOP',
    },
  }[action];

  const ActionIcon = actionConfig.icon;

  const modeBadge = {
    NORMAL: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    DEGRADED_AUTONOMY: 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse',
    SAFE_RETURN: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    EMERGENCY_STOP: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse',
  }[mode];

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
      <div>
        {/* Header with Operating Mode Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Safety Governor Decision
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-slate-500 font-mono">OPERATING MODE:</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${modeBadge}`}>
              {mode.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Big Action Banner */}
        <div className={`p-4 rounded-xl border flex items-center space-x-3 mb-4 ${actionConfig.bg}`}>
          <div className={`p-2.5 rounded-lg bg-slate-950/60 ${actionConfig.color}`}>
            <ActionIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Recommended Action
            </div>
            <div className={`text-lg font-extrabold font-mono tracking-tight ${actionConfig.color}`}>
              {actionConfig.title}
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              {decision?.reason}
            </div>
          </div>
        </div>

        {/* Explainability / Rationale Section */}
        <div className="space-y-3">
          {/* Primary Drivers Chips */}
          {explanation?.primary_drivers && explanation.primary_drivers.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 mb-1.5 font-semibold">
                Telemetry Driving Factors:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {explanation.primary_drivers.map((driver, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono"
                  >
                    • {driver}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rationale & Advice */}
          <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/80">
            <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">
              Governor Justification:
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {explanation?.rationale}
            </p>
          </div>

          {/* Route Tradeoff Details */}
          {explanation?.tradeoff_summary && (
            <div className="bg-sky-950/20 rounded-xl p-3 border border-sky-900/40">
              <div className="text-[10px] font-mono uppercase text-sky-400 mb-1 flex items-center justify-between">
                <span>Route Tradeoff Analysis:</span>
                <span className="text-slate-400">Selected: {activeRoute?.name || 'Active'}</span>
              </div>
              <p className="text-xs text-sky-200 font-mono font-medium">
                {explanation.tradeoff_summary}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Corridor Options Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>Evaluated Corridors: {candidateRoutes.length} options</span>
        <span className="font-mono text-slate-500">
          Timestamp: {decision ? new Date(decision.timestamp * 1000).toLocaleTimeString() : '--'}
        </span>
      </div>
    </div>
  );
};
