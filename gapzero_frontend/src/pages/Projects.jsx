import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  ArrowRight
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
  }, [selectedDomain]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedDomain !== 'all') params.domain = selectedDomain;
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
      alert('Error creating project.');
    } finally {
      setCreating(false);
    }
  };

  const domains = [
    { label: 'All', value: 'all' },
    { label: 'Technology', value: 'technology' },
    { label: 'Healthcare', value: 'healthcare' },
    { label: 'Science', value: 'science' },
    { label: 'Finance', value: 'finance' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E2022]">Research Projects</h1>
          <p className="text-xs text-[#4A4D55] mt-1">
            Browse and manage your active research investigations and findings.
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

      {/* Clean Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {domains.map((d) => (
            <button
              key={d.value}
              onClick={() => setSelectedDomain(d.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedDomain === d.value
                  ? 'bg-black text-white border border-black shadow-2xs font-semibold'
                  : 'text-gray-800 hover:text-black bg-[#F8F9FA] border border-[#E5E7EB]'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white text-xs text-[#1E2022] placeholder:text-[#4A4D55]/60 rounded-lg pl-8 pr-3 py-2 border border-[#E5E7EB] focus:outline-none focus:border-black"
          />
        </form>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <LoadingSpinner size="lg" message="Loading projects..." />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects found"
          description="Create your first research project to get started."
          actionLabel="New Project"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <Card key={project.id} hoverEffect className="p-5 flex flex-col justify-between hover:border-black transition-all">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-black uppercase bg-[#F3F4F6] px-2.5 py-0.5 rounded-full border border-gray-200">
                    {project.domain}
                  </span>
                  <Badge
                    variant={project.status === 'active' ? 'dark' : 'default'}
                    size="sm"
                    dot
                    className="capitalize font-mono"
                  >
                    {project.status}
                  </Badge>
                </div>

                <Link to={`/projects/${project.id}`}>
                  <h3 className="text-sm font-bold text-[#1E2022] hover:text-black transition-colors line-clamp-2 mb-2">
                    {project.title}
                  </h3>
                </Link>

                <p className="text-xs text-[#4A4D55] line-clamp-3 leading-relaxed mb-4">
                  {project.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#4A4D55]">
                <span className="font-mono font-bold text-black bg-[#F3F4F6] px-2.5 py-0.5 rounded-md border border-gray-200">
                  {project.gap_score ? `${project.gap_score}% Deficit` : 'Pending'}
                </span>
                <Link
                  to={`/projects/${project.id}`}
                  className="text-black hover:underline font-bold flex items-center gap-1"
                >
                  View Details <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Start Research Project"
        description="Set up your topic and key research objectives."
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
            <label className="block text-xs font-semibold text-[#1E2022] mb-1.5">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              className="w-full bg-white text-[#1E2022] border border-[#E5E7EB] rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6] placeholder:text-[#4A4D55]/60"
              placeholder="What questions or hypotheses are you looking to answer?"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2022] mb-1.5">
                Domain
              </label>
              <select
                className="w-full bg-white text-[#1E2022] border border-[#E5E7EB] rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6]"
                value={newProject.domain}
                onChange={(e) => setNewProject({ ...newProject, domain: e.target.value })}
              >
                <option value="technology">Technology & AI</option>
                <option value="healthcare">Healthcare & Medicine</option>
                <option value="science">Natural Sciences</option>
                <option value="finance">Finance</option>
                <option value="other">Other</option>
              </select>
            </div>

            <Input
              label="Keywords"
              placeholder="agents, consensus"
              value={newProject.keywords}
              onChange={(e) => setNewProject({ ...newProject, keywords: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
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

export default Projects;
