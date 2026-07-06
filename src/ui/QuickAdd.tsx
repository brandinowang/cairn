import { useState } from 'react';
import { nextPriority, PRIORITY_LABEL } from '../hooks/useKeyboardMap';
import { useStore } from '../store/useStore';
import type { Priority } from '../types';

export function QuickAdd() {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('med');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const addTask = useStore((s) => s.addTask);
  const categories = useStore((s) => s.categories);

  const handleSubmit = () => {
    if (!title.trim()) return;
    addTask(title, priority, categoryId);
    setTitle('');
    requestAnimationFrame(() => {
      document.getElementById('quick-add-input')?.focus();
    });
  };

  return (
    <div className="border-b border-line p-3">
      <div className="flex gap-2">
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
          placeholder="add task"
          autoFocus
          className="flex-1 bg-panel-2 border border-line px-2 py-1.5 text-text placeholder:text-text-mute focus:outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={() => setPriority(nextPriority(priority))}
          className="font-mono text-[10px] uppercase tracking-widest border border-line px-2 py-1 text-text-dim hover:text-text hover:border-accent"
          title="Cycle priority"
        >
          {PRIORITY_LABEL[priority]}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setCategoryId(null)}
          className={`font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 border ${
            categoryId === null
              ? 'border-accent text-accent'
              : 'border-line text-text-mute hover:text-text-dim'
          }`}
        >
          none
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategoryId(c.id)}
            className={`font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 border ${
              categoryId === c.id
                ? 'border-accent text-accent'
                : 'border-line text-text-mute hover:text-text-dim'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
