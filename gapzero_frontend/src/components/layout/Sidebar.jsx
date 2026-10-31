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
    { name: 'Intelligence Hub', href: '/intelligence', icon: Sparkles },
    { name: 'Findings Explorer', href: '/findings', icon: Search },
    { name: 'Evidence Explorer', href: '/evidence', icon: FileCheck },
    { name: 'Verification Checklist', href: '/checklist', icon: ListChecks },
    { name: 'Research Reports', href: '/reports', icon: FileText },
    { name: 'Projects Archive', href: '/projects', icon: FolderGit2 },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200/90 flex flex-col flex-shrink-0 min-h-screen text-[#202124]">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100">
        <NavLink to="/dashboard" className="flex items-center gap-1.5 select-none">
          <span className="text-xl font-black tracking-tight text-[#202124]">
            agyaan<span className="text-[#20BEFF]">lab</span>
          </span>
        </NavLink>

        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0083B0] border border-blue-100">
          PRO
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
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
                  'flex items-center gap-3 px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-gray-100 text-[#202124] font-semibold shadow-2xs'
                    : 'text-gray-600 hover:text-black hover:bg-gray-50',
                  item.highlight && !isActive && 'text-[#0083B0] hover:text-[#006080]'
                )
              }
            >
              <Icon className={clsx('w-4 h-4 flex-shrink-0', item.highlight ? 'text-[#20BEFF]' : 'text-gray-500')} />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Footer / Landing Link */}
      <div className="p-3 border-t border-gray-100 bg-[#F8F9FA]/60">
        <NavLink
          to="/landing"
          className="flex items-center justify-between px-3.5 py-2 rounded-full text-xs font-medium text-gray-600 hover:text-black hover:bg-white transition-colors border border-transparent hover:border-gray-200"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#20BEFF]" />
            Kaggle-Style Showcase
          </span>
          <ExternalLink className="w-3 h-3 text-gray-400" />
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
