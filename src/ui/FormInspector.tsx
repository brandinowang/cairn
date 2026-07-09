import { FormPreview } from '../scene/FormPreview';
import { SpecCard } from './SpecCard';
import { exportIsolatedPrimitiveSTL } from '../engine/export';
import type { Archetype, FormEntry } from '../types';
import { ARCHETYPE_LABELS } from '../types';

interface FormInspectorProps {
  entry: FormEntry;
  serial: string;
  archetype: Archetype;
  onClose: () => void;
}

export function FormInspector({ entry, serial, archetype, onClose }: FormInspectorProps) {
  return (
    <div className="flex flex-col h-full bg-paper">
      <header className="flex items-center justify-between px-4 py-3 border-b border-line shrink-0">
        <span className="label-section">
          Inspect · {entry.params.type} · {ARCHETYPE_LABELS[archetype]}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-[13px] text-ink-dim hover:text-ink"
        >
          Close
        </button>
      </header>
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0">
          <FormPreview params={entry.params} className="h-full w-full" autoRotate />
        </div>
        <div className="w-[300px] shrink-0 border-l border-line">
          <SpecCard
            entry={entry}
            serial={serial}
            archetype={archetype}
            onExportSTL={() => exportIsolatedPrimitiveSTL(entry.params, serial)}
          />
        </div>
      </div>
    </div>
  );
}
