import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'cyan' | 'neutral' | 'amber' | 'danger' | 'success';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'neutral',
  size = 'md',
  pulse = false,
  ...props
}) => {
  const base = 'inline-flex items-center font-mono font-medium rounded uppercase tracking-wider select-none';

  const sizeMap = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-0.5 gap-1.5',
  };

  const variantMap = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30',
    neutral: 'bg-dark-750 text-dark-300 border border-dark-600',
    amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    danger: 'bg-danger-500/10 text-danger-400 border border-danger-500/30',
    success: 'bg-success-500/10 text-success-400 border border-success-500/30',
  };

  return (
    <span className={twMerge(clsx(base, sizeMap[size], variantMap[variant], className))} {...props}>
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={clsx('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', {
            'bg-cyan-400': variant === 'cyan',
            'bg-amber-400': variant === 'amber',
            'bg-danger-400': variant === 'danger',
            'bg-success-400': variant === 'success',
            'bg-dark-400': variant === 'neutral',
          })}></span>
          <span className={clsx('relative inline-flex rounded-full h-2 w-2', {
            'bg-cyan-500': variant === 'cyan',
            'bg-amber-500': variant === 'amber',
            'bg-danger-500': variant === 'danger',
            'bg-success-500': variant === 'success',
            'bg-dark-400': variant === 'neutral',
          })}></span>
        </span>
      )}
      {children}
    </span>
  );
};
