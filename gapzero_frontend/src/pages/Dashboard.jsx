import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  Layers,
  FileText,
  Plus,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  FolderGit2,
  ExternalLink
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import projectService from '../services/projectService';
import dashboardService from '../services/dashboardService';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New Project Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    domain: 'technology',
    status: 'active',
    keywords: '',
    gap_score: 65,
    gap_summary: '',
  });
  const [creating, setCreating] = useState(false);

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
      setProjects(projectsRes.results || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load intelligence dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        ...newProject,
        keywords: newProject.keywords
          ? newProject.keywords.split(',').map((k) => k.trim())
          : [],
        gap_score: parseFloat(newProject.gap_score) || null,
      };
      await projectService.createProject(payload);
      setIsModalOpen(false);
      setNewProject({
        title: '',
        description: '',
        domain: 'technology',
        status: 'active',
        keywords: '',
        gap_score: 65,
        gap_summary: '',
      });
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Failed to initialize research project. Please verify fields.');
    } finally {
      setCreating(false);
    }
  };

  // Recharts visual gap telemetry data
  const gapDistributionData = [
    { domain: 'Technology', gapAvg: 78, sources: 34 },
    { domain: 'Healthcare', gapAvg: 69, sources: 52 },
    { domain: 'Finance', gapAvg: 54, sources: 28 },
    { domain: 'Science', gapAvg: 83, sources: 45 },
    { domain: 'Environment', gapAvg: 62, sources: 19 },
    { domain: 'Social', gapAvg: 48, sources: 24 },
  ];

  const literatureProgressionData = [
    { month: 'Jun', publishedAnswers: 120, missingGapsDetected: 28 },
    { month: 'Jul', publishedAnswers: 145, missingGapsDetected: 39 },
    { month: 'Aug', publishedAnswers: 180, missingGapsDetected: 52 },
    { month: 'Sep', publishedAnswers: 210, missingGapsDetected: 74 },
    { month: 'Oct', publishedAnswers: 260, missingGapsDetected: 98 },
  ];

  if (loading) {
    return <LoadingSpinner size="lg" message="Synthesizing negative space telemetry..." />;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#38BDF8]">
              Negative Space Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#F8FAFC] tracking-tight">
            Research Intelligence Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time map of scientific consensus, uncharted hypotheses, and literature deficits.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            New Research Project
          </Button>
        </div>
      </div>

      {/* Top 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverEffect className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Projects</span>
            <div className="p-2 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8]">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#F8FAFC]">
              {stats?.projects?.total ?? projects.length}
            </span>
            <span className="text-xs text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> active
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats?.projects?.active ?? 0} active investigations
          </p>
        </Card>

        <Card hoverEffect className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Sources Ingested</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#F8FAFC]">
              {stats?.sources ?? 0}
            </span>
            <span className="text-xs text-slate-400">papers & sets</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Cross-domain publications indexed</p>
        </Card>

        <Card hoverEffect className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Gap Analyses</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#F8FAFC]">
              {stats?.analyses ?? 0}
            </span>
            <span className="text-xs text-emerald-400 font-medium">runs</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Negative space scans triggered</p>
        </Card>

        <Card hoverEffect className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Synthesized Reports</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#F8FAFC]">
              {stats?.reports ?? 0}
            </span>
            <span className="text-xs text-slate-400">published</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Ready for peer dissemination</p>
        </Card>
      </div>

      {/* Visual Analytics Grid with Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Literature Expansion vs Discovered Gap Deficits */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-sm">Consensus Expansion vs Missing Gap Deficits</CardTitle>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Observed published literature vs undetected negative-space boundaries
              </p>
            </div>
            <Badge variant="primary" size="sm">Indexed Trend</Badge>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={literatureProgressionData}>
                <defs>
                  <linearGradient id="colorPublished" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorGaps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818CF8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#818CF8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#172235',
                    border: '1px solid #1E293B',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#F8FAFC'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="publishedAnswers"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPublished)"
                  name="Answers Published"
                />
                <Area
                  type="monotone"
                  dataKey="missingGapsDetected"
                  stroke="#818CF8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorGaps)"
                  name="Identified Gaps"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Domain Severity Gap Scores */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-sm">Research Gap Severity by Domain</CardTitle>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Relative deficit score across active scientific categories (0-100)
              </p>
            </div>
            <Badge variant="purple" size="sm">Deficit Matrix</Badge>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gapDistributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="domain" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#172235',
                    border: '1px solid #1E293B',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#F8FAFC'
                  }}
                />
                <Bar dataKey="gapAvg" fill="#38BDF8" radius={[4, 4, 0, 0]} name="Average Gap Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Active Research Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#F8FAFC]">Active Research Projects</h2>
            <p className="text-xs text-slate-400">
              Core investigations tracked by your intelligence cluster
            </p>
          </div>
          <Link
            to="/projects"
            className="text-xs font-semibold text-[#38BDF8] hover:text-[#0EA5E9] flex items-center gap-1"
          >
            View All Projects <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {projects.length === 0 ? (
          <EmptyState
            title="No research projects yet"
            description="Initiate your first investigation to map uncharted research frontiers."
            actionLabel="Create Project"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 6).map((project) => (
              <Card key={project.id} hoverEffect className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Badge variant="primary" size="sm" className="capitalize">
                      {project.domain}
                    </Badge>
                    <Badge
                      variant={project.status === 'active' ? 'success' : 'default'}
                      size="sm"
                      dot
                      className="capitalize"
                    >
                      {project.status}
                    </Badge>
                  </div>

                  <Link to={`/projects/${project.id}`}>
                    <h3 className="text-sm font-bold text-[#F8FAFC] hover:text-[#38BDF8] transition-colors line-clamp-2 mb-2">
                      {project.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {project.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#1E293B] space-y-3">
                  {/* Gap Score Gauge */}
                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="text-slate-400 font-medium">Research Gap Deficit</span>
                      <span className="font-bold text-[#38BDF8]">
                        {project.gap_score ? `${project.gap_score}%` : 'Pending'}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0B1120] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-[#38BDF8] rounded-full"
                        style={{ width: `${project.gap_score || 20}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{project.sources_count || 0} Sources</span>
                    <Link
                      to={`/projects/${project.id}`}
                      className="text-[#38BDF8] hover:underline flex items-center gap-1 font-semibold"
                    >
                      Inspect <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initialize Research Project"
        description="Set up your investigation boundary for literature intelligence and gap detection."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <Input
            label="Project Title"
            placeholder="e.g., Unresolved Latency in Multi-Agent Reasoning Chains"
            value={newProject.title}
            onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Research Objective & Hypothesis <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              className="w-full bg-[#0B1120] text-[#F8FAFC] border border-[#1E293B] rounded-lg p-3 text-sm focus:outline-none focus:border-[#38BDF8] placeholder:text-slate-500"
              placeholder="Outline the core thesis, expected negative-space anomalies, or targeted literature boundary..."
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Domain
              </label>
              <select
                className="w-full bg-[#0B1120] text-[#F8FAFC] border border-[#1E293B] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#38BDF8]"
                value={newProject.domain}
                onChange={(e) => setNewProject({ ...newProject, domain: e.target.value })}
              >
                <option value="technology">Technology & AI</option>
                <option value="healthcare">Healthcare & Medicine</option>
                <option value="science">Natural Sciences</option>
                <option value="finance">Finance & Economics</option>
                <option value="environment">Environmental Science</option>
                <option value="social">Social Sciences</option>
                <option value="other">Other</option>
              </select>
            </div>

            <Input
              label="Keywords (comma-separated)"
              placeholder="agents, consensus, latency"
              value={newProject.keywords}
              onChange={(e) => setNewProject({ ...newProject, keywords: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Preliminary Gap Summary
            </label>
            <textarea
              rows={2}
              className="w-full bg-[#0B1120] text-[#F8FAFC] border border-[#1E293B] rounded-lg p-3 text-sm focus:outline-none focus:border-[#38BDF8] placeholder:text-slate-500"
              placeholder="Identify where current publications fail to address the core problem..."
              value={newProject.gap_summary}
              onChange={(e) => setNewProject({ ...newProject, gap_summary: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E293B]">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={creating}
            >
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
