import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Layers,
  StickyNote,
  Plus,
  Trash2,
  ExternalLink,
  BookOpen,
  Pin,
  Calendar,
  User,
  Activity,
  AlertCircle
} from 'lucide-react';
import projectService from '../services/projectService';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

export const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [sources, setSources] = useState([]);
  const [notes, setNotes] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '', is_pinned: false });
  const [submittingNote, setSubmittingNote] = useState(false);

  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [newSource, setNewSource] = useState({
    title: '',
    authors: '',
    source_type: 'paper',
    journal: '',
    publication_year: new Date().getFullYear(),
    doi: '',
    url: '',
    abstract: '',
  });
  const [submittingSource, setSubmittingSource] = useState(false);

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const [projData, sourcesData, notesData, analysesData] = await Promise.all([
        projectService.getProject(id),
        projectService.getProjectSources(id),
        projectService.getProjectNotes(id),
        projectService.getProjectAnalyses(id),
      ]);
      setProject(projData);
      setSources(sourcesData.results || sourcesData || []);
      setNotes(notesData.results || notesData || []);
      setAnalyses(analysesData.results || analysesData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    setSubmittingNote(true);
    try {
      await projectService.createProjectNote(id, newNote);
      setIsNoteModalOpen(false);
      setNewNote({ title: '', content: '', is_pinned: false });
      const notesRes = await projectService.getProjectNotes(id);
      setNotes(notesRes.results || notesRes || []);
    } catch (err) {
      console.error(err);
      alert('Failed to save note.');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleCreateSource = async (e) => {
    e.preventDefault();
    setSubmittingSource(true);
    try {
      const payload = {
        ...newSource,
        project: parseInt(id),
        authors: newSource.authors
          ? newSource.authors.split(',').map((a) => a.trim())
          : [],
        publication_year: parseInt(newSource.publication_year) || null,
      };
      await projectService.createProjectSource(payload);
      setIsSourceModalOpen(false);
      setNewSource({
        title: '',
        authors: '',
        source_type: 'paper',
        journal: '',
        publication_year: new Date().getFullYear(),
        doi: '',
        url: '',
        abstract: '',
      });
      const sourcesRes = await projectService.getProjectSources(id);
      setSources(sourcesRes.results || sourcesRes || []);
    } catch (err) {
      console.error(err);
      alert('Failed to register literature source.');
    } finally {
      setSubmittingSource(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this research project? This cannot be undone.')) {
      return;
    }
    try {
      await projectService.deleteProject(id);
      navigate('/projects');
    } catch (err) {
      console.error(err);
      alert('Failed to delete project. You might not be the owner.');
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading research investigation..." />;
  }

  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        description="The requested research project does not exist or you lack access permissions."
        actionLabel="Back to Projects"
        onAction={() => navigate('/projects')}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-[#38BDF8] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>
        <Button
          variant="danger"
          size="sm"
          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          onClick={handleDeleteProject}
        >
          Delete Project
        </Button>
      </div>

      {/* Main Project Card Header */}
      <Card className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="primary" size="md" className="capitalize">
                {project.domain}
              </Badge>
              <Badge
                variant={project.status === 'active' ? 'success' : 'default'}
                size="md"
                dot
                className="capitalize"
              >
                {project.status}
              </Badge>
              {project.is_public && (
                <Badge variant="purple" size="md">
                  Public Frontier
                </Badge>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-[#F8FAFC] tracking-tight">
              {project.title}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
              {project.description}
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#38BDF8]" />
                Lead: <strong className="text-slate-200">{project.owner_name}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                Updated {new Date(project.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Gap Score Gauge Side Box */}
          <div className="w-full md:w-64 p-5 rounded-xl bg-[#0B1120] border border-[#1E293B] flex-shrink-0 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" /> Negative Space Deficit
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-[#38BDF8]">
                  {project.gap_score ? `${project.gap_score}%` : 'N/A'}
                </span>
                <span className="text-xs text-slate-400">deficit index</span>
              </div>
              <div className="w-full h-2 bg-[#172235] rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-[#38BDF8] rounded-full"
                  style={{ width: `${project.gap_score || 20}%` }}
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
              Indicates the fraction of critical cross-study questions currently missing from literature.
            </p>
          </div>
        </div>

        {/* Negative Space Gap Summary Callout */}
        {project.gap_summary && (
          <div className="mt-6 p-4 rounded-xl bg-[#38BDF8]/5 border border-[#38BDF8]/20 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#38BDF8] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#38BDF8]">
                Negative Space Hypothesis
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {project.gap_summary}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Navigation Tabs */}
      <div className="border-b border-[#1E293B] flex items-center gap-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-semibold transition-colors relative ${
            activeTab === 'overview'
              ? 'text-[#38BDF8]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Overview & Telemetry
          {activeTab === 'overview' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#38BDF8]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          className={`pb-3 text-sm font-semibold transition-colors relative flex items-center gap-2 ${
            activeTab === 'sources'
              ? 'text-[#38BDF8]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Literature & Sources ({sources.length})
          {activeTab === 'sources' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#38BDF8]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`pb-3 text-sm font-semibold transition-colors relative flex items-center gap-2 ${
            activeTab === 'notes'
              ? 'text-[#38BDF8]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Research Notes ({notes.length})
          {activeTab === 'notes' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#38BDF8]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('analyses')}
          className={`pb-3 text-sm font-semibold transition-colors relative flex items-center gap-2 ${
            activeTab === 'analyses'
              ? 'text-[#38BDF8]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Gap Analyses ({analyses.length})
          {activeTab === 'analyses' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#38BDF8]" />
          )}
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6">
              <CardTitle className="text-base mb-3">Investigation Description</CardTitle>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {project.description}
              </p>
            </Card>

            <Card className="p-6">
              <CardTitle className="text-base mb-3">Frontier Keywords</CardTitle>
              {project.keywords && project.keywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {project.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-lg bg-[#0B1120] text-xs font-medium text-[#38BDF8] border border-[#1E293B]"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No keywords specified yet.</p>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-5">
              <CardTitle className="text-sm mb-4">Project Architecture</CardTitle>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-[#1E293B]">
                  <span className="text-slate-400">Project ID</span>
                  <span className="font-mono text-slate-200">#GP-{project.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1E293B]">
                  <span className="text-slate-400">Owner</span>
                  <span className="font-semibold text-slate-200">{project.owner_name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1E293B]">
                  <span className="text-slate-400">Domain</span>
                  <span className="capitalize text-slate-200">{project.domain}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#1E293B]">
                  <span className="text-slate-400">Sources Ingested</span>
                  <span className="text-[#38BDF8] font-bold">{sources.length}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Registered Notes</span>
                  <span className="text-slate-200">{notes.length}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Sources & Literature */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Published papers, clinical reports, and datasets indexed for negative-space triangulation.
            </p>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsSourceModalOpen(true)}
            >
              Add Literature Source
            </Button>
          </div>

          {sources.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No literature sources attached"
              description="Register academic papers or datasets to begin mapping literature boundaries."
              actionLabel="Add First Source"
              onAction={() => setIsSourceModalOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {sources.map((source) => (
                <Card key={source.id} className="p-5">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="primary" size="sm" className="uppercase text-[10px]">
                          {source.source_type}
                        </Badge>
                        <Badge variant="default" size="sm">
                          {source.status}
                        </Badge>
                        {source.publication_year && (
                          <span className="text-xs text-slate-400 font-mono">
                            ({source.publication_year})
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-[#F8FAFC]">
                        {source.title}
                      </h4>

                      {source.authors && source.authors.length > 0 && (
                        <p className="text-xs text-slate-400">
                          Authors: <span className="text-slate-300">{source.authors.join(', ')}</span>
                        </p>
                      )}

                      {source.journal && (
                        <p className="text-xs text-slate-400 italic">
                          Published in: {source.journal}
                        </p>
                      )}

                      {source.abstract && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {source.abstract}
                        </p>
                      )}
                    </div>

                    {source.doi && (
                      <div className="flex-shrink-0">
                        <a
                          href={`https://doi.org/${source.doi}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1120] text-xs font-medium text-[#38BDF8] border border-[#1E293B] hover:border-[#38BDF8]/40"
                        >
                          DOI: {source.doi} <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Research Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Observations, literature discrepancies, and hypotheses noted during investigation.
            </p>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsNoteModalOpen(true)}
            >
              Add Note
            </Button>
          </div>

          {notes.length === 0 ? (
            <EmptyState
              icon={StickyNote}
              title="No research notes yet"
              description="Record experimental anomalies, contradictory findings, or literature blindspots."
              actionLabel="Create Note"
              onAction={() => setIsNoteModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map((note) => (
                <Card key={note.id} className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-1.5">
                        {note.is_pinned && <Pin className="w-3.5 h-3.5 text-[#38BDF8] fill-[#38BDF8]" />}
                        {note.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                      {note.content}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#1E293B] text-[11px] text-slate-500">
                    Recorded by {note.author_name}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Gap Analyses */}
      {activeTab === 'analyses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Algorithmic gap discovery runs executed on this project.
            </p>
          </div>

          {analyses.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No gap analyses recorded"
              description="Trigger literature scans to map contradictory statements and unaddressed hypotheses."
            />
          ) : (
            <div className="space-y-3">
              {analyses.map((analysis) => (
                <Card key={analysis.id} className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant="primary" size="sm" className="uppercase text-[10px]">
                          {analysis.analysis_type}
                        </Badge>
                        <Badge
                          variant={analysis.status === 'completed' ? 'success' : 'default'}
                          size="sm"
                        >
                          {analysis.status}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-bold text-[#F8FAFC]">
                        {analysis.title}
                      </h4>
                      {analysis.results?.unaddressed_hypotheses && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-semibold text-slate-300">
                            Unaddressed Hypotheses Discovered:
                          </p>
                          <ul className="list-disc pl-5 text-xs text-slate-400 space-y-0.5">
                            {analysis.results.unaddressed_hypotheses.map((h, i) => (
                              <li key={i}>{h}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(analysis.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Source Modal */}
      <Modal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        title="Add Literature Source"
        description="Index an academic paper, book, or dataset into this project's boundary."
      >
        <form onSubmit={handleCreateSource} className="space-y-4">
          <Input
            label="Title"
            placeholder="e.g., Attention Is All You Need"
            value={newSource.title}
            onChange={(e) => setNewSource({ ...newSource, title: e.target.value })}
            required
          />
          <Input
            label="Authors (comma-separated)"
            placeholder="Ashish Vaswani, Noam Shazeer, Niki Parmar..."
            value={newSource.authors}
            onChange={(e) => setNewSource({ ...newSource, authors: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Type
              </label>
              <select
                className="w-full bg-[#0B1120] text-[#F8FAFC] border border-[#1E293B] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#38BDF8]"
                value={newSource.source_type}
                onChange={(e) => setNewSource({ ...newSource, source_type: e.target.value })}
              >
                <option value="paper">Academic Paper</option>
                <option value="article">Article</option>
                <option value="dataset">Dataset</option>
                <option value="book">Book</option>
                <option value="report">Report</option>
              </select>
            </div>
            <Input
              label="Publication Year"
              type="number"
              value={newSource.publication_year}
              onChange={(e) => setNewSource({ ...newSource, publication_year: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Journal / Conference"
              placeholder="NeurIPS, Nature, etc."
              value={newSource.journal}
              onChange={(e) => setNewSource({ ...newSource, journal: e.target.value })}
            />
            <Input
              label="DOI"
              placeholder="10.1145/..."
              value={newSource.doi}
              onChange={(e) => setNewSource({ ...newSource, doi: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Abstract
            </label>
            <textarea
              rows={3}
              className="w-full bg-[#0B1120] text-[#F8FAFC] border border-[#1E293B] rounded-lg p-3 text-sm focus:outline-none focus:border-[#38BDF8] placeholder:text-slate-500"
              placeholder="Paper abstract..."
              value={newSource.abstract}
              onChange={(e) => setNewSource({ ...newSource, abstract: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E293B]">
            <Button type="button" variant="ghost" onClick={() => setIsSourceModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submittingSource}>
              Save Source
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Note Modal */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title="Add Research Note"
        description="Jot down a critical observation or negative space deficit."
      >
        <form onSubmit={handleCreateNote} className="space-y-4">
          <Input
            label="Note Title"
            placeholder="e.g., Unaddressed batch discrepancy in experiment 4"
            value={newNote.title}
            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            required
          />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Content <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              className="w-full bg-[#0B1120] text-[#F8FAFC] border border-[#1E293B] rounded-lg p-3 text-sm focus:outline-none focus:border-[#38BDF8] placeholder:text-slate-500"
              placeholder="Detail the anomaly, literature gap, or hypothesis..."
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pinNote"
              checked={newNote.is_pinned}
              onChange={(e) => setNewNote({ ...newNote, is_pinned: e.target.checked })}
              className="w-4 h-4 rounded bg-[#0B1120] border-[#1E293B] text-[#38BDF8] focus:ring-[#38BDF8]"
            />
            <label htmlFor="pinNote" className="text-xs text-slate-300">
              Pin this note to top of project
            </label>
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E293B]">
            <Button type="button" variant="ghost" onClick={() => setIsNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submittingNote}>
              Save Note
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectDetail;
