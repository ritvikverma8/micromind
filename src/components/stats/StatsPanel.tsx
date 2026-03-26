// src/components/stats/StatsPanel.tsx
import React from 'react';

interface StatsPanelProps {
  algorithm: string;
  episode?: number;
  epsilon?: number;
  status?: string;
  elapsedMs?: number | null;
  pathLength?: number;   // Fix 2
  visitedCount?: number; // Fix 3
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ 
  algorithm, episode, epsilon, status, elapsedMs, pathLength, visitedCount
}) => {
  // Format ms → human readable: "1.23s" or "123ms" or "2m 04.1s"
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    const mins = Math.floor(ms / 60000);
    const secs = ((ms % 60000) / 1000).toFixed(1);
    return `${mins}m ${secs.padStart(4, '0')}s`;
  };
  return (
    <div className="bg-slate-900 border-2 border-slate-800 rounded-lg overflow-hidden shadow-xl">
      <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">System_Output</span>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
          <div className="w-2 h-2 rounded-full bg-amber-500/50"></div>
          <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
        </div>
      </div>
      
      <div className="p-4 font-mono space-y-6">
        <section>
          <label className="text-slate-500 text-[10px] uppercase block mb-1">Active_Core</label>
          <div className="text-blue-400 font-bold text-lg leading-tight">{algorithm}</div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-1 gap-4">
          <div>
            <label className="text-slate-500 text-[10px] uppercase block mb-1">Iteration</label>
            <div className="text-white text-xl font-bold">{episode ?? '000'}</div>
          </div>
          <div>
            <label className="text-slate-500 text-[10px] uppercase block mb-1">Epsilon_Val</label>
            <div className="text-amber-500 text-xl font-bold">
              {epsilon !== undefined ? `${(epsilon * 100).toFixed(1)}%` : '0.0%'}
            </div>
          </div>
          <div>
            <label className="text-slate-500 text-[10px] uppercase block mb-1">Time_Elapsed</label>
            <div className="text-violet-400 text-xl font-bold">
              {elapsedMs != null ? formatTime(elapsedMs) : '—'}
            </div>
          </div>
          <div>
            <label className="text-slate-500 text-[10px] uppercase block mb-1">Path_Length</label>
            <div className="text-yellow-400 text-xl font-bold">
              {pathLength != null ? `${pathLength} cells` : '—'}
            </div>
          </div>
          <div>
            <label className="text-slate-500 text-[10px] uppercase block mb-1">Cells_Explored</label>
            <div className="text-cyan-400 text-xl font-bold">
              {visitedCount != null ? visitedCount.toLocaleString() : '—'}
            </div>
          </div>
        </section>

        <section className="pt-4 border-t border-slate-800">
          <label className="text-slate-500 text-[10px] uppercase block mb-1">Process_Status</label>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              status === 'OPTIMIZED' || status === 'PATH FOUND' ? 'bg-green-500' :
              status === 'NO PATH' || status === 'PARTIAL PATH' ? 'bg-red-500' :
              status === 'SEARCHING' || status === 'TRAINING' ? 'bg-blue-500 animate-ping' :
              'bg-slate-600'
            }`}></div>
            <span className={`font-bold tracking-widest ${
              status === 'OPTIMIZED' || status === 'PATH FOUND' ? 'text-green-500' :
              status === 'NO PATH' || status === 'PARTIAL PATH' ? 'text-red-400' :
              status === 'SEARCHING' || status === 'TRAINING' ? 'text-blue-400' :
              'text-slate-500'
            }`}>
              {status ?? 'IDLE'}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
};