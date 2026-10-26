import React from 'react';
import { Database, AlertCircle, PlayCircle, BarChart3, HelpCircle } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: 'database' | 'alert' | 'play' | 'chart' | 'help';
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'database',
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  const renderIcon = () => {
    const props = { size: 36, className: 'text-dark-500' };
    switch (icon) {
      case 'alert':
        return <AlertCircle {...props} className="text-amber-500/80" />;
      case 'play':
        return <PlayCircle {...props} className="text-cyan-500/80" />;
      case 'chart':
        return <BarChart3 {...props} className="text-cyan-400/80" />;
      case 'help':
        return <HelpCircle {...props} className="text-dark-400" />;
      default:
        return <Database {...props} />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-dark-700/80 rounded bg-dark-900/30">
      <div className="p-3 mb-3 rounded-full bg-dark-800/80 border border-dark-700/60">{renderIcon()}</div>
      <h4 className="text-sm font-semibold uppercase tracking-wider text-dark-200">{title}</h4>
      <p className="mt-1.5 max-w-md text-xs text-dark-400 leading-relaxed">{description}</p>
      {(actionText || secondaryActionText) && (
        <div className="flex items-center gap-2.5 mt-4">
          {actionText && onAction && (
            <Button size="sm" variant="primary" onClick={onAction}>
              {actionText}
            </Button>
          )}
          {secondaryActionText && onSecondaryAction && (
            <Button size="sm" variant="secondary" onClick={onSecondaryAction}>
              {secondaryActionText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
