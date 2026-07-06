import { useState } from 'react';
import { PRIORITY_LABEL } from '../hooks/useKeyboardMap';
import { useStore } from '../store/useStore';
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
  const setFocusedTask = useStore((s) => s.setFocusedTask);
  const completeTask = useStore((s) => s.completeTask);
  const uncompleteTask = useStore((s) => s.uncompleteTask);
  const editTask = useStore((s) => s.editTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const categories = useStore((s) => s.categories);

  const category = categories.find((c) => c.id === task.categoryId);
  const isFocused = focusedTaskId === task.id;

  const handleToggle = () => {
    if (task.completedAt) uncompleteTask(task.id);
    else completeTask(task.id);
  };

  const handleSaveEdit = () => {
    editTask(task.id, editTitle);
    setEditing(false);
  };

  const priorityColor =
    task.priority === 'high'
      ? 'text-accent border-accent'
      : task.priority === 'med'
        ? 'text-text-dim border-line'
        : 'text-text-mute border-line';

  return (
    <div
      data-task-id={task.id}
      onClick={() => setFocusedTask(task.id)}
      className={`group flex items-center gap-2 px-3 py-2 border-b border-line cursor-pointer transition-colors ${
        isFocused ? 'bg-panel-2' : 'hover:bg-panel-2/50'
      }`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
        className={`w-3.5 h-3.5 shrink-0 border flex items-center justify-center ${
          done ? 'border-ok bg-ok/10' : 'border-line hover:border-accent'
        }`}
        aria-label={done ? 'Uncomplete' : 'Complete'}
      >
        {done && (
          <span className="text-ok text-[10px] leading-none">✓</span>
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
            className="w-full bg-panel border border-line px-1 py-0.5 text-text focus:outline-none focus:border-accent"
          />
        ) : (
          <span
            data-edit-trigger
            onDoubleClick={() => {
              setEditTitle(task.title);
              setEditing(true);
            }}
            className={`block truncate ${done ? 'line-through text-text-dim' : 'text-text'}`}
          >
            {task.title}
          </span>
        )}
      </div>

      {category && (
        <span className="font-mono text-[9px] uppercase tracking-wider text-text-mute shrink-0">
          {category.name}
        </span>
      )}

      <span
        className={`font-mono text-[9px] uppercase tracking-wider border px-1 shrink-0 ${priorityColor}`}
      >
        {PRIORITY_LABEL[task.priority]}
      </span>

      <div className="hidden group-hover:flex items-center gap-1 shrink-0">
        <button
          type="button"
          data-edit-trigger
          onClick={(e) => {
            e.stopPropagation();
            setEditTitle(task.title);
            setEditing(true);
          }}
          className="font-mono text-[9px] text-text-mute hover:text-text uppercase"
        >
          edit
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (confirmDelete) {
              deleteTask(task.id);
            } else {
              setConfirmDelete(true);
              setTimeout(() => setConfirmDelete(false), 2000);
            }
          }}
          className={`font-mono text-[9px] uppercase ${
            confirmDelete ? 'text-accent' : 'text-text-mute hover:text-accent'
          }`}
        >
          {confirmDelete ? 'confirm' : 'del'}
        </button>
      </div>
    </div>
  );
}
