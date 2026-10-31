import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Copy, Check, ArrowRight } from 'lucide-react';
import projectService from '../services/projectService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';

export const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await projectService.getAllReports();
      setReports(res.results || res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id, content) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#1E2022]">Research Intelligence Reports</h1>
        <p className="text-xs text-[#4A4D55] mt-1">
          Full publication-grade intelligence briefs synthesized from identified literature gaps.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" message="Loading reports..." />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No intelligence reports generated yet"
          description="Open any research project and click 'Generate Brief' to synthesize an intelligence report."
          actionLabel="View Projects"
          onAction={() => window.location.href = '/projects'}
        />
      ) : (
        <div className="space-y-5">
          {reports.map((report) => (
            <Card key={report.id} className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
                <div>
                  <h3 className="text-base font-bold text-[#1E2022]">
                    {report.title}
                  </h3>
                  <p className="text-xs text-[#4A4D55] mt-0.5">
                    Project: <strong className="text-[#1E2022]">{report.project_title}</strong> • Generated {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={copiedId === report.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    onClick={() => handleCopy(report.id, report.content)}
                  >
                    {copiedId === report.id ? 'Copied' : 'Copy Markdown'}
                  </Button>
                  <Link to={`/projects/${report.project}`}>
                    <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      View Project
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="text-xs text-[#1E2022] leading-relaxed whitespace-pre-line bg-[#F9F9FB] p-5 rounded-lg border border-[#E5E7EB] font-mono max-h-96 overflow-y-auto">
                {report.content}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
