import React, { useState } from 'react';
import { Compass, ShieldCheck, ArrowRight, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

export const ExecutiveStoryBanner: React.FC<{}> = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <div className="bg-gradient-to-r from-slate-900/95 via-sky-950/40 to-slate-900/95 border border-sky-800/40 rounded-2xl p-4 shadow-xl backdrop-blur-md transition-all">
      {/* Top row: Core communication quote & collapse toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 shrink-0 mt-0.5">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-sky-400 uppercase">
                THE MIRA DIFFERENCE
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] font-mono text-slate-400">
                Mission Intelligence &amp; Risk-Aware Autonomy
              </span>
            </div>
            <div className="text-sm sm:text-base font-bold text-white mt-0.5 leading-snug">
              <span className="text-slate-400 font-normal">Traditional navigation asks where the robot should go. </span>
              <span className="text-sky-300 font-semibold">MIRA asks whether the robot can still safely complete the mission.</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="self-end md:self-center px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer shrink-0 border border-slate-700"
        >
          <span>{isExpanded ? 'Hide Storyline' : 'Why MIRA? Storyline'}</span>
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Expanded Storytelling Pipeline */}
      {isExpanded && (
        <div className="mt-4 pt-3 border-t border-sky-900/40 space-y-3">
          {/* Causal Flow Chain */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px] font-mono">
            {/* Step 1 */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
              <div className="text-[9px] text-slate-500 font-bold uppercase">1. Telemetry Changes</div>
              <div className="text-slate-200 font-sans text-xs mt-1">Battery, sensors, comms, obstacle, or environment degrade.</div>
              <div className="text-[9px] text-sky-400 mt-2 font-mono flex items-center justify-between">
                <span>Real-time (2 Hz)</span>
                <ArrowRight className="h-3 w-3 inline text-slate-600" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
              <div className="text-[9px] text-slate-500 font-bold uppercase">2. Risk Shifts</div>
              <div className="text-slate-200 font-sans text-xs mt-1">Normalized arithmetic integrates hazards + mission criticality.</div>
              <div className="text-[9px] text-amber-400 mt-2 font-mono flex items-center justify-between">
                <span>Risk Index (0-100)</span>
                <ArrowRight className="h-3 w-3 inline text-slate-600" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl -2.5 flex flex-col justify-between">
              <div className="text-[9px] text-slate-500 font-bold uppercase">3. MIRA Explains Why</div>
              <div className="text-slate-200 font-sans text-xs mt-1">Transparent causal explanation & rule provenance.</div>
              <div className="text-[9px] text-purple-400 mt-2 font-mono flex items-center justify-between">
                <span>No Black-Box</span>
                <ArrowRight className="h-3 w-3 inline text-slate-600" />
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl -2.5 flex flex-col justify-between">
              <div className="text-[9px] text-slate-500 font-bold uppercase">4. Governor Decides</div>
              <div className="text-slate-200 font-sans text-xs mt-1">6-State FSM enforces budget with 5-pt hysteresis.</div>
              <div className="text-[9px] text-sky-400 mt-2 font-mono flex items-center justify-between">
                <span>Safety Authority</span>
                <ArrowRight className="h-3 w-3 inline text-slate-600" />
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
              <div className="text-[9px] text-slate-500 font-bold uppercase">5. Planner Adapts</div>
              <div className="text-slate-200 font-sans text-xs mt-1">Multi-criteria A* reroutes or safe return zone picks up.</div>
              <div className="text-[9px] text-emerald-400 mt-2 font-mono flex items-center justify-between">
                <span>Dynamic Detour</span>
                <ArrowRight className="h-3 w-3 inline text-slate-600" />
              </div>
            </div>

            {/* Step 6 */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
              <div className="text-[9px] text-slate-500 font-bold uppercase">6. Mission Outcome</div>
              <div className="text-slate-200 font-sans text-xs mt-1">Goal arrived safely OR defensive abort preserving robot.</div>
              <div className="text-[9px] text-emerald-400 mt-2 font-mono flex items-center justify-between">
                <span>Zero Collisions</span>
                <CheckCircle2 className="h-3 w-3 inline text-emerald-400" />
              </div>
            </div>
          </div>


          <div className="bg-slate-950/50 rounded-xl p-2.5 border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
            <span className="text-slate-400 font-semibold uppercase tracking-wider">
              6 SAFETY GOVERNOR ACTIONS:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                CONTINUE (Nominal Speed)
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                SLOW_DOWN (Widen Braking Margin)
              </span>
              <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
                REPLAN (Bypass Hazard Corridor)
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/40">
                DEGRADED_AUTONOMY (Onboard Fail-Safe)
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/40">
                RETURN_TO_SAFE_ZONE (Prevent Stranding)
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/50">
                EMERGENCY_STOP (Holding Brake)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
