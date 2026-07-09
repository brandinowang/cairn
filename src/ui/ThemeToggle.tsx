import { useStore } from '../store/useStore';
import { PanelIconButton } from './PanelIconButton';

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.05 3.05l1.06 1.06M11.9 11.9l1.06 1.06M3.05 12.95l1.06-1.06M11.9 4.1l1.06-1.06"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M6.2 2.4a5.6 5.6 0 1 0 7.4 7.4A4.8 4.8 0 0 1 6.2 2.4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ThemeToggle() {
  const colorScheme = useStore((s) => s.colorScheme);
  const toggleColorScheme = useStore((s) => s.toggleColorScheme);
  const isDark = colorScheme === 'dark';

  return (
    <PanelIconButton
      label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleColorScheme}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </PanelIconButton>
  );
}
