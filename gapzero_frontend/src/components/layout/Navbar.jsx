import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { Search, LogOut, Menu, Moon, Sun } from 'lucide-react';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <header
      className={`h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 border-b transition-colors duration-300 ${
        darkMode
          ? 'bg-gray-900 border-gray-800 text-gray-100'
          : 'bg-white border-gray-200/90 text-[#202124]'
      }`}
    >
      {/* Left: 3-lines hamburger menu icon + Brand */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title="Open workspace menu"
            aria-label="Open workspace menu"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer focus:outline-none ${
              darkMode
                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                : 'text-gray-700 hover:text-black hover:bg-gray-100'
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link to={isAuthenticated ? '/dashboard' : '/landing'} className="flex items-center gap-1.5 group select-none">
          <span
            className={`text-2xl font-black tracking-tight transition-colors ${
              darkMode ? 'text-white' : 'text-[#202124]'
            }`}
          >
            agyaan<span className="text-[#20BEFF]">lab</span>
          </span>
        </Link>
      </div>

      {/* Right: Search + Dark Mode + User Profile */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          title="Quick search"
          className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
            darkMode
              ? 'border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white'
              : 'border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-black'
          }`}
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Dark / Light toggle */}
        <button
          onClick={toggleDarkMode}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
            darkMode
              ? 'border-gray-700 text-amber-400 hover:bg-gray-800'
              : 'border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-black'
          }`}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {isAuthenticated ? (
          <div
            className={`flex items-center gap-2 pl-2 border-l ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            {/* Clickable avatar → /profile */}
            <Link
              to="/profile"
              title="View profile"
              className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition-all ring-2 ring-transparent hover:ring-gray-300 dark:hover:ring-gray-600 ${
                darkMode
                  ? 'bg-gray-700 text-white'
                  : 'bg-[#EBF7FF] border border-[#BCE4FA] text-[#0083B0]'
              }`}
            >
              {user?.first_name
                ? user.first_name[0]
                : user?.username
                ? user.username[0].toUpperCase()
                : 'A'}
            </Link>

            <div className="hidden lg:block text-left text-xs leading-tight">
              <Link
                to="/profile"
                className={`font-semibold hover:underline ${
                  darkMode ? 'text-gray-100' : 'text-gray-800'
                }`}
              >
                {user?.username || 'Researcher'}
              </Link>
              <p className={`text-[10px] capitalize ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {user?.role || 'Scientific Lead'}
              </p>
            </div>

            <button
              onClick={logout}
              title="Sign out"
              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className={`text-sm font-medium px-3.5 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-black'
              }`}
            >
              Login
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-full bg-[#202124] dark:bg-white text-white dark:text-black px-5 py-2 text-sm font-medium hover:bg-black dark:hover:bg-gray-100 transition-all shadow-xs"
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
