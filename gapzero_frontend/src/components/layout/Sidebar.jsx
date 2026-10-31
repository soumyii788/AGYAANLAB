import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass,
  PlusCircle,
  FolderGit2,
  Layers,
  Sparkles,
  Search,
  FileCheck,
  ListChecks,
  FileText,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import clsx from 'clsx';

export const Sidebar = () => {
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Compass },
    { name: 'New Research', href: '/new-research', icon: PlusCircle, highlight: true },
    { name: 'Source Manager', href: '/sources', icon: Layers },
    { name: 'Intelligence Dashboard', href: '/intelligence', icon: Sparkles },
    { name: 'Findings Explorer', href: '/findings', icon: Search },
    { name: 'Evidence Explorer', href: '/evidence', icon: FileCheck },
    { name: 'Verification Checklist', href: '/checklist', icon: ListChecks },
    { name: 'Research Reports', href: '/reports', icon: FileText },
    { name: 'Projects Archive', href: '/projects', icon: FolderGit2 },
  ];

  return (
    <aside className="w-64 bg-[#0A0F1D] border-r border-[#1E2C4A] flex flex-col flex-shrink-0 min-h-screen text-[#F8FAFC]">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-[#1E2C4A]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] flex items-center justify-center text-white font-black text-sm shadow-[0_0_15px_rgba(59,130,246,0.4)]">
            G0
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-extrabold tracking-tight text-white">
              GAP<span className="text-[#3B82F6]">ZERO</span>
            </span>
            <span className="text-[10px] text-[#94A3B8] font-medium tracking-tight">
              Research Intelligence
            </span>
          </div>
        </div>

        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#141F36] text-[#60A5FA] border border-[#1E2C4A]">
          v2.0
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
          Intelligence Workspace
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
                    ? 'bg-[#1E2C4A] text-white border-l-2 border-[#3B82F6] font-semibold shadow-[0_2px_10px_rgba(0,0,0,0.2)]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#141F36]',
                  item.highlight && !isActive && 'text-[#60A5FA] hover:text-[#93C5FD]'
                )
              }
            >
              <Icon className={clsx('w-4 h-4 flex-shrink-0', item.highlight ? 'text-[#3B82F6]' : '')} />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Footer / Landing Link */}
      <div className="p-4 border-t border-[#1E2C4A] bg-[#080C15]/50">
        <NavLink
          to="/landing"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-[#94A3B8] hover:text-white hover:bg-[#141F36] transition-colors"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#3B82F6]" />
            Product Overview
          </span>
          <ExternalLink className="w-3 h-3 text-[#64748B]" />
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
