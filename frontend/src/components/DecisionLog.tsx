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
      setLogs(data);
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

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <History className="h-4 w-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Governor Decision & Event Audit Trail
          </h3>
        </div>
        <button
          onClick={loadData}
          className="text-xs text-slate-400 hover:text-sky-400 flex items-center gap-1 font-mono"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[500px]">
        {/* Events list */}
        {logs.events.length === 0 && logs.decisions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 font-mono">
            No audit records logged yet. Inject events or run mission to generate log entries.
          </div>
        ) : (
          logs.events.map((evt) => {
            const timeStr = new Date(evt.timestamp * 1000).toLocaleTimeString();
            return (
              <div
                key={`event-${evt.id}`}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col space-y-1 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-sky-400 font-semibold">{evt.event_type}</span>
                  <span className="text-slate-500">{timeStr}</span>
                </div>
                <div className="text-xs text-slate-200">{evt.description}</div>
                <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-400 mt-1">
                  <span>
                    Risk Impact:{' '}
                    <strong className="text-slate-300">{Math.round(evt.risk_before || 0)}</strong> →{' '}
                    <strong className="text-amber-400">{Math.round(evt.risk_after || 0)}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Action:{' '}
                    <span className="text-sky-400 font-semibold">{evt.action_taken || 'EVALUATE'}</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
