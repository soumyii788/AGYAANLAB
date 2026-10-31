import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Search, LogOut } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-[#1E2C4A] bg-[#0A0F1D] px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Search Bar */}
      <div className="relative w-80">
        <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search research claims, gaps, papers..."
          className="w-full bg-[#080C15] text-xs text-[#F8FAFC] placeholder:text-[#94A3B8]/50 rounded-lg pl-9 pr-4 py-2 border border-[#1E2C4A] focus:outline-none focus:border-[#3B82F6] focus:bg-[#0E1626] transition-colors"
        />
      </div>

      {/* Right User & Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#141F36] border border-[#1E2C4A] flex items-center justify-center text-xs font-bold text-[#60A5FA]">
            {user?.first_name ? user.first_name[0] : (user?.username ? user.username[0].toUpperCase() : 'G0')}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-[#F8FAFC]">
              {user?.full_name || user?.username || 'Researcher'}
            </p>
            <p className="text-[10px] text-[#94A3B8] capitalize">
              {user?.organization || 'Scientific Investigator'}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign out"
          className="p-2 text-[#94A3B8] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors ml-2"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
