import React from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#172235] border border-[#1E293B] flex items-center justify-center text-rose-400 mb-6 shadow-xl">
        <AlertOctagon className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-black text-[#F8FAFC]">404</h1>
      <p className="text-lg font-bold text-slate-300 mt-2">Uncharted Negative Space</p>
      <p className="text-xs text-slate-400 max-w-md mt-1 mb-6">
        The coordinates you requested do not exist in the GAPZERO research matrix.
      </p>
      <Link to="/dashboard">
        <Button variant="primary">Return to Dashboard</Button>
      </Link>
    </div>
  );
};

export default NotFound;
