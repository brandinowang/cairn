import type { Archetype, Category, FusedStructure, Task } from '../types';
import { buildFieldPrimitives, dominantMaterial, pickArchetype } from './accretion';
import { resolveFormProfile } from './blueprints';
import { computeBlendK, fieldCacheKey } from './field';
import { taskToPrimitive } from './mapping';
import { xfnv1a } from './rng';

export function getCompletedTasks(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => t.completedAt != null)
    .sort((a, b) => a.completedAt! - b.completedAt!);
}

export function buildSerial(completed: Task[]): string {
  return `CRN-${xfnv1a(completed.map((t) => t.id).join('')).toString(16).toUpperCase().slice(0, 6)}-${completed.length.toString().padStart(3, '0')}`;
}

export function buildFusedStructure(
  tasks: Task[],
  categories: Category[],
  refineLevel: number,
  resolvedArchetype: Archetype | null,
  animBlendBoost = 0,
  formSeed = 0,
): FusedStructure {
  const completed = getCompletedTasks(tasks);
  const autoArchetype = pickArchetype(tasks, categories, formSeed);
  const archetype = resolvedArchetype ?? autoArchetype;
  const profile = resolveFormProfile(archetype, formSeed);
  const primitives = buildFieldPrimitives(tasks, categories, archetype, formSeed, profile);
  const blendK =
    (computeBlendK(completed.length, refineLevel) + animBlendBoost) * profile.blendScale;
  const features = profile.features;

  const totalHeight =
    primitives.length > 0
      ? Math.max(...primitives.map((p) => p.position[1] + p.mass * p.aspect * 0.35))
      : 0;

  return {
    primitives,
    blendK,
    blendScale: profile.blendScale,
    blueprintId: profile.blueprintId,
    archetype: autoArchetype,
    resolvedArchetype,
    features,
    serial: buildSerial(completed),
    totalHeight,
    dominantMaterial: dominantMaterial(primitives),
  };
}

export function fusedCacheKey(structure: FusedStructure): string {
  const primSig = structure.primitives
    .map(
      (p) =>
        `${p.taskId}:${p.type}:${p.mass.toFixed(3)}:${p.aspect.toFixed(3)}:${p.complexity.toFixed(3)}:${p.rotationSeed.toFixed(3)}:${p.position.map((v) => v.toFixed(3)).join(',')}`,
    )
    .join('|');
  const feat = structure.features;
  const featSig = `${feat.flattenBase}|${feat.boreRadius}|${feat.mirrorX}|${feat.concavity}`;
  return fieldCacheKey(
    structure.primitives.map((p) => p.taskId),
    structure.blendK,
    structure.archetype,
    structure.resolvedArchetype,
  ).concat(`|${primSig}|${featSig}|${structure.blueprintId}|${structure.blendScale}`);
}

export function computeStoneParams(task: Task, categories: Category[]) {
  if (task.completedAt == null) return null;
  const category = categories.find((c) => c.id === task.categoryId) ?? null;
  return taskToPrimitive(task, category);
}

export function buildFormLibrary(tasks: Task[], categories: Category[]) {
  return getCompletedTasks(tasks)
    .map((task) => {
      const params = computeStoneParams(task, categories);
      if (!params) return null;
      const category = categories.find((c) => c.id === task.categoryId) ?? null;
      return { task, params, category };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry != null)
    .reverse();
}

/** @deprecated v1 compat */
export function buildCairnStructure(tasks: Task[], categories: Category[]) {
  const fused = buildFusedStructure(tasks, categories, 0.5, null);
  return {
    stones: fused.primitives.map((p) => ({
      params: {
        ...p,
        primitive: p.type,
        jitter: [0, 0] as [number, number],
      },
      position: p.position,
      rotation: p.rotationSeed * Math.PI * 2,
      height: p.mass * p.aspect * 0.35,
    })),
    totalHeight: fused.totalHeight,
    lean: [0, 0] as [number, number],
    serial: fused.serial,
  };
}
