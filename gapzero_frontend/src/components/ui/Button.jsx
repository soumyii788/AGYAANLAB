import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#080C15] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary: 'bg-[#3B82F6] text-white hover:bg-[#2563EB] focus:ring-[#3B82F6] shadow-[0_2px_10px_rgba(59,130,246,0.3)] font-semibold',
    secondary: 'bg-[#141F36] text-[#F8FAFC] hover:bg-[#1E2C4A] hover:text-white focus:ring-[#3B82F6] border border-[#1E2C4A] shadow-sm',
    outline: 'bg-transparent text-[#60A5FA] border border-[#3B82F6]/50 hover:bg-[#3B82F6]/10 focus:ring-[#3B82F6]',
    ghost: 'bg-transparent text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#141F36] focus:ring-slate-700',
    danger: 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 focus:ring-rose-500',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-xs px-4 py-2 gap-2 font-medium',
    lg: 'text-sm px-5 py-2.5 gap-2.5 font-semibold',
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
      ) : (
        leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
};

export default Button;
