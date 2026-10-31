import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ExternalLink,
  BookOpen,
  Pin,
  Calendar,
  User,
  Sparkles
} from 'lucide-react';
import projectService from '../services/projectService';
import { Card } from '../components/ui/Card';
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
      const [projData, sourcesData, notesData] = await Promise.all([
        projectService.getProject(id),
        projectService.getProjectSources(id),
        projectService.getProjectNotes(id),
      ]);
      setProject(projData);
      setSources(sourcesData.results || sourcesData || []);
      setNotes(notesData.results || notesData || []);
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
      alert('Failed to add source.');
    } finally {
      setSubmittingSource(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this research project?')) return;
    try {
      await projectService.deleteProject(id);
      navigate('/projects');
    } catch (err) {
      console.error(err);
      alert('Failed to delete project.');
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading project..." />;
  }

  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        description="The requested project does not exist."
        actionLabel="Back to Projects"
        onAction={() => navigate('/projects')}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-[#38BDF8] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>
        <Button
          variant="danger"
          size="sm"
          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          onClick={handleDeleteProject}
        >
          Delete
        </Button>
      </div>

      {/* Main Project Header */}
      <Card className="p-6 md:p-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#38BDF8] capitalize">
              {project.domain}
            </span>
            <span className="text-slate-500">•</span>
            <Badge
              variant={project.status === 'active' ? 'success' : 'default'}
              size="sm"
              dot
              className="capitalize"
            >
              {project.status}
            </Badge>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-[#F8FAFC]">
            {project.title}
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            {project.description}
          </p>

          {/* Gap Highlight if present */}
          {project.gap_summary && (
            <div className="p-4 rounded-xl bg-[#0B1120] border border-[#1E293B] flex items-start gap-3 mt-4">
              <Sparkles className="w-4 h-4 text-[#38BDF8] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[#38BDF8]">
                  Identified Research Gap
                </p>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  {project.gap_summary}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#38BDF8]" />
              Lead: <strong className="text-slate-200">{project.owner_name}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Updated {new Date(project.updated_at).toLocaleDateString()}
            </span>
            {project.gap_score && (
              <span className="text-[#38BDF8] font-semibold">
                Gap Deficit: {project.gap_score}%
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Clean Navigation Tabs */}
      <div className="border-b border-[#1E293B]/60 flex items-center gap-6 text-sm">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 font-medium transition-colors relative ${
            activeTab === 'overview'
              ? 'text-[#38BDF8] font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Overview
          {activeTab === 'overview' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#38BDF8]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          className={`pb-3 font-medium transition-colors relative flex items-center gap-1.5 ${
            activeTab === 'sources'
              ? 'text-[#38BDF8] font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Sources ({sources.length})
          {activeTab === 'sources' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#38BDF8]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`pb-3 font-medium transition-colors relative flex items-center gap-1.5 ${
            activeTab === 'notes'
              ? 'text-[#38BDF8] font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Notes ({notes.length})
          {activeTab === 'notes' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#38BDF8]" />
          )}
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-[#F8FAFC] mb-2">Keywords & Tags</h3>
            {project.keywords && project.keywords.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {project.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-[#0B1120] text-xs text-slate-300 border border-[#1E293B]"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No keywords specified.</p>
            )}
          </Card>
        </div>
      )}

      {/* Tab 2: Sources */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Literature, papers, and datasets attached to this investigation.
            </p>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsSourceModalOpen(true)}
            >
              Add Source
            </Button>
          </div>

          {sources.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No sources added yet"
              description="Attach academic papers or datasets to benchmark your findings."
              actionLabel="Add Source"
              onAction={() => setIsSourceModalOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {sources.map((source) => (
                <Card key={source.id} className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#38BDF8] uppercase tracking-wider">
                          {source.source_type}
                        </span>
                        {source.publication_year && (
                          <span className="text-xs text-slate-400">
                            • {source.publication_year}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-semibold text-[#F8FAFC]">
                        {source.title}
                      </h4>

                      {source.authors && source.authors.length > 0 && (
                        <p className="text-xs text-slate-400">
                          {source.authors.join(', ')}
                        </p>
                      )}

                      {source.abstract && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {source.abstract}
                        </p>
                      )}
                    </div>

                    {source.doi && (
                      <a
                        href={`https://doi.org/${source.doi}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#38BDF8] hover:underline"
                      >
                        DOI <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Observations and anomaly notes for this project.
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
              title="No notes recorded"
              description="Record any questions or unexpected findings as you research."
              actionLabel="Add Note"
              onAction={() => setIsNoteModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map((note) => (
                <Card key={note.id} className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-1.5">
                      {note.is_pinned && <Pin className="w-3.5 h-3.5 text-[#38BDF8] fill-[#38BDF8]" />}
                      {note.title}
                    </h4>
                    <span className="text-[10px] text-slate-500">
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {note.content}
                  </p>
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
        title="Add Source"
        description="Attach an academic paper or publication."
      >
        <form onSubmit={handleCreateSource} className="space-y-4">
          <Input
            label="Title"
            placeholder="Paper or dataset title"
            value={newSource.title}
            onChange={(e) => setNewSource({ ...newSource, title: e.target.value })}
            required
          />
          <Input
            label="Authors"
            placeholder="Author names, separated by comma"
            value={newSource.authors}
            onChange={(e) => setNewSource({ ...newSource, authors: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Publication Year"
              type="number"
              value={newSource.publication_year}
              onChange={(e) => setNewSource({ ...newSource, publication_year: e.target.value })}
            />
            <Input
              label="DOI"
              placeholder="10.1145/..."
              value={newSource.doi}
              onChange={(e) => setNewSource({ ...newSource, doi: e.target.value })}
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
        title="Add Note"
        description="Write an observation or literature note."
      >
        <form onSubmit={handleCreateNote} className="space-y-4">
          <Input
            label="Title"
            placeholder="Note title"
            value={newNote.title}
            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            required
          />
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Content <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              className="w-full bg-[#0B1120] text-[#F8FAFC] border border-[#1E293B] rounded-lg p-3 text-xs focus:outline-none focus:border-[#38BDF8]"
              placeholder="Type your notes..."
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              required
            />
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
