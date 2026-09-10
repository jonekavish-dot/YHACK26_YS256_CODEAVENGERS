import React from 'react';
import { Telemetry } from '../types';
import { BatteryCharging, Cpu, Radio, Gauge, Crosshair, Zap, Compass } from 'lucide-react';

interface TelemetryPanelProps {
  telemetry: Telemetry | null;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ telemetry }) => {
  const battery = telemetry?.battery ?? 85;
  const sensor = telemetry?.sensor_health ?? 96;
  const latency = telemetry?.communication_latency ?? 45;
  const reliability = telemetry?.communication_reliability ?? 98;
  const speed = telemetry?.speed ?? 1.0;
  const obsDist = telemetry?.obstacle_distance ?? 8.5;
  const energyRate = telemetry?.energy_consumption_rate ?? 1.2;
  const progress = telemetry?.mission_progress ?? 0;

  const items = [
    {
      label: 'Battery SOC',
      value: `${battery.toFixed(1)}%`,
      sub: battery < 30 ? 'CRITICAL RESERVE' : 'HEALTHY',
      icon: BatteryCharging,
      statusColor: battery > 50 ? 'text-emerald-400' : battery > 25 ? 'text-amber-400' : 'text-rose-500',
    },
    {
      label: 'Sensor Health',
      value: `${sensor.toFixed(0)}%`,
      sub: sensor < 70 ? 'ATTENUATED' : 'NOMINAL',
      icon: Cpu,
      statusColor: sensor > 80 ? 'text-emerald-400' : sensor > 50 ? 'text-amber-400' : 'text-rose-500',
    },
    {
      label: 'Comm Latency',
      value: `${latency.toFixed(0)} ms`,
      sub: `${reliability.toFixed(0)}% packet reliability`,
      icon: Radio,
      statusColor: latency < 150 ? 'text-emerald-400' : latency < 350 ? 'text-amber-400' : 'text-rose-500',
    },
    {
      label: 'Obstacle Clearance',
      value: `${obsDist.toFixed(1)} m`,
      sub: obsDist < 2.0 ? 'IMMEDIATE HAZARD' : 'CLEAR CORRIDOR',
      icon: Crosshair,
      statusColor: obsDist > 4.0 ? 'text-emerald-400' : obsDist > 1.8 ? 'text-amber-400' : 'text-rose-500',
    },
    {
      label: 'Locomotion Speed',
      value: `${speed.toFixed(1)} m/s`,
      sub: speed < 1.0 ? 'DEFENSIVE VELOCITY' : 'CRUISING SPEED',
      icon: Gauge,
      statusColor: 'text-sky-400',
    },
    {
      label: 'Energy Burn Rate',
      value: `${energyRate.toFixed(1)} W/m`,
      sub: `${progress.toFixed(0)}% mission complete`,
      icon: Zap,
      statusColor: energyRate > 1.8 ? 'text-amber-400' : 'text-slate-300',
    },
  ];

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
          <Compass className="h-4 w-4 text-sky-400" />
          Live Robot Telemetry
        </h3>
        <div className="text-xs font-mono text-slate-400">
          UAV/UGV: <span className="text-sky-400 font-bold">{telemetry?.robot_id ?? 'R01'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between"
            >
              <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
                <Icon className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-[11px] font-medium">{item.label}</span>
              </div>
              <div className={`text-xl font-bold font-mono tracking-tight ${item.statusColor}`}>
                {item.value}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                {item.sub}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
