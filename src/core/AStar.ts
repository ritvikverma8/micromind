// src/core/AStar.ts
import type { MazeSolver, Position, StepResult } from './types';

export class AStar implements MazeSolver {
  name = "A* Search";
  
  private maze: number[][] = [];
  private goal!: Position;
  
  // A* specific state
  private openSet: Position[] = [];
  private cameFrom: Map<string, Position> = new Map();
  private gScore: Map<string, number> = new Map();
  private fScore: Map<string, number> = new Map();
  
  // Trackers for the UI
  private visitedNodes: Position[] = [];
  private currentPosition!: Position;
  private isFinished = false;
  private pathFound: Position[] = [];

  // Manhattan Distance Heuristic
  private heuristic(a: Position, b: Position): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  private posToString(p: Position): string {
    return `${p.x},${p.y}`;
  }

  initialize(mazeGrid: number[][], start: Position, goal: Position): void {
    this.maze = mazeGrid;
    this.goal = goal; // We store the goal to check distance, but we don't need to store the start
    
    this.openSet = [start];
    this.cameFrom = new Map();
    this.gScore = new Map();
    this.fScore = new Map();
    
    this.gScore.set(this.posToString(start), 0);
    this.fScore.set(this.posToString(start), this.heuristic(start, goal));
    
    this.visitedNodes = [];
    this.currentPosition = start;
    this.isFinished = false;
    this.pathFound = [];
  }

  private getNeighbors(pos: Position): Position[] {
    const { x, y } = pos;
    const neighbors: Position[] = [];
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]]; 

    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (ny >= 0 && ny < this.maze.length && nx >= 0 && nx < this.maze[0].length) {
        if (this.maze[ny][nx] === 0) {
          neighbors.push({ x: nx, y: ny });
        }
      }
    }
    return neighbors;
  }

  private reconstructPath(current: Position): Position[] {
    const path = [current];
    let currStr = this.posToString(current);
    while (this.cameFrom.has(currStr)) {
      current = this.cameFrom.get(currStr)!;
      path.unshift(current);
      currStr = this.posToString(current);
    }
    return path;
  }

  step(): StepResult {
    if (this.isFinished || this.openSet.length === 0) {
      this.isFinished = true;
      return this.getResult();
    }

    this.openSet.sort((a, b) => {
      const fA = this.fScore.get(this.posToString(a)) ?? Infinity;
      const fB = this.fScore.get(this.posToString(b)) ?? Infinity;
      return fA - fB;
    });

    const current = this.openSet.shift()!;
    this.currentPosition = current;
    this.visitedNodes.push(current);

    if (current.x === this.goal.x && current.y === this.goal.y) {
      this.isFinished = true;
      this.pathFound = this.reconstructPath(current);
      return this.getResult();
    }

    const currentStr = this.posToString(current);
    const currentG = this.gScore.get(currentStr) ?? Infinity;

    for (const neighbor of this.getNeighbors(current)) {
      const neighborStr = this.posToString(neighbor);
      const tentativeG = currentG + 1; 

      if (tentativeG < (this.gScore.get(neighborStr) ?? Infinity)) {
        this.cameFrom.set(neighborStr, current);
        this.gScore.set(neighborStr, tentativeG);
        this.fScore.set(neighborStr, tentativeG + this.heuristic(neighbor, this.goal));

        if (!this.openSet.some(p => p.x === neighbor.x && p.y === neighbor.y)) {
          this.openSet.push(neighbor);
        }
      }
    }

    return this.getResult();
  }

  solveInstantly(): StepResult {
    while (!this.isFinished) {
      this.step();
    }
    return this.getResult();
  }

  private getResult(): StepResult {
    return {
      currentPosition: this.currentPosition,
      visitedNodes: [...this.visitedNodes],
      isFinished: this.isFinished,
      pathFound: [...this.pathFound],
      metadata: {
        status: this.isFinished
          ? (this.pathFound.length > 0 ? 'PATH FOUND' : 'NO PATH')
          : this.openSet.length > 0 ? 'SEARCHING' : 'IDLE',
        pathLength: this.pathFound.length > 0 ? this.pathFound.length : undefined, // Fix 2
        visitedCount: this.visitedNodes.length,                                     // Fix 3
      }
    };
  }
}