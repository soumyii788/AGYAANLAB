import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass,
  FolderGit2,
  Layers,
  Sparkles,
  FileText,
  Plus
} from 'lucide-react';
import clsx from 'clsx';

export const Sidebar = () => {
  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: Compass },
    { name: 'Research Projects', href: '/projects', icon: FolderGit2 },
    { name: 'Literature Sources', href: '/sources', icon: Layers },
    { name: 'Gap Analyses', href: '/analyses', icon: Sparkles },
    { name: 'Reports', href: '/reports', icon: FileText },
  ];

  return (
    <aside className="w-60 bg-[#101827] border-r border-[#1E293B]/60 flex flex-col flex-shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-[#1E293B]/40">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#38BDF8] to-blue-600 flex items-center justify-center text-[#0B1120] font-black text-sm shadow-md shadow-[#38BDF8]/10">
          G0
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-wider text-[#F8FAFC]">
            GAP<span className="text-[#38BDF8]">ZERO</span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium tracking-tight">
            Research Intelligence
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-6 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-[#172235] text-[#38BDF8] font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#172235]/40'
                )
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Clean Bottom Workspace Indicator */}
      <div className="p-4 border-t border-[#1E293B]/40">
        <div className="px-3 py-2.5 rounded-lg bg-[#0B1120]/60 border border-[#1E293B]/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-slate-300 font-medium">Core Engine</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">v1.0</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
