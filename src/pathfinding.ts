/** A deterministic four-neighbour A* on the town's tile grid. */
export interface GridPoint { x: number; y: number }
export type IsBlocked = (x: number, y: number) => boolean;
export const TOWN_WIDTH = 31;
export const TOWN_HEIGHT = 17;

/**
 * Returns consecutive steps after `start`, including `goal`, or null if either
 * endpoint is invalid/blocked or there is no route. A valid start equal to the
 * goal returns an empty route. The obstacle callback must be stable for the
 * duration of this call; callers should re-plan when world obstacles change.
 */
export function findPath(
  start: GridPoint,
  goal: GridPoint,
  isBlocked: IsBlocked = () => false,
  width = TOWN_WIDTH,
  height = TOWN_HEIGHT,
): GridPoint[] | null {
  if (!Number.isSafeInteger(width) || width <= 0 || !Number.isSafeInteger(height) || height <= 0) return null;
  const valid = ({ x, y }: GridPoint) => Number.isSafeInteger(x) && Number.isSafeInteger(y) && x >= 0 && x < width && y >= 0 && y < height;
  if (!valid(start) || !valid(goal) || isBlocked(start.x, start.y) || isBlocked(goal.x, goal.y)) return null;
  if (start.x === goal.x && start.y === goal.y) return [];

  const index = (x: number, y: number) => y * width + x;
  const startIndex = index(start.x, start.y);
  const goalIndex = index(goal.x, goal.y);
  const size = width * height;
  const cost = new Float64Array(size).fill(Infinity);
  const previous = new Int32Array(size).fill(-1);
  const closed = new Uint8Array(size);
  const open: number[] = [startIndex];
  const inOpen = new Uint8Array(size);
  inOpen[startIndex] = 1;
  cost[startIndex] = 0;
  const heuristic = (id: number) => Math.abs(id % width - goal.x) + Math.abs(Math.floor(id / width) - goal.y);
  // Fixed order makes otherwise equivalent routes reproducible across runs.
  const directions: ReadonlyArray<readonly [number, number]> = [[0, -1], [-1, 0], [1, 0], [0, 1]];

  while (open.length) {
    let best = 0;
    for (let i = 1; i < open.length; i++) {
      const score = cost[open[i]] + heuristic(open[i]);
      const bestScore = cost[open[best]] + heuristic(open[best]);
      if (score < bestScore || (score === bestScore && heuristic(open[i]) < heuristic(open[best]))) best = i;
    }
    const current = open.splice(best, 1)[0];
    inOpen[current] = 0;
    if (current === goalIndex) {
      const steps: GridPoint[] = [];
      for (let at = current; at !== startIndex; at = previous[at]) {
        steps.push({ x: at % width, y: Math.floor(at / width) });
      }
      return steps.reverse();
    }
    closed[current] = 1;
    const x = current % width, y = Math.floor(current / width);
    for (const [dx, dy] of directions) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height || isBlocked(nx, ny)) continue;
      const next = index(nx, ny);
      if (closed[next]) continue;
      const nextCost = cost[current] + 1;
      if (nextCost >= cost[next]) continue;
      previous[next] = current;
      cost[next] = nextCost;
      if (!inOpen[next]) { open.push(next); inOpen[next] = 1; }
    }
  }
  return null;
}
