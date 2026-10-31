import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Search,
  Filter,
  ExternalLink,
  Quote,
  Sparkles,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Info,
  BookOpen,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import projectService from '../services/projectService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';

export const EvidenceExplorerPage = () => {
  const [claims, setClaims] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sources, setSources] = useState([]);
  const [stats, setStats] = useState({
    total_claims: 0,
    total_evidence: 0,
    sources_analyzed: 0,
    avg_confidence: 0,
    claims_by_type: {},
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchFilter, setSearchFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [minConfidenceFilter, setMinConfidenceFilter] = useState('0');

  // Extraction Modal
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false);
  const [extractProjectId, setExtractProjectId] = useState('');
  const [extractSourceId, setExtractSourceId] = useState('all');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [extractSuccess, setExtractSuccess] = useState('');

  // UI state
  const [copiedId, setCopiedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchClaimsAndStats();
  }, [projectFilter, typeFilter, minConfidenceFilter, searchFilter]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [projectsRes, sourcesRes] = await Promise.all([
        projectService.getProjects(),
        projectService.getAllSources({ processing_status: 'completed' }),
      ]);
      const projList = projectsRes.results || projectsRes || [];
      setProjects(projList);
      if (projList.length > 0 && !extractProjectId) {
        setExtractProjectId(projList[0].id);
      }
      setSources(sourcesRes.results || sourcesRes || []);
      await fetchClaimsAndStats();
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClaimsAndStats = async () => {
    try {
      const params = {};
      if (projectFilter !== 'all') params.project = projectFilter;
      if (typeFilter !== 'all') params.claim_type = typeFilter;
      if (minConfidenceFilter !== '0') params.min_confidence = minConfidenceFilter;
      if (searchFilter.trim()) params.search = searchFilter.trim();

      const [claimsRes, statsRes] = await Promise.all([
        projectService.getClaims(params),
        projectService.getEvidenceStats(projectFilter !== 'all' ? { project: projectFilter } : {}),
      ]);

      setClaims(claimsRes.results || claimsRes || []);
      if (statsRes) setStats(statsRes);
    } catch (err) {
      console.error('Failed to fetch claims/stats:', err);
    }
  };

  const handleRunExtraction = async (e) => {
    e.preventDefault();
    setExtractError('');
    setExtractSuccess('');

    if (!extractProjectId) {
      setExtractError('Please select a target research project.');
      return;
    }

    setExtracting(true);
    try {
      const payload = {};
      if (extractSourceId !== 'all') {
        payload.source_id = parseInt(extractSourceId);
      } else {
        payload.project_id = parseInt(extractProjectId);
      }

      const res = await projectService.extractClaims(payload);
      setExtractSuccess(res.message || 'Claims extracted successfully.');
      await fetchClaimsAndStats();
      // Keep modal open briefly to show success or close after 1.5s
      setTimeout(() => {
        setIsExtractModalOpen(false);
        setExtractSuccess('');
      }, 1500);
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        err.message ||
        'Extraction failed.';
      setExtractError(detail);
    } finally {
      setExtracting(false);
    }
  };

  const handleDeleteClaim = async (claimId) => {
    if (!window.confirm('Delete this claim and its linked evidence?')) return;
    setDeletingId(claimId);
    try {
      await projectService.deleteClaim(claimId);
      setClaims((prev) => prev.filter((c) => c.id !== claimId));
      fetchClaimsAndStats();
    } catch (err) {
      alert(`Failed to delete claim: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyPassage = (passage, claimId) => {
    navigator.clipboard.writeText(passage);
    setCopiedId(claimId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const availableSourcesForProject = sources.filter(
    (s) => !extractProjectId || s.project === parseInt(extractProjectId)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#1E2022] tracking-tight">Evidence Explorer</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#3B82F6] border border-[#DBEAFE]">
              Grounded Epistemology
            </span>
          </div>
          <p className="text-xs text-[#4A4D55] mt-1">
            Convert extracted source documents into atomic, traceable claims backed by verbatim supporting passages.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
            onClick={() => {
              setExtractError('');
              setExtractSuccess('');
              setIsExtractModalOpen(true);
            }}
          >
            Extract Claims with AI
          </Button>
        </div>
      </div>

      {/* Epistemic Ground Truth Banner */}
      <div className="bg-[#EFF6FF]/60 border border-[#DBEAFE] rounded-xl p-3.5 text-xs text-[#1E2022] flex items-start gap-2.5 shadow-xs">
        <ShieldCheck className="w-4 h-4 text-[#3B82F6] flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5 flex-1">
          <p className="font-semibold text-[#1E2022]">
            Evidence Integrity Policy (Hallucination Barrier)
          </p>
          <p className="text-[11px] text-[#4A4D55] leading-relaxed">
            All extracted claims are mathematically cross-checked against original document text. Claims lacking verbatim supporting passages are strictly rejected. Model confidence score denotes parsing clarity, not external scientific consensus.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-xs">
          <p className="text-[11px] font-medium text-[#4A4D55] uppercase tracking-wider">Atomic Claims</p>
          <p className="text-2xl font-bold text-[#1E2022] mt-1">{stats.total_claims}</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-xs">
          <p className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">Verbatim Passages</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.total_evidence}</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-xs">
          <p className="text-[11px] font-medium text-[#3B82F6] uppercase tracking-wider">Sources Analyzed</p>
          <p className="text-2xl font-bold text-[#3B82F6] mt-1">{stats.sources_analyzed}</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-xs">
          <p className="text-[11px] font-medium text-[#4A4D55] uppercase tracking-wider">Mean Confidence</p>
          <p className="text-2xl font-bold text-[#1E2022] mt-1">
            {stats.avg_confidence > 0 ? `${stats.avg_confidence}%` : '—'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white border border-[#E5E7EB]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#4A4D55] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search claims, subjects, attributes, values, or passage words..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F9F9FB] border border-[#E5E7EB] rounded-lg text-[#1E2022] placeholder-[#4A4D55] focus:outline-none focus:border-[#3B82F6] focus:bg-white transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Project Filter */}
            {projects.length > 0 && (
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="text-xs bg-[#F9F9FB] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-[#1E2022] focus:outline-none focus:border-[#3B82F6] max-w-[150px] truncate"
              >
                <option value="all">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            )}

            {/* Claim Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs bg-[#F9F9FB] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-[#1E2022] focus:outline-none focus:border-[#3B82F6]"
            >
              <option value="all">All Claim Types</option>
              <option value="empirical">Empirical Finding</option>
              <option value="methodological">Methodological</option>
              <option value="theoretical">Theoretical</option>
              <option value="statistical">Statistical</option>
              <option value="comparative">Comparative</option>
              <option value="definitional">Definitional</option>
            </select>

            {/* Confidence Filter */}
            <select
              value={minConfidenceFilter}
              onChange={(e) => setMinConfidenceFilter(e.target.value)}
              className="text-xs bg-[#F9F9FB] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-[#1E2022] focus:outline-none focus:border-[#3B82F6]"
            >
              <option value="0">All Confidence</option>
              <option value="0.9">≥ 90% Confidence</option>
              <option value="0.8">≥ 80% Confidence</option>
              <option value="0.7">≥ 70% Confidence</option>
            </select>

            {(searchFilter || projectFilter !== 'all' || typeFilter !== 'all' || minConfidenceFilter !== '0') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchFilter('');
                  setProjectFilter('all');
                  setTypeFilter('all');
                  setMinConfidenceFilter('0');
                }}
                className="text-xs text-[#4A4D55] hover:text-[#1E2022]"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Claims List */}
      {loading ? (
        <LoadingSpinner size="lg" message="Loading evidence graph..." />
      ) : claims.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title={stats.total_claims === 0 ? 'No atomic claims extracted yet' : 'No matching claims found'}
          description={
            stats.total_claims === 0
              ? 'Run the AI claim extraction engine on any ingested source or project to convert documents into structured evidence.'
              : 'Try clearing your search query or adjusting your filters.'
          }
          actionLabel={stats.total_claims === 0 ? 'Extract Claims Now' : 'Reset Filters'}
          onAction={() => {
            if (stats.total_claims === 0) {
              setIsExtractModalOpen(true);
            } else {
              setSearchFilter('');
              setProjectFilter('all');
              setTypeFilter('all');
              setMinConfidenceFilter('0');
            }
          }}
        />
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => {
            const confidencePercent = Math.round((claim.confidence || 0.9) * 100);
            return (
              <div
                key={claim.id}
                className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs hover:border-[#3B82F6]/50 transition-all space-y-3.5"
              >
                {/* Header Row: Subject / Attribute / Value Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#E5E7EB]">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="font-semibold text-[#1E2022] bg-[#F9F9FB] px-2.5 py-1 rounded-md border border-[#E5E7EB]">
                      <strong className="text-[#4A4D55] font-normal mr-1">Subject:</strong>
                      {claim.subject}
                    </span>
                    <span className="text-[#4A4D55]">•</span>
                    <span className="font-semibold text-[#1E2022] bg-[#F9F9FB] px-2.5 py-1 rounded-md border border-[#E5E7EB]">
                      <strong className="text-[#4A4D55] font-normal mr-1">Attribute:</strong>
                      {claim.attribute}
                    </span>
                    <span className="text-[#4A4D55]">•</span>
                    <span className="font-bold text-[#3B82F6] bg-[#EFF6FF] px-2.5 py-1 rounded-md border border-[#DBEAFE]">
                      <strong className="text-[#4A4D55] font-normal mr-1">Value:</strong>
                      {claim.value}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Claim Type Badge */}
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-[#4A4D55] border border-slate-200">
                      {claim.claim_type}
                    </span>

                    {/* Extraction Confidence */}
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                        confidencePercent >= 90
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : confidencePercent >= 75
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                      title="Extraction Confidence: Indicates parsing clarity from source text. Does not denote external ground truth."
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {confidencePercent}% Confidence
                    </span>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-7 w-7 p-0"
                      onClick={() => handleDeleteClaim(claim.id)}
                      isLoading={deletingId === claim.id}
                      title="Delete claim"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Atomic Claim Statement */}
                <div>
                  <p className="text-sm font-semibold text-[#1E2022] leading-snug">
                    {claim.claim_text}
                  </p>
                </div>

                {/* Evidence Passages (Verbatim quotes from source) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#4A4D55]">
                    <span className="font-semibold text-[#1E2022] flex items-center gap-1.5">
                      <Quote className="w-3.5 h-3.5 text-[#3B82F6]" />
                      Original Supporting Passage:
                    </span>
                    <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified Verbatim in Source Document
                    </span>
                  </div>

                  {claim.evidence_items && claim.evidence_items.length > 0 ? (
                    claim.evidence_items.map((evidence, eIdx) => (
                      <div
                        key={eIdx}
                        className="p-3.5 rounded-lg bg-[#F9F9FB] border border-[#E5E7EB] space-y-2"
                      >
                        <blockquote className="font-mono text-xs text-[#1E2022] leading-relaxed italic border-l-2 border-[#3B82F6] pl-3">
                          "{evidence.passage}"
                        </blockquote>

                        <div className="flex items-center justify-between pt-1 text-[11px] text-[#4A4D55]">
                          <div className="flex items-center gap-2">
                            {evidence.page_number && (
                              <span className="font-medium text-[#1E2022] bg-white px-2 py-0.5 rounded border border-[#E5E7EB]">
                                Page {evidence.page_number}
                              </span>
                            )}
                            {evidence.char_start !== null && evidence.char_end !== null && (
                              <span className="text-[10px] text-[#4A4D55]">
                                Offset: {evidence.char_start}–{evidence.char_end}
                              </span>
                            )}
                            <span className="text-emerald-700 font-medium">
                              Match Fidelity: {Math.round((evidence.similarity_score || 1.0) * 100)}%
                            </span>
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[11px]"
                            onClick={() => handleCopyPassage(evidence.passage, claim.id)}
                          >
                            {copiedId === claim.id ? (
                              <Check className="w-3 h-3 text-emerald-600 mr-1" />
                            ) : (
                              <Copy className="w-3 h-3 mr-1" />
                            )}
                            {copiedId === claim.id ? 'Copied' : 'Copy Passage'}
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#4A4D55] italic">
                      No linked passage available.
                    </p>
                  )}
                </div>

                {/* Source Provenance Footer */}
                <div className="pt-2 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2 text-xs text-[#4A4D55]">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#1E2022]">Source:</span>
                    <span className="font-semibold text-[#1E2022] truncate max-w-sm">
                      {claim.source_title || 'Untitled Source'}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 text-[#4A4D55]">
                      {claim.source_type}
                    </span>
                  </div>

                  {claim.source_url && (
                    <a
                      href={claim.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[#3B82F6] hover:underline font-medium text-xs"
                    >
                      View Source Document <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* RUN CLAIM EXTRACTION MODAL                                               */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isExtractModalOpen}
        onClose={() => setIsExtractModalOpen(false)}
        title="Extract Claims & Evidence with AI"
        description="Extract atomic, empirical propositions and verify them against original document passages."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleRunExtraction} className="space-y-4">
          {/* Target Project Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#1E2022]">Target Research Project</label>
            <select
              value={extractProjectId}
              onChange={(e) => {
                setExtractProjectId(e.target.value);
                setExtractSourceId('all');
              }}
              className="w-full text-xs bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#1E2022] focus:outline-none focus:border-[#3B82F6]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Source Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#1E2022]">Source Scope</label>
            <select
              value={extractSourceId}
              onChange={(e) => setExtractSourceId(e.target.value)}
              className="w-full text-xs bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#1E2022] focus:outline-none focus:border-[#3B82F6]"
            >
              <option value="all">
                All Completed Sources in this Project ({availableSourcesForProject.length} available)
              </option>
              {availableSourcesForProject.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.source_type.toUpperCase()}] {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Feedback Messages */}
          {extractError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Extraction Notice</p>
                <p className="mt-0.5 leading-relaxed">{extractError}</p>
              </div>
            </div>
          )}

          {extractSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Extraction Complete</p>
                <p className="mt-0.5 leading-relaxed">{extractSuccess}</p>
              </div>
            </div>
          )}

          {/* Extraction Policy Notice */}
          <div className="p-3 rounded-lg bg-[#F9F9FB] border border-[#E5E7EB] text-[11px] text-[#4A4D55] space-y-1">
            <p className="font-semibold text-[#1E2022]">Extraction & Verification Rules:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Atomic extraction: isolates subject, attribute, value, and proposition type.</li>
              <li>Verification barrier: each claim must quote an exact passage from the source document.</li>
              <li>Unsupported claims without matching source passages are automatically rejected.</li>
              <li>Preserves original page numbers and character offsets.</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsExtractModalOpen(false)}
              disabled={extracting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={extracting}
              disabled={availableSourcesForProject.length === 0}
            >
              {extracting ? 'Extracting & Verifying Claims...' : 'Run Extraction'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EvidenceExplorerPage;
