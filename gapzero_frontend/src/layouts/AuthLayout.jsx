import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-[#F9F9FB] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center justify-center">
          <img
            src="/agyaan-logo.png"
            alt="AGYAAN LAB"
            className="h-12 w-auto object-contain"
          />
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
