import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Search, LogOut } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-[#E5E7EB] bg-white px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Search Bar */}
      <div className="relative w-80">
        <Search className="w-4 h-4 text-[#4A4D55] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search projects, hypotheses, papers..."
          className="w-full bg-[#F9F9FB] text-xs text-[#1E2022] placeholder:text-[#4A4D55]/60 rounded-lg pl-9 pr-4 py-2 border border-[#E5E7EB] focus:outline-none focus:border-[#3B82F6] focus:bg-white transition-colors"
        />
      </div>

      {/* Right User & Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-xs font-semibold text-[#3B82F6]">
            {user?.first_name ? user.first_name[0] : (user?.username ? user.username[0].toUpperCase() : 'U')}
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-[#1E2022]">
              {user?.full_name || user?.username || 'Researcher'}
            </p>
            <p className="text-[11px] text-[#4A4D55] capitalize">
              {user?.organization || 'Independent Researcher'}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign out"
          className="p-2 text-[#4A4D55] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-2"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
