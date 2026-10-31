import React from 'react';
import clsx from 'clsx';

export const Card = ({
  children,
  className = '',
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'rounded-xl border border-[#1E2C4A] bg-[#0E1626] text-[#F8FAFC] shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all duration-150',
        hoverEffect && 'hover:border-[#3B82F6]/60 hover:shadow-[0_4px_25px_rgba(59,130,246,0.12)] hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={clsx('p-5 border-b border-[#1E2C4A]', className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={clsx('text-base font-bold text-[#F8FAFC] tracking-tight', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '', ...props }) => (
  <p className={clsx('text-xs text-[#94A3B8] mt-1 leading-relaxed', className)} {...props}>
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
