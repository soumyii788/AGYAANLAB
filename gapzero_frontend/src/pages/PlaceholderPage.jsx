import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Sparkles, ArrowRight } from 'lucide-react';

export const PlaceholderPage = ({ title, subtitle, icon: Icon = Sparkles }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#F8FAFC]">{title}</h1>
        <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
      </div>

      <Card className="p-10 text-center flex flex-col items-center justify-center border-dashed border-[#1E293B]">
        <div className="w-14 h-14 rounded-2xl bg-[#0B1120] border border-[#1E293B] flex items-center justify-center text-[#38BDF8] mb-4 shadow-inner">
          <Icon className="w-7 h-7" />
        </div>
        <CardTitle className="text-lg">Section Connected to GAPZERO Core</CardTitle>
        <p className="text-xs text-slate-400 max-w-md mt-2 mb-6">
          This module is managed via the REST API endpoints at <code className="text-[#38BDF8] bg-[#0B1120] px-1.5 py-0.5 rounded">/api/v1/</code>. Select or manage your active research projects to inspect synchronized records.
        </p>
        <Link to="/projects">
          <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Go to Research Projects
          </Button>
        </Link>
      </Card>
    </div>
  );
};

export default PlaceholderPage;
