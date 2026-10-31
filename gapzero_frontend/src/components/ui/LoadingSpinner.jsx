import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ size = 'md', message = '', fullScreen = false }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={clsx('animate-spin text-[#38BDF8]', sizes[size])} />
      {message && <p className="text-sm text-slate-400 font-medium">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full bg-[#0B1120] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return <div className="py-12 flex items-center justify-center">{content}</div>;
};

export default LoadingSpinner;
