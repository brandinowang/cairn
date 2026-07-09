import { useStore } from '../store/useStore';
import { blendFromLiveSmoothness } from '../engine/field';

export function ViewportBlendSlider() {
  const mode = useStore((s) => s.mode);
  const presentationMode = useStore((s) => s.presentationMode);
  const liveSmoothness = useStore((s) => s.liveSmoothness);
  const setLiveSmoothness = useStore((s) => s.setLiveSmoothness);
  const isUpdating = useStore((s) => s.meshUpdating);

  if (mode !== 'cairn' || presentationMode) return null;

  const pct = Math.round(liveSmoothness * 100);
  const blendK = blendFromLiveSmoothness(liveSmoothness);

  return (
    <div className="absolute top-5 left-5 z-10 pointer-events-auto w-[220px] bg-surface-hi/90 backdrop-blur-sm border border-line rounded-xl px-3 py-2.5 shadow-raised">
      <div className="flex items-center justify-between mb-2">
        <span className="label-section">Live blend</span>
        <span className="font-mono text-[10px] text-ink-mute tabular-nums flex items-center gap-1.5">
          {isUpdating && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          )}
          k={blendK.toFixed(2)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9px] text-ink-mute uppercase tracking-wide">Sharp</span>
        <input
          type="range"
          min={0}
          max={100}
          value={pct}
          onChange={(e) => setLiveSmoothness(Number(e.target.value) / 100)}
          className="flex-1 h-1.5 accent-ink cursor-pointer"
          aria-label="Live smooth sharp blend"
        />
        <span className="font-mono text-[9px] text-ink-mute uppercase tracking-wide">Smooth</span>
      </div>
    </div>
  );
}
