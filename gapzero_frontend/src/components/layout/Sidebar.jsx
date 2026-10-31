import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass,
  FolderGit2,
  Layers,
  Sparkles,
  FileText
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
    <aside className="w-60 bg-white border-r border-[#E5E7EB] flex flex-col flex-shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-[#E5E7EB]">
        <div className="w-8 h-8 rounded-lg bg-[#3B82F6] flex items-center justify-center text-white font-black text-xs shadow-sm">
          AL
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-[#1E2022]">
            AGYAAN<span className="text-[#3B82F6]"> LAB</span>
          </span>
          <span className="text-[10px] text-[#4A4D55] font-medium tracking-tight">
            Research Intelligence
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-6 space-y-1">
        <p className="px-3 text-[10px] font-bold text-[#4A4D55] uppercase tracking-wider mb-2">
          Workspace
        </p>
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
                    ? 'bg-[#EFF6FF] text-[#3B82F6] font-semibold'
                    : 'text-[#4A4D55] hover:text-[#1E2022] hover:bg-[#F9F9FB]'
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
      <div className="p-4 border-t border-[#E5E7EB]">
        <div className="px-3 py-2.5 rounded-lg bg-[#F9F9FB] border border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-[#1E2022] font-medium">Core Engine</span>
          </div>
          <span className="text-[10px] font-mono text-[#4A4D55]">v1.0</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
