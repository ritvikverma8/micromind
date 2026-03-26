// src/core/Dijkstra.ts
import type { MazeSolver, Position, StepResult } from './types';

/**
 * Dijkstra's Algorithm — Uniform Cost Search.
 * Identical to A* but with h(n) = 0 (no heuristic).
 * Guarantees the shortest path by exploring in order of accumulated cost.
 * Explores more nodes than A* since it has no directional bias toward the goal.
 */
export class Dijkstra implements MazeSolver {
  name = "Dijkstra";

  private maze: number[][] = [];
  private goal!: Position;

  // Priority queue sorted purely by gScore (cost from start)
  private openSet: Position[] = [];
  private cameFrom: Map<string, Position> = new Map();
  private gScore: Map<string, number> = new Map();
  private closedSet: Set<string> = new Set(); // Tracks fully settled nodes

  // UI trackers
  private visitedNodes: Position[] = [];
  private currentPosition!: Position;
  private isFinished = false;
  private pathFound: Position[] = [];

  private posToString(p: Position): string {
    return `${p.x},${p.y}`;
  }

  initialize(mazeGrid: number[][], start: Position, goal: Position): void {
    this.maze = mazeGrid;
    this.goal = goal;

    this.openSet = [start];
    this.cameFrom = new Map();
    this.gScore = new Map();
    this.closedSet = new Set();

    this.gScore.set(this.posToString(start), 0);

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

    // Sort by gScore only — no heuristic, this is the key difference from A*
    this.openSet.sort((a, b) => {
      const gA = this.gScore.get(this.posToString(a)) ?? Infinity;
      const gB = this.gScore.get(this.posToString(b)) ?? Infinity;
      return gA - gB;
    });

    const current = this.openSet.shift()!;
    const currentStr = this.posToString(current);

    // Skip if already settled (can happen due to duplicate entries)
    if (this.closedSet.has(currentStr)) return this.getResult();

    this.closedSet.add(currentStr);
    this.currentPosition = current;
    this.visitedNodes.push(current);

    if (current.x === this.goal.x && current.y === this.goal.y) {
      this.isFinished = true;
      this.pathFound = this.reconstructPath(current);
      return this.getResult();
    }

    const currentG = this.gScore.get(currentStr) ?? Infinity;

    for (const neighbor of this.getNeighbors(current)) {
      const neighborStr = this.posToString(neighbor);
      if (this.closedSet.has(neighborStr)) continue;

      const tentativeG = currentG + 1; // Uniform edge weight of 1

      if (tentativeG < (this.gScore.get(neighborStr) ?? Infinity)) {
        this.cameFrom.set(neighborStr, current);
        this.gScore.set(neighborStr, tentativeG);
        // Don't filter duplicates — just push and let closedSet handle it
        this.openSet.push(neighbor);
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
        pathLength: this.pathFound.length > 0 ? this.pathFound.length : undefined,
        visitedCount: this.visitedNodes.length,
      }
    };
  }
}