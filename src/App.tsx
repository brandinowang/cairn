import { ListPanel } from './ui/ListPanel';
import { SceneCanvas } from './scene/Canvas';
import { useKeyboardMap } from './hooks/useKeyboardMap';
import { useStore } from './store/useStore';

export function App() {
  useKeyboardMap();
  const presentationMode = useStore((s) => s.presentationMode);

  return (
    <div className="flex h-full w-full overflow-hidden">
      {!presentationMode && <ListPanel />}
      <SceneCanvas />
      {presentationMode && (
        <button
          type="button"
          onClick={() => useStore.getState().togglePresentation()}
          className="fixed top-3 left-3 font-mono text-[9px] uppercase tracking-wider text-text-mute hover:text-text opacity-0 hover:opacity-100 transition-opacity z-10"
        >
          exit pres
        </button>
      )}
    </div>
  );
}
