import type { Place } from './types';
import { TOWN_HEIGHT, TOWN_WIDTH } from './pathfinding';
import { SQUARE_DOORS } from './scene-transitions';

/**
 * Solid cells painted by renderer.ts, in 32px scene-local tiles. Pure lookup;
 * furniture that can be walked over (rugs, food, flowers, doorways) is omitted.
 * Revisit this table whenever the renderer's fixed scene layout changes.
 * The player and NPC scene grids are not a shared global town map.
 */
export function isSceneBlocked(place: Place, x: number, y: number, beds: number): boolean {
  if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y) || x <= 0 || y <= 0 || x >= TOWN_WIDTH - 1 || y >= TOWN_HEIGHT - 1) return true;
  const at = (ax: number, ay: number) => x === ax && y === ay;
  const any = (points: readonly (readonly [number, number])[]) => points.some(([px, py]) => at(px, py));
  const row = (py: number, from: number, to: number) => y === py && x >= from && x <= to;
  const square = (left: number, top: number) => x >= left && x <= left + 2 && y >= top && y <= top + 2;

  if (place === 'inn') {
    if (y === 1 || row(4, 3, 9) || (y === 7 && [12,13,14,16,17,18,20,21,22].includes(x))) return true;
    // Match the renderer's actual dynamic bed and adjacent chest placements.
    for (let i = 0; i < Math.max(0, Math.floor(beds)); i++) {
      const bx = 3 + (i % 7) * 4, by = 11 + Math.floor(i / 7) * 2;
      if (by < 15 && (at(bx, by) || at(bx + 1, by))) return true;
    }
    return any([[2,2],[3,2],[4,2],[23,2],[24,2],[25,2],[27,4],[2,3],[28,12],
      [2,5],[10,5],[26,4],[27,11],[19,12],[12,4],[21,4],[27,8],[3,14],[25,11]]);
  }
  if (place === 'guild') return row(4,4,12) || any([[6,2],[12,2],[18,2],[24,2],[15,8],[20,8],[25,8],[23,3],[3,11]]);
  if (place === 'clinic') return (y === 1 && [4,9,14,19,24].includes(x)) || any([[5,6],[6,6],[10,6],[11,6],[15,6],[16,6],[20,6],[21,6],[25,6],[26,6],[4,3],[27,4]]);

  // Each facade is 96×96 (3×3 tiles); decorative flowers remain walkable.
  if (place === 'market') {
    return square(3,3) || square(13,3) || square(23,3) || any([[6,5],[12,5],[20,5],[25,5],[6,6],[12,6],[20,6],[25,6],[9,13],[21,13]]);
  }
  if (place === 'square') return SQUARE_DOORS.some(d=>square(d.x-1,3)) || any([[9,13],[21,13]]);
  return square(14,2) || square(4,4) || square(24,4) || any([[9,13],[21,13]]);
}
