import React, { useState, useEffect } from 'react';
import { queryWhatIf, compareMissionProfiles } from '../services/api';
import { WhatIfResponse } from '../types';
import { Sliders, Sparkles, AlertTriangle, ShieldCheck, CornerUpLeft, Ban, Play, Layers } from 'lucide-react';

export const WhatIfSimulator: React.FC = () => {
  const [battery, setBattery] = useState<number>(85);
  const [sensorHealth, setSensorHealth] = useState<number>(96);
  const [commLatency, setCommLatency] = useState<number>(45);
  const [obstacleDensity, setObstacleDensity] = useState<number>(0.12);
  const [environmentRisk, setEnvironmentRisk] = useState<number>(15);
  const [missionProfile, setMissionProfile] = useState<string>('EMERGENCY_DELIVERY');

  const [result, setResult] = useState<WhatIfResponse | null>(null);
  const [profileMatrix, setProfileMatrix] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const evaluateParams = async () => {
    try {
      setLoading(true);
      const payload = {
        battery,
        sensor_health: sensorHealth,
        communication_latency: commLatency,
        obstacle_density: obstacleDensity,
        environment_risk: environmentRisk,
        mission_profile: missionProfile,
      };
      const [res, matrixRes] = await Promise.all([
        queryWhatIf(payload),
        compareMissionProfiles(payload),
      ]);
      setResult(res);
      if (matrixRes && matrixRes.profiles) {
        setProfileMatrix(matrixRes.profiles);
      }
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
          <p className="text-xs text-sky-300 font-mono mt-0.5">
            "If this condition changes, what decision would MIRA make?"
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Simulate dynamic subsystem degradation and observe immediate deterministic Safety Governor response and strategic trade-offs.
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
          <div className="pt-2">
            <span className="text-xs text-slate-400 font-mono block mb-2 font-semibold">Operational Story Presets:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setBattery(88);
                  setSensorHealth(95);
                  setCommLatency(40);
                  setObstacleDensity(0.1);
                  setEnvironmentRisk(15);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition cursor-pointer border border-slate-700"
              >
                Nominal (Full Speed)
              </button>
              <button
                onClick={() => {
                  setBattery(85);
                  setSensorHealth(40);
                  setCommLatency(45);
                  setObstacleDensity(0.2);
                  setEnvironmentRisk(15);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-mono transition cursor-pointer border border-amber-500/30"
              >
                Degraded Camera → SLOW_DOWN
              </button>
              <button
                onClick={() => {
                  setBattery(20);
                  setSensorHealth(80);
                  setCommLatency(120);
                  setObstacleDensity(0.3);
                  setEnvironmentRisk(20);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-mono transition cursor-pointer border border-purple-500/30"
              >
                Battery Low → RETURN_TO_BASE
              </button>
              <button
                onClick={() => {
                  setBattery(75);
                  setSensorHealth(85);
                  setCommLatency(550);
                  setObstacleDensity(0.25);
                  setEnvironmentRisk(25);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-mono transition cursor-pointer border border-sky-500/30"
              >
                Comms Drop → CAUTION / AUTONOMY
              </button>
              <button
                onClick={() => {
                  setBattery(70);
                  setSensorHealth(80);
                  setCommLatency(50);
                  setObstacleDensity(0.7);
                  setEnvironmentRisk(70);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 text-xs font-mono transition cursor-pointer border border-orange-500/30"
              >
                Severe Hazard → REROUTE
              </button>
              <button
                onClick={() => {
                  setBattery(18);
                  setSensorHealth(35);
                  setCommLatency(650);
                  setObstacleDensity(0.85);
                  setEnvironmentRisk(85);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-mono transition cursor-pointer border border-rose-500/30"
              >
                Catastrophic → EMERGENCY_STOP
              </button>
            </div>
          </div>
        </div>

        {/* Instant Evaluation Output Panel with 4-Step Explanation */}
        <div className="lg:col-span-5 bg-slate-950/90 rounded-xl border border-slate-800 p-5 flex flex-col justify-between shadow-inner">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono uppercase text-sky-400 font-bold tracking-wider">
                  MIRA Decision Explanation
                </span>
                <p className="text-[10px] text-slate-400 font-mono">Condition → Decision → Reason → Tradeoff</p>
              </div>
              {result && (
                <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-bold ${getBadgeStyle(result.risk_level)}`}>
                  {result.risk_level}
                </span>
              )}
            </div>

            {/* Step 1: Condition Detected */}
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono">
              <div className="text-[10px] uppercase text-slate-400 font-bold mb-1 flex items-center justify-between">
                <span>1. Condition Detected</span>
                <span className="text-white font-bold">{result?.composite_risk ?? '--'}/100 Risk</span>
              </div>
              <div className="text-[11px] text-slate-300 space-y-0.5">
                {battery < 25 && <div className="text-rose-400 font-semibold">• Battery SOC depleted to {battery}% (&lt;25% floor)</div>}
                {battery >= 25 && battery < 40 && <div className="text-amber-300">• Battery reserve cautionary at {battery}%</div>}
                {sensorHealth < 60 && <div className="text-amber-300">• Sensor perception degraded to {sensorHealth}% (&lt;60%)</div>}
                {commLatency > 250 && <div className="text-purple-300">• Comm latency elevated to {commLatency}ms (&gt;250ms)</div>}
                {obstacleDensity > 0.4 && <div className="text-orange-300">• Obstacle clutter dense at {(obstacleDensity * 100).toFixed(0)}%</div>}
                {environmentRisk > 40 && <div className="text-rose-300">• Environmental hazard zone at {environmentRisk}%</div>}
                {battery >= 40 && sensorHealth >= 60 && commLatency <= 250 && obstacleDensity <= 0.4 && environmentRisk <= 40 && (
                  <div className="text-emerald-400">• All subsystem telemetry operating within nominal bounds</div>
                )}
              </div>
            </div>

            {/* Step 2: Predicted Decision */}
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono">
              <div className="text-[10px] uppercase text-slate-400 font-bold mb-1">
                2. Predicted Governor Decision
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-amber-400 tracking-wide">
                  {result?.recommended_action?.replace('_', ' ') ?? '--'}
                </span>
                <span className="text-[10px] text-sky-400 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30">
                  Mode: {result?.operating_mode?.replace('_', ' ') ?? '--'}
                </span>
              </div>
            </div>

            {/* Step 3: Causal Reason */}
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
              <div className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                3. Causal Reason ("Why did MIRA do that?")
              </div>
              <p className="text-[11px] text-slate-200 leading-relaxed font-sans">
                {result?.explanation ?? 'Analyzing operating telemetry...'}
              </p>
            </div>

            {/* Step 4: Strategic Trade-Off */}
            {result?.tradeoff_advice && (
              <div className="p-3 rounded-lg bg-sky-950/30 border border-sky-800/40 text-xs">
                <div className="text-[10px] font-mono uppercase text-sky-400 font-bold mb-1">
                  4. Strategic Trade-Off
                </div>
                <p className="text-[11px] text-sky-200 font-sans leading-relaxed">
                  {result.tradeoff_advice}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-mono flex items-center justify-between">
            <span>Deterministic FSM Response</span>
            <span>Deterministic Arithmetic Engine</span>
          </div>
        </div>
      </div>

      {/* Cross-Profile Sensitivity Comparison Table */}
      {profileMatrix && (
        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center space-x-2 mb-3">
            <Layers className="h-4 w-4 text-purple-400" />
            <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              Cross-Profile Sensitivity Matrix (Identical Telemetry Injected Across Profiles)
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(profileMatrix).map(([key, prof]: [string, any]) => {
              const isSelected = key === missionProfile;
              const isExceeded = prof.budget_exceeded;
              return (
                <div
                  key={key}
                  className={`p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-sky-950/40 border-sky-500/60 ring-1 ring-sky-500/40'
                      : 'bg-slate-950/70 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-200">{prof.profile_name}</span>
                    {isSelected && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/30 text-sky-300 font-mono">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Criticality:</span>
                      <span className="text-slate-200">{prof.criticality} / 100</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Risk Budget:</span>
                      <span className="text-slate-200">{prof.risk_budget}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Composite Risk:</span>
                      <span className="text-white font-bold">{prof.composite_risk}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Budget Status:</span>
                      <span className={isExceeded ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        {isExceeded ? 'EXCEEDED' : 'WITHIN BUDGET'}
                      </span>
                    </div>
                    <div className="pt-1 border-t border-slate-800/80 flex justify-between items-center">
                      <span className="text-slate-400">Action:</span>
                      <span className="text-amber-300 font-bold">{prof.action.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

