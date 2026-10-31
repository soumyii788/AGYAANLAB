import React from 'react';
import { Button } from './Button';

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`text-center py-12 px-4 rounded-xl border border-dashed border-gray-200/90 bg-white/50 flex flex-col items-center justify-center ${className}`}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200/90 flex items-center justify-center mb-3 text-blue-600">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-sm font-bold text-[#202124] tracking-tight">{title}</h3>
      {description && (
        <p className="text-xs text-gray-500 max-w-sm mt-1 leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
