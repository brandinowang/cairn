import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export function useThemeSync() {
  const colorScheme = useStore((s) => s.colorScheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', colorScheme === 'dark');
  }, [colorScheme]);
}
