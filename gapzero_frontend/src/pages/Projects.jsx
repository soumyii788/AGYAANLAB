import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderGit2,
  Plus,
  Search,
  Filter,
  Layers,
  Sparkles,
  Calendar,
  ExternalLink,
  Tag
} from 'lucide-react';
import projectService from '../services/projectService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

export const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal
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
    fetchProjects();
  }, [selectedDomain, selectedStatus]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedDomain !== 'all') params.domain = selectedDomain;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (searchTerm) params.search = searchTerm;

      const response = await projectService.getProjects(params);
      setProjects(response.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProjects();
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
      fetchProjects();
    } catch (err) {
      console.error(err);
      alert('Error creating project. Please check input parameters.');
    } finally {
      setCreating(false);
    }
  };

  const domains = [
    { label: 'All Domains', value: 'all' },
    { label: 'Technology', value: 'technology' },
    { label: 'Healthcare', value: 'healthcare' },
    { label: 'Science', value: 'science' },
    { label: 'Finance', value: 'finance' },
    { label: 'Environment', value: 'environment' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#F8FAFC]">Research Projects</h1>
          <p className="text-xs text-slate-400 mt-1">
            Explore, create, and manage ongoing scientific investigations and negative-space hypotheses.
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

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Domain tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {domains.map((d) => (
              <button
                key={d.value}
                onClick={() => setSelectedDomain(d.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedDomain === d.value
                    ? 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30'
                    : 'text-slate-400 hover:text-white hover:bg-[#0B1120]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Search form */}
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0B1120] text-xs text-slate-200 placeholder:text-slate-500 rounded-lg pl-8 pr-3 py-2 border border-[#1E293B] focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#0B1120] text-xs text-slate-300 border border-[#1E293B] rounded-lg px-2.5 py-2 focus:outline-none focus:border-[#38BDF8]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
            </select>
          </form>
        </div>
      </Card>

      {/* Projects Grid */}
      {loading ? (
        <LoadingSpinner size="lg" message="Loading research projects..." />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No research projects matching filters"
          description="Try broadening your search query or create a new investigation."
          actionLabel="Create Project"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <Card key={project.id} hoverEffect className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
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
                  <h3 className="text-base font-bold text-[#F8FAFC] hover:text-[#38BDF8] transition-colors line-clamp-2 mb-2">
                    {project.title}
                  </h3>
                </Link>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                  {project.description}
                </p>

                {/* Keywords tags */}
                {project.keywords && project.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {project.keywords.slice(0, 3).map((kw, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-[#0B1120] text-slate-400 border border-[#1E293B]"
                      >
                        #{kw}
                      </span>
                    ))}
                    {project.keywords.length > 3 && (
                      <span className="text-[10px] text-slate-500 self-center">
                        +{project.keywords.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Footer info */}
              <div className="pt-4 border-t border-[#1E293B] space-y-3">
                {/* Gap score meter */}
                <div>
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#38BDF8]" /> Gap Deficit Index
                    </span>
                    <span className="font-bold text-[#38BDF8]">
                      {project.gap_score ? `${project.gap_score}%` : 'Unscored'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0B1120] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-[#38BDF8] rounded-full"
                      style={{ width: `${project.gap_score || 15}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3" /> {project.sources_count || 0} sources
                  </span>
                  <Link
                    to={`/projects/${project.id}`}
                    className="text-[#38BDF8] hover:underline flex items-center gap-1 font-semibold"
                  >
                    Open Project <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Research Project"
        description="Establish the scope for automated literature intelligence and negative space detection."
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
              Description & Objective <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              className="w-full bg-[#0B1120] text-[#F8FAFC] border border-[#1E293B] rounded-lg p-3 text-sm focus:outline-none focus:border-[#38BDF8] placeholder:text-slate-500"
              placeholder="Outline what literature you will scan and what unanswered hypotheses you suspect are missing..."
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
              Negative Space Gap Summary
            </label>
            <textarea
              rows={2}
              className="w-full bg-[#0B1120] text-[#F8FAFC] border border-[#1E293B] rounded-lg p-3 text-sm focus:outline-none focus:border-[#38BDF8] placeholder:text-slate-500"
              placeholder="What questions does existing literature deliberately avoid or leave unanswered?"
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

export default Projects;
