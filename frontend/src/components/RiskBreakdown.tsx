import React from 'react';
import { RiskBreakdown } from '../types';
import { Battery, Eye, Wifi, AlertOctagon, Mountain, Flame } from 'lucide-react';

interface RiskBreakdownProps {
  risk: RiskBreakdown | null;
}

export const RiskBreakdownPanel: React.FC<RiskBreakdownProps> = ({ risk }) => {
  const factors = [
    {
      label: 'Battery Health',
      weight: '20%',
      val: risk?.battery_risk ?? 0,
      icon: Battery,
      desc: 'Reserve margin vs safe return',
    },
    {
      label: 'Sensor Integrity',
      weight: '20%',
      val: risk?.sensor_risk ?? 0,
      icon: Eye,
      desc: 'Perception confidence & noise',
    },
    {
      label: 'Communication Link',
      weight: '15%',
      val: risk?.communication_risk ?? 0,
      icon: Wifi,
      desc: 'Latency & packet reliability',
    },
    {
      label: 'Obstacle Hazard',
      weight: '20%',
      val: risk?.obstacle_risk ?? 0,
      icon: AlertOctagon,
      desc: 'Proximity & corridor blockage',
    },
    {
      label: 'Environment Hazard',
      weight: '10%',
      val: risk?.environment_risk ?? 0,
      icon: Mountain,
      desc: 'Terrain roughness & hazards',
    },
    {
      label: 'Mission Criticality',
      weight: '15%',
      val: risk?.mission_criticality ?? 0,
      icon: Flame,
      desc: 'Delivery priority & penalty profile',
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

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Multi-Factor Risk Breakdown
          </h3>
          <p className="text-[11px] text-slate-400">
            Weighted composite: 0.2B + 0.2S + 0.15C + 0.2O + 0.1E + 0.15Crit
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {factors.map((f) => {
          const Icon = f.icon;
          const score = Math.round(f.val);
          return (
            <div
              key={f.label}
              className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-sky-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-200">{f.label}</div>
                    <div className="text-[10px] text-slate-500">Weight {f.weight}</div>
                  </div>
                </div>
                <div className={`text-base font-bold font-mono ${getTextColor(score)}`}>
                  {score}
                  <span className="text-[10px] text-slate-500 font-normal">/100</span>
                </div>
              </div>

              {/* Factor Progress Bar */}
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mb-1.5">
                <div
                  className={`h-full ${getBarColor(score)} transition-all duration-500 rounded-full`}
                  style={{ width: `${Math.min(100, Math.max(2, score))}%` }}
                />
              </div>

              <div className="text-[10px] text-slate-500 truncate">{f.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
