import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FileText,
  Copy,
  Check,
  ArrowRight,
  Download,
  Printer,
  Sparkles,
  FolderGit2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Clock,
  HelpCircle,
  ListChecks,
  BookOpen,
  Info
} from 'lucide-react';
import projectService from '../services/projectService';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import clsx from 'clsx';

export const ReportsPage = () => {
  const [searchParams] = useSearchParams();
  const initialProjectId = searchParams.get('project') || '';

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [activeSection, setActiveSection] = useState('all');

  const canonicalSections = [
    { id: 'all', title: 'Full Intelligence Brief' },
    { id: 'executive', title: '1. Executive Summary' },
    { id: 'sources', title: '2. Sources Reviewed' },
    { id: 'claims', title: '3. Key Claims' },
    { id: 'gaps', title: '4. Potential Gaps' },
    { id: 'contradictions', title: '5. Possible Contradictions' },
    { id: 'freshness', title: '6. Freshness Warnings' },
    { id: 'checklist', title: '7. Verification Checklist' },
    { id: 'methodology', title: '8. Methodology & Limitations' }
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadReports();
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      const data = await projectService.getProjects();
      const list = data.results || data || [];
      setProjects(list);
      if (!selectedProjectId && list.length > 0) {
        setSelectedProjectId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedProjectId) {
        params.project = selectedProjectId;
      }
      const data = await projectService.getAllReports(params);
      const list = data.results || data || [];
      setReports(list);
      if (list.length > 0) {
        setSelectedReport(list[0]);
      } else {
        setSelectedReport(null);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedProjectId) {
      alert('Please select a project first.');
      return;
    }
    try {
      setGenerating(true);
      const newReport = await projectService.generateReport(selectedProjectId, 'full');
      setReports((prev) => [newReport, ...prev]);
      setSelectedReport(newReport);
    } catch (err) {
      console.error('Failed to generate report:', err);
      alert('Report generation failed. Ensure your project has completed claims and analyses.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (id, content) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/90 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Research Intelligence Reports
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-blue-600 border border-gray-200/90">
              8 Canonical Sections
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1.5 max-w-2xl leading-relaxed">
            Publication-grade negative-space intelligence briefs. Evaluates source coverage, atomic claims, empirical contradictions, freshness thresholds, and provides a prioritized verification checklist.
          </p>
        </div>

        {/* Project Selector & Generate CTA */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200/90 rounded-lg px-3 py-1.5">
            <FolderGit2 className="w-4 h-4 text-blue-600" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent text-xs text-white border-none focus:outline-none focus:ring-0 cursor-pointer pr-4"
            >
              <option value="" className="bg-white text-white">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-white text-white">
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerateReport}
            disabled={generating || !selectedProjectId}
            leftIcon={<Sparkles className={clsx('w-3.5 h-3.5', generating && 'animate-spin')} />}
          >
            {generating ? 'Synthesizing Brief...' : 'Generate New Brief'}
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" message="Loading intelligence reports..." />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No intelligence briefs generated yet"
          description="Synthesize your first publication-grade research brief. The report will automatically consolidate all ingested sources, atomic claims, gap findings, contradictions, and checklist actions."
          actionLabel={generating ? 'Synthesizing...' : 'Generate Intelligence Brief Now'}
          onAction={handleGenerateReport}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Report List Sidebar */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 px-1">
              Generated Reports ({reports.length})
            </h3>
            
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {reports.map((rep) => {
                const isSelected = selectedReport?.id === rep.id;
                return (
                  <button
                    key={rep.id}
                    onClick={() => setSelectedReport(rep)}
                    className={clsx(
                      'w-full text-left p-3.5 rounded-xl border transition-all duration-150',
                      isSelected
                        ? 'bg-gray-100 border-[#3B82F6] shadow-sm'
                        : 'bg-white border-gray-200/90 hover:border-[#3B82F6]/40'
                    )}
                  >
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                      <span className="uppercase font-bold text-blue-600">
                        {rep.report_type || 'Full Brief'}
                      </span>
                      <span>{new Date(rep.created_at).toLocaleDateString()}</span>
                    </div>

                    <h4 className="text-xs font-bold text-white truncate">
                      {rep.title}
                    </h4>

                    <p className="text-[11px] text-gray-500 truncate mt-0.5">
                      Project: {rep.project_title || 'General'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Report Viewer */}
          <div className="lg:col-span-3 space-y-4">
            {selectedReport && (
              <Card className="p-6 bg-white border-gray-200/90 space-y-5">
                {/* Header with Title and Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200/90">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      Publication-Grade Research Intelligence Brief
                    </span>
                    <h2 className="text-lg font-black text-white tracking-tight mt-0.5">
                      {selectedReport.title}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Project: <strong className="text-white">{selectedReport.project_title}</strong> • Generated on {new Date(selectedReport.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopy(selectedReport.id, selectedReport.content)}
                      leftIcon={
                        copiedId === selectedReport.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )
                      }
                    >
                      {copiedId === selectedReport.id ? 'Copied' : 'Copy Markdown'}
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handlePrint}
                      leftIcon={<Printer className="w-3.5 h-3.5" />}
                    >
                      Print
                    </Button>

                    <Link to={`/projects/${selectedReport.project}`}>
                      <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                        Project
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* 8-Section Quick Navigation Chips */}
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-gray-50 rounded-xl border border-gray-200/90">
                  <span className="text-[10px] font-bold uppercase text-gray-400 px-2">Sections:</span>
                  {canonicalSections.map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => setActiveSection(sec.id)}
                      className={clsx(
                        'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
                        activeSection === sec.id
                          ? 'bg-[#1E2C4A] text-white font-semibold'
                          : 'text-gray-500 hover:text-white hover:bg-gray-100'
                      )}
                    >
                      {sec.title}
                    </button>
                  ))}
                </div>

                {/* Methodology Transparency Notice */}
                <div className="bg-gray-100/50 border border-gray-200/90 rounded-xl p-3.5 flex items-start gap-3">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-gray-500 leading-relaxed">
                    <strong className="text-white">Scientific Methodology Notice:</strong> This synthesis incorporates empirical atomic claims verified against ingested literature. In accordance with epistemic rigor rules, an absence of documented evidence is never represented as proof of absence, and competing claims are preserved symmetrically.
                  </div>
                </div>

                {/* Report Content Body */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200/90 text-xs text-[#CBD5E1] leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto max-h-[700px] overflow-y-auto selection:bg-[#2563EB] selection:text-white">
                  {selectedReport.content}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
