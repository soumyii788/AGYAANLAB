import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ size = 'md', message = '', fullScreen = false }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-2.5">
      <Loader2 className={clsx('animate-spin text-[#3B82F6]', sizes[size])} />
      {message && <p className="text-xs text-[#4A4D55] font-medium">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full bg-[#F9F9FB] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return <div className="py-12 flex items-center justify-center">{content}</div>;
};

export default LoadingSpinner;
