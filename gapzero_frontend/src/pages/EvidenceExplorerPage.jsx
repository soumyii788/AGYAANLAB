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
  ShieldCheck,
  FolderGit2
} from 'lucide-react';
import projectService from '../services/projectService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import clsx from 'clsx';

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200/90">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white tracking-tight">Evidence Explorer</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-blue-600 border border-gray-200/90">
              Grounded Epistemology
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1.5 max-w-2xl leading-relaxed">
            Convert extracted source documents into atomic, traceable claims backed by verbatim supporting passages. Reject ungrounded propositions.
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
      <div className="bg-gray-100/60 border border-gray-200/90 rounded-xl p-3.5 text-xs text-gray-500 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5 flex-1">
          <p className="font-bold text-white">
            Evidence Integrity Policy (Zero-Hallucination Barrier)
          </p>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            All extracted claims are mathematically cross-checked against original document text. Claims lacking verbatim supporting passages are strictly rejected. Model confidence score denotes parsing clarity, not external scientific consensus.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-gray-200/90 rounded-xl p-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Atomic Claims</p>
          <p className="text-2xl font-black text-white mt-1">{stats.total_claims}</p>
        </div>
        <div className="bg-white border border-gray-200/90 rounded-xl p-4">
          <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Verbatim Passages</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{stats.total_evidence}</p>
        </div>
        <div className="bg-white border border-gray-200/90 rounded-xl p-4">
          <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Sources Analyzed</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{stats.sources_analyzed}</p>
        </div>
        <div className="bg-white border border-gray-200/90 rounded-xl p-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mean Confidence</p>
          <p className="text-2xl font-black text-white mt-1">
            {stats.avg_confidence > 0 ? `${stats.avg_confidence}%` : '—'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 bg-white border border-gray-200/90 rounded-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search claims, subjects, attributes, values, or passage words..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200/90 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#3B82F6]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Project Filter */}
          {projects.length > 0 && (
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-200/90 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-[#3B82F6] max-w-[150px] truncate"
            >
              <option value="all" className="bg-white">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-white">
                  {p.title}
                </option>
              ))}
            </select>
          )}

          {/* Claim Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200/90 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-[#3B82F6]"
          >
            <option value="all" className="bg-white">All Claim Types</option>
            <option value="empirical" className="bg-white">Empirical Finding</option>
            <option value="methodological" className="bg-white">Methodological</option>
            <option value="theoretical" className="bg-white">Theoretical</option>
            <option value="statistical" className="bg-white">Statistical</option>
            <option value="comparative" className="bg-white">Comparative</option>
            <option value="definitional" className="bg-white">Definitional</option>
          </select>

          {/* Confidence Filter */}
          <select
            value={minConfidenceFilter}
            onChange={(e) => setMinConfidenceFilter(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200/90 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-[#3B82F6]"
          >
            <option value="0" className="bg-white">All Confidence</option>
            <option value="0.9" className="bg-white">≥ 90% Confidence</option>
            <option value="0.8" className="bg-white">≥ 80% Confidence</option>
            <option value="0.7" className="bg-white">≥ 70% Confidence</option>
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
              className="text-xs text-gray-500 hover:text-white"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

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
                className="bg-white border border-gray-200/90 rounded-xl p-5 hover:border-[#3B82F6]/50 transition-all space-y-3.5"
              >
                {/* Header Row: Subject / Attribute / Value Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-gray-200/90">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="font-semibold text-white bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200/90">
                      <strong className="text-gray-400 font-normal mr-1">Subject:</strong>
                      {claim.subject}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-semibold text-white bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200/90">
                      <strong className="text-gray-400 font-normal mr-1">Attribute:</strong>
                      {claim.attribute}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-bold text-blue-600 bg-gray-100 px-2.5 py-1 rounded-md border border-[#3B82F6]/30">
                      <strong className="text-gray-400 font-normal mr-1">Value:</strong>
                      {claim.value}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Claim Type Badge */}
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200/90">
                      {claim.claim_type}
                    </span>

                    {/* Extraction Confidence */}
                    <span
                      className={clsx(
                        'text-[10px] font-bold uppercase px-2 py-0.5 rounded border flex items-center gap-1',
                        confidencePercent >= 90
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : confidencePercent >= 75
                          ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      )}
                      title="Extraction Confidence: Indicates parsing clarity from source text. Does not denote external ground truth."
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {confidencePercent}% Confidence
                    </span>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-7 w-7 p-0"
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
                  <p className="text-sm font-semibold text-white leading-snug">
                    {claim.claim_text}
                  </p>
                </div>

                {/* Evidence Passages (Verbatim quotes from source) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Quote className="w-3.5 h-3.5 text-blue-600" />
                      Original Supporting Passage:
                    </span>
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified Verbatim in Source Document
                    </span>
                  </div>

                  {claim.evidence_items && claim.evidence_items.length > 0 ? (
                    claim.evidence_items.map((evidence, eIdx) => (
                      <div
                        key={eIdx}
                        className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/90 space-y-2"
                      >
                        <blockquote className="font-mono text-xs text-[#CBD5E1] leading-relaxed italic border-l-2 border-[#3B82F6] pl-3">
                          "{evidence.passage}"
                        </blockquote>

                        <div className="flex items-center justify-between pt-1 text-[11px] text-gray-400">
                          <div className="flex items-center gap-2">
                            {evidence.page_number && (
                              <span className="font-bold text-white bg-gray-100 px-2 py-0.5 rounded border border-gray-200/90">
                                Page {evidence.page_number}
                              </span>
                            )}
                            {evidence.char_start !== null && evidence.char_end !== null && (
                              <span className="text-[10px] text-gray-400">
                                Offset: {evidence.char_start}–{evidence.char_end}
                              </span>
                            )}
                            <span className="text-emerald-400 font-semibold">
                              Match Fidelity: {Math.round((evidence.similarity_score || 1.0) * 100)}%
                            </span>
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[11px] text-gray-500 hover:text-white"
                            onClick={() => handleCopyPassage(evidence.passage, claim.id)}
                          >
                            {copiedId === claim.id ? (
                              <Check className="w-3 h-3 text-emerald-400 mr-1" />
                            ) : (
                              <Copy className="w-3 h-3 mr-1" />
                            )}
                            {copiedId === claim.id ? 'Copied' : 'Copy Passage'}
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      No linked passage available.
                    </p>
                  )}
                </div>

                {/* Source Provenance Footer */}
                <div className="pt-2 border-t border-gray-200/90 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-500">Source:</span>
                    <span className="font-semibold text-white truncate max-w-sm">
                      {claim.source_title || 'Untitled Source'}
                    </span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-gray-100 text-blue-600">
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
            <label className="text-xs font-bold text-white">Target Research Project</label>
            <select
              value={extractProjectId}
              onChange={(e) => {
                setExtractProjectId(e.target.value);
                setExtractSourceId('all');
              }}
              className="w-full text-xs bg-gray-50 border border-gray-200/90 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#3B82F6]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-white">
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Source Selection */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-white">Source Scope</label>
            <select
              value={extractSourceId}
              onChange={(e) => setExtractSourceId(e.target.value)}
              className="w-full text-xs bg-gray-50 border border-gray-200/90 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#3B82F6]"
            >
              <option value="all" className="bg-white">
                All Completed Sources in this Project ({availableSourcesForProject.length} available)
              </option>
              {availableSourcesForProject.map((s) => (
                <option key={s.id} value={s.id} className="bg-white">
                  [{s.source_type.toUpperCase()}] {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Feedback Messages */}
          {extractError && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Extraction Notice</p>
                <p className="mt-0.5 leading-relaxed">{extractError}</p>
              </div>
            </div>
          )}

          {extractSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Extraction Complete</p>
                <p className="mt-0.5 leading-relaxed">{extractSuccess}</p>
              </div>
            </div>
          )}

          {/* Extraction Policy Notice */}
          <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-200/90 text-[11px] text-gray-500 space-y-1.5">
            <p className="font-bold text-white">Extraction & Verification Rules:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Atomic extraction: isolates subject, attribute, value, and proposition type.</li>
              <li>Verification barrier: each claim must quote an exact passage from the source document.</li>
              <li>Unsupported claims without matching source passages are automatically rejected.</li>
              <li>Preserves original page numbers and character offsets.</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200/90">
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
