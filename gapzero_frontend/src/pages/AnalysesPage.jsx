import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Scale,
  Clock,
  ListChecks,
  CheckCircle2,
  ExternalLink,
  Quote,
  RefreshCw,
  Search,
  Filter,
  Layers,
  ArrowRight,
  ShieldAlert,
  Info,
  Check,
  Plus
} from 'lucide-react';
import projectService from '../services/projectService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';

export const AnalysesPage = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [activeTab, setActiveTab] = useState('gaps'); // 'gaps' | 'contradictions' | 'freshness' | 'checklist'
  const [loading, setLoading] = useState(true);

  // Core Data
  const [statusData, setStatusData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [findings, setFindings] = useState([]);
  const [checklist, setChecklist] = useState([]);

  // Running Pipeline State
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [runningPipeline, setRunningPipeline] = useState(false);
  const [pipelineError, setPipelineError] = useState('');
  const [policyYears, setPolicyYears] = useState(5);
  const [forceRegenerate, setForceRegenerate] = useState(false);

  // Checklist Action State
  const [togglingTaskId, setTogglingTaskId] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectAnalysisData(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await projectService.getProjects();
      const projList = res.results || res || [];
      setProjects(projList);
      if (projList.length > 0) {
        setSelectedProjectId(projList[0].id);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectAnalysisData = async (projId) => {
    try {
      setLoading(true);
      const [statusRes, questionsRes, findingsRes, checklistRes] = await Promise.all([
        projectService.getAnalysisStatus(projId),
        projectService.getResearchQuestions({ project: projId }),
        projectService.getFindings({ project: projId }),
        projectService.getChecklist({ project: projId }),
      ]);

      setStatusData(statusRes);
      setQuestions(questionsRes.results || questionsRes || []);
      setFindings(findingsRes.results || findingsRes || []);
      setChecklist(checklistRes.results || checklistRes || []);
    } catch (err) {
      console.error('Failed to load project analysis data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunPipeline = async (e) => {
    e.preventDefault();
    setPipelineError('');
    setRunningPipeline(true);

    try {
      await projectService.runIntelligenceEngine({
        project_id: parseInt(selectedProjectId),
        policy: { max_age_years: parseInt(policyYears) },
        force_regenerate_questions: forceRegenerate,
      });

      setIsRunModalOpen(false);
      await loadProjectAnalysisData(selectedProjectId);
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        err.message ||
        'Intelligence engine execution failed.';
      setPipelineError(detail);
    } finally {
      setRunningPipeline(false);
    }
  };

  const handleToggleTask = async (task) => {
    setTogglingTaskId(task.id);
    try {
      const updated = await projectService.toggleChecklistItem(task.id, !task.is_completed);
      setChecklist((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, is_completed: updated.is_completed } : t))
      );
      // Refresh status counts
      if (selectedProjectId) {
        const statusRes = await projectService.getAnalysisStatus(selectedProjectId);
        setStatusData(statusRes);
      }
    } catch (err) {
      alert(`Failed to update task: ${err.message}`);
    } finally {
      setTogglingTaskId(null);
    }
  };

  // Filtered Findings
  const gapFindings = findings.filter((f) => f.finding_type === 'gap');
  const contradictionFindings = findings.filter((f) => f.finding_type === 'contradiction');
  const freshnessFindings = findings.filter((f) => f.finding_type === 'freshness');

  const selectedProjectObj = projects.find((p) => p.id === parseInt(selectedProjectId));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#1E2022] tracking-tight">Core Intelligence Engine</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#3B82F6] border border-[#DBEAFE]">
              AGYAAN LAB
            </span>
          </div>
          <p className="text-xs text-[#4A4D55] mt-1">
            Empirical information gap detection, cross-source contradiction resolution, freshness auditing, and verification task mapping.
          </p>
        </div>

        {/* Project Selector & Run Trigger */}
        <div className="flex flex-wrap items-center gap-2.5">
          {projects.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-xs shadow-xs">
              <span className="text-[#4A4D55] font-medium">Project:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent font-semibold text-[#1E2022] focus:outline-none max-w-[180px] truncate"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
            onClick={() => {
              setPipelineError('');
              setIsRunModalOpen(true);
            }}
          >
            Run Intelligence Pipeline
          </Button>
        </div>
      </div>

      {/* Epistemic Ground Truth Banner */}
      <div className="bg-[#EFF6FF]/60 border border-[#DBEAFE] rounded-xl p-3.5 text-xs text-[#1E2022] flex items-start gap-2.5 shadow-xs">
        <Info className="w-4 h-4 text-[#3B82F6] flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5 flex-1 leading-relaxed">
          <p className="font-semibold text-[#1E2022]">Epistemic Integrity Guarantees:</p>
          <p className="text-[11px] text-[#4A4D55]">
            1. <strong>Absence of evidence</strong> within ingested project sources is never represented as proof of absence in wider global science.
            <br />
            2. <strong>Contradiction analysis</strong> preserves competing claims neutrally and never artificially decides which source is correct.
            <br />
            3. <strong>Freshness auditing</strong> identifies temporal decay without labeling older literature as false.
          </p>
        </div>
      </div>

      {/* High-Level Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-xs">
          <p className="text-[11px] font-medium text-[#4A4D55] uppercase tracking-wider">Deficit Index</p>
          <p className="text-2xl font-bold text-[#3B82F6] mt-1">
            {statusData?.gap_score !== undefined ? `${statusData.gap_score}%` : '—'}
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-xs">
          <p className="text-[11px] font-medium text-amber-700 uppercase tracking-wider">Unanswered Gaps</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {statusData?.questions?.unanswered || 0}
            <span className="text-xs text-[#4A4D55] font-normal ml-1">
              / {statusData?.questions?.total || 0} subquestions
            </span>
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-xs">
          <p className="text-[11px] font-medium text-rose-700 uppercase tracking-wider">Contradictions</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">
            {statusData?.findings?.contradictions || 0}
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-xs">
          <p className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">Tasks Completed</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {statusData?.checklist?.completed || 0}
            <span className="text-xs text-[#4A4D55] font-normal ml-1">
              / {statusData?.checklist?.total || 0}
            </span>
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#E5E7EB]">
        <button
          onClick={() => setActiveTab('gaps')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'gaps'
              ? 'border-[#3B82F6] text-[#3B82F6]'
              : 'border-transparent text-[#4A4D55] hover:text-[#1E2022]'
          }`}
        >
          <Layers className="w-4 h-4" />
          Module 1: Information Gaps ({questions.length})
        </button>

        <button
          onClick={() => setActiveTab('contradictions')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'contradictions'
              ? 'border-[#3B82F6] text-[#3B82F6]'
              : 'border-transparent text-[#4A4D55] hover:text-[#1E2022]'
          }`}
        >
          <Scale className="w-4 h-4" />
          Module 2: Contradictions ({contradictionFindings.length})
        </button>

        <button
          onClick={() => setActiveTab('freshness')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'freshness'
              ? 'border-[#3B82F6] text-[#3B82F6]'
              : 'border-transparent text-[#4A4D55] hover:text-[#1E2022]'
          }`}
        >
          <Clock className="w-4 h-4" />
          Module 3: Freshness Warnings ({freshnessFindings.length})
        </button>

        <button
          onClick={() => setActiveTab('checklist')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'checklist'
              ? 'border-[#3B82F6] text-[#3B82F6]'
              : 'border-transparent text-[#4A4D55] hover:text-[#1E2022]'
          }`}
        >
          <ListChecks className="w-4 h-4" />
          Module 4: Verification Checklist ({checklist.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INFORMATION GAPS                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'gaps' && (
        <div className="space-y-4">
          {loading ? (
            <LoadingSpinner size="lg" message="Loading research questions & gap map..." />
          ) : questions.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No subquestions evaluated yet"
              description="Execute the intelligence pipeline to decompose your objective into subquestions and evaluate empirical coverage."
              actionLabel="Run Gap Detection"
              onAction={() => setIsRunModalOpen(true)}
            />
          ) : (
            <div className="space-y-3.5">
              {questions.map((q) => {
                const cov = q.coverage || {};
                const isUnanswered = cov.status === 'unanswered' || !cov.status;
                const isPartial = cov.status === 'partially_answered';
                const isAnswered = cov.status === 'answered';

                return (
                  <div
                    key={q.id}
                    className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs space-y-3 hover:border-[#3B82F6]/50 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Importance Badge */}
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                              q.importance === 'critical'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : q.importance === 'high'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-[#4A4D55] border-slate-200'
                            }`}
                          >
                            {q.importance} Priority
                          </span>

                          {/* Coverage Badge */}
                          {isUnanswered && (
                            <Badge variant="danger" size="sm" dot>
                              Unanswered Gap (0% Coverage)
                            </Badge>
                          )}
                          {isPartial && (
                            <Badge variant="warning" size="sm" dot>
                              Partially Answered ({Math.round((cov.coverage_score || 0.5) * 100)}%)
                            </Badge>
                          )}
                          {isAnswered && (
                            <Badge variant="success" size="sm" dot>
                              Empirically Answered ({Math.round((cov.coverage_score || 0.9) * 100)}%)
                            </Badge>
                          )}

                          {q.domain_category && (
                            <span className="text-[11px] text-[#4A4D55] bg-[#F9F9FB] px-2 py-0.5 rounded border border-[#E5E7EB]">
                              Domain: {q.domain_category}
                            </span>
                          )}

                          {isUnanswered && (
                            <span className="text-[10px] text-[#4A4D55] bg-slate-100 px-2 py-0.5 rounded font-mono">
                              AI Research Suggestion
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-[#1E2022] leading-snug pt-1">
                          {q.question_text}
                        </h3>
                      </div>
                    </div>

                    {/* Resolution Explanation */}
                    {cov.resolution_explanation && (
                      <div
                        className={`text-xs p-3 rounded-lg border leading-relaxed ${
                          isUnanswered
                            ? 'bg-amber-50/60 text-amber-900 border-amber-200'
                            : isPartial
                            ? 'bg-blue-50/60 text-blue-900 border-blue-200'
                            : 'bg-emerald-50/60 text-emerald-900 border-emerald-200'
                        }`}
                      >
                        <p className="font-semibold mb-0.5">
                          {isUnanswered ? 'Gap Explanation:' : 'Coverage Evaluation:'}
                        </p>
                        <p className="text-[11px]">{cov.resolution_explanation}</p>
                      </div>
                    )}

                    {/* Mapped Claims List */}
                    {cov.mapped_claims && cov.mapped_claims.length > 0 && (
                      <div className="pt-2 border-t border-[#E5E7EB] space-y-2">
                        <span className="text-xs font-semibold text-[#1E2022]">
                          Corroborating Extracted Claims ({cov.mapped_claims.length}):
                        </span>
                        <div className="space-y-1.5">
                          {cov.mapped_claims.map((claim) => (
                            <div
                              key={claim.id}
                              className="p-2.5 rounded-lg bg-[#F9F9FB] border border-[#E5E7EB] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                            >
                              <div className="space-y-0.5 flex-1">
                                <span className="font-bold text-[#1E2022]">
                                  {claim.subject}:{' '}
                                </span>
                                <span className="text-[#4A4D55]">{claim.claim_text}</span>
                                <span className="text-[10px] text-[#3B82F6] font-bold ml-2">
                                  [{claim.value}]
                                </span>
                              </div>
                              <span className="text-[11px] text-[#4A4D55] flex-shrink-0">
                                Source: {claim.source_title?.slice(0, 30)}...
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: POSSIBLE CONTRADICTIONS                                            */}
      {/* ========================================================================= */}
      {activeTab === 'contradictions' && (
        <div className="space-y-4">
          {loading ? (
            <LoadingSpinner size="lg" message="Scanning cross-source claims..." />
          ) : contradictionFindings.length === 0 ? (
            <EmptyState
              icon={Scale}
              title="No contradictory claims detected"
              description="Module 2 compares claims by subject and attribute across distinct papers. When divergent metrics occur, both are highlighted neutrally."
              actionLabel="Run Contradiction Check"
              onAction={() => setIsRunModalOpen(true)}
            />
          ) : (
            <div className="space-y-4">
              {contradictionFindings.map((finding) => {
                const evLinks = finding.evidence_links || [];
                const claimA = evLinks.find((e) => e.role === 'competing_claim_a');
                const claimB = evLinks.find((e) => e.role === 'competing_claim_b');

                return (
                  <div
                    key={finding.id}
                    className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5E7EB]">
                      <div className="flex items-center gap-2">
                        <Badge variant="danger" size="sm">
                          Contradiction / Tension
                        </Badge>
                        <h3 className="text-sm font-bold text-[#1E2022]">
                          {finding.title}
                        </h3>
                      </div>
                      <span className="text-[11px] font-semibold text-[#4A4D55] bg-[#F9F9FB] px-2.5 py-0.5 rounded border border-[#E5E7EB]">
                        Neutral Preservation Mode
                      </span>
                    </div>

                    <p className="text-xs text-[#4A4D55] leading-relaxed">
                      {finding.explanation}
                    </p>

                    {/* Side-by-Side Comparison of Source A and Source B */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {/* Competing Claim A */}
                      <div className="p-3.5 rounded-lg bg-[#F9F9FB] border border-[#E5E7EB] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#1E2022]">Source A Observation:</span>
                          <span className="text-[10px] uppercase font-semibold text-[#3B82F6]">
                            {claimA?.source_type || 'Paper'}
                          </span>
                        </div>
                        <blockquote className="font-mono text-xs text-[#1E2022] italic border-l-2 border-[#3B82F6] pl-2.5 py-0.5 leading-relaxed">
                          "{claimA?.passage || 'No excerpt'}"
                        </blockquote>
                        <div className="text-[11px] text-[#4A4D55] pt-1 border-t border-[#E5E7EB] flex items-center justify-between">
                          <span className="truncate max-w-[200px]">
                            {claimA?.source_title || 'Source A'}
                          </span>
                          {claimA?.source_url && (
                            <a
                              href={claimA.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#3B82F6] hover:underline inline-flex items-center gap-1 font-medium"
                            >
                              View <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Competing Claim B */}
                      <div className="p-3.5 rounded-lg bg-[#F9F9FB] border border-[#E5E7EB] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#1E2022]">Source B Observation:</span>
                          <span className="text-[10px] uppercase font-semibold text-rose-600">
                            {claimB?.source_type || 'Paper'}
                          </span>
                        </div>
                        <blockquote className="font-mono text-xs text-[#1E2022] italic border-l-2 border-rose-500 pl-2.5 py-0.5 leading-relaxed">
                          "{claimB?.passage || 'No excerpt'}"
                        </blockquote>
                        <div className="text-[11px] text-[#4A4D55] pt-1 border-t border-[#E5E7EB] flex items-center justify-between">
                          <span className="truncate max-w-[200px]">
                            {claimB?.source_title || 'Source B'}
                          </span>
                          {claimB?.source_url && (
                            <a
                              href={claimB.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#3B82F6] hover:underline inline-flex items-center gap-1 font-medium"
                            >
                              View <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FRESHNESS WARNINGS                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'freshness' && (
        <div className="space-y-4">
          {loading ? (
            <LoadingSpinner size="lg" message="Auditing source publication dates..." />
          ) : freshnessFindings.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="All literature meets freshness policies"
              description="No outdated or undated sources detected. Ingested papers are current within your configured domain threshold."
              actionLabel="Run Freshness Audit"
              onAction={() => setIsRunModalOpen(true)}
            />
          ) : (
            <div className="space-y-3.5">
              {freshnessFindings.map((finding) => {
                const meta = finding.metadata || {};
                const isUndated = meta.status === 'undated';

                return (
                  <div
                    key={finding.id}
                    className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5E7EB]">
                      <div className="flex items-center gap-2">
                        <Badge variant={isUndated ? 'default' : 'warning'} size="sm">
                          {isUndated ? 'Undated Source' : `Outdated (${meta.age_years} yrs)`}
                        </Badge>
                        <h3 className="text-sm font-bold text-[#1E2022]">
                          {finding.title}
                        </h3>
                      </div>
                      <span className="text-[11px] text-[#4A4D55]">
                        Policy Threshold: {meta.threshold_years || 5} years
                      </span>
                    </div>

                    <p className="text-xs text-[#1E2022] leading-relaxed">
                      {finding.description}
                    </p>

                    <div className="p-3 rounded-lg bg-[#F9F9FB] border border-[#E5E7EB] text-xs text-[#4A4D55] leading-relaxed">
                      {finding.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: VERIFICATION CHECKLIST                                             */}
      {/* ========================================================================= */}
      {activeTab === 'checklist' && (
        <div className="space-y-4">
          {loading ? (
            <LoadingSpinner size="lg" message="Generating verification tasks..." />
          ) : checklist.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="No verification tasks generated"
              description="Execute the intelligence pipeline to generate prioritized verification tasks linked to unresolved gaps and contradictions."
              actionLabel="Generate Roadmap"
              onAction={() => setIsRunModalOpen(true)}
            />
          ) : (
            <div className="space-y-2.5">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all flex items-start gap-3 ${
                    item.is_completed
                      ? 'bg-[#F9F9FB]/80 border-[#E5E7EB] opacity-75'
                      : 'bg-white border-[#E5E7EB] shadow-xs hover:border-[#3B82F6]/50'
                  }`}
                >
                  <button
                    onClick={() => handleToggleTask(item)}
                    disabled={togglingTaskId === item.id}
                    className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                      item.is_completed
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-[#4A4D55] hover:border-[#3B82F6] bg-white'
                    }`}
                  >
                    {item.is_completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          item.priority === 'critical'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : item.priority === 'high'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-[#4A4D55] border-slate-200'
                        }`}
                      >
                        {item.priority} Priority
                      </span>

                      {item.finding_type && (
                        <span className="text-[10px] font-semibold uppercase text-[#3B82F6] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#DBEAFE]">
                          Derived from: {item.finding_type}
                        </span>
                      )}

                      {item.is_completed && (
                        <span className="text-[11px] text-emerald-700 font-medium">
                          Completed on {new Date(item.completed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <p
                      className={`text-xs font-semibold ${
                        item.is_completed
                          ? 'text-[#4A4D55] line-through'
                          : 'text-[#1E2022]'
                      }`}
                    >
                      {item.task_text}
                    </p>

                    {item.rationale && (
                      <p className="text-[11px] text-[#4A4D55] leading-relaxed">
                        {item.rationale}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* RUN INTELLIGENCE PIPELINE MODAL                                           */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
        title="Execute Core Intelligence Pipeline"
        description="Run Modules 1 through 4 to discover empirical gaps, detect contradictions, audit freshness, and generate verification tasks."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleRunPipeline} className="space-y-4">
          {/* Target Project */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#1E2022]">Target Research Project</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full text-xs bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#1E2022] focus:outline-none focus:border-[#3B82F6]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Freshness Policy Configuration */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#1E2022]">
              Domain Freshness Relevance Policy (Cutoff Threshold)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="25"
                value={policyYears}
                onChange={(e) => setPolicyYears(e.target.value)}
                className="w-24 text-xs bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#1E2022] focus:outline-none focus:border-[#3B82F6]"
              />
              <span className="text-xs text-[#4A4D55]">
                years (flag sources older than this threshold)
              </span>
            </div>
          </div>

          {/* Subquestion Regeneration Toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="force-regen"
              checked={forceRegenerate}
              onChange={(e) => setForceRegenerate(e.target.checked)}
              className="rounded border-[#E5E7EB] text-[#3B82F6] focus:ring-[#3B82F6]"
            />
            <label htmlFor="force-regen" className="text-xs text-[#1E2022] cursor-pointer">
              Force regenerate research subquestions from project objective
            </label>
          </div>

          {/* Pipeline Notice */}
          <div className="p-3 rounded-lg bg-[#F9F9FB] border border-[#E5E7EB] text-[11px] text-[#4A4D55] space-y-1">
            <p className="font-semibold text-[#1E2022]">Pipeline Orchestration:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Module 1: Maps empirical claims and identifies unanswered gaps.</li>
              <li>Module 2: Cross-references claims between sources to flag contradictions.</li>
              <li>Module 3: Audits publication years against domain freshness.</li>
              <li>Module 4: Synthesizes findings into prioritized verification checklist.</li>
            </ul>
          </div>

          {pipelineError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <strong>Pipeline Error:</strong> {pipelineError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsRunModalOpen(false)}
              disabled={runningPipeline}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={runningPipeline}
            >
              {runningPipeline ? 'Executing 4-Module Pipeline...' : 'Run Pipeline Now'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AnalysesPage;
