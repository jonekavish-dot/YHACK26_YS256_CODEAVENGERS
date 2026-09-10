import React, { useState, useEffect } from 'react';
import { queryWhatIf } from '../services/api';
import { WhatIfResponse } from '../types';
import { Sliders, Sparkles, AlertTriangle, ShieldCheck, CornerUpLeft, Ban, Play } from 'lucide-react';

export const WhatIfSimulator: React.FC = () => {
  const [battery, setBattery] = useState<number>(85);
  const [sensorHealth, setSensorHealth] = useState<number>(96);
  const [commLatency, setCommLatency] = useState<number>(45);
  const [obstacleDensity, setObstacleDensity] = useState<number>(0.12);
  const [environmentRisk, setEnvironmentRisk] = useState<number>(15);
  const [missionProfile, setMissionProfile] = useState<string>('EMERGENCY_DELIVERY');

  const [result, setResult] = useState<WhatIfResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const evaluateParams = async () => {
    try {
      setLoading(true);
      const res = await queryWhatIf({
        battery,
        sensor_health: sensorHealth,
        communication_latency: commLatency,
        obstacle_density: obstacleDensity,
        environment_risk: environmentRisk,
        mission_profile: missionProfile,
      });
      setResult(res);
    } catch (e) {
      console.error('Failed to query what-if evaluation', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    evaluateParams();
  }, [battery, sensorHealth, commLatency, obstacleDensity, environmentRisk, missionProfile]);

  const getBadgeStyle = (level: string) => {
    switch (level) {
      case 'GREEN':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'YELLOW':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'ORANGE':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'RED':
      default:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse';
    }
  };

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            <Sliders className="h-5 w-5 text-sky-400" />
            Interactive What-If Mission Scenario Sandbox
          </h2>
          <p className="text-xs text-slate-400">
            Adjust hypothetical telemetry conditions to test how MIRA's Safety Governor adapts in real time.
          </p>
        </div>

        {/* Profile Selector */}
        <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-mono">Profile:</span>
          <select
            value={missionProfile}
            onChange={(e) => setMissionProfile(e.target.value)}
            className="bg-transparent text-xs text-sky-400 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="EMERGENCY_DELIVERY" className="bg-slate-900 text-white">
              Emergency Delivery (Risk Budget: 35)
            </option>
            <option value="ROUTINE_INSPECTION" className="bg-slate-900 text-white">
              Routine Inspection (Risk Budget: 60)
            </option>
            <option value="SURVEILLANCE" className="bg-slate-900 text-white">
              Perimeter Surveillance (Risk Budget: 45)
            </option>
            <option value="CRITICAL_RESCUE" className="bg-slate-900 text-white">
              Critical Rescue (Risk Budget: 25)
            </option>
          </select>
        </div>
      </div>

      {/* Main Grid: Sliders on Left, Instant Governor Output on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Area */}
        <div className="lg:col-span-7 space-y-4">
          {/* Slider 1: Battery */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex justify-between text-xs font-mono mb-2">
              <span className="text-slate-300 font-semibold">Battery State of Charge (SOC)</span>
              <span className={`font-bold ${battery < 30 ? 'text-rose-400' : 'text-sky-400'}`}>
                {battery}%
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              value={battery}
              onChange={(e) => setBattery(Number(e.target.value))}
              className="w-full accent-sky-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>5% (Depleted)</span>
              <span>25% (Safe Return Floor)</span>
              <span>100% (Full)</span>
            </div>
          </div>

          {/* Slider 2: Sensor Health */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex justify-between text-xs font-mono mb-2">
              <span className="text-slate-300 font-semibold">Sensor Perception Health</span>
              <span className={`font-bold ${sensorHealth < 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {sensorHealth}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={sensorHealth}
              onChange={(e) => setSensorHealth(Number(e.target.value))}
              className="w-full accent-emerald-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>10% (Occluded / Faulty)</span>
              <span>75% (Nominal Threshold)</span>
              <span>100% (Clean)</span>
            </div>
          </div>

          {/* Slider 3: Communication Latency */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex justify-between text-xs font-mono mb-2">
              <span className="text-slate-300 font-semibold">Communication Latency</span>
              <span className={`font-bold ${commLatency > 300 ? 'text-purple-400' : 'text-sky-400'}`}>
                {commLatency} ms
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="900"
              step="10"
              value={commLatency}
              onChange={(e) => setCommLatency(Number(e.target.value))}
              className="w-full accent-purple-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>20 ms (5G / Low Latency)</span>
              <span>250 ms (Degraded Autonomy Threshold)</span>
              <span>900 ms (Near Blackout)</span>
            </div>
          </div>

          {/* Slider 4: Obstacle Density */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex justify-between text-xs font-mono mb-2">
              <span className="text-slate-300 font-semibold">Spatial Obstacle Density / Proximity</span>
              <span className={`font-bold ${obstacleDensity > 0.5 ? 'text-orange-400' : 'text-slate-300'}`}>
                {(obstacleDensity * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={obstacleDensity}
              onChange={(e) => setObstacleDensity(Number(e.target.value))}
              className="w-full accent-orange-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>0% (Open Plain)</span>
              <span>50% (Cluttered Facility)</span>
              <span>100% (Dense Rubble)</span>
            </div>
          </div>

          {/* Slider 5: Environmental Risk */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex justify-between text-xs font-mono mb-2">
              <span className="text-slate-300 font-semibold">Environmental Hazard Level</span>
              <span className={`font-bold ${environmentRisk > 50 ? 'text-rose-400' : 'text-slate-300'}`}>
                {environmentRisk}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={environmentRisk}
              onChange={(e) => setEnvironmentRisk(Number(e.target.value))}
              className="w-full accent-rose-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>0% (Safe Room)</span>
              <span>50% (Hazardous Zone)</span>
              <span>100% (Extreme Toxicity / Fire)</span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center space-x-2 pt-1 flex-wrap gap-y-2">
            <span className="text-xs text-slate-400 font-mono">Quick Presets:</span>
            <button
              onClick={() => {
                setBattery(88);
                setSensorHealth(95);
                setCommLatency(40);
                setObstacleDensity(0.1);
                setEnvironmentRisk(15);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition"
            >
              Nominal
            </button>
            <button
              onClick={() => {
                setBattery(20);
                setSensorHealth(80);
                setCommLatency(120);
                setObstacleDensity(0.3);
                setEnvironmentRisk(20);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-mono transition"
            >
              Low Battery (Safe Return)
            </button>
            <button
              onClick={() => {
                setBattery(75);
                setSensorHealth(85);
                setCommLatency(550);
                setObstacleDensity(0.25);
                setEnvironmentRisk(25);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-mono transition"
            >
              Comms Blackout (Degraded Mode)
            </button>
            <button
              onClick={() => {
                setBattery(22);
                setSensorHealth(45);
                setCommLatency(480);
                setObstacleDensity(0.85);
                setEnvironmentRisk(75);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-mono transition"
            >
              Catastrophic Combined
            </button>
          </div>
        </div>

        {/* Instant Evaluation Output Panel */}
        <div className="lg:col-span-5 bg-slate-950/80 rounded-xl border border-slate-800 p-5 flex flex-col justify-between shadow-inner">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase text-slate-400 font-semibold tracking-wider">
                Predicted Governor State
              </span>
              {result && (
                <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-bold ${getBadgeStyle(result.risk_level)}`}>
                  {result.risk_level}
                </span>
              )}
            </div>

            {/* Big Risk Display */}
            <div className="flex items-center space-x-4 mb-5">
              <div className="text-4xl font-extrabold font-mono text-white">
                {result?.composite_risk ?? '--'}
                <span className="text-slate-500 text-base font-normal"> / 100</span>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div>
                <div className="text-[10px] text-slate-400 font-mono uppercase">Operating Mode</div>
                <div className="text-sm font-bold font-mono text-sky-400">
                  {result?.operating_mode?.replace('_', ' ') ?? '--'}
                </div>
              </div>
            </div>

            {/* Recommended Action */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 mb-4">
              <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">
                Commanded Action
              </div>
              <div className="text-base font-extrabold font-mono text-amber-400">
                {result?.recommended_action?.replace('_', ' ') ?? '--'}
              </div>
              <p className="text-xs text-slate-300 mt-1.5 font-sans leading-relaxed">
                {result?.explanation}
              </p>
            </div>

            {/* Tradeoff Advice */}
            {result?.tradeoff_advice && (
              <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-900/40 text-xs">
                <span className="text-[10px] font-mono uppercase text-sky-400 block mb-0.5">
                  Strategic Tradeoff:
                </span>
                <p className="text-sky-200 font-mono">
                  {result.tradeoff_advice}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-mono flex items-center justify-between">
            <span>Deterministic Model</span>
            <span>Real-time Hybrid Computation</span>
          </div>
        </div>
      </div>
    </div>
  );
};

