import { QuickAdd } from './QuickAdd';
import { TaskRow } from './TaskRow';
import { ModeToggle } from './ModeToggle';
import { useStore, useDoneTasks, useOpenTasks, useTaskCounts } from '../store/useStore';

export function ListPanel() {
  const openTasks = useOpenTasks();
  const doneTasks = useDoneTasks();
  const { open, done } = useTaskCounts();
  const doneExpanded = useStore((s) => s.doneExpanded);
  const toggleDoneExpanded = useStore((s) => s.toggleDoneExpanded);
  const togglePresentation = useStore((s) => s.togglePresentation);
  const presentationMode = useStore((s) => s.presentationMode);

  if (presentationMode) return null;

  return (
    <aside className="w-[360px] shrink-0 flex flex-col border-r border-line bg-panel h-full">
      <header className="flex items-center justify-between px-3 py-2 border-b border-line">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-medium tracking-widest uppercase">
            CAIRN
          </span>
          <span className="font-mono text-[10px] text-text-dim tracking-wider uppercase">
            OPEN {open.toString().padStart(2, '0')} / DONE {done.toString().padStart(2, '0')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <button
            type="button"
            onClick={togglePresentation}
            className="font-mono text-[9px] uppercase tracking-wider text-text-mute hover:text-text border border-line px-1.5 py-0.5"
            title="Presentation mode (p)"
          >
            pres
          </button>
        </div>
      </header>

      <QuickAdd />

      <div className="flex-1 overflow-y-auto">
        {openTasks.length === 0 && (
          <div className="px-3 py-4 text-text-mute font-mono text-[10px] uppercase tracking-wider">
            no open tasks
          </div>
        )}
        {openTasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}

        {doneTasks.length > 0 && (
          <div className="border-t border-line">
            <button
              type="button"
              onClick={toggleDoneExpanded}
              className="w-full px-3 py-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-text-dim hover:text-text"
            >
              <span>DONE ({doneTasks.length})</span>
              <span>{doneExpanded ? '−' : '+'}</span>
            </button>
            {doneExpanded &&
              doneTasks.map((task) => (
                <TaskRow key={task.id} task={task} done />
              ))}
          </div>
        )}
      </div>
    </aside>
  );
}
