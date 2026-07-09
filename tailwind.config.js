/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)',
        surface: 'var(--surface)',
        'surface-hi': 'var(--surface-hi)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        ink: 'var(--ink)',
        'ink-dim': 'var(--ink-dim)',
        'ink-mute': 'var(--ink-mute)',
        accent: 'var(--accent)',
        'accent-press': 'var(--accent-press)',
        'mat-aluminum': 'var(--mat-aluminum)',
        'mat-walnut': 'var(--mat-walnut)',
        'mat-graphite': 'var(--mat-graphite)',
        'mat-red': 'var(--mat-red)',
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', '"Berkeley Mono"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: 'var(--radius-card)',
        chip: 'var(--radius-chip)',
        panel: 'var(--radius-panel)',
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        raised: 'var(--shadow-raised)',
      },
    },
  },
  plugins: [],
};
