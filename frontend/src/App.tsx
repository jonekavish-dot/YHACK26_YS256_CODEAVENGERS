import React, { useState } from 'react';
import { useMissionSocket } from './hooks/useMissionSocket';
import { Header } from './components/Header';
import { RiskGauge } from './components/RiskGauge';
import { DecisionPanel } from './components/DecisionPanel';
import { MissionMap } from './components/MissionMap';
import { TelemetryPanel } from './components/TelemetryPanel';
import { RiskBreakdownPanel } from './components/RiskBreakdown';
import { EventControlPanel } from './components/EventControlPanel';
import { RiskTimeline } from './components/RiskTimeline';
import { DecisionLog } from './components/DecisionLog';
import { BaselineComparison } from './components/BaselineComparison';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { ArchitectureVisualizer } from './components/ArchitectureVisualizer';
import { EvaluatorMode } from './components/EvaluatorMode';
import { DemoTourController } from './components/DemoTourController';
import { ExecutiveStoryBanner } from './components/ExecutiveStoryBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ShieldCheck, Compass, HelpCircle } from 'lucide-react';

export function App() {
  const { state, isConnected, history } = useMissionSocket();
  const [activeTab, setActiveTab] = useState<'mission' | 'whatif' | 'comparison' | 'audit' | 'architecture'>('mission');
  const [evaluatorMode, setEvaluatorMode] = useState<boolean>(false);

  const activeRoute = state?.candidate_routes.find((r) => r.id === state?.decision.selected_route_id)
    || state?.candidate_routes[0];

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Header Bar */}
      <Header
        state={state}
        isConnected={isConnected}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        evaluatorMode={evaluatorMode}
        setEvaluatorMode={setEvaluatorMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 lg:p-6 max-w-[1780px] mx-auto w-full space-y-5">
        {/* Evaluator Diagnostic Console (Displayed when Evaluator Mode is active) */}
        {evaluatorMode && (
          <EvaluatorMode state={state} onClose={() => setEvaluatorMode(false)} />
        )}

        {/* Mission Operations Tab */}
        {activeTab === 'mission' && (
          <div className="space-y-5">
            {/* Automated Judge Demo Tour Controller */}
            <DemoTourController state={state} />

            {/* Core Message & Problem-to-Decision Storytelling Hero Banner */}
            <ExecutiveStoryBanner />

            {/* Top Mission Status Summary HUD */}
            <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono backdrop-blur-md shadow-lg">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <div className="whitespace-nowrap">
                  <span className="text-slate-500 font-semibold">MISSION ID: </span>
                  <span className="text-sky-400 font-bold">{state?.mission_id ?? '--'}</span>
                </div>
                <div className="hidden sm:block h-3.5 w-px bg-slate-800" />
                <div className="whitespace-nowrap">
                  <span className="text-slate-500 font-semibold">PROFILE: </span>
                  <span className="text-slate-200">{state?.mission_name ?? 'Emergency Medical Delivery'}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <div className="whitespace-nowrap">
                  <span className="text-slate-500 font-semibold">DISTANCE: </span>
                  <span className="text-slate-200 font-bold">{state?.metrics.distance_traveled ?? 0}m</span>
                </div>
                <div className="hidden sm:block h-3.5 w-px bg-slate-800" />
                <div className="whitespace-nowrap">
                  <span className="text-slate-500 font-semibold">REPLANS: </span>
                  <span className="text-amber-400 font-bold">{state?.metrics.replanning_count ?? 0}</span>
                </div>
                <div className="hidden sm:block h-3.5 w-px bg-slate-800" />
                <div className="whitespace-nowrap">
                  <span className="text-slate-500 font-semibold">ENERGY BURNED: </span>
                  <span className="text-emerald-400 font-bold">{state?.metrics.energy_consumed ?? 0} Wh</span>
                </div>
                <div className="hidden sm:block h-3.5 w-px bg-slate-800" />
                <div className="whitespace-nowrap">
                  <span className="text-slate-500 font-semibold">COLLISIONS: </span>
                  <span className={`font-bold ${(state?.metrics.collision_count ?? 0) === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {state?.metrics.collision_count ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Core Decision & Risk Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-4">
                <RiskGauge risk={state?.risk ?? null} currentAction={state?.decision?.action} />
              </div>
              <div className="lg:col-span-8">
                <DecisionPanel
                  decision={state?.decision ?? null}
                  activeRoute={activeRoute}
                  candidateRoutes={state?.candidate_routes ?? []}
                  risk={state?.risk ?? null}
                  missionName={state?.mission_name}
                />
              </div>
            </div>

            {/* Middle Row: Digital Twin Map & Dynamic Timeline */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
              <div className="xl:col-span-7">
                <MissionMap state={state} />
              </div>
              <div className="xl:col-span-5 space-y-5 flex flex-col justify-between">
                <EventControlPanel />
                <RiskTimeline history={history} />
              </div>
            </div>

            {/* Bottom Row: Telemetry & Risk Factor Breakdown */}
            <TelemetryPanel telemetry={state?.telemetry ?? null} />
            <RiskBreakdownPanel risk={state?.risk ?? null} telemetry={state?.telemetry ?? null} />
          </div>
        )}

        {/* What-If Sandbox Tab */}
        {activeTab === 'whatif' && (
          <ErrorBoundary fallbackTitle="What-If Sandbox Console">
            <div className="space-y-5">
              <WhatIfSimulator />
              <TelemetryPanel telemetry={state?.telemetry ?? null} />
            </div>
          </ErrorBoundary>
        )}

        {/* Baseline vs MIRA Tab */}
        {activeTab === 'comparison' && (
          <ErrorBoundary fallbackTitle="Empirical Baseline Benchmark Console">
            <div className="space-y-5">
              <BaselineComparison metrics={state?.metrics ?? null} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <RiskBreakdownPanel risk={state?.risk ?? null} telemetry={state?.telemetry ?? null} />
                <TelemetryPanel telemetry={state?.telemetry ?? null} />
              </div>
            </div>
          </ErrorBoundary>
        )}

        {/* How MIRA Thinks Architecture Visualizer Tab */}
        {activeTab === 'architecture' && (
          <ErrorBoundary fallbackTitle="Architecture Visualizer Console">
            <div className="space-y-5">
              <ArchitectureVisualizer />
              <TelemetryPanel telemetry={state?.telemetry ?? null} />
            </div>
          </ErrorBoundary>
        )}

        {/* Decision Audit Log Tab */}
        {activeTab === 'audit' && (
          <ErrorBoundary fallbackTitle="Decision Audit Trail Log">
            <div className="space-y-5">
              <DecisionLog missionId={state?.mission_id ?? 'MISSION-0001'} />
            </div>
          </ErrorBoundary>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 px-6 py-4 text-xs text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-4 w-4 text-sky-400" />
          <span>MIRA — Autonomous Robot Mission Risk Assessment • YHACK'26 Challenge 17</span>
        </div>
        <div>
          Team: <strong className="text-slate-300">CODEAVENGERS</strong> (Team ID: <strong className="text-sky-400">YS526</strong>) • Domain: Software
        </div>
      </footer>
    </div>
  );
}

export default App;
