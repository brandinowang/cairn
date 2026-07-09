import type { Task } from '../types';

/** FNV-1a 32-bit hash → uint32 */
export function xfnv1a(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Seeded PRNG returning [0, 1) */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rollFormSeed(): number {
  return xfnv1a(`${Date.now()}-${Math.random()}-${Math.random()}`);
}

export function deriveTaskSeed(id: string, title: string): number {
  return xfnv1a(id + title);
}

/** Unique deposit seed — rolled when a task is completed */
export function deriveDepositSeed(
  formSeed: number,
  taskId: string,
  completedAt: number,
  title: string,
): number {
  return xfnv1a(`${formSeed}|${taskId}|${completedAt}|${title}`);
}

/** Re-roll deposit seeds for all completed tasks under a new session seed */
export function resyncCompletedSeeds(tasks: Task[], formSeed: number): Task[] {
  return tasks.map((task) =>
    task.completedAt != null
      ? {
          ...task,
          seed: deriveDepositSeed(formSeed, task.id, task.completedAt, task.title),
        }
      : task,
  );
}
