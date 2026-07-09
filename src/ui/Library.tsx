import { useMemo } from 'react';
import { buildFusedStructure, buildFormLibrary } from '../engine/structure';
import { FormPreview } from '../scene/FormPreview';
import { FormInspector } from './FormInspector';
import { useStore } from '../store/useStore';
import type { Archetype, FormEntry, LibraryFilters, MaterialKey } from '../types';
import { ARCHETYPE_LABELS } from '../types';

const MATERIALS: MaterialKey[] = ['aluminum', 'walnut', 'graphite', 'red'];
const PRIMITIVES = ['box', 'octahedron', 'wedge', 'roundBox', 'cylinder', 'capsule', 'roundCone'] as const;
const ARCHETYPES: Archetype[] = ['HOLDER', 'VESSEL', 'HANDHELD', 'TRAY', 'MONUMENT'];

function filterForms(forms: FormEntry[], filters: LibraryFilters): FormEntry[] {
  let result = forms.filter((f) => {
    if (filters.material !== 'all' && f.params.material !== filters.material) return false;
    if (filters.primitive !== 'all' && f.params.type !== filters.primitive) return false;
    if (filters.categoryId !== 'all' && f.task.categoryId !== filters.categoryId) return false;
    return true;
  });

  result = [...result].sort((a, b) => {
    switch (filters.sort) {
      case 'material':
        return a.params.material.localeCompare(b.params.material);
      case 'primitive':
        return a.params.type.localeCompare(b.params.type);
      case 'category':
        return (a.category?.name ?? '').localeCompare(b.category?.name ?? '');
      case 'date':
      default:
        return (b.task.completedAt ?? 0) - (a.task.completedAt ?? 0);
    }
  });

  return result;
}

export function Library() {
  const tasks = useStore((s) => s.tasks);
  const categories = useStore((s) => s.categories);
  const selectedTaskId = useStore((s) => s.selectedTaskId);
  const filters = useStore((s) => s.libraryFilters);
  const refineLevel = useStore((s) => s.refineLevel);
  const resolvedArchetype = useStore((s) => s.resolvedArchetype);
  const formSeed = useStore((s) => s.formSeed);
  const setResolvedArchetype = useStore((s) => s.setResolvedArchetype);
  const setLibraryFilters = useStore((s) => s.setLibraryFilters);
  const selectForm = useStore((s) => s.selectForm);
  const setView = useStore((s) => s.setView);

  const fused = useMemo(
    () => buildFusedStructure(tasks, categories, refineLevel, resolvedArchetype, 0, formSeed),
    [tasks, categories, refineLevel, resolvedArchetype, formSeed],
  );

  const forms = useMemo(
    () => filterForms(buildFormLibrary(tasks, categories), filters),
    [tasks, categories, filters],
  );

  const selected = forms.find((f) => f.task.id === selectedTaskId) ?? null;
  const activeArchetype = resolvedArchetype ?? fused.archetype;

  if (selected) {
    return (
      <FormInspector
        entry={selected}
        serial={fused.serial}
        archetype={activeArchetype}
        onClose={() => selectForm(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      <header className="flex items-center justify-between px-4 py-3 border-b border-line shrink-0 bg-paper">
        <div>
          <span className="text-[15px] font-medium tracking-tight text-ink">Library</span>
          <p className="font-mono text-[10px] text-ink-mute mt-0.5">
            {fused.serial} · {ARCHETYPE_LABELS[activeArchetype]} study
          </p>
        </div>
        <button
          type="button"
          onClick={() => setView('main')}
          className="text-[13px] text-ink-dim hover:text-ink"
        >
          Back
        </button>
      </header>

      <div className="px-4 py-3 border-b border-line flex flex-wrap gap-3 shrink-0 items-end">
        <label className="label-section flex flex-col gap-1">
          Resolve as
          <select
            value={resolvedArchetype ?? ''}
            onChange={(e) =>
              setResolvedArchetype(e.target.value ? (e.target.value as Archetype) : null)
            }
            className="bg-surface-hi border border-line rounded-chip text-ink-dim text-[11px] px-2 py-1 focus:outline-none focus:border-ink-dim"
          >
            <option value="">Auto ({ARCHETYPE_LABELS[fused.archetype]})</option>
            {ARCHETYPES.map((a) => (
              <option key={a} value={a}>
                {ARCHETYPE_LABELS[a]}
              </option>
            ))}
          </select>
        </label>
        <FilterSelect
          label="sort"
          value={filters.sort}
          options={[
            ['date', 'DATE'],
            ['material', 'MATERIAL'],
            ['primitive', 'PRIMITIVE'],
            ['category', 'CATEGORY'],
          ]}
          onChange={(v) => setLibraryFilters({ sort: v as LibraryFilters['sort'] })}
        />
        <FilterSelect
          label="material"
          value={filters.material}
          options={[['all', 'ALL'], ...MATERIALS.map((m): [string, string] => [m, m.toUpperCase()])]}
          onChange={(v) => setLibraryFilters({ material: v as LibraryFilters['material'] })}
        />
        <FilterSelect
          label="primitive"
          value={filters.primitive}
          options={[['all', 'ALL'], ...PRIMITIVES.map((p): [string, string] => [p, p.toUpperCase()])]}
          onChange={(v) => setLibraryFilters({ primitive: v as LibraryFilters['primitive'] })}
        />
        <FilterSelect
          label="category"
          value={filters.categoryId}
          options={[
            ['all', 'ALL'],
            ...categories.map((c): [string, string] => [c.id, c.name]),
          ]}
          onChange={(v) => setLibraryFilters({ categoryId: v })}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {forms.length === 0 ? (
          <p className="text-sm text-ink-mute">No forms yet</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {forms.map((entry) => (
              <button
                key={entry.task.id}
                type="button"
                onClick={() => selectForm(entry.task.id)}
                className="text-left border border-line bg-surface-hi rounded-card overflow-hidden shadow-raised hover:border-ink-dim transition-colors"
              >
                <FormPreview params={entry.params} className="h-28 w-full" />
                <div className="px-3 py-2 border-t border-line">
                  <div className="truncate text-ink text-[13px]">{entry.task.title}</div>
                  <div className="font-mono text-[10px] text-ink-mute mt-0.5">
                    {entry.params.type} · {entry.params.material}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <label className="label-section flex items-center gap-1.5">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-surface-hi border border-line rounded-chip text-ink-dim text-[11px] px-2 py-1 focus:outline-none focus:border-ink-dim"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
