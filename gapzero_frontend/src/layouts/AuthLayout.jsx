import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-[#F9F9FB] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#3B82F6] flex items-center justify-center text-white font-black text-sm shadow-sm">
            G0
          </div>
          <span className="text-xl font-black tracking-tight text-[#1E2022]">
            GAP<span className="text-[#3B82F6]">ZERO</span>
          </span>
        </Link>
        <p className="mt-1.5 text-xs text-[#4A4D55]">
          Don't just find answers. <span className="text-[#1E2022] font-medium">Discover what's missing.</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-xl border border-[#E5E7EB] shadow-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
