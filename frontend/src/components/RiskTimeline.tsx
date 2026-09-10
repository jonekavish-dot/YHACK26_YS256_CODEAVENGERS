import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { RiskPoint } from '../hooks/useMissionSocket';
import { Activity } from 'lucide-react';

interface RiskTimelineProps {
  history: RiskPoint[];
}

export const RiskTimeline: React.FC<RiskTimelineProps> = ({ history }) => {
  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Activity className="h-4 w-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Dynamic Risk Trajectory Timeline
          </h3>
        </div>
        <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Normal (&lt;30)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Caution (31-60)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> High/Crit (&gt;60)
          </span>
        </div>
      </div>

      <div className="h-48 w-full">
        {history.length < 2 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
            Accumulating telemetry data points...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#1e293b',
                  borderRadius: '0.75rem',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                }}
              />
              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" opacity={0.5} label={{ value: 'Norm', fill: '#10b981', fontSize: 9, position: 'insideTopRight' }} />
              <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="3 3" opacity={0.5} label={{ value: 'Caut', fill: '#f59e0b', fontSize: 9, position: 'insideTopRight' }} />
              <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} label={{ value: 'Crit', fill: '#ef4444', fontSize: 9, position: 'insideTopRight' }} />

              <Area
                type="monotone"
                dataKey="risk"
                name="Mission Risk"
                stroke="#38bdf8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#riskGradient)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
