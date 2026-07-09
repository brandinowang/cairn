import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import type { GenerativeMode } from '../types';

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
        setMode,
        togglePresentation,
        toggleLockIn,
        setFocusedTask,
        setView,
        view,
        selectForm,
      } = state;

      if (e.key === 'Escape') {
        if (state.lockInMode) {
          e.preventDefault();
          toggleLockIn();
          return;
        }
        if (view === 'library') {
          e.preventDefault();
          if (state.selectedTaskId) selectForm(null);
          else setView('main');
          return;
        }
      }

      if (e.key === 'l' && !isInput) {
        e.preventDefault();
        setView(view === 'library' ? 'main' : 'library');
        return;
      }

      if (e.key === 'n' && !isInput && view === 'main') {
        e.preventDefault();
        document.getElementById('quick-add-input')?.focus();
        return;
      }

      if (e.key === 'm' && !isInput && view === 'main') {
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

      if (e.key === 'k' && !isInput && view === 'main') {
        e.preventDefault();
        toggleLockIn();
        return;
      }

      if (view !== 'main') return;
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
