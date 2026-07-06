import { useStore } from '../store/useStore';
import { buildCairnStructure } from '../engine/structure';

interface HudProps {
  cameraPos?: [number, number, number];
}

export function Hud({ cameraPos }: HudProps) {
  const presentationMode = useStore((s) => s.presentationMode);
  const mode = useStore((s) => s.mode);
  const tasks = useStore((s) => s.tasks);
  const categories = useStore((s) => s.categories);

  const structure = buildCairnStructure(tasks, categories);
  const stoneCount = structure.stones.length;

  if (presentationMode) {
    return (
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <span className="font-mono text-[10px] text-text-mute tracking-widest uppercase">
          {structure.serial}
        </span>
      </div>
    );
  }

  return (
    <div className="absolute top-3 right-3 pointer-events-none font-mono text-[10px] text-text-mute tracking-wider uppercase space-y-0.5 text-right">
      <div>{structure.serial}</div>
      <div>STONES {stoneCount.toString().padStart(3, '0')}</div>
      <div>MODE {mode}</div>
      {cameraPos && (
        <div>
          CAM {cameraPos[0].toFixed(1)} {cameraPos[1].toFixed(1)} {cameraPos[2].toFixed(1)}
        </div>
      )}
    </div>
  );
}
