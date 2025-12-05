import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { SimulationStats } from '../types';

interface StatsPanelProps {
  stats: SimulationStats;
  history: any[];
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats, history }) => {
  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Live Metrics */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
          <div className="text-slate-400 text-xs uppercase">Active Fires</div>
          <div className="text-2xl font-bold text-orange-500 font-mono">{stats.activeFireCells}</div>
        </div>
        <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
          <div className="text-slate-400 text-xs uppercase">Avg Temp</div>
          <div className="text-2xl font-bold text-red-500 font-mono">{Math.round(stats.averageTemperature)}°C</div>
        </div>
        <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
          <div className="text-slate-400 text-xs uppercase">Smoke Mass</div>
          <div className="text-2xl font-bold text-gray-400 font-mono">{Math.round(stats.totalSmokeMass)}</div>
        </div>
        <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
          <div className="text-slate-400 text-xs uppercase">Critical Level</div>
          <div className="text-2xl font-bold text-cyan-400 font-mono">
            {stats.floorStats.some(f => f.dangerLevel > 80) ? 'CRITICAL' : 'STABLE'}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="flex-1 min-h-[150px] bg-slate-900/50 rounded border border-slate-800 p-2 flex flex-col">
        <div className="text-xs text-slate-500 mb-2">Smoke Density Trend</div>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history}>
            <defs>
              <linearGradient id="colorSmoke" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis hide domain={[0, 'auto']} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }} 
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Area type="monotone" dataKey="smoke" stroke="#94a3b8" fillOpacity={1} fill="url(#colorSmoke)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 min-h-[150px] bg-slate-900/50 rounded border border-slate-800 p-2 flex flex-col">
        <div className="text-xs text-slate-500 mb-2">Floor Danger Levels</div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.floorStats}>
             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
            <XAxis dataKey="floorIndex" tickFormatter={(v) => `L${v+1}`} stroke="#475569" fontSize={10} />
            <YAxis stroke="#475569" fontSize={10} domain={[0, 100]} />
            <Tooltip 
              cursor={{fill: '#1e293b'}}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }} 
            />
            <Bar dataKey="dangerLevel" fill="#f59e0b" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatsPanel;
