import type { Category, Task } from '../types';
import { deriveTaskSeed } from '../engine/rng';

const BASE = Date.UTC(2026, 0, 15, 10, 0, 0);

export const DEMO_TASKS: Task[] = [
  { id: 'demo-001', title: 'Calibrate CNC fixture offsets', categoryId: 'cat-studio', priority: 'med', createdAt: BASE, completedAt: BASE + 3.6e6, seed: deriveTaskSeed('demo-001', 'Calibrate CNC fixture offsets') },
  { id: 'demo-002', title: 'Order 6061 billet stock', categoryId: 'cat-admin', priority: 'low', createdAt: BASE + 1.8e6, completedAt: BASE + 7.2e6, seed: deriveTaskSeed('demo-002', 'Order 6061 billet stock') },
  { id: 'demo-003', title: 'Sketch incense holder profile', categoryId: 'cat-design', priority: 'med', createdAt: BASE + 2.4e6, completedAt: BASE + 9e6, seed: deriveTaskSeed('demo-003', 'Sketch incense holder profile') },
  { id: 'demo-004', title: 'Invoice Q1 tooling run', categoryId: 'cat-admin', priority: 'low', createdAt: BASE + 3e6, completedAt: BASE + 10.8e6, seed: deriveTaskSeed('demo-004', 'Invoice Q1 tooling run') },
  { id: 'demo-005', title: 'Prototype USB enclosure shell', categoryId: 'cat-design', priority: 'high', createdAt: BASE + 4.2e6, completedAt: BASE + 14.4e6, seed: deriveTaskSeed('demo-005', 'Prototype USB enclosure shell') },
  { id: 'demo-006', title: 'Anodize batch — signal red', categoryId: 'cat-signal', priority: 'high', createdAt: BASE + 5e6, completedAt: BASE + 18e6, seed: deriveTaskSeed('demo-006', 'Anodize batch — signal red') },
  { id: 'demo-007', title: 'Surface finish pass on walnut tray', categoryId: 'cat-design', priority: 'med', createdAt: BASE + 6e6, completedAt: BASE + 21.6e6, seed: deriveTaskSeed('demo-007', 'Surface finish pass on walnut tray') },
  { id: 'demo-008', title: 'Update BOM for cairn plinth', categoryId: 'cat-admin', priority: 'low', createdAt: BASE + 7e6, completedAt: BASE + 25.2e6, seed: deriveTaskSeed('demo-008', 'Update BOM for cairn plinth') },
  { id: 'demo-009', title: 'Mill graphite electrode blank', categoryId: 'cat-studio', priority: 'med', createdAt: BASE + 8e6, completedAt: BASE + 28.8e6, seed: deriveTaskSeed('demo-009', 'Mill graphite electrode blank') },
  { id: 'demo-010', title: 'Photograph form library set A', categoryId: 'cat-design', priority: 'low', createdAt: BASE + 9e6, completedAt: BASE + 32.4e6, seed: deriveTaskSeed('demo-010', 'Photograph form library set A') },
  { id: 'demo-011', title: 'Design taper stand base geometry', categoryId: 'cat-design', priority: 'med', createdAt: BASE + 10e6, completedAt: BASE + 36e6, seed: deriveTaskSeed('demo-011', 'Design taper stand base geometry') },
  { id: 'demo-012', title: 'Ship sample to client — expedite', categoryId: 'cat-signal', priority: 'high', createdAt: BASE + 11e6, completedAt: BASE + 39.6e6, seed: deriveTaskSeed('demo-012', 'Ship sample to client — expedite') },
  { id: 'demo-013', title: 'Deburr aluminum slab series', categoryId: 'cat-studio', priority: 'low', createdAt: BASE + 12e6, completedAt: BASE + 43.2e6, seed: deriveTaskSeed('demo-013', 'Deburr aluminum slab series') },
  { id: 'demo-014', title: 'Model crystalline cluster variant', categoryId: 'cat-design', priority: 'med', createdAt: BASE + 13e6, completedAt: BASE + 50.4e6, seed: deriveTaskSeed('demo-014', 'Model crystalline cluster variant') },
  { id: 'demo-015', title: 'Reconcile vendor PO #4421', categoryId: 'cat-admin', priority: 'low', createdAt: BASE + 14e6, completedAt: BASE + 54e6, seed: deriveTaskSeed('demo-015', 'Reconcile vendor PO #4421') },
  { id: 'demo-016', title: 'Turn pen vessel prototype on lathe', categoryId: 'cat-studio', priority: 'med', createdAt: BASE + 15e6, completedAt: BASE + 61.2e6, seed: deriveTaskSeed('demo-016', 'Turn pen vessel prototype on lathe') },
  { id: 'demo-017', title: 'Critical dimension check — core prism', categoryId: 'cat-signal', priority: 'high', createdAt: BASE + 16e6, completedAt: BASE + 68.4e6, seed: deriveTaskSeed('demo-017', 'Critical dimension check — core prism') },
  { id: 'demo-018', title: 'Archive studio session notes', categoryId: 'cat-admin', priority: 'low', createdAt: BASE + 17e6, completedAt: BASE + 72e6, seed: deriveTaskSeed('demo-018', 'Archive studio session notes') },
  { id: 'demo-019', title: 'Composite nodule stress test', categoryId: 'cat-studio', priority: 'med', createdAt: BASE + 18e6, completedAt: BASE + 79.2e6, seed: deriveTaskSeed('demo-019', 'Composite nodule stress test') },
  { id: 'demo-020', title: 'Refine facet hull for bookend', categoryId: 'cat-design', priority: 'med', createdAt: BASE + 19e6, completedAt: BASE + 90e6, seed: deriveTaskSeed('demo-020', 'Refine facet hull for bookend') },
  { id: 'demo-021', title: 'Pack trade-show sample kit', categoryId: 'cat-admin', priority: 'low', createdAt: BASE + 20e6, completedAt: BASE + 93.6e6, seed: deriveTaskSeed('demo-021', 'Pack trade-show sample kit') },
  { id: 'demo-022', title: 'Polish machined disc plinth', categoryId: 'cat-studio', priority: 'low', createdAt: BASE + 21e6, completedAt: BASE + 97.2e6, seed: deriveTaskSeed('demo-022', 'Polish machined disc plinth') },
  { id: 'demo-023', title: 'Finalize red-anodized signal core for stack top', categoryId: 'cat-signal', priority: 'high', createdAt: BASE + 22e6, completedAt: BASE + 108e6, seed: deriveTaskSeed('demo-023', 'Finalize red-anodized signal core for stack top') },
  { id: 'demo-024', title: 'Document generative form parameters for export library', categoryId: 'cat-design', priority: 'med', createdAt: BASE + 23e6, completedAt: BASE + 115.2e6, seed: deriveTaskSeed('demo-024', 'Document generative form parameters for export library') },
];

export const DEMO_CATEGORIES: Category[] = [
  { id: 'cat-studio', name: 'STUDIO', material: 'aluminum' },
  { id: 'cat-admin', name: 'ADMIN', material: 'graphite' },
  { id: 'cat-design', name: 'DESIGN', material: 'walnut' },
  { id: 'cat-signal', name: 'SIGNAL', material: 'red' },
];
