import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Sparkles, ArrowRight } from 'lucide-react';

export const PlaceholderPage = ({ title, subtitle, icon: Icon = Sparkles }) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#1E2022]">{title}</h1>
        <p className="text-xs text-[#4A4D55] mt-1">{subtitle}</p>
      </div>

      <Card className="p-10 text-center flex flex-col items-center justify-center border-dashed border-[#E5E7EB]">
        <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#3B82F6] mb-3">
          <Icon className="w-6 h-6" />
        </div>
        <CardTitle className="text-base">Section Synchronized to GAPZERO Core</CardTitle>
        <p className="text-xs text-[#4A4D55] max-w-md mt-1.5 mb-5 leading-relaxed">
          This module is managed via the REST API endpoints at <code className="text-[#3B82F6] bg-[#F9F9FB] px-1.5 py-0.5 rounded border border-[#E5E7EB]">/api/v1/</code>. Select or manage your active research projects to inspect synchronized records.
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
