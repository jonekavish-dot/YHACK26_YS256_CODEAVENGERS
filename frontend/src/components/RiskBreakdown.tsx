import React from 'react';
import { RiskBreakdown, Telemetry } from '../types';
import { Battery, Eye, Wifi, AlertOctagon, Mountain, Flame, Cpu, TrendingUp } from 'lucide-react';

interface RiskBreakdownProps {
  risk: RiskBreakdown | null;
  telemetry?: Telemetry | null;
}

export const RiskBreakdownPanel: React.FC<RiskBreakdownProps> = ({ risk, telemetry }) => {
  const battVal = telemetry?.battery ?? 85;
  const sensVal = telemetry?.sensor_health ?? 96;
  const commVal = telemetry?.communication_latency ?? 45;
  const obsDist = telemetry?.obstacle_distance ?? 10.0;
  const envVal = telemetry?.environment_risk ?? 15;

  const factors = [
    {
      label: 'Battery Health',
      weight: '25%',
      val: risk?.battery_risk ?? 0,
      currentVal: `${battVal.toFixed(1)}%`,
      contrib: `${(0.25 * (risk?.battery_risk ?? 0)).toFixed(1)} pts`,
      trend: battVal <= 25 ? '↓ Critical reserve' : battVal <= 50 ? '↓ Discharging' : '→ Nominal charge',
      icon: Battery,
      desc: 'Reserve margin vs safe return',
    },
    {
      label: 'Sensor Integrity',
      weight: '25%',
      val: risk?.sensor_risk ?? 0,
      currentVal: `${sensVal.toFixed(1)}%`,
      contrib: `${(0.25 * (risk?.sensor_risk ?? 0)).toFixed(1)} pts`,
      trend: sensVal < 55 ? '↑ Perception degraded' : sensVal < 80 ? '↑ Elevated noise' : '→ Perception clear',
      icon: Eye,
      desc: 'Perception confidence & noise',
    },
    {
      label: 'Communication Link',
      weight: '15%',
      val: risk?.communication_risk ?? 0,
      currentVal: `${commVal.toFixed(0)} ms`,
      contrib: `${(0.15 * (risk?.communication_risk ?? 0)).toFixed(1)} pts`,
      trend: commVal > 250 ? '↑ Link degraded' : commVal > 100 ? '↑ Latency jitter' : '→ Stable link',
      icon: Wifi,
      desc: 'Latency & packet reliability',
    },
    {
      label: 'Obstacle Hazard',
      weight: '25%',
      val: risk?.obstacle_risk ?? 0,
      currentVal: `${obsDist.toFixed(1)} m`,
      contrib: `${(0.25 * (risk?.obstacle_risk ?? 0)).toFixed(1)} pts`,
      trend: obsDist <= 1.5 ? '↑ Immediate hazard' : obsDist <= 3.5 ? '↑ Corridor hazard' : '→ Path clear',
      icon: AlertOctagon,
      desc: 'Proximity & corridor blockage',
    },
    {
      label: 'Environment Hazard',
      weight: '10%',
      val: risk?.environment_risk ?? 0,
      currentVal: `${envVal.toFixed(0)}%`,
      contrib: `${(0.10 * (risk?.environment_risk ?? 0)).toFixed(1)} pts`,
      trend: envVal > 50 ? '↑ Rough terrain' : '→ Nominal corridor',
      icon: Mountain,
      desc: 'Terrain roughness & hazards',
    },
  ];

  const getBarColor = (score: number) => {
    if (score <= 30) return 'bg-emerald-500';
    if (score <= 60) return 'bg-amber-500';
    if (score <= 80) return 'bg-orange-500';
    return 'bg-rose-500';
  };

  const getTextColor = (score: number) => {
    if (score <= 30) return 'text-emerald-400';
    if (score <= 60) return 'text-amber-400';
    if (score <= 80) return 'text-orange-400';
    return 'text-rose-400';
  };

  const trendColor =
    risk?.risk_trend === 'RAPIDLY_RISING'
      ? 'text-rose-400 border-rose-500/40 bg-rose-500/10'
      : risk?.risk_trend === 'RISING'
      ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
      : risk?.risk_trend === 'FALLING'
      ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
      : 'text-slate-400 border-slate-700 bg-slate-900';

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Multi-Factor Risk Breakdown
          </h3>
          <p className="text-[11px] text-slate-400">
            Physical Hazards: 0.25B + 0.25S + 0.15C + 0.25O + 0.10E
          </p>
        </div>

        {/* Real-time Status Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {risk?.physical_risk !== undefined && (
            <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 whitespace-nowrap">
              <span className="text-slate-500">R_phys:</span>{' '}
              <span className="font-bold text-sky-400">{risk.physical_risk}</span>
            </div>
          )}

          {risk?.context_multiplier !== undefined && (
            <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 whitespace-nowrap">
              <span className="text-slate-500">Ctx:</span>{' '}
              <span className="font-bold text-purple-400">{risk.context_multiplier}x</span>
            </div>
          )}

          {risk?.risk_budget !== undefined && (
            <div
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-medium whitespace-nowrap ${
                risk.budget_exceeded
                  ? 'border-rose-500/50 bg-rose-500/15 text-rose-300'
                  : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              }`}
            >
              Budget: {risk.risk_budget}{' '}
              <span className="text-[10px]">({risk.budget_exceeded ? 'EXCEEDED' : 'OK'})</span>
            </div>
          )}

          {risk?.risk_trend && (
            <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border text-[11px] font-mono font-medium whitespace-nowrap ${trendColor}`}>
              <TrendingUp className="h-3 w-3" />
              <span>{risk.risk_trend}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {factors.map((f) => {
          const Icon = f.icon;
          const score = Math.round(f.val);
          return (
            <div
              key={f.label}
              className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-sm min-w-0"
            >
              {/* Top Row: Icon + Weight Badge */}
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-sky-400">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono font-medium">
                  {f.weight} wt
                </span>
              </div>

              {/* Name & Subtitle Row: Full Risk Factor Name without truncation */}
              <div className="mb-2">
                <div className="text-xs font-bold text-slate-100 leading-tight">
                  {f.label}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  {f.desc}
                </div>
              </div>

              {/* Measured Telemetry & Risk Contribution */}
              <div className="bg-slate-900/90 rounded-lg p-2.5 my-2 border border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-mono gap-1">
                  <span className="text-slate-400">Telemetry:</span>
                  <span className="text-white font-bold whitespace-nowrap shrink-0">{f.currentVal}</span>
                </div>
                <div className="text-[10px] font-mono text-amber-300 mt-1 leading-snug">
                  {f.trend}
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-1 whitespace-nowrap">
                  Contribution: {f.contrib}
                </div>
              </div>

              {/* Score & Qualitative Status Tag */}
              <div className="flex items-baseline justify-between mb-1.5 mt-auto">
                <div className={`text-2xl font-black font-mono tracking-tight ${getTextColor(score)}`}>
                  {score}
                  <span className="text-xs text-slate-500 font-normal ml-0.5">/100</span>
                </div>
                <span className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${getTextColor(score)}`}>
                  {score <= 30 ? 'NORMAL' : score <= 60 ? 'CAUTION' : score <= 80 ? 'HIGH' : 'CRITICAL'}
                </span>
              </div>

              {/* Factor Progress Bar */}
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getBarColor(score)} transition-all duration-500 rounded-full`}
                  style={{ width: `${Math.min(100, Math.max(2, score))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Isolation Forest Advisory Footer */}
      <div className="mt-3 pt-3 border-t border-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2 text-slate-400">
          <Cpu className="h-3.5 w-3.5 text-purple-400" />
          <span>AI Telemetry Anomaly Detector (Isolation Forest):</span>
          <span className="font-mono text-slate-200 font-semibold">
            Score: {risk?.anomaly_score?.toFixed(2) ?? '0.00'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {risk?.is_anomaly ? (
            <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-[11px] font-bold">
              ANOMALY ADVISORY ACTIVE (+{Math.min(15, Math.round((risk.anomaly_score || 0) * 10))} pts)
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[11px]">
              NOMINAL PATTERN
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

