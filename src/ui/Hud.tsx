import { useStore } from '../store/useStore';
import { buildFusedStructure } from '../engine/structure';
import { buildVoronoiStructure } from '../engine/voronoi';
import { captureCanvasPNG, exportFusedSTL, exportVoronoiSTL } from '../engine/export';
import { computeBlendK } from '../engine/field';
import { getCompletedTasks } from '../engine/structure';

export function Hud() {
  const presentationMode = useStore((s) => s.presentationMode);
  const mode = useStore((s) => s.mode);
  const tasks = useStore((s) => s.tasks);
  const categories = useStore((s) => s.categories);
  const refineLevel = useStore((s) => s.refineLevel);
  const resolvedArchetype = useStore((s) => s.resolvedArchetype);
  const formSeed = useStore((s) => s.formSeed);
  const viewportCanvas = useStore((s) => s.viewportCanvas);

  const fused = buildFusedStructure(tasks, categories, refineLevel, resolvedArchetype, 0, formSeed);
  const voronoi = buildVoronoiStructure(tasks, categories);
  const formCount = mode === 'cairn' ? fused.primitives.length : voronoi.cells.length;
  const serial = mode === 'cairn' ? fused.serial : voronoi.serial;

  const handleCapture = () => {
    if (viewportCanvas) captureCanvasPNG(viewportCanvas, 2);
  };

  const handleExportStructure = () => {
    if (mode === 'cairn') {
      const exportStructure = {
        ...fused,
        blendK: computeBlendK(getCompletedTasks(tasks).length, refineLevel),
      };
      exportFusedSTL(exportStructure);
    } else exportVoronoiSTL(voronoi.cells, voronoi.serial);
  };

  if (presentationMode) {
    return (
      <div className="absolute bottom-5 left-5 pointer-events-none">
        <span className="font-mono text-[10px] text-ink-mute tracking-wide">{serial}</span>
      </div>
    );
  }

  return (
    <div className="absolute bottom-5 right-5 flex gap-2 pointer-events-auto bg-surface-hi/80 backdrop-blur-sm rounded-xl px-2 py-1.5 border border-line shadow-raised">
      {formCount > 0 && (
        <button type="button" onClick={handleExportStructure} className="btn-ghost text-[12px]">
          Export STL
        </button>
      )}
      <button type="button" onClick={handleCapture} className="btn-ghost text-[12px]">
        Capture
      </button>
    </div>
  );
}
