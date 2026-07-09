import { useMemo } from 'react';
import { buildGeometry } from '../engine/geometry';
import { suggestObject, getDimensions } from '../engine/suggest';
import { estimateWallThickness } from '../engine/mesh';
import { supMm } from '../utils/format';
import type { Archetype, FormEntry } from '../types';
import { ARCHETYPE_LABELS } from '../types';

interface SpecCardProps {
  entry: FormEntry;
  serial: string;
  archetype: Archetype;
  onExportSTL: () => void;
}

export function SpecCard({ entry, serial, archetype, onExportSTL }: SpecCardProps) {
  const stoneParams = useMemo(
    () => ({
      ...entry.params,
      primitive: entry.params.type,
      jitter: [0, 0] as [number, number],
    }),
    [entry.params],
  );
  const geo = useMemo(() => buildGeometry(stoneParams), [stoneParams]);
  const dims = useMemo(() => getDimensions(geo), [geo]);
  const wall = estimateWallThickness({ positions: new Float32Array(0), indices: new Uint32Array(0), normals: new Float32Array(0) });
  const suggestion = suggestObject(entry.params, dims);
  const completed = entry.task.completedAt
    ? new Date(entry.task.completedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      })
    : '—';

  const rows: [string, string][] = [
    ['Origin', `${entry.task.title} · ${completed}`],
    ['Archetype', ARCHETYPE_LABELS[archetype]],
    ['Primitive', entry.params.type],
    ['Material', entry.params.material],
    [
      'Dimensions',
      `${supMm(dims.width)} × ${supMm(dims.height)} × ${supMm(dims.depth)}`,
    ],
    ['Volume', `${Math.round(dims.volume).toLocaleString()} mm³`],
    ['Wall thickness', `${wall.toFixed(1)} mm`],
    ['Mass index', entry.params.mass.toFixed(2)],
    ['Suggested object', suggestion],
    ['Serial', serial],
  ];

  return (
    <div className="border border-line bg-surface-hi flex flex-col h-full shadow-raised">
      <div className="border-b border-line px-4 py-3 label-section">Product study</div>
      <dl className="flex-1 px-4 py-3 space-y-3 overflow-y-auto">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="label-section mb-0.5">{label}</dt>
            <dd className="font-mono text-[12px] text-ink leading-snug">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="border-t border-line p-4">
        <button
          type="button"
          onClick={onExportSTL}
          className="w-full text-[13px] text-ink-dim hover:text-ink border border-line-strong rounded-chip py-2.5 transition-colors hover:border-ink-dim focus-visible:shadow-[var(--focus-ring)]"
        >
          Export STL
        </button>
      </div>
    </div>
  );
}
