// src/core/QLearningAgent.ts
import type { MazeSolver, Position, StepResult, Action } from './types';

export class QLearningAgent implements MazeSolver {
  name = "Q-Learning";
  
  private maze: number[][] = [];
  private start!: Position;
  private goal!: Position;
  
  // Q-Learning Hyperparameters
  private alpha = 0.3;      // Learning rate
  private gamma = 0.9;      // Discount factor
  private minEpsilon = 0.01;
  private epsilon = 1.0;    // Exploration rate
  private currentEpsilonDecay = 0.96;

  // Internal State
  private qTable: Map<string, Record<Action, number>> = new Map();
  private currentPosition!: Position;
  private visitedNodes: Position[] = [];       // Resets each episode (used for reward shaping)
  private exploredCells: Set<string> = new Set(); // Persists across all episodes (used for UI heatmap)
  private isFinished = false;
  private pathFound: Position[] = [];
  
  private episodeCount = 0;
  private maxEpisodes = 100;
  private isTraining = true;

  private actions: Action[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
  private posToString(p: Position): string { return `${p.x},${p.y}`; }

  initialize(mazeGrid: number[][], start: Position, goal: Position): void {
    this.maze = mazeGrid;
    this.start = start;
    this.goal = goal;
    this.qTable.clear();
    this.exploredCells.clear();
    
    // DYNAMIC SCALING based on grid density
    const totalCells = mazeGrid.length * mazeGrid[0].length;
    this.maxEpisodes = Math.max(100, Math.floor(totalCells * 0.2));
    
    // Adjust decay: Slower decay for larger maps to allow more exploration
    this.currentEpsilonDecay = totalCells > 900 ? 0.985 : 0.96;
    
    this.episodeCount = 0;
    this.isTraining = true;
    this.epsilon = 1.0;
    this.resetEpisode();
  }

  private resetEpisode() {
    this.currentPosition = { ...this.start };
    this.visitedNodes = [{ ...this.start }]; // Per-episode reset for reward shaping
    this.isFinished = false;
    this.pathFound = [];
  }

  private initQValues(stateStr: string) {
    if (!this.qTable.has(stateStr)) {
      this.qTable.set(stateStr, { UP: 0, DOWN: 0, LEFT: 0, RIGHT: 0 });
    }
  }

  private chooseAction(stateStr: string): Action {
    this.initQValues(stateStr);
    
    // Epsilon-Greedy: Explore vs Exploit
    if (Math.random() < this.epsilon) {
      return this.actions[Math.floor(Math.random() * this.actions.length)];
    }
    
    const qValues = this.qTable.get(stateStr)!;
    return Object.keys(qValues).reduce((a, b) => 
      qValues[a as Action] > qValues[b as Action] ? a : b
    ) as Action;
  }

  private getNextPosition(pos: Position, action: Action): Position {
    const next = { ...pos };
    if (action === 'UP') next.y -= 1;
    if (action === 'DOWN') next.y += 1;
    if (action === 'LEFT') next.x -= 1;
    if (action === 'RIGHT') next.x += 1;
    return next;
  }

  step(): StepResult {
    if (this.isFinished) return this.getResult();

    const currentStateStr = this.posToString(this.currentPosition);
    const action = this.chooseAction(currentStateStr);
    const nextPos = this.getNextPosition(this.currentPosition, action);
    
    let reward = -1.0; // Standard step penalty
    let nextStateStr = currentStateStr;

    const isValidMove = nextPos.y >= 0 && nextPos.y < this.maze.length && 
                        nextPos.x >= 0 && nextPos.x < this.maze[0].length && 
                        this.maze[nextPos.y][nextPos.x] === 0;

    if (!isValidMove) {
      reward = -5.0; // Penalty for hitting walls
    } else {
      // Bonus for exploring new territory in this episode
      if (!this.visitedNodes.some(p => p.x === nextPos.x && p.y === nextPos.y)) {
        reward = 2.0;
      }
      
      nextStateStr = this.posToString(nextPos);
      this.currentPosition = nextPos;
      this.visitedNodes.push({ ...this.currentPosition });
      this.exploredCells.add(nextStateStr); // Persist across episodes for heatmap

      if (nextPos.x === this.goal.x && nextPos.y === this.goal.y) {
        reward = 500.0; // Goal reached
        this.handleEpisodeEnd();
        return this.getResult();
      }
    }

    // Bellman Equation Update
    this.initQValues(nextStateStr);
    const currentQ = this.qTable.get(currentStateStr)![action];
    const nextMaxQ = Math.max(...Object.values(this.qTable.get(nextStateStr)!));
    
    const newQ = currentQ + this.alpha * (reward + this.gamma * nextMaxQ - currentQ);
    this.qTable.get(currentStateStr)![action] = newQ;

    return this.getResult();
  }

  private handleEpisodeEnd() {
    this.episodeCount++;
    
    if (this.episodeCount >= this.maxEpisodes) {
      this.isTraining = false;
      this.isFinished = true;
      this.epsilon = 0;
      this.extractFinalPath();
    } else {
      this.epsilon = Math.max(this.minEpsilon, this.epsilon * this.currentEpsilonDecay);
      this.resetEpisode();
    }
  }

  private extractFinalPath() {
    let curr = { ...this.start };
    this.pathFound = [{ ...curr }];
    const seen = new Set<string>(); // Fix 3: cycle detection
    seen.add(this.posToString(curr));
    
    for (let i = 0; i < 2000; i++) {
      if (curr.x === this.goal.x && curr.y === this.goal.y) break;
      
      const stateStr = this.posToString(curr);
      this.initQValues(stateStr);
      const qValues = this.qTable.get(stateStr)!;
      const bestAction = Object.keys(qValues).reduce((a, b) => 
        qValues[a as Action] > qValues[b as Action] ? a : b
      ) as Action;
      
      const next = this.getNextPosition(curr, bestAction);

      // Stop if next cell is a wall (failed training)
      if (this.maze[next.y]?.[next.x] === 1 || this.maze[next.y]?.[next.x] === undefined) break;

      // Stop if we've already visited this cell in the sprint (cycle detected)
      const nextStr = this.posToString(next);
      if (seen.has(nextStr)) break;
      seen.add(nextStr);
      
      curr = next;
      this.pathFound.push({ ...curr });
    }
  }

  solveInstantly(): StepResult {
    while (this.isTraining) {
      this.step();
    }
    return this.getResult();
  }

  private getResult(): StepResult {
    const heatmap = new Map<string, number>();
    this.qTable.forEach((actions, posStr) => {
      heatmap.set(posStr, Math.max(...Object.values(actions)));
    });

    // Convert persistent exploredCells set to Position[] for the UI
    const allExplored: Position[] = Array.from(this.exploredCells).map(str => {
      const [x, y] = str.split(',').map(Number);
      return { x, y };
    });

    // Fix 9: Check whether the extracted path actually reached the goal
    const lastCell = this.pathFound[this.pathFound.length - 1];
    const reachedGoal = lastCell?.x === this.goal?.x && lastCell?.y === this.goal?.y;
    const finishedStatus = reachedGoal ? 'OPTIMIZED' : 'PARTIAL PATH';

    return {
      currentPosition: this.currentPosition,
      visitedNodes: allExplored,
      isFinished: this.isFinished,
      pathFound: [...this.pathFound],
      metadata: {
        episode: this.episodeCount,
        epsilon: this.epsilon,
        status: this.isTraining ? 'TRAINING' : finishedStatus, // Fix 9
        pathLength: this.pathFound.length > 0 ? this.pathFound.length : undefined, // Fix 2
        visitedCount: this.exploredCells.size,                                      // Fix 3
      },
      qValues: heatmap
    };
  }
}