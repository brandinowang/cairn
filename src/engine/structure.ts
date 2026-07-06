import type { Category, CairnStructure, PlacedStone, StoneParams, Task } from '../types';
import { buildGeometry, getGeometryHeight } from './geometry';
import { taskToStone } from './mapping';
import { xfnv1a } from './rng';

// ── Tunable constants ──────────────────────────────────────────────
export const JITTER_SCALE = 0.03;
export const LEAN_PER_STONE = 0.004;
export const MAX_LEAN = 0.12;
export const LEAN_CORRECTION = 0.85;

export function computeStoneParams(
  task: Task,
  categories: Category[],
): StoneParams | null {
  if (task.completedAt == null) return null;
  const category = categories.find((c) => c.id === task.categoryId) ?? null;
  return taskToStone(task, category);
}

export function buildCairnStructure(
  tasks: Task[],
  categories: Category[],
): CairnStructure {
  const completed = tasks
    .filter((t) => t.completedAt != null)
    .sort((a, b) => (a.completedAt! - b.completedAt!));

  const stones: PlacedStone[] = [];
  let runningHeight = 0;
  let leanX = 0;
  let leanZ = 0;

  for (const task of completed) {
    const params = computeStoneParams(task, categories);
    if (!params) continue;

    const geo = buildGeometry(params);
    const fullHeight = getGeometryHeight(geo);
    const halfHeight = fullHeight / 2;
    const y = runningHeight + halfHeight;

    leanX = leanX * LEAN_CORRECTION + params.jitter[0] * LEAN_PER_STONE;
    leanZ = leanZ * LEAN_CORRECTION + params.jitter[1] * LEAN_PER_STONE;
    leanX = Math.max(-MAX_LEAN, Math.min(MAX_LEAN, leanX));
    leanZ = Math.max(-MAX_LEAN, Math.min(MAX_LEAN, leanZ));

    const footprint = 0.9 * params.mass;
    const jitterX = params.jitter[0] * footprint * JITTER_SCALE;
    const jitterZ = params.jitter[1] * footprint * JITTER_SCALE;
    const rotation = params.rotationSeed * Math.PI * 2;

    stones.push({
      params,
      position: [jitterX, y, jitterZ],
      rotation,
      height: fullHeight,
    });

    runningHeight += fullHeight;
  }

  const serial = `CRN-${xfnv1a(completed.map((t) => t.id).join('')).toString(16).toUpperCase().slice(0, 6)}-${completed.length.toString().padStart(3, '0')}`;

  return {
    stones,
    totalHeight: runningHeight,
    lean: [leanX, leanZ],
    serial,
  };
}
