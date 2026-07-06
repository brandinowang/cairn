/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        panel: 'var(--panel)',
        'panel-2': 'var(--panel-2)',
        line: 'var(--line)',
        text: 'var(--text)',
        'text-dim': 'var(--text-dim)',
        'text-mute': 'var(--text-mute)',
        accent: 'var(--accent)',
        'accent-dim': 'var(--accent-dim)',
        ok: 'var(--ok)',
      },
      fontFamily: {
        mono: ['"Berkeley Mono"', '"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '1px',
        sm: '1px',
        md: '2px',
      },
    },
  },
  plugins: [],
};
