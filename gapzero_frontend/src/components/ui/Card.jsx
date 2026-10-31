import React from 'react';
import clsx from 'clsx';

export const Card = ({
  children,
  className = '',
  hoverEffect = false,
  glass = false,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'rounded-xl border border-[#1E293B]/80 transition-all duration-200',
        glass ? 'glass-panel' : 'bg-[#172235]',
        hoverEffect && 'hover:border-[#38BDF8]/40 hover:shadow-lg hover:shadow-[#38BDF8]/5 hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={clsx('p-5 border-b border-[#1E293B]/80', className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={clsx('text-lg font-semibold text-[#F8FAFC] tracking-tight', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '', ...props }) => (
  <p className={clsx('text-xs text-slate-400 mt-1', className)} {...props}>
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
