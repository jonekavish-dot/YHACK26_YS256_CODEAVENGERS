import React, { useEffect } from 'react';
import {
  Shield,
  ArrowRight,
  CornerDownLeft,
  Activity,
  Cpu,
  Scale,
  Compass,
  Radio,
  Sparkles,
  CheckCircle2,
  Terminal,
} from 'lucide-react';

interface IntroScreenProps {
  onEnter: () => void;
  isConnected: boolean;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onEnter, isConnected }) => {
  // Listen for the Enter key to enter the dashboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onEnter();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEnter]);

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-sky-500 selection:text-white">
      {/* Ambient background glow effects */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-sky-500/15 via-blue-600/10 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -bottom-40 right-10 w-[500px] h-[500px] bg-purple-600/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -bottom-40 left-10 w-[500px] h-[500px] bg-emerald-600/10 blur-3xl pointer-events-none rounded-full" />

      {/* Cyber-grid overlay pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Header Bar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold">
              YHACK'26 SOFTWARE TRACK
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline">
              CHALLENGE 17: AUTONOMOUS ROBOT MISSION RISK ASSESSMENT
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-slate-400">
              TEAM: <strong className="text-white">CODEAVENGERS</strong> (<strong className="text-sky-400">YS526</strong>)
            </span>
            <span className="text-slate-600">|</span>
            <div className="flex items-center space-x-1.5">
              <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className={isConnected ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                {isConnected ? 'LIVE TELEMETRY ACTIVE' : 'CONNECTING...'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Hero & Presentation Center */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-8 flex flex-col items-center text-center my-auto space-y-6">
        {/* Animated Badge & Emblem */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-sky-500/40 shadow-lg shadow-sky-500/10 backdrop-blur text-xs font-mono text-sky-300">
          <Sparkles className="h-3.5 w-3.5 text-sky-400 animate-spin" style={{ animationDuration: '4s' }} />
          <span>AUTONOMOUS RISK ASSESSMENT &amp; SAFETY GOVERNANCE</span>
        </div>

        {/* Brand Title & Hero Hook */}
        <div className="space-y-3 max-w-3xl">
          <div className="flex items-center justify-center space-x-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-xl shadow-sky-500/30 ring-2 ring-white/20">
              <Shield className="h-9 w-9 text-white" />
            </div>
            <h1 className="text-5xl sm:text-6xl font-black tracking-wider text-white font-mono">
              MIRA
            </h1>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-sky-300 font-sans tracking-wide">
            Mission Intelligence &amp; Risk-Aware Autonomy
          </h2>

          <div className="pt-2">
            <p className="text-xl sm:text-2xl font-extrabold text-white font-sans leading-snug">
              &ldquo;Don't just navigate.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-200 to-blue-400">
                Know when navigation becomes dangerous.
              </span>&rdquo;
            </p>
            <p className="text-sm sm:text-base text-slate-400 font-sans mt-2 max-w-2xl mx-auto leading-relaxed">
              Traditional navigation asks where the robot should go. MIRA continuously evaluates multi-subsystem degradation, dynamic obstacles, and communications to enforce deterministic safety governance.
            </p>
          </div>
        </div>

        {/* Primary Interactive CTA: Hit Enter or Click */}
        <div className="pt-4 pb-2 flex flex-col items-center space-y-3">
          <button
            onClick={onEnter}
            className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white font-mono font-bold text-base shadow-2xl shadow-sky-500/30 ring-1 ring-white/25 transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer flex items-center space-x-3"
          >
            <span>ENTER MISSION DASHBOARD</span>
            <span className="px-2.5 py-1 rounded-md bg-black/40 border border-white/20 text-xs font-mono text-sky-200 group-hover:text-white flex items-center gap-1">
              ENTER ↵
            </span>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Keyboard Hint */}
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
            <CornerDownLeft className="h-3.5 w-3.5 text-sky-400 animate-pulse" />
            <span>
              Press <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-sky-300 font-bold">ENTER</kbd> on your keyboard or click above to launch
            </span>
          </div>
        </div>

        {/* 3 Core Architecture Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full pt-4 text-left">
          {/* Pillar 1 */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-lg">
            <div>
              <div className="flex items-center space-x-2 text-sky-400 mb-2">
                <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20">
                  <Activity className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  1. Multi-Factor Risk Assessment
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Evaluates battery reserve floor (25%), sensor confidence, 5G latency (&gt;250ms), obstacle clearance, and environmental hazards into a unified 0–100 index.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] font-mono text-sky-400">
              Formula: 0.25B + 0.25S + 0.15C + 0.25O + 0.10E
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-lg">
            <div>
              <div className="flex items-center space-x-2 text-amber-400 mb-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Cpu className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  2. Deterministic Safety Governor
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                6-State Finite State Machine enforcing mission risk budgets with 5-point mathematical hysteresis to eliminate oscillations and prevent stranding.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] font-mono text-amber-400">
              Actions: CONTINUE, SLOW_DOWN, REPLAN, DEGRADED, RETURN, E-STOP
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-lg">
            <div>
              <div className="flex items-center space-x-2 text-emerald-400 mb-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Scale className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  3. Empirical Verification
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                20-trial reproducible paired Monte Carlo benchmarks against static distance-only A*: 0 collisions vs 3, -91.4% physical risk exposure, with full audit trail.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] font-mono text-emerald-400">
              Evidence: 0 Collisions • -91.4% Exposure
            </div>
          </div>
        </div>
      </main>

      {/* Footer Strip */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-slate-500">
          <div className="flex items-center space-x-2">
            <Terminal className="h-3.5 w-3.5 text-sky-400" />
            <span>Digital Twin 25×25 Metric Grid • 2.0 Hz WebSocket Telemetry Stream</span>
          </div>
          <div className="flex items-center space-x-3">
            <span>Domain: Software</span>
            <span>•</span>
            <button
              onClick={onEnter}
              className="text-sky-400 hover:text-sky-300 underline font-semibold transition cursor-pointer"
            >
              Skip Intro &rarr;
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

