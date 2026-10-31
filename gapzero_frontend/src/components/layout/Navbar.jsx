import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Bell, Search, ShieldCheck, User as UserIcon, LogOut } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-[#1E293B] bg-[#101827]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search Input Bar */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search research queries, papers, gaps (Cmd + K)..."
            className="w-full bg-[#0B1120] text-xs text-slate-200 placeholder:text-slate-500 rounded-lg pl-9 pr-4 py-2 border border-[#1E293B] focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8]"
          />
        </div>
      </div>

      {/* Right User & Status Area */}
      <div className="flex items-center gap-4">
        {/* API connection indicator */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Core Connected</span>
        </div>

        {/* Notifications Icon */}
        <button
          title="Notifications"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#172235] transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#38BDF8] rounded-full" />
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center gap-3 pl-2 border-l border-[#1E293B]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#38BDF8] to-indigo-600 flex items-center justify-center text-xs font-bold text-slate-900 shadow">
            {user?.first_name ? user.first_name[0] : (user?.username ? user.username[0].toUpperCase() : 'U')}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-[#F8FAFC] leading-none">
              {user?.full_name || user?.username || 'Researcher'}
            </p>
            <p className="text-[11px] text-slate-400 capitalize mt-0.5">
              {user?.role || 'Principal Investigator'}
            </p>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-[#172235] rounded-lg transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
