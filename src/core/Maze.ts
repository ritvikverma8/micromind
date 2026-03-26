// src/core/Maze.ts

/**
 * Generates a perfect maze using Recursive Backtracking.
 * Returns a 2D array where 1 = Wall and 0 = Path.
 */
export function generateMaze(width: number, height: number): number[][] {
  // The algorithm requires odd dimensions to leave room for walls
  const cols = width % 2 === 0 ? width + 1 : width;
  const rows = height % 2 === 0 ? height + 1 : height;

  // 1. Initialize the grid filled entirely with walls (1)
  const maze: number[][] = Array.from({ length: rows }, () => Array(cols).fill(1));

  // Directions for carving: Up, Down, Left, Right (jumping 2 cells at a time)
  const dirs = [
    [0, -2], [0, 2], [-2, 0], [2, 0]
  ];

  // Helper to check if a cell is within bounds and is still a wall
  function isValid(x: number, y: number) {
    return x > 0 && x < cols - 1 && y > 0 && y < rows - 1 && maze[y][x] === 1;
  }

  // 2. The core recursive algorithm
  function carvePassagesFrom(cx: number, cy: number) {
    maze[cy][cx] = 0; // Mark current cell as a path

    // Randomize the order we check directions to create the maze chaos
    const shuffledDirs = [...dirs].sort(() => Math.random() - 0.5);

    for (const [dx, dy] of shuffledDirs) {
      const nx = cx + dx;
      const ny = cy + dy;

      if (isValid(nx, ny)) {
        // Knock down the wall *between* current cell and next cell
        maze[cy + dy / 2][cx + dx / 2] = 0;
        
        // Recursively carve from the new cell
        carvePassagesFrom(nx, ny);
      }
    }
  }

  // 3. Start carving from the top-left corner
  carvePassagesFrom(1, 1);

  // 4. Force open the Start (top-left) and Goal (bottom-right) just to be safe
  maze[1][1] = 0; 
  maze[rows - 2][cols - 2] = 0; 

  return maze;
}