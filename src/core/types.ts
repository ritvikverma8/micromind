// src/core/types.ts

export type Position = { x: number; y: number };
export type Action = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// src/core/types.ts
// src/core/types.ts
export interface StepResult {
  currentPosition: Position;
  visitedNodes: Position[]; 
  isFinished: boolean;
  pathFound: Position[];    
  metadata?: {
    episode?: number;
    epsilon?: number;
    status?: string;
    pathLength?: number;   // Fix 2: length of final path
    visitedCount?: number; // Fix 3: total cells explored
  };
  // ADD THIS: Maps "x,y" to the maximum Q-value found at that spot
  qValues?: Map<string, number>; 
}

export interface MazeSolver {
  name: string;
  initialize(mazeGrid: number[][], start: Position, goal: Position): void;
  step(): StepResult;
  solveInstantly(): StepResult; 
}