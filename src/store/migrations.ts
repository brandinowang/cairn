import type { AppState } from './useStore';
import type { ColorScheme } from '../types';

export const STORAGE_KEY = 'cairn.v1';
export const STORAGE_VERSION = 1;

export interface PersistedState {
  version: number;
  tasks: AppState['tasks'];
  categories: AppState['categories'];
  mode: AppState['mode'];
  refineLevel?: number;
  colorScheme?: ColorScheme;
}

export function migrate(raw: unknown): PersistedState | null {
  if (!raw || typeof raw !== 'object') return null;

  const data = raw as Record<string, unknown>;

  // Handle zustand persist wrapper
  const state = (data.state as Record<string, unknown>) ?? data;
  const version = (state.version as number) ?? 0;

  if (version === 0 || version === 1) {
    return {
      version: STORAGE_VERSION,
      tasks: (state.tasks as AppState['tasks']) ?? [],
      categories: (state.categories as AppState['categories']) ?? [],
      mode: (state.mode as AppState['mode']) ?? 'cairn',
      refineLevel: typeof state.refineLevel === 'number' ? state.refineLevel : 0.5,
      colorScheme:
        state.colorScheme === 'dark' || state.colorScheme === 'light'
          ? (state.colorScheme as ColorScheme)
          : 'light',
    };
  }

  return null;
}
