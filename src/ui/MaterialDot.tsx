import type { MaterialKey } from '../types';

const SWATCH: Record<MaterialKey, string> = {
  aluminum: 'var(--mat-aluminum)',
  walnut: 'var(--mat-walnut)',
  graphite: 'var(--mat-graphite)',
  red: 'var(--accent)',
};

interface MaterialDotProps {
  material: MaterialKey;
  className?: string;
}

export function MaterialDot({ material, className = '' }: MaterialDotProps) {
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${className}`}
      style={{ backgroundColor: SWATCH[material] }}
    />
  );
}

export function categoryMaterial(name: string, fallback: MaterialKey = 'aluminum'): MaterialKey {
  const key = name.toUpperCase();
  if (key === 'SIGNAL') return 'red';
  if (key === 'ADMIN') return 'graphite';
  if (key === 'DESIGN') return 'walnut';
  if (key === 'STUDIO') return 'aluminum';
  return fallback;
}
