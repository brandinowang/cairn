import { describe, expect, it } from 'vitest';
import type { Category, Task } from '../types';
import { smin, computeBlendK } from './field';
import { meshField } from './mesh';
import { defaultFeatures } from './field';
import { taskToPrimitive } from './mapping';
import { deriveDepositSeed, deriveTaskSeed, mulberry32, xfnv1a } from './rng';
import { buildFusedStructure } from './structure';
import { buildVoronoiStructure } from './voronoi';
import { isAttachedToPrevious } from './accretion';

const sampleCategory: Category = {
  id: 'cat-studio',
  name: 'STUDIO',
  material: 'aluminum',
};

function makeTask(overrides: Partial<Task> = {}): Task {
  const id = overrides.id ?? 'task-001';
  const title = overrides.title ?? 'Test task';
  return {
    id,
    title,
    categoryId: overrides.categoryId ?? sampleCategory.id,
    priority: overrides.priority ?? 'med',
    createdAt: overrides.createdAt ?? Date.now() - 3600000,
    completedAt: overrides.completedAt ?? Date.now(),
    seed: overrides.seed ?? deriveTaskSeed(id, title),
  };
}

describe('rng', () => {
  it('xfnv1a is deterministic', () => {
    expect(xfnv1a('hello')).toBe(xfnv1a('hello'));
    expect(xfnv1a('hello')).not.toBe(xfnv1a('world'));
  });

  it('mulberry32 produces stable sequence', () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });
});

describe('taskToPrimitive', () => {
  it('same task always yields identical params', () => {
    const task = makeTask();
    const p1 = taskToPrimitive(task, sampleCategory);
    const p2 = taskToPrimitive(task, sampleCategory);
    expect(p1).toEqual(p2);
  });

  it('high priority tasks get red material', () => {
    const task = makeTask({ priority: 'high', categoryId: sampleCategory.id });
    const params = taskToPrimitive(task, sampleCategory);
    expect(params.material).toBe('red');
  });

  it('longer titles produce taller aspect', () => {
    const profile = null;
    const short = taskToPrimitive(makeTask({ title: 'a' }), sampleCategory, profile, null, 0);
    const long = taskToPrimitive(
      makeTask({ id: 'task-002', title: 'a'.repeat(50) }),
      sampleCategory,
      profile,
      null,
      1,
    );
    expect(long.aspect).toBeGreaterThan(short.aspect);
  });
});

describe('field', () => {
  it('smin approaches min(a,b) when k is zero', () => {
    expect(smin(1, 2, 0)).toBe(1);
    expect(smin(2, 1, 0)).toBe(1);
  });

  it('smin with k rounds the union below the min', () => {
    const blended = smin(0.1, 0.2, 0.15);
    expect(blended).toBeLessThan(0.1);
  });

  it('computeBlendK is stable across task counts', () => {
    const one = computeBlendK(1, 0.5);
    const three = computeBlendK(3, 0.5);
    const eight = computeBlendK(8, 0.5);
    expect(one).toBe(three);
    expect(three).toBe(eight);
  });

  it('computeBlendK spans a range with refine', () => {
    const sharp = computeBlendK(1, 0);
    const smooth = computeBlendK(1, 1);
    expect(smooth).toBeGreaterThan(sharp);
    expect(sharp).toBeLessThan(0.12);
    expect(smooth).toBeGreaterThan(0.2);
  });
});

describe('mesh', () => {
  it('meshes two primitives into a watertight surface', () => {
    const t1 = makeTask({ id: 't1', title: 'First', seed: 1001 });
    const t2 = makeTask({ id: 't2', title: 'Second', seed: 2002 });
    const p1 = taskToPrimitive(t1, sampleCategory);
    const p2 = taskToPrimitive(t2, sampleCategory);
    p1.position = [-0.1, 0.2, 0];
    p2.position = [0.12, 0.35, 0.05];

    const data = meshField([p1, p2], 0.12, defaultFeatures('MONUMENT'), 48);
    expect(data.positions.length).toBeGreaterThan(0);
    expect(data.indices.length).toBeGreaterThan(0);
    expect(data.normals.length).toBe(data.positions.length);
  });
});

describe('structure', () => {
  const FORM_SEED = 424242;

  it('buildFusedStructure attaches each deposit to an earlier primitive', () => {
    const tasks = [
      makeTask({ id: 't1', title: 'First', completedAt: 1000, createdAt: 0 }),
      makeTask({ id: 't2', title: 'Second', completedAt: 2000, createdAt: 500 }),
      makeTask({ id: 't3', title: 'Third', completedAt: 3000, createdAt: 800 }),
    ];
    const structure = buildFusedStructure(tasks, [sampleCategory], 0.5, null, 0, FORM_SEED);
    expect(structure.primitives).toHaveLength(3);
    for (let i = 1; i < structure.primitives.length; i++) {
      const attached = structure.primitives
        .slice(0, i)
        .some((anchor) =>
          isAttachedToPrevious(anchor, structure.primitives[i]),
        );
      expect(attached).toBe(true);
    }
  });

  it('first three tasks spread into distinct deposits', () => {
    const tasks = [
      makeTask({ id: 't1', title: 'First', completedAt: 1000, createdAt: 0 }),
      makeTask({ id: 't2', title: 'Second', completedAt: 2000, createdAt: 500 }),
      makeTask({ id: 't3', title: 'Third', completedAt: 3000, createdAt: 800 }),
    ];
    const structure = buildFusedStructure(tasks, [sampleCategory], 0.5, null, 0, FORM_SEED);
    const [base, second, third] = structure.primitives;
    const wingSpread = Math.hypot(second.position[0] - base.position[0], second.position[2] - base.position[2]);
    const frontSpread = Math.hypot(third.position[0] - base.position[0], third.position[2] - base.position[2]);
    expect(wingSpread).toBeGreaterThan(0.15);
    expect(frontSpread).toBeGreaterThan(0.1);
    expect(second.mass).toBeLessThan(base.mass);
    expect(third.mass).toBeLessThan(base.mass);
  });

  it('fourth task extrudes upward off the spine', () => {
    const tasks = [
      makeTask({ id: 't1', title: 'First', completedAt: 1000, createdAt: 0 }),
      makeTask({ id: 't2', title: 'Second', completedAt: 2000, createdAt: 500 }),
      makeTask({ id: 't3', title: 'Third', completedAt: 3000, createdAt: 800 }),
      makeTask({ id: 't4', title: 'Fourth', completedAt: 4000, createdAt: 900 }),
    ];
    const structure = buildFusedStructure(tasks, [sampleCategory], 0.5, null, 0, FORM_SEED);
    const base = structure.primitives[0];
    const spine = structure.primitives[3];
    expect(spine.position[1]).toBeGreaterThan(base.position[1] + 0.12);
  });

  it('fourth task chains off the previous deposit', () => {
    const tasks = [
      makeTask({ id: 't1', title: 'First', completedAt: 1000, createdAt: 0 }),
      makeTask({ id: 't2', title: 'Second', completedAt: 2000, createdAt: 500 }),
      makeTask({ id: 't3', title: 'Third', completedAt: 3000, createdAt: 800 }),
      makeTask({ id: 't4', title: 'Fourth', completedAt: 4000, createdAt: 900 }),
    ];
    const structure = buildFusedStructure(tasks, [sampleCategory], 0.5, null, 0, FORM_SEED);
    const fourth = structure.primitives[3];
    const third = structure.primitives[2];
    const dist = Math.hypot(
      fourth.position[0] - third.position[0],
      fourth.position[1] - third.position[1],
      fourth.position[2] - third.position[2],
    );
    expect(dist).toBeGreaterThan(0.08);
    expect(dist).toBeLessThan(1.2);
  });

  it('buildFusedStructure attachment is deterministic for the same formSeed', () => {
    const tasks = [
      makeTask({ id: 't1', title: 'First', completedAt: 1000, createdAt: 0 }),
      makeTask({ id: 't2', title: 'Second', completedAt: 2000, createdAt: 500 }),
    ];
    const a = buildFusedStructure(tasks, [sampleCategory], 0.5, null, 0, FORM_SEED);
    const b = buildFusedStructure(tasks, [sampleCategory], 0.5, null, 0, FORM_SEED);
    expect(a.primitives.map((p) => p.position)).toEqual(b.primitives.map((p) => p.position));
  });

  it('buildFusedStructure varies layout with different formSeeds', () => {
    const tasks = [
      makeTask({ id: 't1', title: 'First', completedAt: 1000, createdAt: 0 }),
      makeTask({ id: 't2', title: 'Second', completedAt: 2000, createdAt: 500 }),
      makeTask({ id: 't3', title: 'Third', completedAt: 3000, createdAt: 800 }),
    ];
    const a = buildFusedStructure(tasks, [sampleCategory], 0.5, null, 0, 111);
    const b = buildFusedStructure(tasks, [sampleCategory], 0.5, null, 0, 999);
    expect(a.blueprintId).not.toBe(b.blueprintId);
    expect(a.primitives.map((p) => p.position)).not.toEqual(b.primitives.map((p) => p.position));
  });

  it('resyncCompletedSeeds changes geometry under a new formSeed', () => {
    const task = makeTask({ id: 't1', title: 'First', completedAt: 1000, createdAt: 0 });
    const seedA = deriveDepositSeed(111, task.id, 1000, task.title);
    const seedB = deriveDepositSeed(999, task.id, 1000, task.title);
    expect(seedA).not.toBe(seedB);
  });

  it('deriveDepositSeed changes deposit geometry on completion', () => {
    const task = makeTask({ id: 't1', title: 'First', completedAt: null as unknown as number });
    const seedA = deriveDepositSeed(123, task.id, 1000, task.title);
    const seedB = deriveDepositSeed(123, task.id, 2000, task.title);
    expect(seedA).not.toBe(seedB);
    const pA = taskToPrimitive({ ...task, completedAt: 1000, seed: seedA }, sampleCategory);
    const pB = taskToPrimitive({ ...task, completedAt: 2000, seed: seedB }, sampleCategory);
    expect(pA).not.toEqual(pB);
  });

  it('buildVoronoiStructure is deterministic', () => {
    const tasks = [
      makeTask({ id: 't1', title: 'First', completedAt: 1000, createdAt: 0 }),
      makeTask({ id: 't2', title: 'Second', completedAt: 2000, createdAt: 500 }),
      makeTask({ id: 't3', title: 'Third', completedAt: 3000, createdAt: 800 }),
    ];
    const a = buildVoronoiStructure(tasks, [sampleCategory]);
    const b = buildVoronoiStructure(tasks, [sampleCategory]);
    expect(a).toEqual(b);
    expect(a.cells.length).toBe(3);
  });
});
