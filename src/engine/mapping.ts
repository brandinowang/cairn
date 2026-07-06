import type { Category, StoneParams, Task } from '../types';
import { mulberry32 } from './rng';

// ── Tunable constants ──────────────────────────────────────────────
export const PRIORITY_MASS: Record<Task['priority'], number> = {
  low: 0.72,
  med: 1.0,
  high: 1.35,
};

export const ASPECT_MIN = 0.4;
export const ASPECT_MAX = 2.6;
export const TITLE_LENGTH_MIN = 0;
export const TITLE_LENGTH_MAX = 60;

export const COMPLEXITY_MIN = 0.05;
export const COMPLEXITY_MAX = 1.0;
export const HOURS_MIN = 0;
export const HOURS_MAX = 72;

export const CATEGORY_PRIMITIVE: Record<string, StoneParams['primitive']> = {
  studio: 'slab',
  admin: 'shard',
  design: 'facet',
  build: 'core',
  signal: 'core',
};

export const DEFAULT_PRIMITIVES: StoneParams['primitive'][] = [
  'slab',
  'shard',
  'core',
  'nodule',
  'facet',
];

export const NO_CATEGORY_MATERIALS: Array<'aluminum' | 'walnut' | 'graphite'> = [
  'aluminum',
  'walnut',
  'graphite',
];

const SIGNAL_CATEGORY_NAME = 'SIGNAL';

function mapTitleToAspect(titleLength: number): number {
  const t = Math.max(TITLE_LENGTH_MIN, Math.min(TITLE_LENGTH_MAX, titleLength));
  const ratio = (t - TITLE_LENGTH_MIN) / (TITLE_LENGTH_MAX - TITLE_LENGTH_MIN);
  return ASPECT_MIN + ratio * (ASPECT_MAX - ASPECT_MIN);
}

function mapDurationToComplexity(createdAt: number, completedAt: number): number {
  const hours = (completedAt - createdAt) / 3.6e6;
  const h = Math.max(HOURS_MIN, Math.min(HOURS_MAX, hours));
  const ratio = (h - HOURS_MIN) / (HOURS_MAX - HOURS_MIN);
  return COMPLEXITY_MIN + ratio * (COMPLEXITY_MAX - COMPLEXITY_MIN);
}

function pickPrimitive(
  category: Category | null,
  rng: () => number,
): StoneParams['primitive'] {
  if (category) {
    const key = category.name.toLowerCase();
    if (CATEGORY_PRIMITIVE[key]) {
      return CATEGORY_PRIMITIVE[key];
    }
  }
  const idx = Math.floor(rng() * DEFAULT_PRIMITIVES.length);
  return DEFAULT_PRIMITIVES[idx];
}

function pickMaterial(
  task: Task,
  category: Category | null,
  rng: () => number,
): StoneParams['material'] {
  const isSignalCategory =
    category?.name.toUpperCase() === SIGNAL_CATEGORY_NAME;
  if (task.priority === 'high' || isSignalCategory) {
    return 'red';
  }
  if (category) {
    return category.material;
  }
  const idx = Math.floor(rng() * NO_CATEGORY_MATERIALS.length);
  return NO_CATEGORY_MATERIALS[idx];
}

export function taskToStone(task: Task, category: Category | null): StoneParams {
  const rng = mulberry32(task.seed);

  const primitive = pickPrimitive(category, rng);
  const mass = PRIORITY_MASS[task.priority] * (0.9 + 0.2 * rng());
  const aspect = mapTitleToAspect(task.title.length);
  const complexity =
    task.completedAt != null
      ? mapDurationToComplexity(task.createdAt, task.completedAt)
      : COMPLEXITY_MIN;
  const material = pickMaterial(task, category, rng);
  const rotationSeed = rng();
  const jitter: [number, number] = [
    (rng() - 0.5) * 2,
    (rng() - 0.5) * 2,
  ];

  return {
    taskId: task.id,
    primitive,
    mass,
    aspect,
    complexity,
    material,
    rotationSeed,
    jitter,
  };
}
