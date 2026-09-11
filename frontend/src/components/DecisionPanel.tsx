import React from 'react';
import { MissionDecision, Route, RiskBreakdown } from '../types';
import { ShieldCheck, Shuffle, AlertCircle, RefreshCw, CornerUpLeft, Ban, CheckCircle2, FileText, Cpu } from 'lucide-react';

interface DecisionPanelProps {
  decision: MissionDecision | null;
  activeRoute: Route | undefined;
  candidateRoutes: Route[];
  risk?: RiskBreakdown | null;
  missionName?: string;
}

export const DecisionPanel: React.FC<DecisionPanelProps> = ({
  decision,
  activeRoute,
  candidateRoutes,
  risk,
  missionName,
}) => {
  const action = decision?.action ?? 'CONTINUE';
  const mode = decision?.mode ?? 'NORMAL';
  const explanation = decision?.explanation;

  const getProvenanceRule = () => {
    switch (action) {
      case 'RETURN_TO_SAFE_ZONE':
        return {
          code: 'RULE_BATTERY_RESERVE_FLOOR',
          text: 'Battery <= 25% (or battery risk >= 85%), or all goal corridors blocked: Safe zone diversion engaged.'
        };
      case 'EMERGENCY_STOP':
        return {
          code: 'RULE_CORRIDOR_ZERO_TRAVERSAL',
          text: 'All traversal corridors and safe zones completely obstructed (or battery exhausted without safe return): Holding brake engaged.'
        };
      case 'DEGRADED_AUTONOMY':
        return {
          code: 'RULE_COMM_FAILSAFE_HYSTERESIS',
          text: 'Comm latency > 250ms or reliability < 80% (exit hysteresis < 180ms / > 88%): Onboard fail-safe governor active with speed reduced by 40%.'
        };
      case 'REPLAN':
        return {
          code: 'RULE_MULTI_CRITERIA_DETOUR',
          text: 'Active route obstructed or composite risk > effective budget (with 5.0 pt hysteresis): Autonomous detour to lowest-cost candidate corridor.'
        };
      case 'SLOW_DOWN':
        return {
          code: 'RULE_PERCEPTION_MARGIN_BUFFER',
          text: 'Sensor health < 55.0% or obstacle distance <= 1.5m, OR composite risk > budget with no safer detour: Speed throttled to 0.5 m/s to expand stopping envelope.'
        };
      case 'CONTINUE':
      default:
        return {
          code: 'RULE_NOMINAL_OPTIMAL_EXECUTION',
          text: 'Composite risk <= budget and telemetry nominal: Cruising speed and planned trajectory maintained.'
        };
    }
  };

  const provenance = getProvenanceRule();

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

  const getDecisionFourPillars = () => {
    switch (action) {
      case 'REPLAN':
        return {
          why: explanation?.rationale || 'Dynamic obstacle or elevated corridor hazard detected on active route.',
          tradeoff: explanation?.tradeoff_summary || '+Route detour length • Lower physical risk exposure',
          result: 'Collision avoided in the tested scenario; bypass corridor engaged.',
        };
      case 'RETURN_TO_SAFE_ZONE':
        return {
          why: explanation?.rationale || 'Remaining battery insufficient for safe mission completion without stranding.',
          tradeoff: explanation?.tradeoff_summary || 'Mission objective aborted • Vehicle & hardware preserved',
          result: 'Safe-zone return initiated to designated charging depot.',
        };
      case 'DEGRADED_AUTONOMY':
        return {
          why: explanation?.rationale || 'Communication latency or packet loss exceeded teleoperation threshold.',
          tradeoff: explanation?.tradeoff_summary || 'Operating speed reduced by 40% • Independent onboard safety policy',
          result: 'Mission continues under local onboard fail-safe autonomy.',
        };
      case 'SLOW_DOWN':
        return {
          why: explanation?.rationale || 'Sensor perception degradation or proximity requires wider stopping margin.',
          tradeoff: explanation?.tradeoff_summary || 'Travel time +25% • 40% wider stopping & reaction window',
          result: 'Speed throttled to 0.5 m/s to expand perception safety envelope.',
        };
      case 'EMERGENCY_STOP':
        return {
          why: explanation?.rationale || 'All traversal corridors and safe zones completely obstructed.',
          tradeoff: explanation?.tradeoff_summary || 'Vehicle halted in place • Avoids collision in tested obstructed scenario',
          result: 'Holding brake engaged. Awaiting clearance.',
        };
      case 'CONTINUE':
      default:
        return {
          why: explanation?.rationale || 'Composite risk within budget. Telemetry parameters nominal.',
          tradeoff: explanation?.tradeoff_summary || 'Cruising speed maintained • Maximum energy & time efficiency',
          result: 'Nominal navigation proceeding to mission destination.',
        };
    }
  };

  const fourPillars = getDecisionFourPillars();
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Safety Governor Decision &amp; Explainability
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-slate-500 font-mono">OPERATING MODE:</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${modeBadge}`}>
              {mode.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Mission Contract HUD Strip */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 mb-3 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <FileText className="h-3 w-3 text-sky-400" />
            <span className="text-slate-500">CONTRACT:</span>
            <span className="text-slate-200 font-bold">{missionName || '—'}</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-300">
            <span>BUDGET: <strong className="text-sky-300">{risk?.risk_budget !== undefined ? risk.risk_budget : '—'}</strong></span>
            <span>CRITICALITY: <strong className="text-amber-300">{risk?.mission_criticality !== undefined ? risk.mission_criticality : '—'}</strong></span>
            <span>HYSTERESIS: <strong className="text-purple-300">{risk ? '5.0 pts' : '—'}</strong></span>
          </div>
        </div>

        {/* 4-Pillar Decision Explainability Grid (ACTION | WHY | TRADE-OFF | RESULT) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
          {/* 1. ACTION */}
          <div className={`p-3 rounded-xl border flex flex-col justify-between ${actionConfig.bg}`}>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold flex items-center justify-between">
              <span>1. ACTION</span>
              <ActionIcon className="h-4 w-4" />
            </div>
            <div className={`text-base font-extrabold font-mono tracking-tight my-1 ${actionConfig.color}`}>
              {actionConfig.title}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Status: <strong className="text-slate-200">{decision?.reason || 'Nominal'}</strong>
            </div>
          </div>

          {/* 2. WHY */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <div className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-semibold">
              2. WHY DID MIRA DO THAT?
            </div>
            <div className="text-xs text-slate-200 my-1 font-sans leading-snug">
              {fourPillars.why}
            </div>
            <div className="text-[9px] text-slate-500 font-mono leading-tight break-all">
              Trigger: {provenance.code}
            </div>
          </div>

          {/* 3. TRADE-OFF */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <div className="text-[10px] uppercase font-mono tracking-wider text-sky-400 font-semibold">
              3. OPERATIONAL TRADE-OFF
            </div>
            <div className="text-xs text-sky-200 font-mono my-1 leading-snug">
              {fourPillars.tradeoff}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Route: {activeRoute?.name || 'Active'}
            </div>
          </div>

          {/* 4. RESULT */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <div className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-semibold">
              4. MISSION RESULT
            </div>
            <div className="text-xs text-emerald-300 font-sans font-medium my-1 leading-snug">
              {fourPillars.result}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Autonomous Safety Layer Active
            </div>
          </div>
        </div>

        {/* Decision Provenance Banner */}
        <div className="bg-sky-950/25 border border-sky-800/40 rounded-xl px-3 py-2 mb-3 flex items-start space-x-2 text-xs font-mono">
          <Cpu className="h-3.5 w-3.5 text-sky-400 mt-0.5 shrink-0" />
          <div>
            <div className="text-[10px] text-sky-400 font-bold tracking-wider">
              PROVENANCE TRIGGER: <span className="text-white">{provenance.code}</span>
            </div>
            <div className="text-[11px] text-slate-300 font-sans">
              {provenance.text}
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

          {/* Active Route Objective Cost & Risk Horizon Breakdown */}
          {activeRoute && (
            <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400">
                <span>Route Objective Breakdown:</span>
                <span className="text-sky-400 font-bold">Total Cost J(R): {activeRoute.total_score}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
                <div className="bg-slate-900 p-1.5 rounded border border-slate-800 text-center">
                  <div className="text-[9px] text-slate-500 uppercase">Length</div>
                  <div className="text-slate-300 font-semibold">{activeRoute.length}m</div>
                </div>
                <div className="bg-slate-900 p-1.5 rounded border border-slate-800 text-center">
                  <div className="text-[9px] text-slate-500 uppercase">Hazard Cost</div>
                  <div className="text-amber-400 font-semibold">{activeRoute.hazard_cost ?? activeRoute.risk_cost}</div>
                </div>
                <div className="bg-slate-900 p-1.5 rounded border border-slate-800 text-center">
                  <div className="text-[9px] text-slate-500 uppercase">Clearance Cost</div>
                  <div className="text-emerald-400 font-semibold">{activeRoute.clearance_cost ?? 0}</div>
                </div>
              </div>

              {/* Forward Risk Horizon */}
              {activeRoute.risk_horizon && activeRoute.risk_horizon.length > 0 && (
                <div className="pt-1.5 border-t border-slate-800/80">
                  <div className="text-[10px] font-mono text-slate-400 mb-1 flex items-center justify-between">
                    <span>Forward Risk Horizon:</span>
                    <span className="text-purple-400 text-[10px]">Projected: {activeRoute.projected_risk ?? 0}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center">
                    {['Current', '+5 Cells', '+10 Cells', 'Goal'].map((stage, sIdx) => {
                      const val = activeRoute.risk_horizon?.[sIdx] ?? 0;
                      const valColor =
                        val > 60 ? 'text-rose-400 bg-rose-500/10' : val > 30 ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10';
                      return (
                        <div key={stage} className={`p-1 rounded border border-slate-800 ${valColor}`}>
                          <div className="text-[8px] text-slate-500 uppercase">{stage}</div>
                          <div className="font-bold">{val}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
