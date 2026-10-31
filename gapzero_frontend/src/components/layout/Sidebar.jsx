import React, { useEffect } from 'react';
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
  X
} from 'lucide-react';
import clsx from 'clsx';

export const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
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

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Dark backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Workspace Menu Drawer */}
      <aside className="relative w-72 max-w-[85vw] bg-white border-r border-gray-200/90 flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200 text-[#202124]">
        {/* Brand Header + Close button */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-[#202124]">
              agyaan<span className="text-[#20BEFF]">lab</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0083B0] border border-blue-100">
              PRO
            </span>
          </div>

          <button
            onClick={onClose}
            title="Close menu"
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
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
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-medium transition-all duration-150',
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
      </aside>
    </div>
  );
};

export default Sidebar;
