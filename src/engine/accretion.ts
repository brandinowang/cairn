import type { Archetype, Category, FieldPrimitive, Task, Vec3 } from '../types';
import {
  growthStepForIndex,
  resolveAnchorIndex,
  resolveFormProfile,
  type AttachmentDir,
  type ResolvedFormProfile,
} from './blueprints';
import { getPrimitiveExtents } from './field';
import { mulberry32, xfnv1a } from './rng';
import { taskToPrimitive } from './mapping';

export const BASE_PAD = 0.04;

const CATEGORY_ARCHETYPE: Record<string, Archetype> = {
  studio: 'MONUMENT',
  admin: 'TRAY',
  design: 'VESSEL',
  build: 'HANDHELD',
  signal: 'HOLDER',
};

const ALL_ARCHETYPES: Archetype[] = ['MONUMENT', 'TRAY', 'VESSEL', 'HANDHELD', 'HOLDER'];

function jitter(rng: () => number, scale: number): number {
  return (rng() - 0.5) * scale;
}

function overlapFor(dir: AttachmentDir): number {
  switch (dir) {
    case 'left':
    case 'right':
    case 'front':
    case 'back':
      return 1.08;
    case 'top':
      return 0.9;
    case 'topLeft':
    case 'topRight':
      return 0.92;
    case 'topFront':
      return 0.86;
    default:
      return 0.95;
  }
}

function attachmentOffset(
  dir: AttachmentDir,
  prevExt: ReturnType<typeof getPrimitiveExtents>,
  nextExt: ReturnType<typeof getPrimitiveExtents>,
  rng: () => number,
  jitterScale: number,
): Vec3 {
  const o = overlapFor(dir);
  const j = jitterScale;
  const jx = () => jitter(rng, prevExt.rx * j);
  const jy = () => jitter(rng, prevExt.ry * j * 0.35);
  const jz = () => jitter(rng, prevExt.rz * j);
  const terrace = (prevExt.ry + nextExt.ry) * 0.22;

  switch (dir) {
    case 'left':
      return [-(prevExt.rx + nextExt.rx) * o, terrace + jy(), jz()];
    case 'right':
      return [(prevExt.rx + nextExt.rx) * o, terrace + jy(), jz()];
    case 'front':
      return [jx(), terrace + jy(), (prevExt.rz + nextExt.rz) * o];
    case 'back':
      return [jx(), terrace + jy(), -(prevExt.rz + nextExt.rz) * o];
    case 'top':
      return [0, (prevExt.ry + nextExt.ry) * o, 0];
    case 'topLeft':
      return [
        -(prevExt.rx + nextExt.rx) * o * 0.82,
        (prevExt.ry + nextExt.ry) * o * 0.55,
        0,
      ];
    case 'topRight':
      return [
        (prevExt.rx + nextExt.rx) * o * 0.82,
        (prevExt.ry + nextExt.ry) * o * 0.55,
        0,
      ];
    case 'topFront':
      return [0, (prevExt.ry + nextExt.ry) * o * 0.5, (prevExt.rz + nextExt.rz) * o * 0.55];
    default:
      return [0, (prevExt.ry + nextExt.ry) * o * 0.52, 0];
  }
}

function clampAboveBase(position: Vec3, ext: ReturnType<typeof getPrimitiveExtents>): Vec3 {
  const minY = ext.ry + BASE_PAD;
  return [position[0], Math.max(position[1], minY), position[2]];
}

export function pickArchetype(tasks: Task[], categories: Category[], formSeed = 0): Archetype {
  const counts = new Map<Archetype, number>();

  for (const task of tasks) {
    if (!task.completedAt) continue;
    const cat = categories.find((c) => c.id === task.categoryId);
    const key = cat?.name.toLowerCase() ?? 'studio';
    const arch = CATEGORY_ARCHETYPE[key] ?? 'MONUMENT';
    counts.set(arch, (counts.get(arch) ?? 0) + 1);
  }

  if (counts.size === 0) {
    return ALL_ARCHETYPES[formSeed % ALL_ARCHETYPES.length] ?? 'MONUMENT';
  }

  let best: Archetype = 'MONUMENT';
  let max = 0;
  for (const [arch, n] of counts) {
    if (n > max) {
      max = n;
      best = arch;
    }
  }
  return best;
}

export function placeOnBase(prim: FieldPrimitive, formSeed: number, profile: ResolvedFormProfile): Vec3 {
  const ext = getPrimitiveExtents(prim);
  const rng = mulberry32(formSeed ^ xfnv1a(prim.taskId));
  const r = rng() * ext.rx * profile.spread * 0.04;
  return [r, ext.ry + BASE_PAD, 0];
}

export function placeAttachedTo(
  anchor: FieldPrimitive,
  next: FieldPrimitive,
  task: Task,
  index: number,
  formSeed: number,
  profile: ResolvedFormProfile,
): Vec3 {
  const step = growthStepForIndex(profile, index);
  const rng = mulberry32(task.seed + index * 13 + formSeed);
  const prevExt = getPrimitiveExtents(anchor);
  const nextExt = getPrimitiveExtents(next);
  const offset = attachmentOffset(
    step.direction,
    prevExt,
    nextExt,
    rng,
    (step.jitter ?? 0.003) * profile.jitterScale,
  );

  const position: Vec3 = [
    anchor.position[0] + offset[0],
    anchor.position[1] + offset[1],
    anchor.position[2] + offset[2],
  ];

  return clampAboveBase(position, nextExt);
}

export function attachmentReach(a: FieldPrimitive, b: FieldPrimitive): number {
  const ea = getPrimitiveExtents(a);
  const eb = getPrimitiveExtents(b);
  return (ea.rx + eb.rx + ea.ry + eb.ry + ea.rz + eb.rz) * 0.78;
}

export function isAttachedToPrevious(previous: FieldPrimitive, next: FieldPrimitive): boolean {
  const dx = next.position[0] - previous.position[0];
  const dy = next.position[1] - previous.position[1];
  const dz = next.position[2] - previous.position[2];
  return Math.hypot(dx, dy, dz) <= attachmentReach(previous, next);
}

/** One cohesive material — red accents stay small */
function harmonizeMaterials(primitives: FieldPrimitive[]): void {
  if (primitives.length === 0) return;
  const baseMaterial = primitives[0].material === 'red' ? 'aluminum' : primitives[0].material;
  for (const prim of primitives) {
    if (prim.material === 'red') continue;
    prim.material = baseMaterial;
  }
}

function rotateStructureY(primitives: FieldPrimitive[], angle: number): void {
  if (Math.abs(angle) < 1e-4) return;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  for (const prim of primitives) {
    const [x, , z] = prim.position;
    prim.position[0] = x * c - z * s;
    prim.position[2] = x * s + z * c;
  }
}

export function buildFieldPrimitives(
  tasks: Task[],
  categories: Category[],
  archetype: Archetype,
  formSeed: number,
  profile = resolveFormProfile(archetype, formSeed),
): FieldPrimitive[] {
  const completed = tasks
    .filter((t) => t.completedAt != null)
    .sort((a, b) => a.completedAt! - b.completedAt!);

  const primitives: FieldPrimitive[] = [];

  for (let i = 0; i < completed.length; i++) {
    const task = completed[i];
    const category = categories.find((c) => c.id === task.categoryId) ?? null;
    const step = growthStepForIndex(profile, i);
    const prim = taskToPrimitive(task, category, profile, step, i);

    if (i === 0) {
      prim.position = placeOnBase(prim, formSeed, profile);
    } else {
      const anchorIndex = resolveAnchorIndex(step.anchor, i, primitives);
      prim.position = placeAttachedTo(
        primitives[anchorIndex],
        prim,
        task,
        i,
        formSeed,
        profile,
      );
    }

    primitives.push(prim);
  }

  harmonizeMaterials(primitives);
  rotateStructureY(primitives, profile.baseRotation);
  return primitives;
}

export function dominantMaterial(primitives: FieldPrimitive[]): FieldPrimitive['material'] {
  if (primitives.length === 0) return 'aluminum';
  const base = primitives[0].material;
  return base === 'red' ? 'aluminum' : base;
}

/** @deprecated v1 spine placement */
export function placeOnSpine(
  index: number,
  total: number,
  task: Task,
  _archetype: Archetype,
): Vec3 {
  const prim = taskToPrimitive(task, null);
  if (index === 0) return placeOnBase(prim, 0, resolveFormProfile('MONUMENT', 0));
  const rng = mulberry32(task.seed + index);
  const t = total <= 1 ? 0.5 : index / (total - 1);
  return [(rng() - 0.5) * 0.3, 0.12 + t * 1.6, (rng() - 0.5) * 0.2];
}

export function placeAttachedToPrevious(
  previous: FieldPrimitive,
  next: FieldPrimitive,
  task: Task,
  index: number,
  archetype: Archetype,
): Vec3 {
  const profile = resolveFormProfile(archetype, 0);
  return placeAttachedTo(previous, next, task, index, 0, profile);
}
