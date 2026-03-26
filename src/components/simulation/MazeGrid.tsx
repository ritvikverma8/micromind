// src/components/simulation/MazeGrid.tsx
import React, { useMemo } from 'react';
import type { Position } from '../../core/types';

interface MazeGridProps {
  maze: number[][];
  visitedNodes?: Position[];
  pathFound?: Position[];
  qValues?: Map<string, number>;
  currentPosition?: Position | null; // Fix 6: live agent position
}

export const MazeGrid: React.FC<MazeGridProps> = ({ 
  maze, visitedNodes = [], pathFound = [], qValues = new Map(), currentPosition = null
}) => {
  if (!maze || maze.length === 0) return null;

  const rows = maze.length;
  const cols = maze[0].length;

  const visitedSet = useMemo(() => new Set(visitedNodes.map(p => `${p.x},${p.y}`)), [visitedNodes]);
  const pathSet = useMemo(() => new Set(pathFound.map(p => `${p.x},${p.y}`)), [pathFound]);

  const maxQ = useMemo(() => {
    if (qValues.size === 0) return 0;
    return Math.max(...Array.from(qValues.values()));
  }, [qValues]);

  return (
    <div
      className="border-2 border-slate-700 bg-slate-950 shadow-2xl overflow-hidden"
      style={{
        width: '100%',
        maxWidth: cols > 30 ? '650px' : '500px',
        aspectRatio: '1 / 1',
      }}
    >
      <div
        style={{
          display: 'grid',
          width: '100%',
          height: '100%',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gap: 0,
        }}
      >
        {maze.map((row, y) =>
          row.map((cell, x) => {
            const key = `${x},${y}`;
            const isWall = cell === 1;
            const isStart = x === 1 && y === 1;
            const isGoal = x === cols - 2 && y === rows - 2;
            const isPath = pathSet.has(key);
            const isAgent = currentPosition?.x === x && currentPosition?.y === y;

            const qVal = qValues.get(key) || 0;
            const intensity = maxQ > 0 ? qVal / maxQ : 0;

            let bgColor = '';

            if (isStart) {
              bgColor = 'rgb(59,130,246)';
            } else if (isGoal) {
              bgColor = 'rgb(34,197,94)';
            } else if (isWall) {
              bgColor = 'rgb(15,23,42)'; // slate-900
            } else if (isAgent) {
              bgColor = 'rgb(34,211,238)'; // cyan-400
            } else if (isPath) {
              bgColor = 'rgb(250,204,21)'; // yellow-400
            } else if (intensity > 0) {
              bgColor = `rgba(34,197,94,${intensity * 0.5})`;
            } else if (visitedSet.has(key)) {
              bgColor = 'rgba(49,46,129,0.3)'; // indigo-900/30
            } else {
              bgColor = 'rgb(2,6,23)'; // slate-950
            }

            return (
              <div
                key={key}
                style={{ backgroundColor: bgColor }}
              />
            );
          })
        )}
      </div>
    </div>
  );
};