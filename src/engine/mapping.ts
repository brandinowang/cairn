import type { Category, FieldPrimitive, Task } from '../types';
import type { GrowthStep, ResolvedFormProfile } from './blueprints';
import { mulberry32 } from './rng';

export const PRIORITY_MASS: Record<Task['priority'], number> = {
  low: 0.96,
  med: 1.0,
  high: 1.12,
};

export const BASE_MASS = 1.15;

const SIGNAL_CATEGORY_NAME = 'SIGNAL';

function mapTitleToAspect(titleLength: number): number {
  const t = Math.max(0, Math.min(60, titleLength));
  return 0.98 + (t / 60) * 0.04;
}

function pickMaterial(
  task: Task,
  category: Category | null,
): FieldPrimitive['material'] {
  const isSignal = category?.name.toUpperCase() === SIGNAL_CATEGORY_NAME;
  if (task.priority === 'high' || isSignal) return 'red';
  if (category) return category.material;
  return 'aluminum';
}

export function taskToPrimitive(
  task: Task,
  category: Category | null,
  profile: ResolvedFormProfile | null = null,
  step: GrowthStep | null = null,
  _depositIndex = 0,
): FieldPrimitive {
  const rng = mulberry32(task.seed);
  const [aspectMin, aspectMax] = profile?.aspectRange ?? [0.55, 0.75];
  const titleAspect = mapTitleToAspect(task.title.length);
  const aspectScale = step?.aspectScale ?? 1;
  const aspect =
    (aspectMin + rng() * (aspectMax - aspectMin)) * titleAspect * aspectScale;

  const massScale = step?.massScale ?? 1;
  const isAccent = task.priority === 'high' || category?.name.toUpperCase() === SIGNAL_CATEGORY_NAME;
  const mass =
    BASE_MASS *
    PRIORITY_MASS[task.priority] *
    massScale *
    (isAccent ? 0.72 : 1) *
    (0.98 + rng() * 0.04);

  return {
    taskId: task.id,
    type: 'box',
    mass,
    aspect,
    complexity: 0,
    material: pickMaterial(task, category),
    rotationSeed: 0,
    cornerRadius: 0.012,
    position: [0, 0, 0],
  };
}

/** @deprecated alias */
export const taskToStone = taskToPrimitive;
