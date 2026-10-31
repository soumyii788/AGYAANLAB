import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  ArrowRight,
  FolderGit2,
  Layers,
  Sparkles,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import projectService from '../services/projectService';
import dashboardService from '../services/dashboardService';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Project Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    domain: 'technology',
    status: 'active',
    keywords: '',
    gap_score: 70,
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
        gap_score: 70,
        gap_summary: '',
      });
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Failed to initialize research project.');
    } finally {
      setCreating(false);
    }
  };

  const chartData = [
    { month: 'Jun', published: 110, gaps: 25 },
    { month: 'Jul', published: 140, gaps: 38 },
    { month: 'Aug', published: 175, gaps: 55 },
    { month: 'Sep', published: 215, gaps: 72 },
    { month: 'Oct', published: 260, gaps: 94 },
  ];

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Friendly, uncluttered Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC]">
            Welcome, {user?.first_name || user?.username || 'Researcher'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Discover unexplored gaps and unaddressed hypotheses across your projects.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          New Project
        </Button>
      </div>

      {/* 3 Clean, spacious metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-6">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Research Projects</span>
            <FolderGit2 className="w-4 h-4 text-[#38BDF8]" />
          </div>
          <div className="text-3xl font-extrabold text-[#F8FAFC]">
            {stats?.projects?.total ?? projects.length}
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            {stats?.projects?.active ?? 0} actively tracked
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Indexed Sources</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-[#F8FAFC]">
            {stats?.sources ?? 0}
          </div>
          <p className="text-xs text-slate-400 mt-1.5">Papers, preprints & datasets</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Negative Space Scans</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-[#F8FAFC]">
            {stats?.analyses ?? 0}
          </div>
          <p className="text-xs text-slate-400 mt-1.5">Hypotheses mapped</p>
        </Card>
      </div>

      {/* Clean Single Analytics Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-[#F8FAFC]">Literature Growth vs. Unaddressed Gaps</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparison of published literature papers vs undetected gap findings over time
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" />
              <span className="text-slate-300">Published Papers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#818CF8]" />
              <span className="text-slate-300">Identified Gaps</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradPublished" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gradGaps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818CF8" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#818CF8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#172235',
                  border: '1px solid #1E293B',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#F8FAFC'
                }}
              />
              <Area
                type="monotone"
                dataKey="published"
                stroke="#38BDF8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#gradPublished)"
                name="Published Papers"
              />
              <Area
                type="monotone"
                dataKey="gaps"
                stroke="#818CF8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#gradGaps)"
                name="Identified Gaps"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Projects List with friendly spacing */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#F8FAFC]">Recent Projects</h2>
            <p className="text-xs text-slate-400">Your ongoing research investigations</p>
          </div>
          <Link
            to="/projects"
            className="text-xs font-semibold text-[#38BDF8] hover:text-[#0EA5E9] flex items-center gap-1"
          >
            All projects <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Create your first research project to begin analyzing what's missing."
            actionLabel="New Project"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.slice(0, 4).map((project) => (
              <Card key={project.id} hoverEffect className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-xs font-medium text-[#38BDF8] capitalize">
                      {project.domain}
                    </span>
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
                    <h3 className="text-base font-semibold text-[#F8FAFC] hover:text-[#38BDF8] transition-colors line-clamp-1 mb-2">
                      {project.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {project.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#1E293B]/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-slate-400">
                    <span>{project.sources_count || 0} sources</span>
                    <span>•</span>
                    <span className="text-[#38BDF8] font-semibold">
                      {project.gap_score ? `${project.gap_score}% gap` : 'Unscored'}
                    </span>
                  </div>
                  <Link
                    to={`/projects/${project.id}`}
                    className="text-[#38BDF8] hover:underline font-semibold flex items-center gap-1"
                  >
                    Open <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* New Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Start Research Project"
        description="Define the topic and questions you want to investigate."
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <Input
            label="Project Title"
            placeholder="e.g., Unresolved Latency in Multi-Agent Reasoning"
            value={newProject.title}
            onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Objective & Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              className="w-full bg-[#0B1120] text-[#F8FAFC] border border-[#1E293B] rounded-lg p-3 text-xs focus:outline-none focus:border-[#38BDF8] placeholder:text-slate-500"
              placeholder="What are you researching, and what answers or gaps are you searching for?"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Domain
              </label>
              <select
                className="w-full bg-[#0B1120] text-[#F8FAFC] border border-[#1E293B] rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#38BDF8]"
                value={newProject.domain}
                onChange={(e) => setNewProject({ ...newProject, domain: e.target.value })}
              >
                <option value="technology">Technology & AI</option>
                <option value="healthcare">Healthcare & Medicine</option>
                <option value="science">Natural Sciences</option>
                <option value="finance">Finance</option>
                <option value="environment">Environment</option>
                <option value="other">Other</option>
              </select>
            </div>

            <Input
              label="Keywords"
              placeholder="agents, reasoning, latency"
              value={newProject.keywords}
              onChange={(e) => setNewProject({ ...newProject, keywords: e.target.value })}
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
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
