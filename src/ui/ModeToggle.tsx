import type { GenerativeMode } from '../types';
import { useStore } from '../store/useStore';

const LABELS: Record<GenerativeMode, string> = {
  cairn: 'Cairn',
  voronoi: 'Voronoi',
};

export function ModeToggle() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const modes: GenerativeMode[] = ['cairn', 'voronoi'];

  return (
    <div className="inline-flex w-full rounded-xl bg-surface p-1 gap-1">
      {modes.map((m) => {
        const active = mode === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 px-3 py-2 text-[13px] rounded-lg transition-all duration-150 active:scale-[0.98] ${
              active
                ? 'bg-surface-hi text-ink shadow-sm'
                : 'text-ink-dim hover:text-ink'
            }`}
          >
            {LABELS[m]}
          </button>
        );
      })}
    </div>
  );
}
