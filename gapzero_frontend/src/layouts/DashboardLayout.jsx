import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';

export const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen bg-[#080C15] text-[#F8FAFC]">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#080C15]">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-5 md:p-8 bg-[#080C15]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
