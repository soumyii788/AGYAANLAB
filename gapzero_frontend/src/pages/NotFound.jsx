import React from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#F9F9FB] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-center text-rose-500 mb-4 shadow-sm">
        <AlertOctagon className="w-7 h-7" />
      </div>
      <h1 className="text-3xl font-extrabold text-[#1E2022]">404</h1>
      <p className="text-base font-semibold text-[#1E2022] mt-1">Page Not Found</p>
      <p className="text-xs text-[#4A4D55] max-w-md mt-1 mb-6">
        The coordinates you requested do not exist in the AGYAAN LAB research matrix.
      </p>
      <Link to="/dashboard">
        <Button variant="primary">Return to Dashboard</Button>
      </Link>
    </div>
  );
};

export default NotFound;
