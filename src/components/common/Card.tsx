import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  headerAction,
  children,
  className,
  noPadding = false,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        'bg-dark-850/90 border border-dark-700/80 rounded shadow-panel backdrop-blur-sm',
        className
      )}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700/60 bg-dark-900/40">
          <div>
            {title && <h3 className="text-sm font-semibold text-dark-100 tracking-wide uppercase">{title}</h3>}
            {subtitle && <p className="text-xs text-dark-400 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={clsx(!noPadding && 'p-4')}>{children}</div>
    </div>
  );
};
