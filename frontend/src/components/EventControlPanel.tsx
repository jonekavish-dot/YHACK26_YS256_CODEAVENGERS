import React, { useState } from 'react';
import {
  AlertOctagon,
  BatteryWarning,
  EyeOff,
  WifiOff,
  Flame,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Ban,
} from 'lucide-react';
import {
  injectObstacle,
  injectBatteryDrain,
  injectSensorDegradation,
  injectCommDegradation,
  injectEnvironmentHazard,
  injectCombinedFault,
  injectBlockAllCorridors,
  recoverSystem,
} from '../services/api';

export const EventControlPanel: React.FC = () => {
  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);

  const triggerEvent = async (name: string, fn: () => Promise<any>) => {
    try {
      await fn();
      setActiveFeedback(name);
      setTimeout(() => setActiveFeedback(null), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const events = [
    {
      name: 'Dynamic Obstacle',
      desc: 'Spawn moving obstruction 3 cells ahead on path',
      icon: AlertOctagon,
      color: 'border-orange-500/40 hover:bg-orange-500/15 text-orange-400',
      action: () => injectObstacle(),
    },
    {
      name: 'Drain Battery',
      desc: 'Drop state of charge to 48% (consumption 1.8 W/m)',
      icon: BatteryWarning,
      color: 'border-amber-500/40 hover:bg-amber-500/15 text-amber-400',
      action: () => injectBatteryDrain(48.0),
    },
    {
      name: 'Degrade Sensor',
      desc: 'Occlude camera/lidar confidence to 48%',
      icon: EyeOff,
      color: 'border-yellow-500/40 hover:bg-yellow-500/15 text-yellow-400',
      action: () => injectSensorDegradation(48.0),
    },
    {
      name: 'Increase Comm Latency',
      desc: 'Spike network ping to 480ms (reliability 68%)',
      icon: WifiOff,
      color: 'border-purple-500/40 hover:bg-purple-500/15 text-purple-400',
      action: () => injectCommDegradation(480.0, 68.0),
    },
    {
      name: 'Increase Hazard',
      desc: 'Escalate local environmental danger to 85%',
      icon: Flame,
      color: 'border-rose-500/40 hover:bg-rose-500/15 text-rose-400',
      action: () => injectEnvironmentHazard(85.0),
    },
    {
      name: 'Combined Fault',
      desc: 'Trigger compound multi-subsystem cascading failure',
      icon: ShieldAlert,
      color: 'border-red-600/50 hover:bg-red-600/20 text-red-400 font-bold',
      action: () => injectCombinedFault(),
    },
    {
      name: 'Block All Corridors',
      desc: 'Completely obstruct all goal corridors and safe fallback paths',
      icon: Ban,
      color: 'border-rose-600/50 hover:bg-rose-600/20 text-rose-400 font-bold',
      action: () => injectBlockAllCorridors(),
    },
    {
      name: 'Recover System',
      desc: 'Clear dynamic hazards & recover all subsystems to nominal',
      icon: RotateCcw,
      color: 'border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold',
      action: () => recoverSystem(),
    },
  ];

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-400" />
            Live Fault & Event Injection System
          </h3>
          <p className="text-[11px] text-slate-400">
            Triggers deterministic physical failure states on the backend Robot Digital Twin
          </p>
        </div>
        {activeFeedback && (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono animate-fade-in">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{activeFeedback} Active!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2.5">
        {events.map((e) => {
          const Icon = e.icon;
          return (
            <button
              key={e.name}
              onClick={() => triggerEvent(e.name, e.action)}
              className={`flex flex-col items-start p-3 rounded-xl border bg-slate-950/60 transition-all text-left shadow-sm cursor-pointer hover:scale-[1.02] ${e.color}`}
            >
              <div className="flex items-center space-x-2 mb-1.5">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-xs font-semibold leading-tight">{e.name}</span>
              </div>
              <span className="text-[10px] text-slate-400 leading-tight">
                {e.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
