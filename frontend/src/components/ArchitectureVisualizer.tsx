import React from 'react';
import { ArrowRight, Cpu, Radio, ShieldCheck, Compass, Activity, BrainCircuit, Navigation } from 'lucide-react';

export const ArchitectureVisualizer: React.FC = () => {
  const stages = [
    {
      step: '01',
      title: 'Telemetry Ingestion',
      subtitle: '2 Hz Clock',
      desc: 'Streams battery SOC, sensor health, comm latency, and obstacle distance.',
      icon: Radio,
      color: 'border-sky-500/40 text-sky-400 bg-sky-500/10',
    },
    {
      step: '02',
      title: 'Feature Extraction',
      subtitle: 'Normalized Fields',
      desc: 'Extracts spatial clearance, battery margin vs safe return floor, and link jitter.',
      icon: Cpu,
      color: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10',
    },
    {
      step: '03',
      title: 'Deterministic Risk',
      subtitle: '6 Dimensions',
      desc: 'Calculates normalized 0-100 composite index via weighted formula.',
      icon: Compass,
      color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    },
    {
      step: '04',
      title: 'Isolation Forest',
      subtitle: 'ML Outlier Filter',
      desc: 'Detects non-linear operational outliers without obscuring causality.',
      icon: BrainCircuit,
      color: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
    },
    {
      step: '05',
      title: 'Safety Governor',
      subtitle: 'Decision Engine',
      desc: 'Enforces risk budgets (e.g. 35 for medical delivery) and selects actions.',
      icon: ShieldCheck,
      color: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
    },
    {
      step: '06',
      title: 'Risk-Aware A*',
      subtitle: 'Pathfinder',
      desc: 'Generates safety corridors balancing distance against hazard exposure.',
      icon: Navigation,
      color: 'border-teal-500/40 text-teal-400 bg-teal-500/10',
    },
    {
      step: '07',
      title: 'Robot Execution',
      subtitle: 'Actuator Governor',
      desc: 'Updates speed, traverses detour, or evacuates safely to safe zone.',
      icon: Activity,
      color: 'border-sky-500/40 text-sky-400 bg-sky-500/10',
    },
  ];

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-sky-400" />
          How MIRA Thinks: Autonomous Safety Architecture
        </h2>
        <p className="text-xs text-slate-400">
          Continuous real-time perception-to-action pipeline running at 2 Hz.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 relative">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <div
              key={stage.step}
              className="bg-slate-950/80 rounded-xl border border-slate-800/80 p-3.5 flex flex-col justify-between hover:border-slate-750 transition shadow-sm relative group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-slate-500">{stage.step}</span>
                  <div className={`p-1.5 rounded-lg border ${stage.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="text-xs font-bold text-white mb-0.5">{stage.title}</div>
                <div className="text-[10px] text-sky-400 font-mono mb-2">{stage.subtitle}</div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  {stage.desc}
                </p>
              </div>

              {idx < stages.length - 1 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-700 pointer-events-none">
                  <ArrowRight className="h-4 w-4 text-sky-500/40" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Architectural Differentiators: AI Advisory vs Safety Authority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        <div className="bg-purple-950/20 border border-purple-800/40 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center space-x-2 text-purple-300 font-bold">
            <BrainCircuit className="h-4 w-4 text-purple-400" />
            <span>AI ML LAYER: ADVISORY ONLY (ISOLATION FOREST)</span>
          </div>
          <p className="text-slate-300 font-sans text-[11px] leading-relaxed">
            The unsupervised Isolation Forest evaluates a 9-dimensional telemetry vector and provides a <em>strictly bounded advisory delta</em> (max +15 pts). It detects non-linear sensor anomalies and subtle battery drain anomalies, but <strong>never possesses executive authority to unilaterally halt or steer the robot</strong>.
          </p>
        </div>

        <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center space-x-2 text-emerald-300 font-bold">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>SAFETY GOVERNOR: DETERMINISTIC SAFETY AUTHORITY</span>
          </div>
          <p className="text-slate-300 font-sans text-[11px] leading-relaxed">
            The Safety Governor maintains authoritative state-machine control with <strong>mathematical hysteresis</strong> (5-point buffer against oscillation). It strictly enforces mission risk budgets (e.g. 35 for Medical Delivery), enforces deterministic fail-safe transitions (Safe Return, E-Stop), and produces fully explainable causal audit records.
          </p>
        </div>
      </div>

      {/* Value Proposition Callout */}
      <div className="bg-sky-950/20 border border-sky-900/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5">
          <span className="font-bold text-sky-300 font-mono">Traditional Navigation vs MIRA:</span>
          <p className="text-slate-300 font-sans">
            Conventional planners ask: <em>"Where should I go?"</em> MIRA continuously asks: <em>"Can I still safely get there under current battery, sensor, communication, and environmental conditions?"</em>
            Conventional planners ask: <em>"Where should I go?"</em> MIRA continuously asks: <em>"Can I still safely complete the mission under current battery, sensor, communication, and environmental conditions — and what should I do next?"</em>
          </p>
        </div>
      </div>
    </div>
  );
};

