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
  Plus,
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

  const recentProjects = stats?.recent_projects || projects.slice(0, 6);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-[#202124]">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#202124] tracking-tight">Research Intelligence Dashboard</h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EBF7FF] text-[#0083B0] border border-[#BCE4FA]">
              AGYAAN LAB
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time telemetry across empirical claims, unanswered hypotheses, cross-source tensions, and verification milestones.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/new-research"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#202124] text-white px-4 py-2 text-sm font-medium hover:bg-black transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Research</span>
          </Link>
          <Link
            to="/intelligence"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 text-[#202124] px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-all shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-[#20BEFF]" />
            <span>Intelligence Hub</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" message="Loading research telemetry..." />
      ) : (
        <>
          {/* Key Metric Cards (All 6 Required Metrics in Kaggle White Cards) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* 1. Total Research Projects */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs hover:border-gray-300 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Projects</span>
                <FolderGit2 className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-[#202124] mt-1">
                {stats?.total_projects || projects.length}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">Active investigations</p>
            </div>

            {/* 2. Total Sources Reviewed */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs hover:border-gray-300 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Sources</span>
                <Layers className="w-4 h-4 text-[#20BEFF]" />
              </div>
              <p className="text-2xl font-bold text-[#202124] mt-1">
                {stats?.total_sources || stats?.sources || 0}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">PDFs, URLs & Papers</p>
            </div>

            {/* 3. Total Extracted Claims */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs hover:border-gray-300 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Claims</span>
                <FileCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {stats?.total_claims || 0}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">Grounded atomic facts</p>
            </div>

            {/* 4. Potential Information Gaps */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs hover:border-gray-300 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Gaps</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-amber-700 mt-1">
                {stats?.information_gaps || 0}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">Unaddressed voids</p>
            </div>

            {/* 5. Possible Contradictions */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs hover:border-gray-300 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Tensions</span>
                <Scale className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-2xl font-bold text-rose-700 mt-1">
                {stats?.contradictions || 0}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">Empirical conflicts</p>
            </div>

            {/* 6. Freshness Warnings */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs hover:border-gray-300 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Freshness</span>
                <Clock className="w-4 h-4 text-[#0083B0]" />
              </div>
              <p className="text-2xl font-bold text-[#0083B0] mt-1">
                {stats?.freshness_warnings || 0}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">Outdated / Undated</p>
            </div>
          </div>

          {/* Quick Action Banner (Kaggle Cream Card) */}
          <div className="bg-[#F9F8F4] border border-gray-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#202124] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#20BEFF]" />
                Four-Module Negative-Space Intelligence Engine Ready
              </h3>
              <p className="text-xs text-gray-600 max-w-2xl leading-relaxed">
                Scan your literature corpus to automatically detect empirical gaps, reconcile contradictory metrics, audit publication years, and generate prioritized verification tasks.
              </p>
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <Link
                to="/intelligence"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#202124] text-white px-5 py-2 text-xs md:text-sm font-medium hover:bg-black transition-all shadow-xs"
              >
                <span>Launch Engine</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/evidence"
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white text-[#202124] px-4 py-2 text-xs md:text-sm font-medium hover:bg-gray-50 transition-all shadow-2xs"
              >
                <span>Evidence Explorer</span>
              </Link>
            </div>
          </div>

          {/* Recent Research Projects Grid */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#202124] uppercase tracking-wider">
                Recent Research Projects ({recentProjects.length})
              </h2>
              <Link to="/projects" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentProjects.map((p) => (
                  <div key={p.id} className="bg-white border border-gray-200/90 rounded-2xl p-5 flex flex-col justify-between hover:border-gray-300 hover:shadow-xs transition-all space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {p.domain?.replace('_', ' ') || 'General'}
                        </span>
                        {p.gap_score !== null && p.gap_score !== undefined && (
                          <span className="font-mono text-xs font-bold text-[#F9AB00]">
                            {p.gap_score}% Deficit
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-[#202124] line-clamp-1 leading-snug">
                        {p.title}
                      </h3>

                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {p.description || 'No objective description provided.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                      <span>
                        {p.sources_count || 0} sources • {p.claims_count || 0} claims
                      </span>
                      <Link
                        to={`/projects/${p.id}`}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold transition-colors"
                      >
                        Inspect <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
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
