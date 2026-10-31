import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Search,
  BookOpen,
  Compass,
  FileText,
  Activity,
  CheckCircle2,
  TrendingUp,
  ExternalLink,
  ShieldCheck,
  Microscope,
  Atom,
  Binary
} from 'lucide-react';
import projectService from '../services/projectService';
import dashboardService from '../services/dashboardService';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/sources?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const recentProjects = stats?.recent_projects || projects.slice(0, 6);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-[#202124]">
      {/* ─── FORMAL PUBMED-INSPIRED HERO BANNER (INSPIRATION IMAGE 1) ─────────── */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0B2545] via-[#133C55] to-[#134074] text-white p-7 sm:p-10 shadow-lg border border-[#134074]/50">
        {/* Subtle Molecular Constellation Network Background */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="molecular-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="2" fill="#FFFFFF" />
                <circle cx="50" cy="50" r="2" fill="#FFFFFF" />
                <line x1="10" y1="10" x2="50" y2="50" stroke="#FFFFFF" strokeWidth="0.5" strokeDasharray="3 3" />
                <line x1="50" y1="10" x2="10" y2="50" stroke="#FFFFFF" strokeWidth="0.5" strokeDasharray="3 3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#molecular-grid)" />
          </svg>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4">
          {/* Institutional Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-mono tracking-wider text-[#20BEFF]">
            <ShieldCheck className="w-3.5 h-3.5" />
            AGYAAN LAB · NEGATIVE-SPACE SCIENTIFIC RESEARCH INTELLIGENCE
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Discover What Lies in the Scientific Negative Space
          </h1>

          <p className="text-sm sm:text-base text-gray-200 max-w-2xl mx-auto leading-relaxed">
            Deconstruct peer-reviewed literature into verifiable atomic claims. Uncover unaddressed hypotheses, cross-study empirical contradictions, and publication freshness boundaries.
          </p>

          {/* PubMed-Style Central Discovery Bar */}
          <form onSubmit={handleSearchSubmit} className="pt-2 max-w-2xl mx-auto">
            <div className="flex items-center bg-white rounded-full p-1.5 shadow-2xl border border-white/20 focus-within:ring-3 focus-within:ring-[#20BEFF]/50 transition-all">
              <div className="pl-4 text-gray-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Search literature, claims, contradictions, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm text-[#202124] placeholder-gray-400 focus:outline-none bg-transparent"
              />
              <button
                type="submit"
                className="rounded-full bg-[#0083B0] hover:bg-[#006080] text-white px-6 py-2.5 text-sm font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer shadow-xs"
              >
                <span>Search</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick Category Badges (like PubMed's Learn, Find, Download, Explore) */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 pt-3 text-xs text-gray-300">
            <Link to="/new-research" className="flex items-center gap-1 hover:text-white transition-colors bg-white/10 px-3 py-1 rounded-full">
              <Plus className="w-3.5 h-3.5 text-[#20BEFF]" /> New Project
            </Link>
            <Link to="/findings" className="flex items-center gap-1 hover:text-white transition-colors bg-white/10 px-3 py-1 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" /> Negative Gaps
            </Link>
            <Link to="/evidence" className="flex items-center gap-1 hover:text-white transition-colors bg-white/10 px-3 py-1 rounded-full">
              <Scale className="w-3.5 h-3.5 text-rose-300" /> Contradictions
            </Link>
            <Link to="/checklist" className="flex items-center gap-1 hover:text-white transition-colors bg-white/10 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Verification Tasks
            </Link>
            <Link to="/reports" className="flex items-center gap-1 hover:text-white transition-colors bg-white/10 px-3 py-1 rounded-full">
              <FileText className="w-3.5 h-3.5 text-blue-300" /> Final Reports
            </Link>
          </div>
        </div>
      </section>

      {/* ─── KEY TELEMETRY METRIC CARDS ────────────────────────────────────────── */}
      {loading ? (
        <LoadingSpinner size="lg" message="Loading research telemetry..." />
      ) : (
        <>
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

          {/* ─── CREATIVE RESEARCH TILES (USING 3 UPLOADED IMAGES) ───────────── */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#202124] tracking-tight flex items-center gap-2">
                  <Atom className="w-5 h-5 text-blue-600" />
                  Frontier Intelligence & Epistemic Disciplines
                </h2>
                <p className="text-xs text-gray-500">
                  Visualizing multi-dimensional research pipelines across biological, molecular, and digital domains.
                </p>
              </div>
              <Link to="/intelligence" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                Engine Telemetry <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: DNA / Genetic & Claim Deconstruction (Uploaded Image 2) */}
              <div className="group bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs hover:shadow-md hover:border-gray-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="h-44 overflow-hidden relative bg-gray-100">
                    <img
                      src="/assets/dna-analysis.jpg"
                      alt="DNA & Atomic Claim Analysis"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                      Genomics & Empirical Claims
                    </div>
                  </div>
                  <div className="p-5 space-y-2">
                    <h3 className="text-base font-bold text-[#202124] group-hover:text-blue-600 transition-colors">
                      Atomic Claim Extraction
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Deconstruct research papers into subject-attribute-value triplets. Every claim is verified against verbatim source sentences, rejecting fabricated citations.
                    </p>
                  </div>
                </div>
                <div className="p-5 pt-0">
                  <Link
                    to="/evidence"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <span>Inspect Evidence Explorer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Card 2: Molecular Crystal Lattice (Uploaded Image 3) */}
              <div className="group bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs hover:shadow-md hover:border-gray-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="h-44 overflow-hidden relative bg-gray-100">
                    <img
                      src="/assets/molecular-lattice.jpg"
                      alt="Molecular Lattice & Negative Space"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-[#0B2545]/85 backdrop-blur-md text-white text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                      Lattice & Negative Space
                    </div>
                  </div>
                  <div className="p-5 space-y-2">
                    <h3 className="text-base font-bold text-[#202124] group-hover:text-blue-600 transition-colors">
                      Hypothesis Void Discovery
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Maps the negative space of scientific literature. Exposes what hypotheses remain untested, benchmark deficits, and unexplored reaction conditions.
                    </p>
                  </div>
                </div>
                <div className="p-5 pt-0">
                  <Link
                    to="/findings"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0083B0] hover:text-[#006080] transition-colors"
                  >
                    <span>View Information Gaps</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Card 3: Digital Interface & Scientific Computing (Uploaded Image 4) */}
              <div className="group bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs hover:shadow-md hover:border-gray-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="h-44 overflow-hidden relative bg-gray-100">
                    <img
                      src="/assets/digital-intel.jpg"
                      alt="Digital Research Intelligence"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-blue-900/80 backdrop-blur-md text-white text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                      AI & Contradiction Matrix
                    </div>
                  </div>
                  <div className="p-5 space-y-2">
                    <h3 className="text-base font-bold text-[#202124] group-hover:text-blue-600 transition-colors">
                      Neutral Contradiction Engine
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Cross-references disparate studies side-by-side. Highlights conflicting parameters and measurement anomalies without automated bias.
                    </p>
                  </div>
                </div>
                <div className="p-5 pt-0">
                  <Link
                    to="/checklist"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <span>Verification Roadmap</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ─── RECENT RESEARCH PROJECTS GRID ───────────────────────────────────── */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#202124] tracking-tight">
                  Recent Research Projects ({recentProjects.length})
                </h2>
                <p className="text-xs text-gray-500">
                  Ongoing investigations under empirical surveillance and gap modeling.
                </p>
              </div>
              <Link to="/projects" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold">
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
                  <div
                    key={p.id}
                    className="bg-white border border-gray-200/90 rounded-2xl p-5 flex flex-col justify-between hover:border-gray-300 hover:shadow-xs transition-all space-y-3"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {p.domain?.replace('_', ' ') || 'General'}
                        </span>
                        {p.gap_score !== null && p.gap_score !== undefined && (
                          <span className="font-mono text-xs font-bold text-[#F9AB00] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            {p.gap_score}% Deficit
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-[#202124] line-clamp-2 leading-snug">
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
