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
        <label className="block text-xs font-semibold text-[#202124] mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative rounded-xl">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full bg-white text-[#202124] border rounded-xl px-3.5 py-2.5 text-sm transition-all duration-150 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#202124]/10 focus:border-[#202124]',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-500' : 'border-gray-300 hover:border-gray-400',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
      )}
      {!error && helperText && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
