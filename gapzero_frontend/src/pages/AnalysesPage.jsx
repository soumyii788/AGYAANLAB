import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Activity, AlertCircle } from 'lucide-react';
import projectService from '../services/projectService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';

export const AnalysesPage = () => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      const res = await projectService.getAllAnalyses();
      setAnalyses(res.results || res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#1E2022]">Negative-Space Gap Analyses</h1>
        <p className="text-xs text-[#4A4D55] mt-1">
          Algorithmic scans executed by the Groq AI engine, revealing unaddressed hypotheses and literature blindspots.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" message="Loading gap analyses..." />
      ) : analyses.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No analyses executed yet"
          description="Open any research project and click 'Run AI Gap Detection' to synthesize literature gaps."
          actionLabel="View Projects"
          onAction={() => window.location.href = '/projects'}
        />
      ) : (
        <div className="space-y-4">
          {analyses.map((analysis) => {
            const res = analysis.results || {};
            return (
              <Card key={analysis.id} className="p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#3B82F6] uppercase">
                        {analysis.analysis_type}
                      </span>
                      <span className="text-[#4A4D55]">•</span>
                      <span className="text-xs text-[#4A4D55]">
                        {new Date(analysis.created_at).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#1E2022]">
                      {analysis.title}
                    </h3>
                    <p className="text-xs text-[#4A4D55] mt-0.5">
                      Project: <strong className="text-[#1E2022]">{analysis.project_title}</strong> • Run by {analysis.created_by_name}
                    </p>
                  </div>
                  {res.gap_score !== undefined && (
                    <div className="text-right">
                      <span className="text-2xl font-black text-[#3B82F6]">
                        {res.gap_score}%
                      </span>
                      <p className="text-[10px] text-[#4A4D55] uppercase font-semibold">
                        Deficit Index
                      </p>
                    </div>
                  )}
                </div>

                {res.gap_summary && (
                  <div className="p-3.5 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE]">
                    <h4 className="text-xs font-bold text-[#3B82F6] uppercase tracking-wider mb-1">
                      Identified Negative Space
                    </h4>
                    <p className="text-xs text-[#1E2022] leading-relaxed">
                      {res.gap_summary}
                    </p>
                  </div>
                )}

                {res.unaddressed_hypotheses && res.unaddressed_hypotheses.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-[#1E2022] uppercase tracking-wider mb-2">
                      Unaddressed Hypotheses
                    </h4>
                    <ul className="space-y-1.5">
                      {res.unaddressed_hypotheses.map((h, i) => (
                        <li key={i} className="text-xs text-[#4A4D55] flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] mt-1.5 flex-shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <Link
                    to={`/projects/${analysis.project}`}
                    className="text-xs font-semibold text-[#3B82F6] hover:underline flex items-center gap-1"
                  >
                    Open Project <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AnalysesPage;
