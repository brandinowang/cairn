import { useState } from 'react';
import { useStore } from '../store/useStore';

export function QuickAdd() {
  const [title, setTitle] = useState('');
  const addTask = useStore((s) => s.addTask);
  const clearLastAdded = useStore((s) => s.clearLastAdded);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    addTask(trimmed, 'med', null);
    setTitle('');
    setTimeout(() => clearLastAdded(), 520);
    requestAnimationFrame(() => {
      document.getElementById('quick-add-input')?.focus();
    });
  };

  return (
    <div className="px-4 pt-3 pb-4 border-b border-line bg-surface">
      <div className="flex items-center bg-surface-hi border border-line rounded-2xl shadow-sm focus-within:border-ink-dim focus-within:shadow-[var(--focus-ring)] transition-all duration-200 overflow-hidden">
        <input
          id="quick-add-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Add a task"
          className="flex-1 min-w-0 bg-transparent px-4 py-3 text-[15px] text-ink placeholder:text-ink-mute focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!title.trim()}
          aria-label="Add task"
          className="self-stretch px-4 text-[13px] font-medium text-ink-dim border-l border-line hover:text-ink hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.98]"
        >
          Add
        </button>
      </div>
    </div>
  );
}
