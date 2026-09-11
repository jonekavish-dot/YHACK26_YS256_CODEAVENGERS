import React from 'react';
import { RiskBreakdown, RiskLevel } from '../types';
import { ShieldAlert, AlertTriangle, CheckCircle, Flame } from 'lucide-react';

interface RiskGaugeProps {
  risk: RiskBreakdown | null;
  currentAction?: string;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ risk, currentAction = 'CONTINUE' }) => {
  const score = risk?.composite_risk ?? 0;
  const level: RiskLevel = risk?.risk_level ?? 'GREEN';
  const isAnomaly = risk?.is_anomaly ?? false;

  const activeDrivers: string[] = [];
  if ((risk?.battery_risk ?? 0) > 40) activeDrivers.push('Battery reserve');
  if ((risk?.sensor_risk ?? 0) > 40) activeDrivers.push('Sensor degradation');
  if ((risk?.communication_risk ?? 0) > 40) activeDrivers.push('Comm latency');
  if ((risk?.obstacle_risk ?? 0) > 40) activeDrivers.push('Obstacle proximity');
  if ((risk?.environment_risk ?? 0) > 40) activeDrivers.push('Environment hazard');
  if (isAnomaly) activeDrivers.push('AI anomaly');
  if (activeDrivers.length === 0) activeDrivers.push('Nominal subsystems');

  // SVG Circular progress math
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const colorConfig = {
    GREEN: {
      text: 'text-emerald-400',
      stroke: '#10b981',
      bgGlow: 'shadow-emerald-500/20',
      label: 'NORMAL',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      icon: CheckCircle,
    },
    YELLOW: {
      text: 'text-amber-400',
      stroke: '#f59e0b',
      bgGlow: 'shadow-amber-500/20',
      label: 'CAUTION',
      badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      icon: AlertTriangle,
    },
    ORANGE: {
      text: 'text-orange-400',
      stroke: '#f97316',
      bgGlow: 'shadow-orange-500/20',
      label: 'HIGH RISK',
      badgeBg: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
      icon: ShieldAlert,
    },
    RED: {
      text: 'text-rose-500',
      stroke: '#ef4444',
      bgGlow: 'shadow-rose-500/20',
      label: 'CRITICAL',
      badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse',
      icon: Flame,
    },
  }[level];

  return (
    <div className={`relative bg-slate-900/80 rounded-2xl border border-slate-800 p-5 flex flex-col items-center justify-between shadow-xl ${colorConfig.bgGlow} transition-all duration-300 h-full`}>
      <div className="w-full flex items-center justify-between mb-2">
        <span className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">
          Mission Risk Score
        </span>
        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
          {isAnomaly && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              AI ANOMALY
            </span>
          )}
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${colorConfig.badgeBg}`}>
            LEVEL: {colorConfig.label}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-300 font-semibold">
            {currentAction.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Circular Gauge */}
      <div className="relative flex items-center justify-center my-2">
        <svg className="w-36 h-36 transform -rotate-90">
          {/* Background circle track */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke="#1e293b"
            strokeWidth="10"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke={colorConfig.stroke}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute flex flex-col items-center text-center">
          <div className="flex items-baseline space-x-0.5">
            <span className={`text-4xl font-extrabold font-mono tracking-tight ${colorConfig.text}`}>
              {score.toFixed(1)}
            </span>
            <span className="text-slate-500 text-sm font-mono">/100</span>
          </div>
          <span className="text-[10px] text-slate-400 tracking-wide font-medium mt-0.5">
            GOVERNOR INDEX
          </span>
        </div>
      </div>

      {/* Human-Readable Active Risk Drivers */}
      <div className="w-full my-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
        <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold mb-1 flex items-center justify-between">
          <span>Active Risk Drivers:</span>
          <span className="text-sky-400">{activeDrivers.length} identified</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {activeDrivers.map((driver, dIdx) => (
            <span
              key={dIdx}
              className="text-[9px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono"
            >
              • {driver}
            </span>
          ))}
        </div>
      </div>

      {/* Threshold Legend Bar */}
      <div className="w-full grid grid-cols-4 gap-1 text-[9px] font-mono text-center">
        <div className={`py-1 rounded bg-emerald-950/40 border ${level === 'GREEN' ? 'border-emerald-500/60 text-emerald-300 font-bold' : 'border-emerald-900/30 text-slate-500'}`}>
          0-30 NORMAL
        </div>
        <div className={`py-1 rounded bg-amber-950/40 border ${level === 'YELLOW' ? 'border-amber-500/60 text-amber-300 font-bold' : 'border-amber-900/30 text-slate-500'}`}>
          31-60 CAUTION
        </div>
        <div className={`py-1 rounded bg-orange-950/40 border ${level === 'ORANGE' ? 'border-orange-500/60 text-orange-300 font-bold' : 'border-orange-900/30 text-slate-500'}`}>
          61-80 HIGH
        </div>
        <div className={`py-1 rounded bg-rose-950/40 border ${level === 'RED' ? 'border-rose-500/60 text-rose-300 font-bold' : 'border-rose-900/30 text-slate-500'}`}>
          81-100 CRIT
        </div>
      </div>
    </div>
  );
};
