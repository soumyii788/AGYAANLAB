import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial subtle accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#38BDF8]/10 via-[#38BDF8]/5 to-transparent blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#38BDF8] to-blue-700 flex items-center justify-center text-[#0B1120] font-black text-xl shadow-lg shadow-[#38BDF8]/20">
            G0
          </div>
          <span className="text-2xl font-black tracking-widest text-[#F8FAFC]">
            GAP<span className="text-[#38BDF8]">ZERO</span>
          </span>
        </Link>
        <p className="mt-2 text-xs font-medium text-slate-400">
          Don't just find answers. <span className="text-slate-200">Discover what's missing.</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-[#172235] py-8 px-6 sm:px-10 rounded-2xl border border-[#1E293B] shadow-2xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
