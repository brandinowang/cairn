import { ListPanel } from './ui/ListPanel';
import { Library } from './ui/Library';
import { SceneCanvas } from './scene/Canvas';
import { useKeyboardMap } from './hooks/useKeyboardMap';
import { useThemeSync } from './hooks/useThemeSync';
import { useStore } from './store/useStore';
import { captureCanvasPNG } from './engine/export';

export function App() {
  useKeyboardMap();
  useThemeSync();
  const presentationMode = useStore((s) => s.presentationMode);
  const lockInMode = useStore((s) => s.lockInMode);
  const view = useStore((s) => s.view);
  const viewportCanvas = useStore((s) => s.viewportCanvas);

  return (
    <div className="flex h-full w-full overflow-hidden bg-paper gap-0">
      {!presentationMode && view === 'main' && <ListPanel />}
      {!presentationMode && !lockInMode && view === 'library' && (
        <aside className="w-full h-full bg-paper p-3">
          <div className="h-full bg-surface rounded-2xl border border-line shadow-raised overflow-hidden">
            <Library />
          </div>
        </aside>
      )}
      {view === 'main' && !lockInMode && <SceneCanvas />}
      {presentationMode && (
        <div className="fixed top-5 left-5 flex gap-2 z-10 opacity-0 hover:opacity-100 transition-opacity duration-200 bg-surface-hi/80 backdrop-blur-sm rounded-xl px-2 py-1.5 border border-line">
          <button
            type="button"
            onClick={() => viewportCanvas && captureCanvasPNG(viewportCanvas, 3)}
            className="btn-ghost text-[12px]"
          >
            Capture
          </button>
          <button
            type="button"
            onClick={() => useStore.getState().togglePresentation()}
            className="btn-ghost text-[12px]"
          >
            Exit
          </button>
        </div>
      )}
    </div>
  );
}
