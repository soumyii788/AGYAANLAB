import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Search, LogOut, Menu } from 'lucide-react';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200/90 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
      {/* Left: 3-lines hamburger menu icon + Brand */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title="Open workspace menu"
            aria-label="Open workspace menu"
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-700 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer focus:outline-none"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link to={isAuthenticated ? "/dashboard" : "/landing"} className="flex items-center gap-1.5 group select-none">
          <span className="text-2xl font-black tracking-tight text-[#202124] group-hover:text-black transition-colors">
            agyaan<span className="text-[#20BEFF]">lab</span>
          </span>
        </Link>
      </div>

      {/* Right: Search + User Profile + Auth Controls */}
      <div className="flex items-center gap-3">
        {/* Search Pill Button */}
        <div className="relative">
          <button
            title="Quick search"
            className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-black transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {isAuthenticated ? (
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            <div className="w-8 h-8 rounded-full bg-[#EBF7FF] border border-[#BCE4FA] text-[#0083B0] font-bold text-xs flex items-center justify-center">
              {user?.first_name ? user.first_name[0] : (user?.username ? user.username[0].toUpperCase() : 'A')}
            </div>
            <div className="hidden lg:block text-left text-xs leading-tight">
              <p className="font-semibold text-gray-800">{user?.username || 'Researcher'}</p>
              <p className="text-[10px] text-gray-500 capitalize">{user?.domain || 'Scientific Lead'}</p>
            </div>

            <button
              onClick={logout}
              title="Sign out"
              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-700 hover:text-black px-3.5 py-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-full bg-[#202124] text-white px-5 py-2 text-sm font-medium hover:bg-black transition-all shadow-xs"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
