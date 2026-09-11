import React, { useEffect, useState } from 'react';
import { fetchAuditLogs } from '../services/api';
import { History, Shield, AlertTriangle, RefreshCw } from 'lucide-react';

interface DecisionLogProps {
  missionId: string;
}

export const DecisionLog: React.FC<DecisionLogProps> = ({ missionId }) => {
  const [logs, setLogs] = useState<{ decisions: any[]; events: any[] }>({
    decisions: [],
    events: [],
  });
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchAuditLogs(missionId);
      if (data && Array.isArray(data.events) && Array.isArray(data.decisions)) {
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [missionId]);

  const getOperationalResult = (action: string, eventType: string) => {
    switch (action) {
      case 'REPLAN':
        return 'Safe bypass trajectory generated; collision path cleared.';
      case 'SLOW_DOWN':
        return 'Kinematic braking applied; sensor reaction margin widened.';
      case 'DEGRADED_AUTONOMY':
        return 'Local onboard autonomy policy engaged; speed throttled 40%.';
      case 'RETURN_TO_SAFE_ZONE':
        return 'Energy reserve secured; safe return abort executed.';
      case 'EMERGENCY_STOP':
        return 'Kinematic halt engaged; fail-safe holding brake secured.';
      case 'CONTINUE':
      default:
        if (eventType.includes('RECOVERY') || eventType.includes('NOMINAL')) {
          return 'Nominal envelope restored; mission continues to goal.';
        }
        return 'Operating parameters verified within safety budget; route maintained.';
    }
  };

  const eventList = logs?.events || [];
  const decisionList = logs?.decisions || [];

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <History className="h-4 w-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Autonomous Decision & Event Causal Timeline
          </h3>
        </div>
        <button
          onClick={loadData}
          className="text-xs text-slate-400 hover:text-sky-400 flex items-center gap-1 font-mono transition cursor-pointer"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="text-[11px] font-mono text-slate-400 mb-3 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80">
        <span className="text-sky-400 font-bold">Causal Chain:</span> [ Timestamp ] Event Detected → Risk Impact → Governor Decision → Operational Result
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[500px]">
        {/* Events list */}
        {eventList.length === 0 && decisionList.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 font-mono">
            No audit records logged yet. Inject events or run mission to generate log entries.
          </div>
        ) : (
          eventList.map((evt) => {
            const timeStr = new Date(evt.timestamp * 1000).toLocaleTimeString();
            const riskBefore = Math.round(evt.risk_before || 0);
            const riskAfter = Math.round(evt.risk_after || 0);
            const isRiskIncreased = riskAfter > riskBefore;
            const action = evt.action_taken || 'EVALUATE';
            const operationalResult = getOperationalResult(action, evt.event_type);

            return (
              <div
                key={`event-${evt.id}`}
                className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3 flex flex-col space-y-2 hover:border-sky-900/60 transition-colors"
              >
                {/* Header: Timestamp and Event Type */}
                <div className="flex items-center justify-between text-[11px] font-mono border-b border-slate-900 pb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500">[{timeStr}]</span>
                    <span className="text-sky-400 font-bold">{evt.event_type.replace(/_/g, ' ')}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    action === 'EMERGENCY_STOP'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : action === 'RETURN_TO_SAFE_ZONE'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : action === 'REPLAN'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : action === 'SLOW_DOWN'
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {action.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Event Description */}
                <div className="text-xs text-slate-200 font-sans">
                  {evt.description}
                </div>

                {/* Causal Chain Summary Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px] font-mono pt-1 border-t border-slate-900 text-slate-400">
                  <div className="flex items-center space-x-1.5">
                    <span>Risk Transition:</span>
                    <span className="text-slate-300">{riskBefore}</span>
                    <span>→</span>
                    <span className={`font-bold ${isRiskIncreased ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {riskAfter} / 100
                    </span>
                  </div>
                  <div className="flex items-start space-x-1 text-slate-300">
                    <span className="text-slate-500 font-mono shrink-0">Result:</span>
                    <span className="leading-tight text-[10px] break-words">{operationalResult}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
