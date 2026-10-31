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
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}
      <div className="relative rounded-lg shadow-sm">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full bg-[#0B1120] text-[#F8FAFC] border rounded-lg px-3.5 py-2.5 text-sm transition-all duration-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/40 focus:border-[#38BDF8]',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error ? 'border-rose-500/80 focus:ring-rose-500/40 focus:border-rose-500' : 'border-[#1E293B] hover:border-slate-700',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-rose-400 font-medium">{error}</p>
      )}
      {!error && helperText && (
        <p className="mt-1.5 text-xs text-slate-400">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
