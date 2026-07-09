import { nanoid } from 'nanoid';
import { useMemo } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AppView,
  Archetype,
  Category,
  ColorScheme,
  GenerativeMode,
  LibraryFilters,
  Priority,
  Task,
} from '../types';
import { deriveTaskSeed, deriveDepositSeed, resyncCompletedSeeds, rollFormSeed } from '../engine/rng';
import { migrate, STORAGE_KEY, STORAGE_VERSION } from './migrations';
import { DEMO_CATEGORIES, DEMO_TASKS } from './demoSeed';

export interface AppState {
  tasks: Task[];
  categories: Category[];
  mode: GenerativeMode;
  view: AppView;
  presentationMode: boolean;
  lockInMode: boolean;
  colorScheme: ColorScheme;
  selectedTaskId: string | null;
  libraryFilters: LibraryFilters;
  refineLevel: number;
  liveSmoothness: number;
  meshUpdating: boolean;
  formSeed: number;
  resolvedArchetype: Archetype | null;
  lastCompletedId: string | null;
  lastAddedId: string | null;
  focusedTaskId: string | null;
  doneExpanded: boolean;
  viewportCanvas: HTMLCanvasElement | null;

  addTask: (title: string, priority: Priority, categoryId: string | null) => void;
  completeTask: (id: string) => void;
  uncompleteTask: (id: string) => void;
  editTask: (id: string, title: string) => void;
  deleteTask: (id: string) => void;
  setPriority: (id: string, priority: Priority) => void;
  setCategory: (id: string, categoryId: string | null) => void;
  addCategory: (name: string, material: Category['material']) => void;
  setMode: (mode: GenerativeMode) => void;
  setView: (view: AppView) => void;
  setRefineLevel: (level: number) => void;
  setLiveSmoothness: (value: number) => void;
  setMeshUpdating: (updating: boolean) => void;
  setResolvedArchetype: (archetype: Archetype | null) => void;
  togglePresentation: () => void;
  toggleLockIn: () => void;
  toggleColorScheme: () => void;
  selectForm: (id: string | null) => void;
  setLibraryFilters: (filters: Partial<LibraryFilters>) => void;
  setFocusedTask: (id: string | null) => void;
  toggleDoneExpanded: () => void;
  clearAnimationFlags: () => void;
  clearLastAdded: () => void;
  clearAllDone: () => void;
  loadDemoSeed: () => void;
  exportData: () => void;
  importData: (json: string) => void;
}

const DEFAULT_CATEGORIES: Category[] = DEMO_CATEGORIES;

const DEFAULT_FILTERS: LibraryFilters = {
  material: 'all',
  primitive: 'all',
  categoryId: 'all',
  sort: 'date',
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      categories: DEFAULT_CATEGORIES,
      mode: 'cairn',
      view: 'main',
      presentationMode: false,
      lockInMode: false,
      colorScheme: 'light',
      selectedTaskId: null,
      libraryFilters: DEFAULT_FILTERS,
      refineLevel: 0.5,
      liveSmoothness: 0.42,
      meshUpdating: false,
      formSeed: rollFormSeed(),
      resolvedArchetype: null,
      lastCompletedId: null,
      lastAddedId: null,
      focusedTaskId: null,
      doneExpanded: true,
      viewportCanvas: null,

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
        set((s) => ({ tasks: [task, ...s.tasks], focusedTaskId: id, lastAddedId: id }));
      },

      completeTask: (id) => {
        const now = Date.now();
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  completedAt: now,
                  seed: deriveDepositSeed(s.formSeed, t.id, now, t.title),
                }
              : t,
          ),
          lastCompletedId: id,
        }));
      },

      uncompleteTask: (id) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, completedAt: null } : t,
          ),
          lastCompletedId: null,
          selectedTaskId: s.selectedTaskId === id ? null : s.selectedTaskId,
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

      setView: (view) => set({ view, selectedTaskId: view === 'main' ? null : get().selectedTaskId }),

      setRefineLevel: (level) => set({ refineLevel: Math.max(0, Math.min(1, level)) }),

      setLiveSmoothness: (value) => set({ liveSmoothness: Math.max(0, Math.min(1, value)) }),

      setMeshUpdating: (updating) => set({ meshUpdating: updating }),

      setResolvedArchetype: (archetype) => set({ resolvedArchetype: archetype }),

      togglePresentation: () =>
        set((s) => ({
          presentationMode: !s.presentationMode,
          lockInMode: false,
        })),

      toggleLockIn: () =>
        set((s) => ({
          lockInMode: !s.lockInMode,
          presentationMode: false,
          view: 'main',
        })),

      toggleColorScheme: () =>
        set((s) => ({
          colorScheme: s.colorScheme === 'dark' ? 'light' : 'dark',
        })),

      selectForm: (id) => set({ selectedTaskId: id }),

      setLibraryFilters: (filters) =>
        set((s) => ({ libraryFilters: { ...s.libraryFilters, ...filters } })),

      setFocusedTask: (id) => set({ focusedTaskId: id }),

      toggleDoneExpanded: () => set((s) => ({ doneExpanded: !s.doneExpanded })),

      clearAnimationFlags: () => set({ lastCompletedId: null }),

      clearLastAdded: () => set({ lastAddedId: null }),

      clearAllDone: () =>
        set((s) => {
          const formSeed = rollFormSeed();
          return {
            tasks: s.tasks.filter((t) => t.completedAt == null),
            lastCompletedId: null,
            selectedTaskId: null,
            formSeed,
          };
        }),

      loadDemoSeed: () => {
        const formSeed = rollFormSeed();
        set({
          tasks: DEMO_TASKS.map((t) => ({
            ...t,
            seed: deriveDepositSeed(formSeed, t.id, t.completedAt ?? 0, t.title),
          })),
          categories: DEMO_CATEGORIES,
          formSeed,
          lastCompletedId: null,
          selectedTaskId: null,
        });
      },

      exportData: () => {
        const { tasks, categories, mode, refineLevel } = get();
        const payload = JSON.stringify(
          { version: STORAGE_VERSION, tasks, categories, mode, refineLevel },
          null,
          2,
        );
        const blob = new Blob([payload], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cairn_export_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },

      importData: (json) => {
        const raw = JSON.parse(json) as unknown;
        const migrated = migrate(raw);
        if (!migrated) throw new Error('Invalid CAIRN data file');
        set({
          tasks: migrated.tasks,
          categories: migrated.categories,
          mode: migrated.mode,
          refineLevel: migrated.refineLevel ?? 0.5,
          selectedTaskId: null,
          lastCompletedId: null,
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        version: STORAGE_VERSION,
        tasks: state.tasks,
        categories: state.categories,
        mode: state.mode,
        refineLevel: state.refineLevel,
        colorScheme: state.colorScheme,
      }),
      merge: (persisted, current) => {
        const migrated = migrate(persisted);
        if (!migrated) return current;
        const formSeed = rollFormSeed();
        return {
          ...current,
          tasks: resyncCompletedSeeds(migrated.tasks, formSeed),
          categories:
            migrated.categories.length > 0 ? migrated.categories : current.categories,
          mode: migrated.mode,
          refineLevel: migrated.refineLevel ?? current.refineLevel,
          colorScheme: migrated.colorScheme ?? current.colorScheme,
          formSeed,
        };
      },
    },
  ),
);

export function useOpenTasks() {
  const tasks = useStore((s) => s.tasks);
  return useMemo(
    () =>
      tasks
        .filter((t) => t.completedAt == null)
        .sort((a, b) => b.createdAt - a.createdAt),
    [tasks],
  );
}

export function useDoneTasks() {
  const tasks = useStore((s) => s.tasks);
  return useMemo(
    () =>
      tasks
        .filter((t) => t.completedAt != null)
        .sort((a, b) => b.completedAt! - a.completedAt!),
    [tasks],
  );
}

export function useTaskCounts() {
  const tasks = useStore((s) => s.tasks);
  return useMemo(() => {
    const open = tasks.filter((t) => !t.completedAt).length;
    const done = tasks.filter((t) => t.completedAt).length;
    return { open, done };
  }, [tasks]);
}
