import { nanoid } from 'nanoid';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Category, GenerativeMode, PlacedStone, Priority, Task } from '../types';
import { deriveTaskSeed } from '../engine/rng';
import { buildCairnStructure } from '../engine/structure';
import { migrate, STORAGE_KEY, STORAGE_VERSION } from './migrations';

export interface AppState {
  tasks: Task[];
  categories: Category[];
  mode: GenerativeMode;
  presentationMode: boolean;
  selectedTaskId: string | null;
  lastCompletedId: string | null;
  removingStone: PlacedStone | null;
  focusedTaskId: string | null;
  doneExpanded: boolean;

  addTask: (title: string, priority: Priority, categoryId: string | null) => void;
  completeTask: (id: string) => void;
  uncompleteTask: (id: string) => void;
  editTask: (id: string, title: string) => void;
  deleteTask: (id: string) => void;
  setPriority: (id: string, priority: Priority) => void;
  setCategory: (id: string, categoryId: string | null) => void;
  addCategory: (name: string, material: Category['material']) => void;
  setMode: (mode: GenerativeMode) => void;
  togglePresentation: () => void;
  selectForm: (id: string | null) => void;
  setFocusedTask: (id: string | null) => void;
  toggleDoneExpanded: () => void;
  clearAnimationFlags: () => void;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-studio', name: 'STUDIO', material: 'aluminum' },
  { id: 'cat-admin', name: 'ADMIN', material: 'graphite' },
  { id: 'cat-design', name: 'DESIGN', material: 'walnut' },
  { id: 'cat-signal', name: 'SIGNAL', material: 'red' },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      categories: DEFAULT_CATEGORIES,
      mode: 'cairn',
      presentationMode: false,
      selectedTaskId: null,
      lastCompletedId: null,
      removingStone: null,
      focusedTaskId: null,
      doneExpanded: true,

      addTask: (title, priority, categoryId) => {
        const trimmed = title.trim();
        if (!trimmed) return;
        const id = nanoid();
        const task: Task = {
          id,
          title: trimmed,
          categoryId,
          priority,
          createdAt: Date.now(),
          completedAt: null,
          seed: deriveTaskSeed(id, trimmed),
        };
        set((s) => ({ tasks: [task, ...s.tasks], focusedTaskId: id }));
      },

      completeTask: (id) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, completedAt: Date.now() } : t,
          ),
          lastCompletedId: id,
          removingStone: null,
        }));
      },

      uncompleteTask: (id) => {
        const state = get();
        const structure = buildCairnStructure(state.tasks, state.categories);
        const stone = structure.stones.find((s) => s.params.taskId === id) ?? null;
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, completedAt: null } : t,
          ),
          removingStone: stone,
          lastCompletedId: null,
        }));
      },

      editTask: (id, title) => {
        const trimmed = title.trim();
        if (!trimmed) return;
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, title: trimmed, seed: deriveTaskSeed(id, trimmed) }
              : t,
          ),
        }));
      },

      deleteTask: (id) => {
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
          focusedTaskId: s.focusedTaskId === id ? null : s.focusedTaskId,
          selectedTaskId: s.selectedTaskId === id ? null : s.selectedTaskId,
        }));
      },

      setPriority: (id, priority) => {
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, priority } : t)),
        }));
      },

      setCategory: (id, categoryId) => {
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, categoryId } : t)),
        }));
      },

      addCategory: (name, material) => {
        const cat: Category = { id: nanoid(), name: name.toUpperCase(), material };
        set((s) => ({ categories: [...s.categories, cat] }));
      },

      setMode: (mode) => set({ mode }),

      togglePresentation: () => set((s) => ({ presentationMode: !s.presentationMode })),

      selectForm: (id) => set({ selectedTaskId: id }),

      setFocusedTask: (id) => set({ focusedTaskId: id }),

      toggleDoneExpanded: () => set((s) => ({ doneExpanded: !s.doneExpanded })),

      clearAnimationFlags: () =>
        set({ lastCompletedId: null, removingStone: null }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        version: STORAGE_VERSION,
        tasks: state.tasks,
        categories: state.categories,
        mode: state.mode,
      }),
      merge: (persisted, current) => {
        const migrated = migrate(persisted);
        if (!migrated) return current;
        return {
          ...current,
          tasks: migrated.tasks,
          categories:
            migrated.categories.length > 0 ? migrated.categories : current.categories,
          mode: migrated.mode,
        };
      },
    },
  ),
);

export function useOpenTasks() {
  return useStore((s) =>
    s.tasks.filter((t) => t.completedAt == null).sort((a, b) => b.createdAt - a.createdAt),
  );
}

export function useDoneTasks() {
  return useStore((s) =>
    s.tasks
      .filter((t) => t.completedAt != null)
      .sort((a, b) => b.completedAt! - a.completedAt!),
  );
}

export function useTaskCounts() {
  return useStore((s) => {
    const open = s.tasks.filter((t) => !t.completedAt).length;
    const done = s.tasks.filter((t) => t.completedAt).length;
    return { open, done };
  });
}
