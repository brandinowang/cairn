import { useState, type ChangeEvent } from 'react';
import { QuickAdd } from './QuickAdd';
import { TaskRow } from './TaskRow';
import { ModeToggle } from './ModeToggle';
import { PanelMenu } from './PanelMenu';
import { ThemeToggle } from './ThemeToggle';
import { PanelIconButton } from './PanelIconButton';
import { useStore, useDoneTasks, useOpenTasks, useTaskCounts } from '../store/useStore';
import { clearMeshCache } from '../hooks/useFusedMesh';
import { taskCountLabel } from '../utils/format';

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2M4 7h8a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ListPanel() {
  const openTasks = useOpenTasks();
  const doneTasks = useDoneTasks();
  const { open, done } = useTaskCounts();
  const doneExpanded = useStore((s) => s.doneExpanded);
  const toggleDoneExpanded = useStore((s) => s.toggleDoneExpanded);
  const presentationMode = useStore((s) => s.presentationMode);
  const lockInMode = useStore((s) => s.lockInMode);
  const toggleLockIn = useStore((s) => s.toggleLockIn);
  const importData = useStore((s) => s.importData);
  const clearAllDone = useStore((s) => s.clearAllDone);
  const [confirmClearDone, setConfirmClearDone] = useState(false);

  if (presentationMode) return null;

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importData(reader.result as string);
      } catch {
        // silent
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <aside
      className={
        lockInMode
          ? 'flex flex-col bg-paper h-full w-full items-center p-6 min-w-0'
          : 'w-[400px] shrink-0 flex flex-col bg-paper h-full min-w-[320px] p-3'
      }
    >
      <div
        className={`flex flex-col bg-surface rounded-2xl border border-line shadow-raised overflow-hidden flex-1 min-h-0 w-full ${
          lockInMode ? 'max-w-[540px]' : ''
        }`}
      >
        <header className="px-4 pt-4 pb-3 border-b border-line bg-surface">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-[17px] font-medium tracking-tight text-ink leading-none">
                {lockInMode ? 'Lock in' : 'To Do'}
              </h1>
              <p className="font-mono text-[11px] text-ink-mute mt-1.5 tabular-nums">
                {taskCountLabel(open, done)}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <ThemeToggle />
              <PanelIconButton
                label={lockInMode ? 'Unlock' : 'Lock in'}
                active={lockInMode}
                onClick={toggleLockIn}
              >
                <LockIcon />
              </PanelIconButton>
              {!lockInMode && <PanelMenu onImport={handleImport} />}
            </div>
          </div>

          {!lockInMode && (
            <div className="mt-3">
              <ModeToggle />
            </div>
          )}
        </header>

        <QuickAdd />

        <div className="flex-1 overflow-y-auto bg-surface min-h-0">
          {openTasks.length === 0 && (
            <div className="px-4 py-10 text-ink-mute text-sm text-center">No open tasks</div>
          )}
          {openTasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}

          {doneTasks.length > 0 && (
            <div className="border-t border-line mt-1">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-line/60">
                <button
                  type="button"
                  onClick={toggleDoneExpanded}
                  className="flex items-center gap-2 label-section hover:text-ink-dim transition-colors duration-150"
                >
                  <span>Done</span>
                  <span className="font-mono">{doneTasks.length}</span>
                </button>
                {doneExpanded && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirmClearDone) {
                        clearAllDone();
                        clearMeshCache();
                        setConfirmClearDone(false);
                      } else {
                        setConfirmClearDone(true);
                        setTimeout(() => setConfirmClearDone(false), 2500);
                      }
                    }}
                    className={`text-[11px] font-mono transition-colors duration-150 ${
                      confirmClearDone ? 'text-accent' : 'text-ink-mute hover:text-ink-dim'
                    }`}
                  >
                    {confirmClearDone ? 'Confirm clear' : 'Clear all'}
                  </button>
                )}
              </div>
              {doneExpanded &&
                doneTasks.map((task) => (
                  <TaskRow key={task.id} task={task} done />
                ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
