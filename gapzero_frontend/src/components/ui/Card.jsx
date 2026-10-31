import React from 'react';
import clsx from 'clsx';

export const Card = ({
  children,
  className = '',
  hoverEffect = true,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-gray-200/90 bg-white text-[#202124] shadow-xs transition-all duration-200',
        hoverEffect && 'hover:border-gray-300 hover:shadow-sm hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={clsx('p-5 border-b border-gray-100', className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={clsx('text-base font-semibold text-[#202124] tracking-tight', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '', ...props }) => (
  <p className={clsx('text-xs text-gray-500 mt-1 leading-relaxed', className)} {...props}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={clsx('p-5', className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={clsx('p-5 pt-0 flex items-center', className)} {...props}>
    {children}
  </div>
);

export default Card;
