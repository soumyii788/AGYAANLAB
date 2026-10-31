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
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#202124] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary: 'bg-[#202124] text-white hover:bg-black font-medium shadow-xs',
    secondary: 'bg-white text-[#202124] border border-gray-300 hover:bg-gray-50 font-medium shadow-xs',
    outline: 'bg-transparent text-[#202124] border border-gray-300 hover:bg-gray-50',
    ghost: 'bg-transparent text-gray-700 hover:text-black hover:bg-gray-100',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100',
    kaggle: 'bg-[#20BEFF] text-[#202124] hover:bg-[#18A5E0] font-semibold',
  };

  const sizes = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-sm px-5 py-2 gap-2 font-medium',
    lg: 'text-base px-6 py-2.5 gap-2.5 font-medium',
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
      ) : (
        leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
};

export default Button;
