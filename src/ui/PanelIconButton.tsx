import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface PanelIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  active?: boolean;
  children: ReactNode;
}

export function PanelIconButton({
  label,
  active = false,
  children,
  className = '',
  ...props
}: PanelIconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-150 active:scale-[0.98] ${
        active
          ? 'bg-ink text-surface-hi border-ink shadow-sm'
          : 'bg-surface-hi text-ink-dim border-line hover:text-ink hover:border-ink-dim'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
