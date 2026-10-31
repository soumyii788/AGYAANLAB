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
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B1120] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary: 'bg-[#38BDF8] text-[#0B1120] hover:bg-[#0EA5E9] focus:ring-[#38BDF8] font-semibold shadow-lg shadow-[#38BDF8]/20',
    secondary: 'bg-[#1E293B] text-[#F8FAFC] hover:bg-[#334155] focus:ring-[#64748B] border border-slate-700/60',
    outline: 'bg-transparent text-[#38BDF8] border border-[#38BDF8]/40 hover:bg-[#38BDF8]/10 focus:ring-[#38BDF8]',
    ghost: 'bg-transparent text-slate-300 hover:text-white hover:bg-[#1E293B]/60 focus:ring-slate-500',
    danger: 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 focus:ring-rose-500',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : (
        leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
};

export default Button;
