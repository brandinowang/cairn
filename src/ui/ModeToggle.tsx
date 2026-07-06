import type { GenerativeMode } from '../types';
import { useStore } from '../store/useStore';

export function ModeToggle() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);

  const modes: GenerativeMode[] = ['cairn', 'voronoi'];

  return (
    <div className="flex border border-line">
      {modes.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
            mode === m
              ? 'bg-accent text-text'
              : 'bg-panel-2 text-text-dim hover:text-text'
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
