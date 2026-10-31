import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';

export const DashboardLayout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#202124] flex flex-col">
      {/* Top Navbar with 3-lines menu icon on left */}
      <Navbar onToggleSidebar={() => setIsMenuOpen((prev) => !prev)} />

      {/* Slide-out Workspace Menu Drawer (triggered by 3-lines menu) */}
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-5 md:p-8 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
