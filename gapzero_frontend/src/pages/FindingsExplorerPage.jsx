import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  AlertTriangle,
  Clock,
  HelpCircle,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  BookOpen,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
  RefreshCw,
  FolderGit2,
  Layers,
  FileCheck
} from 'lucide-react';
import projectService from '../services/projectService';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import clsx from 'clsx';

export const FindingsExplorerPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'all';

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialType);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Evidence inspection modal state
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadFindings();
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      const data = await projectService.getProjects();
      const list = data.results || data || [];
      setProjects(list);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const loadFindings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedProjectId) {
        params.project = selectedProjectId;
      }
      const data = await projectService.getFindings(params);
      const list = data.results || data || [];
      setFindings(list);
    } catch (err) {
      console.error('Failed to load findings:', err);
    } finally {
      setLoading(false);
    }
  };

  const openEvidenceModal = (finding) => {
    setSelectedFinding(finding);
    setIsEvidenceModalOpen(true);
  };

  // Filter findings
  const filteredFindings = findings.filter((f) => {
    // Type filter
    if (activeTab !== 'all' && f.finding_type !== activeTab) {
      return false;
    }
    // Severity filter
    if (severityFilter !== 'all' && f.severity !== severityFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = f.title?.toLowerCase().includes(q);
      const matchDesc = f.description?.toLowerCase().includes(q);
      const matchExpl = f.explanation?.toLowerCase().includes(q);
      const matchQuestion = f.question_text?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchExpl && !matchQuestion) {
        return false;
      }
    }
    return true;
  });

  const countByType = {
    all: findings.length,
    gap: findings.filter((f) => f.finding_type === 'gap').length,
    contradiction: findings.filter((f) => f.finding_type === 'contradiction').length,
    freshness: findings.filter((f) => f.finding_type === 'freshness').length,
  };

  const getSeverityBadge = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <Badge variant="danger" size="sm">CRITICAL</Badge>;
      case 'high':
        return <Badge variant="warning" size="sm">HIGH</Badge>;
      case 'medium':
        return <Badge variant="info" size="sm">MEDIUM</Badge>;
      case 'low':
        return <Badge variant="neutral" size="sm">LOW</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{severity?.toUpperCase() || 'INFO'}</Badge>;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'gap':
        return <HelpCircle className="w-5 h-5 text-amber-400" />;
      case 'contradiction':
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      case 'freshness':
        return <Clock className="w-5 h-5 text-cyan-400" />;
      default:
        return <ShieldAlert className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/90 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Findings Explorer
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-blue-600 border border-gray-200/90">
              {findings.length} Discovered
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1.5 max-w-2xl leading-relaxed">
            Multi-source intelligence audit displaying identified information gaps, empirical contradictions, and publication freshness warnings. Every finding is verifiable against atomic source passages.
          </p>
        </div>

        {/* Global Project Selector */}
        <div className="flex items-center gap-3">
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
            variant="secondary"
            size="sm"
            onClick={loadFindings}
            leftIcon={<RefreshCw className={clsx('w-3.5 h-3.5', loading && 'animate-spin')} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs & Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-3 rounded-xl border border-gray-200/90">
        {/* Type Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => {
              setActiveTab('all');
              setSearchParams(prev => { prev.delete('type'); return prev; });
            }}
            className={clsx(
              'px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-2',
              activeTab === 'all'
                ? 'bg-[#1E2C4A] text-white shadow-sm'
                : 'text-gray-500 hover:text-white hover:bg-gray-100'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Findings</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-gray-100 text-gray-500">
              {countByType.all}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('gap');
              setSearchParams({ type: 'gap' });
            }}
            className={clsx(
              'px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-2',
              activeTab === 'gap'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-gray-500 hover:text-amber-400 hover:bg-gray-100'
            )}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Information Gaps</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-gray-100 text-amber-400/80">
              {countByType.gap}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('contradiction');
              setSearchParams({ type: 'contradiction' });
            }}
            className={clsx(
              'px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-2',
              activeTab === 'contradiction'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'text-gray-500 hover:text-rose-400 hover:bg-gray-100'
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Possible Contradictions</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-gray-100 text-rose-400/80">
              {countByType.contradiction}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('freshness');
              setSearchParams({ type: 'freshness' });
            }}
            className={clsx(
              'px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-2',
              activeTab === 'freshness'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-gray-500 hover:text-cyan-400 hover:bg-gray-100'
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Freshness Warnings</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-gray-100 text-cyan-400/80">
              {countByType.freshness}
            </span>
          </button>
        </div>

        {/* Severity & Search Controls */}
        <div className="flex items-center gap-2.5">
          {/* Severity Dropdown */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200/90 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent text-xs text-gray-500 border-none focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option value="all" className="bg-white">All Severities</option>
              <option value="critical" className="bg-white">Critical</option>
              <option value="high" className="bg-white">High</option>
              <option value="medium" className="bg-white">Medium</option>
              <option value="low" className="bg-white">Low</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter findings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200/90 text-xs text-white placeholder-gray-400 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#3B82F6]"
            />
          </div>
        </div>
      </div>

      {/* Epistemic Transparency Banner */}
      <div className="bg-gray-100/60 border border-gray-200/90 rounded-xl p-3.5 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-gray-500 leading-relaxed">
          <strong className="text-white">Epistemic Rigor Guarantee:</strong> Findings labeled as <span className="text-amber-400 font-semibold">AI Research Suggestion</span> represent hypothesis-level intelligence gaps derived by subquestion decomposition. <span className="text-[#202124]">An absence of evidence is never represented as proof of absence.</span> Contradiction findings preserve competing passages neutrally without automated adjudication.
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingSpinner size="lg" message="Loading research findings..." />
      ) : filteredFindings.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No findings match your criteria"
          description={
            findings.length === 0
              ? 'Run the intelligence engine on your research project to detect gaps, contradictions, and freshness warnings.'
              : 'Try clearing your filters or search keywords to view other findings.'
          }
          actionLabel={findings.length === 0 ? 'Go to Intelligence Engine' : 'Clear Filters'}
          onAction={() => {
            if (findings.length === 0) {
              window.location.href = '/intelligence';
            } else {
              setActiveTab('all');
              setSeverityFilter('all');
              setSearchQuery('');
            }
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredFindings.map((finding) => (
            <Card
              key={finding.id}
              className="p-5 border-gray-200/90 bg-white hover:border-[#3B82F6]/50 transition-all duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Finding Header & Body */}
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gray-100 border border-gray-200/90">
                      {getTypeIcon(finding.finding_type)}
                    </div>
                    {getSeverityBadge(finding.severity)}

                    <span className="text-xs uppercase tracking-wider font-bold text-gray-400">
                      {finding.finding_type.replace('_', ' ')}
                    </span>

                    {finding.is_ai_suggestion && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Sparkles className="w-3 h-3" />
                        AI Research Suggestion
                      </span>
                    )}

                    <span className="text-xs text-gray-400 ml-auto">
                      Project: <strong className="text-gray-500">{finding.project_title || 'General'}</strong>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight">
                    {finding.title}
                  </h3>

                  <p className="text-xs text-gray-500 leading-relaxed">
                    {finding.description}
                  </p>

                  {/* Finding-Specific Specialized Metadata Renderers */}
                  
                  {/* 1. Contradiction finding metadata */}
                  {finding.finding_type === 'contradiction' && finding.metadata && (
                    <div className="mt-3 p-3.5 bg-gray-50 rounded-lg border border-rose-500/20 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-rose-400">
                        <span>COMPETING CLAIMS DETECTED</span>
                        <span className="text-[10px] text-gray-400 uppercase">Neutral Comparison • No Auto-Adjudication</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-2.5 rounded bg-white border border-gray-200/90">
                          <span className="text-[10px] font-bold uppercase text-blue-600">Claim A (Source 1)</span>
                          <p className="text-xs text-white mt-1 font-medium">"{finding.metadata.claim_a?.value || finding.metadata.claim_a_text || 'See evidence links'}"</p>
                          {finding.metadata.claim_a?.source_title && (
                            <span className="text-[10px] text-gray-400 block mt-1 truncate">
                              Ref: {finding.metadata.claim_a.source_title}
                            </span>
                          )}
                        </div>

                        <div className="p-2.5 rounded bg-white border border-gray-200/90">
                          <span className="text-[10px] font-bold uppercase text-amber-400">Claim B (Source 2)</span>
                          <p className="text-xs text-white mt-1 font-medium">"{finding.metadata.claim_b?.value || finding.metadata.claim_b_text || 'See evidence links'}"</p>
                          {finding.metadata.claim_b?.source_title && (
                            <span className="text-[10px] text-gray-400 block mt-1 truncate">
                              Ref: {finding.metadata.claim_b.source_title}
                            </span>
                          )}
                        </div>
                      </div>

                      {finding.metadata.divergence_rationale && (
                        <p className="text-[11px] text-gray-500 italic pt-1 border-t border-gray-200/90">
                          <strong className="text-white not-italic">Divergence Analysis:</strong> {finding.metadata.divergence_rationale}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 2. Freshness finding metadata */}
                  {finding.finding_type === 'freshness' && finding.metadata && (
                    <div className="mt-3 p-3.5 bg-gray-50 rounded-lg border border-cyan-500/20 space-y-2">
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="text-gray-400">
                          Publication / Reporting Year: <strong className="text-white">{finding.metadata.publication_year || finding.metadata.explicit_year || 'Undated'}</strong>
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-400">
                          Age: <strong className="text-white">{finding.metadata.age_years ? `${finding.metadata.age_years} years` : 'Unknown'}</strong>
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-cyan-400 font-semibold uppercase text-[10px]">
                          Policy Threshold: {finding.metadata.policy_threshold_years || 3} Years
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-400 italic">
                        <strong className="text-gray-500 not-italic">Non-Falsification Policy:</strong> Older information is flagged for recency validation; it is not marked false.
                      </p>
                    </div>
                  )}

                  {/* 3. Gap finding subquestion context */}
                  {finding.finding_type === 'gap' && finding.question_text && (
                    <div className="mt-2 text-xs p-2.5 rounded bg-gray-100/40 border border-gray-200/90 flex items-center gap-2">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span className="text-gray-500">
                        Originating Subquestion: <strong className="text-white font-medium">{finding.question_text}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons: View Evidence / Explore */}
                <div className="flex lg:flex-col items-center gap-2 flex-shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openEvidenceModal(finding)}
                    leftIcon={<FileCheck className="w-3.5 h-3.5" />}
                    className="w-full justify-center whitespace-nowrap"
                  >
                    View Supporting Evidence ({finding.evidence_links?.length || 0})
                  </Button>

                  <Link to={`/checklist?project=${finding.project}`} className="w-full">
                    <Button
                      variant="ghost"
                      size="sm"
                      rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                      className="w-full justify-center text-xs text-gray-500 hover:text-white"
                    >
                      Audit Checklist
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Interactive Evidence Inspection Modal */}
      <Modal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        title={
          selectedFinding ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                {selectedFinding.finding_type} Evidence
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="truncate max-w-md text-sm font-semibold text-white">
                {selectedFinding.title}
              </span>
            </div>
          ) : 'Supporting Evidence'
        }
        size="xl"
      >
        {selectedFinding && (
          <div className="space-y-4">
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/90 space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Finding Detail
              </span>
              <p className="text-xs text-gray-500 leading-relaxed">
                {selectedFinding.explanation || selectedFinding.description}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Atomic Evidence Citations ({selectedFinding.evidence_links?.length || 0})
                </h4>
                <span className="text-[10px] text-gray-400">
                  Exact Verbatim Extraction
                </span>
              </div>

              {(!selectedFinding.evidence_links || selectedFinding.evidence_links.length === 0) ? (
                <div className="p-6 text-center bg-gray-50 rounded-xl border border-gray-200/90">
                  <HelpCircle className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-60" />
                  <p className="text-xs text-white font-medium">No direct empirical citations found</p>
                  <p className="text-[11px] text-gray-400 mt-1 max-w-md mx-auto">
                    This finding represents an identified gap where the ingested literature provided zero atomic claims.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                  {selectedFinding.evidence_links.map((link, idx) => (
                    <div
                      key={link.id || idx}
                      className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/90 space-y-2 hover:border-[#3B82F6]/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-gray-200/90 pb-2">
                        <div className="flex items-center gap-2">
                          <span className={clsx(
                            'text-[9px] font-bold uppercase px-2 py-0.5 rounded',
                            link.role === 'opposes' ? 'bg-rose-500/20 text-rose-400' :
                            link.role === 'supports' ? 'bg-emerald-500/20 text-emerald-400' :
                            'bg-gray-100 text-blue-600'
                          )}>
                            {link.role || 'Supporting Evidence'}
                          </span>
                          <span className="text-xs font-semibold text-white truncate max-w-sm">
                            {link.source_title || 'Unknown Source'}
                          </span>
                        </div>

                        {link.source_url && (
                          <a
                            href={link.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] text-[#3B82F6] hover:underline"
                          >
                            <span>Open URL</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {/* Verbatim Supporting Passage */}
                      <blockquote className="text-xs text-gray-900 bg-white p-3 rounded-lg border-l-2 border-[#3B82F6] italic leading-relaxed border border-gray-200">
                        "{link.passage}"
                      </blockquote>

                      {/* Subject / Value / Claim Metadata */}
                      {(link.claim_subject || link.claim_value) && (
                        <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-1">
                          {link.claim_subject && (
                            <span>Subject: <strong className="text-gray-500">{link.claim_subject}</strong></span>
                          )}
                          {link.claim_value && (
                            <span>Value: <strong className="text-gray-500">{link.claim_value}</strong></span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-200/90">
              <Button variant="secondary" size="sm" onClick={() => setIsEvidenceModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FindingsExplorerPage;
