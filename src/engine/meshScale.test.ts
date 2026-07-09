import { describe, expect, it } from 'vitest';
import { resolveRenderBlendK } from './field';
import { meshField } from './mesh';
import { deriveTaskSeed } from './rng';
import { buildFusedStructure } from './structure';
import type { Category, Task } from '../types';

const cat: Category = { id: 'c', name: 'STUDIO', material: 'aluminum' };

function makeTasks(count: number): Task[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `t${i}`,
    title: `Task ${i}`,
    categoryId: cat.id,
    priority: 'med' as const,
    createdAt: i * 1000,
    completedAt: i * 1000 + 500,
    seed: deriveTaskSeed(`t${i}`, `Task ${i}`),
  }));
}

describe('mesh scale', () => {
  it('meshes consistently as task count grows', () => {
    for (const n of [1, 3, 5, 8, 12, 20]) {
      const structure = buildFusedStructure(makeTasks(n), [cat], 0.5, null, 0, 12345);
      const k = resolveRenderBlendK(0.5);
      const mesh = meshField(structure.primitives, k, structure.features, 42);
      expect(mesh.positions.length, `task count ${n}`).toBeGreaterThan(0);
    }
  });

  it('meshes quick-add tasks without category', () => {
    const tasks = Array.from({ length: 10 }, (_, i) => ({
      id: `q${i}`,
      title: `Quick ${i}`,
      categoryId: null,
      priority: 'med' as const,
      createdAt: i * 1000,
      completedAt: i * 1000 + 500,
      seed: deriveTaskSeed(`q${i}`, `Quick ${i}`),
    }));
    const structure = buildFusedStructure(tasks, [cat], 0.5, null, 0, 99999);
    const k = resolveRenderBlendK(0);
    const mesh = meshField(structure.primitives, k, structure.features, 48);
    expect(mesh.positions.length).toBeGreaterThan(0);
  });
});
