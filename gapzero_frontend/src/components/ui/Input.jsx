import React, { forwardRef } from 'react';
import clsx from 'clsx';

export const Input = forwardRef(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  containerClassName = '',
  required = false,
  ...props
}, ref) => {
  return (
    <div className={clsx('w-full', containerClassName)}>
      {label && (
        <label className="block text-xs font-semibold text-[#1E2022] mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative rounded-lg shadow-sm">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#4A4D55]">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full bg-white text-[#1E2022] border rounded-lg px-3 py-2 text-xs transition-all duration-150 placeholder:text-[#4A4D55]/60 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6]',
            leftIcon && 'pl-9',
            rightIcon && 'pr-9',
            error ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500' : 'border-[#E5E7EB] hover:border-slate-300',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#4A4D55]">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>
      )}
      {!error && helperText && (
        <p className="mt-1 text-xs text-[#4A4D55]">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
