import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Search, Plus, LogOut, Sparkles, FolderGit2, Layers, SearchCode, FileCheck, ListChecks, FileText } from 'lucide-react';
import clsx from 'clsx';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Projects', href: '/projects' },
    { name: 'Data Hub', href: '/sources' },
    { name: 'Benchmarks', href: '/findings' },
    { name: 'Evidence', href: '/evidence' },
    { name: 'Checklist', href: '/checklist' },
    { name: 'Reports', href: '/reports' },
  ];

  return (
    <header className="h-16 bg-white border-b border-gray-200/90 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Brand + Nav Items */}
      <div className="flex items-center gap-6 lg:gap-8">
        <Link to={isAuthenticated ? "/dashboard" : "/landing"} className="flex items-center gap-1.5 group select-none">
          <span className="text-2xl font-black tracking-tight text-[#202124] group-hover:text-black transition-colors">
            agyaan<span className="text-[#20BEFF]">lab</span>
          </span>
        </Link>

        {/* Kaggle Header Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.name}
                to={link.href}
                className={clsx(
                  'px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors',
                  isActive
                    ? 'text-[#202124] font-semibold bg-gray-100'
                    : 'text-gray-600 hover:text-[#202124] hover:bg-gray-50'
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: Search + Action Pills + Auth */}
      <div className="flex items-center gap-3">
        {/* Search Pill Button */}
        <div className="relative hidden sm:block">
          <button
            title="Quick search"
            className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-black transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {isAuthenticated ? (
          <>
            <Link
              to="/new-research"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#202124] text-white px-4 py-2 text-xs md:text-sm font-medium hover:bg-black transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Research</span>
            </Link>

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
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-700 hover:text-black px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors"
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
