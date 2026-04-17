# MICROMIND_

> **Grid Intelligence & Pathfinding Lab**  
> A visual comparison engine for classical pathfinding algorithms vs. reinforcement learning agents navigating a procedurally generated maze.

---

## Overview

MicroMind is an interactive web application that visualises and contrasts fundamentally different approaches to solving a maze:

- **Classical algorithms** (A\*, Dijkstra) — deterministic, informed search with complete knowledge of the cost function.
- **Reinforcement learning** (Q-Learning, Deep Q-Learning) — model-free AI agents that learn purely through trial and error, ranging from standard tabular memorisation (Q-Learning) to generalised function approximation using Neural Networks (Deep Q-Learning).

The project was built as an AI coursework submission to demonstrate state space exploration, heuristic search, temporal difference learning, and deep reinforcement learning in a single interactive demo.

---

## Demo

| Mode | What you see |
|---|---|
| **A\* Search** | Agent explores using Manhattan distance heuristic, yellow path shows optimal route. |
| **Dijkstra** | Agent explores uniformly in all directions, finds same optimal path with more cells visited. |
| **Q-Learning** | Agent trains over N episodes, green heatmap builds up as Q-values converge, cyan dot shows live position. |
| **Deep Q-Learning** | Agent trains a custom Neural Network via Experience Replay. Uses proximity shaping to learn faster and a hybrid DQL+BFS approach for precise final-mile path extraction. |

---

## Features

- **4 algorithm modes** — A\*, Dijkstra, Q-Learning, and Deep Q-Learning (DQL) selectable from a dropdown.
- **Dependency-Free Neural Network** — DQL uses a custom-built TypeScript Neural Network (no TensorFlow or external libraries).
- **Procedural maze generation** — unique maze every run via recursive backtracking DFS.
- **Live Q-value heatmap** — cell brightness reflects the agent's expected future rewards for each state.
- **Fog-free exploration tracking** — visited cells persist across all RL episodes.
- **Live agent position** — cyan dot follows the agent in real time during training and search.
- **4 simulation speeds** — Slow / Normal / Fast / Turbo (200ms → 4ms per tick).
- **Step-by-step mode** — advance one action at a time for detailed inspection.
- **5 grid sizes** — 10×10 up to 50×50.
- **Stats panel** — tracks Episode, Epsilon, Time Elapsed, Path Length, Cells Explored, and Process Status live.
- **Hybrid Path Extraction** — Deep Q-Learning uses a hybrid mode (OPTIMIZED HYBRID) to merge policy walks with BFS for perfect pathing.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Styling | Tailwind CSS v4 |
| Build tool | Vite |
| State management | React hooks (`useState`, `useRef`, `useCallback`) |
| Rendering | CSS Grid (no canvas) |
| AI Engines | Custom A\*, Dijkstra, Q-Learning, and Deep Q-Learning implementations |

---

## Project Structure

```
src/
├── core/
│   ├── types.ts            — Position, Action, StepResult, MazeSolver interface
│   ├── Maze.ts             — generateMaze() via recursive backtracking
│   ├── AStar.ts            — A* with Manhattan distance heuristic
│   ├── Dijkstra.ts         — Dijkstra uniform cost search
│   ├── QLearningAgent.ts   — Q-Learning with ε-greedy policy (Tabular)
│   ├── NeuralNetwork.ts    — Custom, minimal 3-layer backprop MLP
│   └── DQLAgent.ts         — Deep Q-Learning with Experience Replay & Proximity Shaping
├── hooks/
│   └── useSimulation.ts    — setInterval engine, speed control, timing, state
├── components/
│   ├── layout/
│   │   └── ControlBar.tsx  — algorithm selector, grid size, speed, run/step/reset
│   ├── simulation/
│   │   └── MazeGrid.tsx    — CSS grid renderer with heatmap + agent layers
│   └── stats/
│       └── StatsPanel.tsx  — live metrics display
└── App.tsx                 — root state: maze, algorithm, layout
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm or yarn

### Installation

```bash
git clone https://github.com/your-username/micromind.git
cd micromind
npm install
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

```bash
npm run build
```

---

## Mathematical Foundation

### Maze Generation — Recursive Backtracking

The maze is a `number[][]` grid where `1 = wall` and `0 = path`. Always generated with odd dimensions so walls and passages align correctly.

```
Algorithm:
1. Start at cell (1,1), mark as visited
2. Pick a random unvisited neighbour 2 cells away
3. Carve the wall between current cell and neighbour
4. Recurse from neighbour
5. Backtrack when no unvisited neighbours remain
```

---

### A\* Search

Minimises the evaluation function: $f(n) = g(n) + h(n)$

Where:
- $g(n)$ — actual cost from start to node $n$
- $h(n)$ — Manhattan distance heuristic: $|x_{goal} - x_n| + |y_{goal} - y_n|$
- $f(n)$ — estimated total cost through $n$

Guaranteed to find the optimal path when the heuristic is admissible.

---

### Dijkstra's Algorithm

Special case of A\* with $h(n) = 0$ — no heuristic, purely uniform cost: $f(n) = g(n)$

Guaranteed optimal but explores the maze radially in all directions, visiting significantly more cells than A\*.

---

### Q-Learning (Tabular)

The agent interacts with the environment $(S, A, R, S')$ and learns an optimal policy $\pi^*$ via the **Bellman equation**, storing values in a massive lookup table:

$$Q(s, a) \leftarrow Q(s, a) + \alpha \left[ R + \gamma \max_{a'} Q(s', a') - Q(s, a) \right]$$

**Reward shaping:**
- Reaching the goal: `+500`
- Hitting a wall: `-5`
- Visiting a new cell: `+2`
- Standard step penalty: `-1`

---

### Deep Q-Learning (DQL)

Instead of a lookup table, a **Neural Network** approximates Q-values. The input is an 8-parameter state vector (normalized coordinates, delta to goal, and immediate wall layout) and it outputs 4 Q-values (`UP, DOWN, LEFT, RIGHT`).

**Key Enhancements:**
1. **Experience Replay**: Stores `[State, Action, Reward, NextState]` in a memory buffer. The network trains dynamically via random batches, breaking the perilous correlation of sequential game steps.
2. **Target Network**: Uses a delayed secondary network to calculate expected future rewards $\gamma \max Q(s', a')$, keeping the learning target stable.
3. **Proximity Shaping**: Instead of flat `+2` bonuses, it uses a Manhattan Distance gradient: `Base Reward + (oldDist - newDist) * 0.5`. Moving closer to the goal yields higher rewards, pulling the agent dynamically rather than blindly wandering.
4. **Hybrid Path Extraction**: In edge cases where DQL gets stuck in a loop near the goal ("last-mile" approximation error), it automatically stitches the pure DQL policy walk along the known optimal BFS path.

---

## Algorithm Comparison

| Metric | A\* | Dijkstra | Q-Learning | Deep Q-Learning (DQL) |
|---|---|---|---|---|
| Approach | Classical informed search | Classical uninformed search | Reinforcement Learning (Tabular) | Reinforcement Learning (Neural Net) |
| Path optimality | Always optimal | Always optimal | Near-optimal (converges) | Hybrid/Optimized |
| Requires maze knowledge | Yes (at search time) | Yes (at search time) | No (learns from scratch) | No (learns from scratch) |
| State Space Limits | Memory limits | Memory limits | Explodes on massive grids | **Massively Scalable** |
| Generalisation | None | None | None | **High (understands features)** |

---

## Implementation Notes

### Sub-stepping Engine
To keep the UI responsive during RL training, the simulation hook runs a burst of steps per animation frame rather than one per tick:
- Grids ≤ 30×30: 50 steps per frame
- Grids > 30×30: 100 steps per frame

### Interval Safety
`togglePlay` always clears any existing `setInterval` before creating a new one, preventing timer leaks from rapid button clicks. Speed changes mid-run also restart the interval at the new rate.

### Q-Value Heatmap
Cell brightness is normalised against the current maximum Q-value in the table/network output:
```
intensity = cellMaxQ / globalMaxQ
backgroundColor = rgba(34, 197, 94, intensity × 0.5)
```

---

## Controls Reference

| Control | Action |
|---|---|
| `RUN` | Start the simulation loop |
| `PAUSE` | Pause without resetting state |
| `STEP` | Advance exactly one action |
| `RESET RUN` | Restart on the same maze |
| `NEW MAZE` | Generate a new maze and reset |
| Speed buttons | Change tick rate (Slow → Turbo) |
| Algorithm dropdown | Switch between A\*, Dijkstra, Q-Learning, Deep Q-Learning |
| Grid scale dropdown | Change maze size (10×10 → 50×50) |

---

## License

MIT
