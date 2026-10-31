import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderGit2,
  Layers,
  FileCheck,
  AlertTriangle,
  Scale,
  Clock,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Activity,
  CheckCircle2,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import projectService from '../services/projectService';
import dashboardService from '../services/dashboardService';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, projectsRes] = await Promise.all([
        dashboardService.getStats(),
        projectService.getProjects(),
      ]);
      setStats(statsRes);
      setProjects(projectsRes.results || projectsRes || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const recentProjects = stats?.recent_projects || projects.slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-[#F8FAFC]">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1E2C4A]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Research Intelligence Dashboard</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#141F36] text-[#60A5FA] border border-[#1E2C4A]">
              GAPZERO v2.0
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Real-time telemetry across empirical claims, unanswered hypotheses, cross-source tensions, and verification milestones.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/new-research">
            <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-3.5 h-3.5" />}>
              New Research Project
            </Button>
          </Link>
          <Link to="/analyses">
            <Button variant="secondary" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />}>
              Run Intelligence Engine
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" message="Loading research telemetry..." />
      ) : (
        <>
          {/* Key Metric Cards (All 6 Required Metrics) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Total Research Projects */}
            <div className="bg-[#0E1626] border border-[#1E2C4A] rounded-xl p-4 shadow-xs hover:border-[#3B82F6]/50 transition-all">
              <div className="flex items-center justify-between text-[#94A3B8] mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider">Projects</span>
                <FolderGit2 className="w-4 h-4 text-[#60A5FA]" />
              </div>
              <p className="text-2xl font-extrabold text-white mt-1">
                {stats?.total_projects || projects.length}
              </p>
              <p className="text-[10px] text-[#94A3B8] mt-1">Active investigations</p>
            </div>

            {/* 2. Total Sources Reviewed */}
            <div className="bg-[#0E1626] border border-[#1E2C4A] rounded-xl p-4 shadow-xs hover:border-[#3B82F6]/50 transition-all">
              <div className="flex items-center justify-between text-[#94A3B8] mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider">Sources</span>
                <Layers className="w-4 h-4 text-[#3B82F6]" />
              </div>
              <p className="text-2xl font-extrabold text-white mt-1">
                {stats?.total_sources || stats?.sources || 0}
              </p>
              <p className="text-[10px] text-[#94A3B8] mt-1">PDFs, URLs & Papers</p>
            </div>

            {/* 3. Total Extracted Claims */}
            <div className="bg-[#0E1626] border border-[#1E2C4A] rounded-xl p-4 shadow-xs hover:border-[#3B82F6]/50 transition-all">
              <div className="flex items-center justify-between text-[#94A3B8] mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider">Claims</span>
                <FileCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1">
                {stats?.total_claims || 0}
              </p>
              <p className="text-[10px] text-[#94A3B8] mt-1">Grounded atomic facts</p>
            </div>

            {/* 4. Potential Information Gaps */}
            <div className="bg-[#0E1626] border border-[#1E2C4A] rounded-xl p-4 shadow-xs hover:border-[#3B82F6]/50 transition-all">
              <div className="flex items-center justify-between text-[#94A3B8] mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider">Gaps</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-extrabold text-amber-400 mt-1">
                {stats?.information_gaps || 0}
              </p>
              <p className="text-[10px] text-[#94A3B8] mt-1">Unaddressed voids</p>
            </div>

            {/* 5. Possible Contradictions */}
            <div className="bg-[#0E1626] border border-[#1E2C4A] rounded-xl p-4 shadow-xs hover:border-[#3B82F6]/50 transition-all">
              <div className="flex items-center justify-between text-[#94A3B8] mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider">Contradictions</span>
                <Scale className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-extrabold text-rose-400 mt-1">
                {stats?.contradictions || 0}
              </p>
              <p className="text-[10px] text-[#94A3B8] mt-1">Empirical tensions</p>
            </div>

            {/* 6. Freshness Warnings */}
            <div className="bg-[#0E1626] border border-[#1E2C4A] rounded-xl p-4 shadow-xs hover:border-[#3B82F6]/50 transition-all">
              <div className="flex items-center justify-between text-[#94A3B8] mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider">Freshness</span>
                <Clock className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-extrabold text-cyan-400 mt-1">
                {stats?.freshness_warnings || 0}
              </p>
              <p className="text-[10px] text-[#94A3B8] mt-1">Outdated / Undated</p>
            </div>
          </div>

          {/* Quick Action Banner */}
          <div className="bg-gradient-to-r from-[#0E1626] via-[#141F36] to-[#0E1626] border border-[#1E2C4A] rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#3B82F6]" />
                Four-Module Intelligence Pipeline Ready
              </h3>
              <p className="text-xs text-[#94A3B8] max-w-2xl leading-relaxed">
                Scan your literature corpus to automatically detect empirical gaps, reconcile contradictory metrics, audit publication years, and generate prioritized verification tasks.
              </p>
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <Link to="/analyses">
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Open Intelligence Engine
                </Button>
              </Link>
              <Link to="/evidence">
                <Button variant="secondary" size="sm">
                  View Evidence Explorer
                </Button>
              </Link>
            </div>
          </div>

          {/* Recent Research Projects Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Recent Research Projects ({recentProjects.length})
              </h2>
              <Link to="/projects" className="text-xs text-[#60A5FA] hover:underline flex items-center gap-1 font-medium">
                View All Projects <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentProjects.length === 0 ? (
              <EmptyState
                icon={FolderGit2}
                title="No research projects initiated yet"
                description="Create your first research project with URL, PDF, and text ingestion to begin."
                actionLabel="Create New Research Project"
                onAction={() => window.location.href = '/new-research'}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {recentProjects.map((p) => (
                  <Card key={p.id} className="p-5 flex flex-col justify-between hoverEffect space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#141F36] text-[#60A5FA] border border-[#1E2C4A]">
                          {p.domain?.replace('_', ' ') || 'General'}
                        </span>
                        {p.gap_score !== null && p.gap_score !== undefined && (
                          <span className="font-mono text-xs font-bold text-[#3B82F6]">
                            {p.gap_score}% Deficit
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-white line-clamp-1 leading-snug">
                        {p.title}
                      </h3>

                      <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed">
                        {p.description || 'No objective description provided.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#1E2C4A] flex items-center justify-between text-[11px] text-[#94A3B8]">
                      <span>
                        {p.sources_count || 0} sources • {p.claims_count || 0} claims
                      </span>
                      <Link
                        to={`/projects/${p.id}`}
                        className="text-[#60A5FA] hover:text-white flex items-center gap-1 font-semibold transition-colors"
                      >
                        Inspect <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
