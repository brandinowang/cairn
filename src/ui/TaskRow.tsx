import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { computeStoneParams } from '../engine/structure';
import { MATERIAL_CONFIG } from '../engine/materials';
import { formatTaskTime } from '../utils/format';
import type { Task } from '../types';

interface TaskRowProps {
  task: Task;
  done?: boolean;
}

export function TaskRow({ task, done = false }: TaskRowProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const focusedTaskId = useStore((s) => s.focusedTaskId);
  const lastAddedId = useStore((s) => s.lastAddedId);
  const setFocusedTask = useStore((s) => s.setFocusedTask);
  const completeTask = useStore((s) => s.completeTask);
  const uncompleteTask = useStore((s) => s.uncompleteTask);
  const editTask = useStore((s) => s.editTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const categories = useStore((s) => s.categories);

  const isFocused = focusedTaskId === task.id;
  const stoneParams = useMemo(
    () => (done ? computeStoneParams(task, categories) : null),
    [done, task, categories],
  );

  const timeLabel = formatTaskTime(done ? (task.completedAt ?? task.createdAt) : task.createdAt);

  const handleToggle = () => {
    if (task.completedAt) uncompleteTask(task.id);
    else completeTask(task.id);
  };

  const handleSaveEdit = () => {
    editTask(task.id, editTitle);
    setEditing(false);
  };

  return (
    <div
      data-task-id={task.id}
      onClick={() => setFocusedTask(task.id)}
      className={`group relative flex items-center gap-3 px-4 py-3 row-separator cursor-pointer transition-colors duration-150 ${
        isFocused ? 'bg-surface-hi' : 'hover:bg-surface-hi/60'
      } ${lastAddedId === task.id && !done ? 'animate-task-in' : ''}`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
        className={`w-[18px] h-[18px] shrink-0 border border-line-strong rounded-md flex items-center justify-center transition-all duration-150 active:scale-90 ${
          done ? 'bg-ink border-ink' : 'bg-surface-hi hover:border-ink-dim'
        }`}
        aria-label={done ? 'Uncomplete' : 'Complete'}
      >
        {done && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden>
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="var(--surface-hi)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit();
              if (e.key === 'Escape') setEditing(false);
            }}
            onBlur={handleSaveEdit}
            className="w-full bg-surface-hi border border-line rounded-xl px-2.5 py-1.5 text-[15px] text-ink focus:outline-none focus:border-ink-dim"
          />
        ) : (
          <span
            data-edit-trigger
            onDoubleClick={() => {
              setEditTitle(task.title);
              setEditing(true);
            }}
            className={`block truncate text-[15px] leading-snug ${done ? 'line-through text-ink-mute' : 'text-ink'}`}
          >
            {task.title}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0 min-w-[72px] justify-end">
        {done && stoneParams && (
          <span
            title={stoneParams.type}
            className="w-6 h-6 shrink-0 rounded-md border border-line overflow-hidden shadow-sm group-hover:hidden"
            style={{ backgroundColor: MATERIAL_CONFIG[stoneParams.material].color }}
          />
        )}

        <span className="font-mono text-[11px] text-ink-mute tabular-nums group-hover:hidden">
          {timeLabel}
        </span>

        <div className="hidden group-hover:flex items-center gap-2">
          <button
            type="button"
            data-edit-trigger
            onClick={(e) => {
              e.stopPropagation();
              setEditTitle(task.title);
              setEditing(true);
            }}
            className="text-[11px] text-ink-mute hover:text-ink transition-colors duration-150 active:scale-95"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (confirmDelete) deleteTask(task.id);
              else {
                setConfirmDelete(true);
                setTimeout(() => setConfirmDelete(false), 2000);
              }
            }}
            className={`text-[11px] transition-colors duration-150 active:scale-95 ${
              confirmDelete ? 'text-accent' : 'text-ink-mute hover:text-ink'
            }`}
          >
            {confirmDelete ? 'Confirm' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
