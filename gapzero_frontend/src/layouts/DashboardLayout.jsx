import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';

export const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen bg-[#F8F9FA] text-[#202124]">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8F9FA]">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-5 md:p-8 bg-[#F8F9FA]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
