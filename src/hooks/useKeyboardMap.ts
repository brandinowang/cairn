import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import type { GenerativeMode, Priority } from '../types';

export function useKeyboardMap() {
  const deleteConfirmRef = useRef<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      const state = useStore.getState();
      const {
        focusedTaskId,
        completeTask,
        uncompleteTask,
        deleteTask,
        setPriority,
        setMode,
        togglePresentation,
        setFocusedTask,
      } = state;

      if (e.key === 'n' && !isInput) {
        e.preventDefault();
        document.getElementById('quick-add-input')?.focus();
        return;
      }

      if (e.key === 'm' && !isInput) {
        e.preventDefault();
        const next: GenerativeMode = state.mode === 'cairn' ? 'voronoi' : 'cairn';
        setMode(next);
        return;
      }

      if (e.key === 'p' && !isInput) {
        e.preventDefault();
        togglePresentation();
        return;
      }

      if (isInput && e.key !== 'Escape') return;

      if (!focusedTaskId) return;

      const task = state.tasks.find((t) => t.id === focusedTaskId);
      if (!task) return;

      switch (e.key) {
        case 'x':
        case ' ':
          e.preventDefault();
          if (task.completedAt) uncompleteTask(task.id);
          else completeTask(task.id);
          deleteConfirmRef.current = null;
          break;
        case '1':
          e.preventDefault();
          setPriority(task.id, 'low');
          break;
        case '2':
          e.preventDefault();
          setPriority(task.id, 'med');
          break;
        case '3':
          e.preventDefault();
          setPriority(task.id, 'high');
          break;
        case 'Delete':
        case 'Backspace':
          if (isInput) return;
          e.preventDefault();
          if (deleteConfirmRef.current === task.id) {
            deleteTask(task.id);
            deleteConfirmRef.current = null;
          } else {
            deleteConfirmRef.current = task.id;
          }
          break;
        case 'Enter':
          if (isInput) return;
          e.preventDefault();
          const row = document.querySelector(
            `[data-task-id="${task.id}"] [data-edit-trigger]`,
          ) as HTMLElement;
          row?.click();
          break;
        case 'ArrowDown': {
          e.preventDefault();
          const open = state.tasks.filter((t) => !t.completedAt);
          const done = state.tasks.filter((t) => t.completedAt);
          const all = [...open, ...done];
          const idx = all.findIndex((t) => t.id === focusedTaskId);
          if (idx < all.length - 1) setFocusedTask(all[idx + 1].id);
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const open = state.tasks.filter((t) => !t.completedAt);
          const done = state.tasks.filter((t) => t.completedAt);
          const all = [...open, ...done];
          const idx = all.findIndex((t) => t.id === focusedTaskId);
          if (idx > 0) setFocusedTask(all[idx - 1].id);
          break;
        }
        case 'Escape':
          deleteConfirmRef.current = null;
          setFocusedTask(null);
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'L',
  med: 'M',
  high: 'H',
};

export const PRIORITY_CYCLE: Priority[] = ['low', 'med', 'high'];

export function nextPriority(p: Priority): Priority {
  const idx = PRIORITY_CYCLE.indexOf(p);
  return PRIORITY_CYCLE[(idx + 1) % PRIORITY_CYCLE.length];
}
