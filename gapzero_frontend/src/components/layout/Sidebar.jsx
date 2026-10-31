import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass,
  FolderGit2,
  FileText,
  Sparkles,
  BarChart3,
  Settings,
  HelpCircle,
  Activity,
  Layers
} from 'lucide-react';
import clsx from 'clsx';

export const Sidebar = () => {
  const navigation = [
    { name: 'Intelligence Dashboard', href: '/dashboard', icon: Compass },
    { name: 'Research Projects', href: '/projects', icon: FolderGit2 },
    { name: 'Gap Analyses', href: '/analyses', icon: Sparkles },
    { name: 'Sources & Papers', href: '/sources', icon: Layers },
    { name: 'Generated Reports', href: '/reports', icon: FileText },
  ];

  const secondaryNavigation = [
    { name: 'System Telemetry', href: '/activity', icon: Activity },
    { name: 'Workspace Settings', href: '/settings', icon: Settings },
    { name: 'Documentation & API', href: '/docs', icon: HelpCircle },
  ];

  return (
    <aside className="w-64 bg-[#101827] border-r border-[#1E293B] flex flex-col flex-shrink-0 min-h-screen">
      {/* Brand Logo & Product Slogan */}
      <div className="p-6 border-b border-[#1E293B]/80 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#38BDF8] to-blue-700 flex items-center justify-center text-[#0B1120] font-black text-lg shadow-lg shadow-[#38BDF8]/20">
          G0
        </div>
        <div>
          <h1 className="text-sm font-extrabold tracking-widest text-[#F8FAFC]">
            GAP<span className="text-[#38BDF8]">ZERO</span>
          </h1>
          <p className="text-[10px] text-slate-400 tracking-tight font-medium uppercase">
            Discover what's missing
          </p>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        <div>
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Platform Core
          </p>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150',
                      isActive
                        ? 'bg-[#172235] text-[#38BDF8] border border-[#38BDF8]/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#172235]/60'
                    )
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Operations
          </p>
          <nav className="space-y-1">
            {secondaryNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150',
                      isActive
                        ? 'bg-[#172235] text-[#38BDF8] border border-[#38BDF8]/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#172235]/60'
                    )
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Negative Space Value Proposition Footer Callout */}
      <div className="p-4 border-t border-[#1E293B]">
        <div className="p-3.5 rounded-xl bg-[#172235] border border-[#1E293B]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
            <span className="text-[11px] font-bold text-slate-200">Negative Space AI</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Synthesizing unpublished absences and contradictory evidence across scientific frontiers.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
