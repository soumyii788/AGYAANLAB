import React from 'react';
import { Layers } from 'lucide-react';
import Button from './Button';

export const EmptyState = ({
  icon: Icon = Layers,
  title = 'No items found',
  description = 'Get started by creating your first entry.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-[#1E293B] bg-[#172235]/40">
      <div className="w-14 h-14 rounded-2xl bg-[#0B1120] border border-[#1E293B] flex items-center justify-center text-[#38BDF8] mb-4 shadow-inner">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-base font-semibold text-[#F8FAFC]">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm mt-1.5 mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
