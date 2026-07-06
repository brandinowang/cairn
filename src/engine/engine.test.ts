import { describe, expect, it } from 'vitest';
import type { Category, Task } from '../types';
import { buildGeometry, geometryCacheKey } from './geometry';
import { taskToStone } from './mapping';
import { deriveTaskSeed, mulberry32, xfnv1a } from './rng';
import { buildCairnStructure } from './structure';

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

describe('taskToStone', () => {
  it('same task always yields identical StoneParams', () => {
    const task = makeTask();
    const p1 = taskToStone(task, sampleCategory);
    const p2 = taskToStone(task, sampleCategory);
    expect(p1).toEqual(p2);
  });

  it('high priority tasks get red material', () => {
    const task = makeTask({ priority: 'high', categoryId: sampleCategory.id });
    const params = taskToStone(task, sampleCategory);
    expect(params.material).toBe('red');
  });

  it('longer titles produce taller aspect', () => {
    const short = taskToStone(makeTask({ title: 'a' }), sampleCategory);
    const long = taskToStone(
      makeTask({ id: 'task-002', title: 'a'.repeat(50) }),
      sampleCategory,
    );
    expect(long.aspect).toBeGreaterThan(short.aspect);
  });
});

describe('geometry', () => {
  it('buildGeometry is cached and deterministic', () => {
    const task = makeTask();
    const params = taskToStone(task, sampleCategory);
    const key1 = geometryCacheKey(params);
    const key2 = geometryCacheKey(params);
    expect(key1).toBe(key2);

    const g1 = buildGeometry(params);
    const g2 = buildGeometry(params);
    expect(g1).toBe(g2);
    expect(g1.attributes.position.count).toBeGreaterThan(0);
  });
});

describe('structure', () => {
  it('buildCairnStructure stacks in completion order', () => {
    const tasks = [
      makeTask({ id: 't1', title: 'First', completedAt: 1000, createdAt: 0 }),
      makeTask({ id: 't2', title: 'Second', completedAt: 2000, createdAt: 500 }),
    ];
    const structure = buildCairnStructure(tasks, [sampleCategory]);
    expect(structure.stones).toHaveLength(2);
    expect(structure.stones[1].position[1]).toBeGreaterThan(structure.stones[0].position[1]);
  });
});
