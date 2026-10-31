import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Search, LogOut } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-[#1E293B]/60 bg-[#0B1120]/90 backdrop-blur-sm px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Search Bar */}
      <div className="relative w-80">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search projects or topics..."
          className="w-full bg-[#101827] text-xs text-slate-200 placeholder:text-slate-500 rounded-lg pl-9 pr-4 py-2 border border-[#1E293B]/60 focus:outline-none focus:border-[#38BDF8]"
        />
      </div>

      {/* Right User & Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#172235] border border-[#1E293B] flex items-center justify-center text-xs font-semibold text-[#38BDF8]">
            {user?.first_name ? user.first_name[0] : (user?.username ? user.username[0].toUpperCase() : 'U')}
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-[#F8FAFC]">
              {user?.full_name || user?.username || 'Researcher'}
            </p>
            <p className="text-[11px] text-slate-400 capitalize">
              {user?.organization || 'Independent'}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign out"
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-[#172235] rounded-lg transition-colors ml-2"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
