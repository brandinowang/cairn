import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useStore } from '../store/useStore';

interface PanelMenuProps {
  onImport: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function PanelMenu({ onImport }: PanelMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const setView = useStore((s) => s.setView);
  const togglePresentation = useStore((s) => s.togglePresentation);
  const toggleColorScheme = useStore((s) => s.toggleColorScheme);
  const colorScheme = useStore((s) => s.colorScheme);
  const loadDemoSeed = useStore((s) => s.loadDemoSeed);
  const exportData = useStore((s) => s.exportData);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const items = [
    { label: 'Library', shortcut: 'L', action: () => setView('library') },
    { label: colorScheme === 'dark' ? 'Light mode' : 'Dark mode', action: () => toggleColorScheme() },
    { label: 'Lock in', shortcut: 'K', action: () => useStore.getState().toggleLockIn() },
    { label: 'Present', shortcut: 'P', action: () => togglePresentation() },
    { label: 'Load demo', action: () => loadDemoSeed() },
    { label: 'Export data', action: () => exportData() },
    { label: 'Import data', action: () => fileRef.current?.click() },
  ];

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-200 ${
          open
            ? 'bg-ink text-surface-hi border-ink shadow-sm'
            : 'bg-surface-hi text-ink-dim border-line hover:text-ink hover:border-ink-dim'
        }`}
        title="Menu"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M3 5h10M3 8h10M3 11h10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className={`origin-center transition-transform duration-200 ${open ? 'scale-90 opacity-80' : ''}`}
          />
        </svg>
      </button>

      <div
        className={`absolute right-0 top-[calc(100%+6px)] z-50 min-w-[168px] origin-top-right transition-all duration-200 ease-out ${
          open
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-[0.96] -translate-y-1 pointer-events-none'
        }`}
        role="menu"
      >
        <div className="bg-surface-hi border border-line rounded-xl shadow-raised overflow-hidden py-1">
          {items.map((item, i) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                item.action();
                setOpen(false);
              }}
              className="w-full flex items-center justify-between gap-6 px-3.5 py-2.5 text-[13px] text-ink hover:bg-surface transition-colors duration-150"
              style={{
                animation: open ? `menu-item-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) ${i * 40}ms both` : undefined,
              }}
            >
              <span>{item.label}</span>
              {item.shortcut && (
                <span className="font-mono text-[10px] text-ink-mute">{item.shortcut}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={onImport}
      />
    </div>
  );
}
