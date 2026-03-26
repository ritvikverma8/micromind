// src/components/layout/ControlBar.tsx
import React from 'react';
import type { SimulationStatus, AlgorithmType } from '../../hooks/useSimulation';
import { SPEED_LEVELS } from '../../hooks/useSimulation';

interface ControlBarProps {
  status: SimulationStatus;
  activeAlgorithm: AlgorithmType;
  onAlgorithmChange: (algo: AlgorithmType) => void;
  mazeSize: number;
  onSizeChange: (size: number) => void;
  onPlayPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onNewMaze: () => void;
  // Fix 2: Speed control props
  speedIndex: number;
  onSpeedChange: (index: number) => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  status, activeAlgorithm, onAlgorithmChange,
  mazeSize, onSizeChange, onPlayPause, onStep, onReset, onNewMaze,
  speedIndex, onSpeedChange
}) => {
  const isRunning = status === 'running';
  const isFinished = status === 'finished';

  return (
    <div className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl overflow-hidden shadow-2xl mb-8">
      {/* Settings Row */}
      <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-3 flex flex-wrap justify-between items-center gap-4">
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-3">
            <label className="text-slate-500 font-mono text-[10px] uppercase">Logic_Core:</label>
            <select 
              value={activeAlgorithm}
              onChange={(e) => onAlgorithmChange(e.target.value as AlgorithmType)}
              disabled={isRunning}
              className="bg-slate-950 border border-slate-700 text-blue-400 p-1.5 font-mono text-xs rounded cursor-pointer"
            >
              <option value="AStar">A* Search (Classical)</option>
              <option value="Dijkstra">Dijkstra (Classical)</option>
              <option value="QLearning">Q-Learning (AI)</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-slate-500 font-mono text-[10px] uppercase">Grid_Scale:</label>
            <select 
              value={mazeSize}
              onChange={(e) => onSizeChange(Number(e.target.value))}
              disabled={isRunning}
              className="bg-slate-950 border border-slate-700 text-emerald-400 p-1.5 font-mono text-xs rounded cursor-pointer"
            >
              <option value={11}>10x10</option>
              <option value={21}>20x20</option>
              <option value={31}>30x30</option>
              <option value={41}>40x40</option>
              <option value={51}>50x50</option>
            </select>
          </div>

          {/* Fix 2: Speed selector */}
          <div className="flex items-center gap-3">
            <label className="text-slate-500 font-mono text-[10px] uppercase">Sim_Speed:</label>
            <div className="flex gap-1">
              {SPEED_LEVELS.map((level, i) => (
                <button
                  key={level.label}
                  onClick={() => onSpeedChange(i)}
                  className={`px-2.5 py-1 font-mono text-[10px] uppercase rounded border transition-all ${
                    speedIndex === i
                      ? 'bg-violet-500/20 border-violet-500 text-violet-400'
                      : 'bg-transparent border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest hidden sm:block">
          System_Console_v1.0.5
        </div>
      </div>

      {/* Control Row */}
      <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={onPlayPause}
            disabled={isFinished}
            className={`min-w-[100px] px-6 py-2 font-bold uppercase tracking-widest text-xs border-2 transition-all rounded ${
              isFinished ? 'border-slate-800 text-slate-700' :
              isRunning ? 'border-amber-500 text-amber-500 bg-amber-500/10' : 
              'border-green-500 text-green-500 bg-green-500/10'
            }`}
          >
            {isRunning ? 'Pause' : 'Run'}
          </button>
          <button 
            onClick={onStep}
            disabled={isRunning || isFinished}
            className="px-6 py-2 font-bold uppercase tracking-widest text-xs border-2 border-blue-500 text-blue-500 disabled:border-slate-800 disabled:text-slate-700 rounded"
          >
            Step
          </button>
        </div>

        <div className="flex gap-4">
          <button onClick={onReset} className="text-[10px] font-bold uppercase text-slate-500 hover:text-white transition-colors">
            Reset Run
          </button>
          <button onClick={onNewMaze} className="px-4 py-2 text-[10px] font-bold uppercase bg-slate-800 text-slate-300 rounded border border-slate-700 hover:bg-slate-700">
            New Maze
          </button>
        </div>
      </div>
    </div>
  );
};