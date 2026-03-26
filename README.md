# MICROMIND_

> **Grid Intelligence & Pathfinding Lab**  
> A visual comparison engine for classical pathfinding algorithms vs. reinforcement learning agents navigating a procedurally generated maze.

---

## Overview

MicroMind is an interactive web application that visualises and contrasts two fundamentally different approaches to solving a maze:

- **Classical algorithms** (A\*, Dijkstra) — deterministic, informed search with complete knowledge of the cost function
- **Reinforcement learning** (Q-Learning) — a model-free AI agent that learns purely through trial and error, with no prior knowledge of the maze

The project was built as an AI coursework submission to demonstrate state space exploration, heuristic search, and temporal difference learning in a single interactive demo.

---

## Demo

| Mode | What you see |
|---|---|
| **A\* Search** | Agent explores using Manhattan distance heuristic, yellow path shows optimal route |
| **Dijkstra** | Agent explores uniformly in all directions, finds same optimal path with more cells visited |
| **Q-Learning** | Agent trains over N episodes, green heatmap builds up as Q-values converge, cyan dot shows live position |

---

## Features

- **3 algorithm modes** — A\*, Dijkstra, Q-Learning selectable from a dropdown
- **Procedural maze generation** — unique maze every run via recursive backtracking DFS
- **Live Q-value heatmap** — cell brightness reflects the agent's learned value for each state
- **Fog-free exploration tracking** — visited cells persist across all Q-Learning episodes
- **Live agent position** — cyan dot follows the agent in real time during training and search
- **4 simulation speeds** — Slow / Normal / Fast / Turbo (200ms → 4ms per tick)
- **Step-by-step mode** — advance one action at a time for detailed inspection
- **5 grid sizes** — 10×10 up to 50×50
- **Stats panel** — tracks Episode, Epsilon, Time Elapsed, Path Length, Cells Explored, and Process Status live
- **Partial path detection** — Q-Learning reports `PARTIAL PATH` if training didn't fully converge
- **Reset vs New Maze** — reset reruns the same maze; New Maze generates a fresh one

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Styling | Tailwind CSS v4 |
| Build tool | Vite |
| State management | React hooks (`useState`, `useRef`, `useCallback`) |
| Rendering | CSS Grid (no canvas) |
| AI engine | Custom Q-Learning implementation |

---

## Project Structure

```
src/
├── core/
│   ├── types.ts            — Position, Action, StepResult, MazeSolver interface
│   ├── Maze.ts             — generateMaze() via recursive backtracking
│   ├── AStar.ts            — A* with Manhattan distance heuristic
│   ├── Dijkstra.ts         — Dijkstra uniform cost search
│   └── QLearningAgent.ts   — Q-Learning with ε-greedy policy
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

This always produces a **perfect maze** — exactly one path between any two cells, no loops, no isolated regions.

---

### A\* Search

Minimises the evaluation function:

$$f(n) = g(n) + h(n)$$

Where:
- $g(n)$ — actual cost from start to node $n$
- $h(n)$ — Manhattan distance heuristic: $|x_{goal} - x_n| + |y_{goal} - y_n|$
- $f(n)$ — estimated total cost through $n$

The heuristic guides the search toward the goal, meaning A\* explores far fewer cells than Dijkstra on the same maze. Guaranteed to find the optimal path when the heuristic is admissible (never overestimates).

---

### Dijkstra's Algorithm

Special case of A\* with $h(n) = 0$ — no heuristic, purely uniform cost:

$$f(n) = g(n)$$

Expands nodes in order of their distance from the start. Guaranteed optimal but explores the maze radially in all directions, visiting significantly more cells than A\*. The `Cells_Explored` stat in the panel makes this difference quantifiable.

---

### Q-Learning

The agent interacts with the environment $(S, A, R, S')$ and learns an optimal policy $\pi^*$ via the **Bellman equation**:

$$Q(s, a) \leftarrow Q(s, a) + \alpha \left[ R + \gamma \max_{a'} Q(s', a') - Q(s, a) \right]$$

**Hyperparameters:**

| Parameter | Value | Role |
|---|---|---|
| $\alpha$ (learning rate) | 0.3 | How fast Q-values update |
| $\gamma$ (discount factor) | 0.9 | How much future rewards matter |
| $\varepsilon$ (epsilon) start | 1.0 | Full random exploration |
| $\varepsilon$ minimum | 0.01 | Minimum exploitation floor |
| $\varepsilon$ decay | 0.96 (small) / 0.985 (large grids) | Exploration → exploitation transition |

**Reward shaping:**

| Event | Reward |
|---|---|
| Reaching the goal | +500 |
| Hitting a wall | −5 |
| Visiting a new cell (per episode) | +2 |
| Standard step penalty | −1 |

**Training phases:**
1. **Exploration** — high ε, agent moves mostly randomly, builds Q-table through trial and error
2. **Exploitation** — low ε, agent follows learned Q-values, path quality improves each episode
3. **Sprint** — after training completes, agent runs a greedy walk using the final Q-table

`maxEpisodes` scales dynamically: `max(100, totalCells × 0.2)`

---

## Algorithm Comparison

Running all three algorithms on the same maze and comparing the Stats Panel reveals:

| Metric | A\* | Dijkstra | Q-Learning |
|---|---|---|---|
| Path optimality | Always optimal | Always optimal | Near-optimal (converges) |
| Cells explored | Fewest (heuristic guides it) | More (no directional bias) | Depends on training |
| Requires maze knowledge | Yes (at search time) | Yes (at search time) | No (learns from scratch) |
| Time complexity | $O(E \log V)$ | $O(E \log V)$ | $O(\text{episodes} \times \text{steps})$ |
| Approach | Classical informed search | Classical uninformed search | Reinforcement learning |

---

## Implementation Notes

### Sub-stepping Engine
To keep the UI responsive during Q-Learning training, the simulation hook runs a burst of steps per animation frame rather than one per tick:
- Grids ≤ 30×30: 50 steps per frame
- Grids > 30×30: 100 steps per frame

### Interval Safety
`togglePlay` always clears any existing `setInterval` before creating a new one, preventing timer leaks from rapid button clicks. Speed changes mid-run also restart the interval at the new rate.

### Q-Value Heatmap
Cell brightness is normalised against the current maximum Q-value in the table:
```
intensity = cellMaxQ / globalMaxQ
backgroundColor = rgba(34, 197, 94, intensity × 0.5)
```

### Explored Cells vs Visited Nodes
Q-Learning maintains two separate tracking structures:
- `visitedNodes` — resets each episode, used for the per-episode exploration bonus reward
- `exploredCells` — persists across all episodes, used for the UI heatmap and `Cells_Explored` stat

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
| Algorithm dropdown | Switch between A\*, Dijkstra, Q-Learning |
| Grid scale dropdown | Change maze size (10×10 → 50×50) |

---

## License

MIT
