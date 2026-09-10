import React from 'react';
import { Play, Pause, RotateCcw, Shield, Radio, Terminal, BrainCircuit } from 'lucide-react';
import { SimulationState } from '../types';
import { pauseMission, resumeMission, resetMission, setSimulationSpeed } from '../services/api';

interface HeaderProps {
  state: SimulationState | null;
  isConnected: boolean;
  activeTab: 'mission' | 'whatif' | 'comparison' | 'audit' | 'architecture';
  setActiveTab: (tab: 'mission' | 'whatif' | 'comparison' | 'audit' | 'architecture') => void;
  evaluatorMode: boolean;
  setEvaluatorMode: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  isConnected,
  activeTab,
  setActiveTab,
  evaluatorMode,
  setEvaluatorMode,
}) => {
  const isPaused = state?.is_paused ?? false;
  const simSpeed = state?.sim_speed ?? 1.0;

  const handleProfileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    resetMission(e.target.value);
  };

  return (
    <header className="border-b border-slate-800/90 bg-slate-950/85 backdrop-blur-md px-5 py-3 sticky top-0 z-50 shadow-2xl">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Brand & Animated Full Form Expansion */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-sky-500/25 ring-1 ring-white/20 shrink-0">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              {/* MIRA Hover Expansion Group */}
              <div className="group flex items-center cursor-pointer select-none py-0.5">
                <h1 className="text-xl font-black tracking-wider text-white font-mono flex items-center">
                  <span className="transition-all duration-300 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:via-sky-200 group-hover:to-sky-400">
                    MIRA
                  </span>
                  {/* Animated Expansion on Hover */}
                  <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[450px] group-hover:opacity-100 transition-all duration-500 ease-out flex items-center">
                    <span className="text-xs font-medium text-sky-200 font-sans tracking-wide pl-2.5 ml-2 border-l-2 border-sky-500/60 py-0.5 flex items-center gap-1.5 bg-gradient-to-r from-sky-500/10 to-transparent pr-2 rounded-r">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse shrink-0" />
                      <span>
                        <strong className="text-sky-400 font-bold">M</strong>ission{' '}
                        <strong className="text-sky-400 font-bold">I</strong>ntelligence &amp;{' '}
                        <strong className="text-sky-400 font-bold">R</strong>isk-Aware{' '}
                        <strong className="text-sky-400 font-bold">A</strong>utonomy
                      </span>
                    </span>
                  </span>
                </h1>
              </div>

              {/* Live Telemetry Status & Edge Compute Badge */}
              <div className="flex items-center space-x-2 pl-1 shrink-0">
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  <span className="text-[11px] text-slate-400 font-mono">
                    {isConnected ? '2Hz TELEMETRY' : 'OFFLINE'}
                  </span>
                </div>

                {state?.compute_metrics && (
                  <div className="hidden sm:flex items-center space-x-2 px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-slate-400">
                    <span className="text-sky-400">CPU {state.compute_metrics.cpu_percent}%</span>
                    <span className="text-slate-700">|</span>
                    <span className="text-purple-400">RAM {state.compute_metrics.memory_mb}MB</span>
                    <span className="text-slate-700">|</span>
                    <span className="text-emerald-400">{state.compute_metrics.total_cycle_ms}ms</span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              "Don't just navigate. Know when navigation becomes dangerous."
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setActiveTab('mission')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'mission'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Mission Ops
          </button>
          <button
            onClick={() => setActiveTab('whatif')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'whatif'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            What-If Sandbox
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'comparison'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Baseline vs MIRA
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'architecture'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <BrainCircuit className="h-3.5 w-3.5" />
            <span>How MIRA Thinks</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Audit Trail
          </button>
        </div>

        {/* Mission Profile & Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Evaluator Mode Toggle Switch */}
          <button
            onClick={() => setEvaluatorMode(!evaluatorMode)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
              evaluatorMode
                ? 'bg-purple-500/25 border-purple-400 text-purple-300 shadow-md shadow-purple-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>{evaluatorMode ? 'EVALUATOR ON' : 'EVALUATOR MODE'}</span>
          </button>

          {/* Mission Profile Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <Radio className="h-3.5 w-3.5 text-sky-400" />
            <select
              value={state?.mission_type || 'EMERGENCY_DELIVERY'}
              onChange={handleProfileChange}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="EMERGENCY_DELIVERY" className="bg-slate-900 text-white">
                Emergency Delivery (Crit: High)
              </option>
              <option value="ROUTINE_INSPECTION" className="bg-slate-900 text-white">
                Facility Inspection (Crit: Low)
              </option>
              <option value="SURVEILLANCE" className="bg-slate-900 text-white">
                Perimeter Patrol (Crit: Med)
              </option>
              <option value="CRITICAL_RESCUE" className="bg-slate-900 text-white">
                Disaster Rescue (Crit: Max)
              </option>
            </select>
          </div>

          {/* Play / Pause */}
          <button
            onClick={isPaused ? resumeMission : pauseMission}
            title={isPaused ? 'Resume Mission' : 'Pause Mission'}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isPaused
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30'
            }`}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>

          {/* Sim Speed Toggles */}
          <div className="flex items-center bg-slate-900 rounded-xl border border-slate-800 p-0.5">
            {[1.0, 2.0, 4.0].map((s) => (
              <button
                key={s}
                onClick={() => setSimulationSpeed(s)}
                className={`px-2 py-1 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer ${
                  simSpeed === s
                    ? 'bg-sky-500 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Reset Demo */}
          <button
            onClick={() => resetMission(state?.mission_type || 'EMERGENCY_DELIVERY')}
            title="Reset Scenario Demo"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-medium transition-all cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
