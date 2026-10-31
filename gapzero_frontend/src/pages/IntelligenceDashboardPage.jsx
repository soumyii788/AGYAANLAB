import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Layers,
  Scale,
  Clock,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  ArrowRight,
  RefreshCw,
  Info,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import projectService from '../services/projectService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';

export const IntelligenceDashboardPage = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(true);

  // Live Data
  const [statusData, setStatusData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [findings, setFindings] = useState([]);
  const [claims, setClaims] = useState([]);
  const [evidenceStats, setEvidenceStats] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectData(selectedProjectId);
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

  const loadProjectData = async (projId) => {
    try {
      setLoading(true);
      const [statusRes, questionsRes, findingsRes, claimsRes, statsRes] = await Promise.all([
        projectService.getAnalysisStatus(projId),
        projectService.getResearchQuestions({ project: projId }),
        projectService.getFindings({ project: projId }),
        projectService.getClaims({ project: projId }),
        projectService.getEvidenceStats({ project: projId }),
      ]);

      setStatusData(statusRes);
      setQuestions(questionsRes.results || questionsRes || []);
      setFindings(findingsRes.results || findingsRes || []);
      setClaims(claimsRes.results || claimsRes || []);
      setEvidenceStats(statsRes);
    } catch (err) {
      console.error('Failed to load intelligence data:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedProject = projects.find((p) => p.id === parseInt(selectedProjectId));

  // Coverage calculations
  const totalQ = questions.length || 1;
  const answeredQ = questions.filter((q) => q.coverage?.status === 'answered').length;
  const partialQ = questions.filter((q) => q.coverage?.status === 'partially_answered').length;
  const unansweredQ = questions.filter((q) => q.coverage?.status === 'unanswered').length;
  const coveragePercent = Math.round(((answeredQ * 1.0 + partialQ * 0.5) / totalQ) * 100);

  // Findings summary
  const gapCount = findings.filter((f) => f.finding_type === 'gap').length;
  const contradictionCount = findings.filter((f) => f.finding_type === 'contradiction').length;
  const freshnessCount = findings.filter((f) => f.finding_type === 'freshness').length;
  const totalFindings = findings.length || 1;

  // Claims by type breakdown
  const empiricalClaims = claims.filter((c) => c.claim_type === 'empirical').length;
  const methodologicalClaims = claims.filter((c) => c.claim_type === 'methodological').length;
  const statisticalClaims = claims.filter((c) => c.claim_type === 'statistical').length;
  const otherClaims = claims.length - empiricalClaims - methodologicalClaims - statisticalClaims;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-[#F8FAFC]">
      {/* Header & Project Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1E2C4A]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Intelligence Dashboard</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#141F36] text-[#60A5FA] border border-[#1E2C4A]">
              Telemetry & Coverage
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Empirical coverage gauge, findings distribution, claim epistemology, and pipeline analysis status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {projects.length > 0 && (
            <div className="flex items-center gap-1.5 bg-[#0E1626] border border-[#1E2C4A] rounded-lg px-3 py-1.5 text-xs">
              <span className="text-[#94A3B8] font-medium">Scope:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent font-semibold text-white focus:outline-none max-w-[180px] truncate"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#0E1626] text-white">
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Link to="/analyses">
            <Button variant="primary" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
              Configure Pipeline
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" message="Computing research coverage & findings distribution..." />
      ) : !selectedProject ? (
        <EmptyState
          icon={Layers}
          title="No research projects available"
          description="Create a research project to generate intelligence metrics."
          actionLabel="Create Project"
          onAction={() => window.location.href = '/new-research'}
        />
      ) : (
        <div className="space-y-6">
          {/* Top Row: Coverage Indicator & Findings Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 1. Research Coverage Indicator Card */}
            <Card className="p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                    Empirical Research Coverage
                  </h3>
                  <span className="text-xs font-mono font-bold text-[#60A5FA]">
                    {coveragePercent}% Covered
                  </span>
                </div>
                <p className="text-2xl font-black text-white mt-2">
                  {questions.length === 0 ? '0%' : `${coveragePercent}%`}
                </p>
                <p className="text-xs text-[#94A3B8] mt-1">
                  Deficit Index: <strong className="text-amber-400">{statusData?.gap_score || 0}%</strong> uncharted space
                </p>
              </div>

              {/* Visual Progress Gauge Bar */}
              <div className="space-y-2">
                <div className="w-full h-3 rounded-full bg-[#141F36] overflow-hidden flex">
                  <div
                    style={{ width: `${(answeredQ / totalQ) * 100}%` }}
                    className="bg-emerald-500 h-full transition-all"
                    title={`Answered: ${answeredQ}`}
                  />
                  <div
                    style={{ width: `${(partialQ / totalQ) * 100}%` }}
                    className="bg-amber-500 h-full transition-all"
                    title={`Partially Answered: ${partialQ}`}
                  />
                  <div
                    style={{ width: `${(unansweredQ / totalQ) * 100}%` }}
                    className="bg-rose-500/70 h-full transition-all"
                    title={`Unanswered: ${unansweredQ}`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> {answeredQ} Answered
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> {partialQ} Partial
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> {unansweredQ} Gaps
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#080C15] border border-[#1E2C4A] text-[11px] text-[#94A3B8] leading-relaxed">
                Coverage measures empirical claims mapped to subquestions. Absence of claims in current sources is never represented as proof of absence in wider global science.
              </div>
            </Card>

            {/* 2. Findings Summary Card */}
            <Card className="p-6 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                  Epistemic Findings Summary
                </h3>
                <p className="text-2xl font-black text-white mt-2">
                  {findings.length}
                </p>
                <p className="text-xs text-[#94A3B8] mt-1">
                  Active findings across 3 diagnostic modules
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#080C15] border border-[#1E2C4A]">
                  <span className="text-xs font-medium text-white flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Information Gaps
                  </span>
                  <span className="text-xs font-bold text-amber-400 font-mono">
                    {gapCount}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#080C15] border border-[#1E2C4A]">
                  <span className="text-xs font-medium text-white flex items-center gap-2">
                    <Scale className="w-3.5 h-3.5 text-rose-400" />
                    Possible Contradictions
                  </span>
                  <span className="text-xs font-bold text-rose-400 font-mono">
                    {contradictionCount}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#080C15] border border-[#1E2C4A]">
                  <span className="text-xs font-medium text-white flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    Freshness Warnings
                  </span>
                  <span className="text-xs font-bold text-cyan-400 font-mono">
                    {freshnessCount}
                  </span>
                </div>
              </div>

              <Link to="/findings" className="text-xs font-semibold text-[#60A5FA] hover:underline flex items-center gap-1">
                Explore Detailed Findings <ArrowRight className="w-3 h-3" />
              </Link>
            </Card>

            {/* 3. Claims Overview Card */}
            <Card className="p-6 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                  Extracted Claims Overview
                </h3>
                <p className="text-2xl font-black text-emerald-400 mt-2">
                  {claims.length}
                </p>
                <p className="text-xs text-[#94A3B8] mt-1">
                  Average extraction confidence: <strong className="text-white">{evidenceStats?.avg_confidence || 90}%</strong>
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#94A3B8]">Empirical Findings:</span>
                  <span className="font-bold text-white">{empiricalClaims}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#94A3B8]">Methodological Protocols:</span>
                  <span className="font-bold text-white">{methodologicalClaims}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#94A3B8]">Statistical Relationships:</span>
                  <span className="font-bold text-white">{statisticalClaims}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#94A3B8]">Other / Theoretical:</span>
                  <span className="font-bold text-white">{otherClaims}</span>
                </div>
              </div>

              <Link to="/evidence" className="text-xs font-semibold text-[#60A5FA] hover:underline flex items-center gap-1">
                Inspect in Evidence Explorer <ArrowRight className="w-3 h-3" />
              </Link>
            </Card>
          </div>

          {/* Findings Distribution Chart / Visual Breakdown */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2C4A]">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#3B82F6]" />
                  Findings Severity & Category Distribution
                </h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Breakdown of identified knowledge gaps, contradictions, and freshness notices.
                </p>
              </div>

              <span className="text-xs text-[#94A3B8]">
                {findings.length} Total Findings
              </span>
            </div>

            {findings.length === 0 ? (
              <p className="text-xs text-[#94A3B8] py-8 text-center">
                Run the intelligence pipeline to generate findings distribution data.
              </p>
            ) : (
              <div className="space-y-3">
                {/* Information Gaps Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white font-semibold flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-amber-400" />
                      Information Gaps (Negative Space)
                    </span>
                    <span className="font-mono text-[#94A3B8]">
                      {gapCount} ({Math.round((gapCount / totalFindings) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#141F36] overflow-hidden">
                    <div
                      style={{ width: `${(gapCount / totalFindings) * 100}%` }}
                      className="bg-amber-400 h-full rounded-full transition-all"
                    />
                  </div>
                </div>

                {/* Contradictions Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white font-semibold flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-rose-400" />
                      Cross-Source Contradictions & Tensions
                    </span>
                    <span className="font-mono text-[#94A3B8]">
                      {contradictionCount} ({Math.round((contradictionCount / totalFindings) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#141F36] overflow-hidden">
                    <div
                      style={{ width: `${(contradictionCount / totalFindings) * 100}%` }}
                      className="bg-rose-400 h-full rounded-full transition-all"
                    />
                  </div>
                </div>

                {/* Freshness Warnings Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white font-semibold flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-cyan-400" />
                      Freshness & Temporal Decay Warnings
                    </span>
                    <span className="font-mono text-[#94A3B8]">
                      {freshnessCount} ({Math.round((freshnessCount / totalFindings) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#141F36] overflow-hidden">
                    <div
                      style={{ width: `${(freshnessCount / totalFindings) * 100}%` }}
                      className="bg-cyan-400 h-full rounded-full transition-all"
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Analysis Engine Status Summary */}
          <Card className="p-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
              Pipeline Telemetry Status
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#080C15] border border-[#1E2C4A]">
                <span className="text-[#94A3B8] block text-[10px] uppercase font-semibold">Corpus Sources</span>
                <span className="text-base font-bold text-white mt-1 block">
                  {statusData?.corpus?.sources || 0}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#080C15] border border-[#1E2C4A]">
                <span className="text-[#94A3B8] block text-[10px] uppercase font-semibold">Subquestions</span>
                <span className="text-base font-bold text-white mt-1 block">
                  {statusData?.questions?.total || 0}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#080C15] border border-[#1E2C4A]">
                <span className="text-[#94A3B8] block text-[10px] uppercase font-semibold">Verification Tasks</span>
                <span className="text-base font-bold text-white mt-1 block">
                  {statusData?.checklist?.completed || 0} / {statusData?.checklist?.total || 0}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#080C15] border border-[#1E2C4A]">
                <span className="text-[#94A3B8] block text-[10px] uppercase font-semibold">Status</span>
                <span className="text-xs font-semibold text-emerald-400 mt-1 block flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Synchronized
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default IntelligenceDashboardPage;
