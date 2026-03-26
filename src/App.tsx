// src/App.tsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { generateMaze } from './core/Maze';
import { MazeGrid } from './components/simulation/MazeGrid';
import { ControlBar } from './components/layout/ControlBar';
import { StatsPanel } from './components/stats/StatsPanel';
import { useSimulation, type AlgorithmType } from './hooks/useSimulation';

function App() {
  const [mazeSize, setMazeSize] = useState(21); 
  const [maze, setMaze] = useState<number[][]>([]);
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('AStar');

  // Start is always top-left (1,1)
  const start = useMemo(() => ({ x: 1, y: 1 }), []);
  
  // Goal is always bottom-right relative to current maze size
  const goal = useMemo(() => {
    if (maze.length === 0) return { x: 19, y: 19 };
    return { x: maze[0].length - 2, y: maze.length - 2 };
  }, [maze]);

  const {
    visitedNodes,
    pathFound,
    currentPosition,
    status,
    metadata,
    qValues,
    elapsedMs,
    speedIndex,
    setSpeed,
    step,
    togglePlay,
    reset
  } = useSimulation(maze, start, goal, algorithm);

  const handleNewMaze = useCallback((size: number = mazeSize) => {
    // Maze algorithm requires odd dimensions for walls/paths to align
    const actualSize = size % 2 === 0 ? size + 1 : size;
    setMaze(generateMaze(actualSize, actualSize));
  }, [mazeSize]);

  const handleSizeChange = (newSize: number) => {
    setMazeSize(newSize);
    // handleNewMaze will be triggered by the useEffect below
  };

  useEffect(() => {
    handleNewMaze();
  }, [mazeSize, handleNewMaze]);

  return (
    <div className="min-h-screen font-mono bg-slate-950 text-slate-300 p-4 md:p-8">
      <header className="max-w-6xl mx-auto mb-8 border-b border-slate-800 pb-6">
        <h1 className="text-4xl font-black text-white tracking-tighter italic">
          MICROMIND<span className="text-blue-500 not-italic">_</span>
        </h1>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">
          Grid Intelligence & Pathfinding Lab
        </p>
      </header>

      <div className="max-w-6xl mx-auto space-y-6">
        <ControlBar 
          status={status}
          activeAlgorithm={algorithm}
          onAlgorithmChange={setAlgorithm}
          mazeSize={mazeSize}
          onSizeChange={handleSizeChange}
          onPlayPause={togglePlay}
          onStep={step}
          onReset={reset}
          onNewMaze={() => handleNewMaze()}
          speedIndex={speedIndex}
          onSpeedChange={setSpeed}
        />

        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          <main className="flex-1 w-full flex justify-center p-4 sm:p-8 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl relative">
            <MazeGrid 
              maze={maze} 
              visitedNodes={visitedNodes}
              pathFound={pathFound}
              qValues={qValues}
              currentPosition={currentPosition}
            />
          </main>

          <aside className="w-full lg:w-80 flex-shrink-0">
            <StatsPanel 
              algorithm={
                algorithm === 'AStar' ? 'A* SEARCH' :
                algorithm === 'Dijkstra' ? 'DIJKSTRA' :
                'Q-LEARNING AI'
              }
              episode={metadata?.episode}
              epsilon={metadata?.epsilon}
              status={metadata?.status}
              elapsedMs={elapsedMs}
              pathLength={metadata?.pathLength}
              visitedCount={metadata?.visitedCount}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

export default App;