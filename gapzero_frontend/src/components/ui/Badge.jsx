import React from 'react';
import clsx from 'clsx';

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
  ...props
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700 border-gray-200',
    primary: 'bg-neutral-900 text-white border-neutral-800',
    dark: 'bg-[#1A1A1A] text-white border-neutral-700',
    mono: 'bg-neutral-100 text-neutral-900 border-neutral-300',
    charcoal: 'bg-neutral-800 text-neutral-200 border-neutral-700',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-neutral-800 text-white border-neutral-700',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    kaggle: 'bg-[#EBF7FF] text-[#0083B0] border-[#BCE4FA]',
  };

  const sizes = {
    sm: 'text-[10px] px-2.5 py-0.5 gap-1 font-semibold uppercase tracking-wider',
    md: 'text-xs px-3 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
  };

  const dotColors = {
    default: 'bg-gray-500',
    primary: 'bg-white',
    dark: 'bg-white',
    mono: 'bg-neutral-900',
    charcoal: 'bg-neutral-300',
    success: 'bg-emerald-600',
    warning: 'bg-neutral-400',
    danger: 'bg-rose-600',
    kaggle: 'bg-[#20BEFF]',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
};

export default Badge;
