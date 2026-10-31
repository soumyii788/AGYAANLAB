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
  Sparkles,
  Search,
  Download,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  FileText,
  Activity
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
  const [analyses, setAnalyses] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // AI Gap Detection State
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  // AI Report Generation State
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [copied, setCopied] = useState(false);

  // Live Literature Search Modal State
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [importingId, setImportingId] = useState(null);

  // Manual Note Modal
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '', is_pinned: false });
  const [submittingNote, setSubmittingNote] = useState(false);

  // Manual Source Modal
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
      const [projData, sourcesData, notesData, analysesData, reportsData] = await Promise.all([
        projectService.getProject(id),
        projectService.getProjectSources(id),
        projectService.getProjectNotes(id),
        projectService.getProjectAnalyses(id),
        projectService.getProjectReports(id),
      ]);
      setProject(projData);
      setSources(sourcesData.results || sourcesData || []);
      setNotes(notesData.results || notesData || []);
      setAnalyses(analysesData.results || analysesData || []);
      setReports(reportsData.results || reportsData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Run Real AI Gap Detection
  const handleRunGapAnalysis = async () => {
    setRunningAnalysis(true);
    setAnalysisError('');
    try {
      const res = await projectService.runGapAnalysis(id);
      // Refresh project and analyses list
      setProject((prev) => ({
        ...prev,
        gap_score: res.project.gap_score,
        gap_summary: res.project.gap_summary,
      }));
      const analysesRes = await projectService.getProjectAnalyses(id);
      setAnalyses(analysesRes.results || analysesRes || []);
      setActiveTab('analyses');
    } catch (err) {
      console.error(err);
      setAnalysisError(err.response?.data?.error || 'AI Gap analysis failed. Please verify API configuration.');
    } finally {
      setRunningAnalysis(false);
    }
  };

  // Run Real AI Report Generation
  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const newReport = await projectService.generateReport(id, 'full');
      setReports((prev) => [newReport, ...prev]);
      setSelectedReport(newReport);
      setActiveTab('reports');
    } catch (err) {
      console.error(err);
      alert('Failed to generate report.');
    } finally {
      setGeneratingReport(false);
    }
  };

  // Search Online Literature (OpenAlex)
  const handleSearchOnline = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await projectService.searchOnlinePapers(searchQuery);
      setSearchResults(res.results || []);
    } catch (err) {
      console.error(err);
      alert('Failed to search online literature.');
    } finally {
      setSearching(false);
    }
  };

  // 1-Click Import Paper
  const handleImportPaper = async (paper) => {
    setImportingId(paper.title);
    try {
      await projectService.importPaper(id, paper);
      const sourcesRes = await projectService.getProjectSources(id);
      setSources(sourcesRes.results || sourcesRes || []);
    } catch (err) {
      console.error(err);
      alert('Failed to import paper.');
    } finally {
      setImportingId(null);
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

  const handleCopyReport = (content) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      {/* Top back navigation & Actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4A4D55] hover:text-[#3B82F6] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
            onClick={handleRunGapAnalysis}
            isLoading={runningAnalysis}
          >
            Run AI Gap Detection
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<FileText className="w-3.5 h-3.5" />}
            onClick={handleGenerateReport}
            isLoading={generatingReport}
          >
            Generate Brief
          </Button>
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={handleDeleteProject}
          >
            Delete
          </Button>
        </div>
      </div>

      {analysisError && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{analysisError}</span>
        </div>
      )}

      {/* Main Project Header */}
      <Card className="p-6 md:p-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#3B82F6] capitalize">
              {project.domain}
            </span>
            <span className="text-[#4A4D55]">•</span>
            <Badge
              variant={project.status === 'active' ? 'success' : 'default'}
              size="sm"
              dot
              className="capitalize"
            >
              {project.status}
            </Badge>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-[#1E2022]">
            {project.title}
          </h1>

          <p className="text-sm text-[#4A4D55] leading-relaxed">
            {project.description}
          </p>

          {/* Gap Highlight */}
          {project.gap_summary && (
            <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-start gap-3 mt-4">
              <Sparkles className="w-4 h-4 text-[#3B82F6] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[#3B82F6]">
                  Negative Space Hypothesis
                </p>
                <p className="text-xs text-[#1E2022] mt-0.5 leading-relaxed">
                  {project.gap_summary}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-[#4A4D55]">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#3B82F6]" />
              Lead: <strong className="text-[#1E2022]">{project.owner_name}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#4A4D55]" />
              Updated {new Date(project.updated_at).toLocaleDateString()}
            </span>
            {project.gap_score && (
              <span className="text-[#3B82F6] font-semibold">
                Gap Deficit: {project.gap_score}%
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Clean Navigation Tabs */}
      <div className="border-b border-[#E5E7EB] flex items-center gap-6 text-sm">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 font-medium transition-colors relative ${
            activeTab === 'overview'
              ? 'text-[#3B82F6] font-semibold'
              : 'text-[#4A4D55] hover:text-[#1E2022]'
          }`}
        >
          Overview
          {activeTab === 'overview' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3B82F6]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          className={`pb-3 font-medium transition-colors relative flex items-center gap-1.5 ${
            activeTab === 'sources'
              ? 'text-[#3B82F6] font-semibold'
              : 'text-[#4A4D55] hover:text-[#1E2022]'
          }`}
        >
          Literature & Sources ({sources.length})
          {activeTab === 'sources' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3B82F6]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('analyses')}
          className={`pb-3 font-medium transition-colors relative flex items-center gap-1.5 ${
            activeTab === 'analyses'
              ? 'text-[#3B82F6] font-semibold'
              : 'text-[#4A4D55] hover:text-[#1E2022]'
          }`}
        >
          Gap Analyses ({analyses.length})
          {activeTab === 'analyses' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3B82F6]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 font-medium transition-colors relative flex items-center gap-1.5 ${
            activeTab === 'reports'
              ? 'text-[#3B82F6] font-semibold'
              : 'text-[#4A4D55] hover:text-[#1E2022]'
          }`}
        >
          Intelligence Briefs ({reports.length})
          {activeTab === 'reports' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3B82F6]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`pb-3 font-medium transition-colors relative flex items-center gap-1.5 ${
            activeTab === 'notes'
              ? 'text-[#3B82F6] font-semibold'
              : 'text-[#4A4D55] hover:text-[#1E2022]'
          }`}
        >
          Notes ({notes.length})
          {activeTab === 'notes' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3B82F6]" />
          )}
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-[#1E2022] mb-2">Keywords & Tags</h3>
            {project.keywords && project.keywords.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {project.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-[#F9F9FB] text-xs text-[#4A4D55] border border-[#E5E7EB]"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#4A4D55]">No keywords specified.</p>
            )}
          </Card>
        </div>
      )}

      {/* Tab 2: Sources */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-[#4A4D55]">
              Literature, papers, and datasets attached to this investigation.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Search className="w-3.5 h-3.5" />}
                onClick={() => {
                  setSearchQuery(project.title);
                  setIsSearchModalOpen(true);
                }}
              >
                Search Online Papers (OpenAlex)
              </Button>
              <Link to="/sources">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Ingest URL / PDF / Text
                </Button>
              </Link>
            </div>
          </div>

          {sources.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No sources added yet"
              description="Search live academic papers or add custom datasets to begin benchmarking."
              actionLabel="Search Online Papers"
              onAction={() => {
                setSearchQuery(project.title);
                setIsSearchModalOpen(true);
              }}
            />
          ) : (
            <div className="space-y-3">
              {sources.map((source) => (
                <Card key={source.id} className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#3B82F6] uppercase tracking-wider">
                          {source.source_type}
                        </span>
                        {source.publication_year && (
                          <span className="text-xs text-[#4A4D55]">
                            • {source.publication_year}
                          </span>
                        )}
                        {source.processing_status && (
                          <Badge
                            variant={
                              source.processing_status === 'completed'
                                ? 'success'
                                : source.processing_status === 'ocr_needed'
                                ? 'warning'
                                : source.processing_status === 'failed'
                                ? 'danger'
                                : 'primary'
                            }
                            size="sm"
                            dot
                          >
                            {source.processing_status === 'completed' ? 'Extracted' : source.processing_status}
                          </Badge>
                        )}
                        {source.relevance_score && (
                          <Badge variant="primary" size="sm">
                            {source.relevance_score}% Relevance
                          </Badge>
                        )}
                      </div>

                      <h4 className="text-sm font-semibold text-[#1E2022]">
                        {source.title}
                      </h4>

                      {source.error_message && (
                        <div className="text-xs p-2 rounded bg-rose-50 border border-rose-200 text-rose-800">
                          <strong>Extraction Error:</strong> {source.error_message}
                        </div>
                      )}

                      {source.authors && source.authors.length > 0 && (
                        <p className="text-xs text-[#4A4D55]">
                          {source.authors.join(', ')}
                        </p>
                      )}

                      {source.journal && (
                        <p className="text-xs text-[#4A4D55] italic">
                          Published in: {source.journal}
                        </p>
                      )}

                      {source.abstract && (
                        <p className="text-xs text-[#4A4D55] line-clamp-3 leading-relaxed mt-1">
                          {source.abstract}
                        </p>
                      )}
                    </div>

                    {source.doi && (
                      <a
                        href={`https://doi.org/${source.doi}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#3B82F6] hover:underline flex-shrink-0"
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

      {/* Tab 3: Analyses */}
      {activeTab === 'analyses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#4A4D55]">
              Real AI gap detection runs executed on this project using Groq & OpenAlex.
            </p>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              onClick={handleRunGapAnalysis}
              isLoading={runningAnalysis}
            >
              Run New Scan
            </Button>
          </div>

          {analyses.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No gap analyses recorded"
              description="Click 'Run AI Gap Detection' to scan your literature and extract missing hypotheses."
              actionLabel="Run AI Gap Detection"
              onAction={handleRunGapAnalysis}
            />
          ) : (
            <div className="space-y-4">
              {analyses.map((analysis) => {
                const res = analysis.results || {};
                return (
                  <Card key={analysis.id} className="p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-[#3B82F6] uppercase">
                            {analysis.analysis_type}
                          </span>
                          <span className="text-[#4A4D55]">•</span>
                          <span className="text-xs text-[#4A4D55]">
                            {new Date(analysis.created_at).toLocaleString()}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[#1E2022]">
                          {analysis.title}
                        </h3>
                      </div>
                      {res.gap_score !== undefined && (
                        <div className="text-right">
                          <span className="text-2xl font-black text-[#3B82F6]">
                            {res.gap_score}%
                          </span>
                          <p className="text-[10px] text-[#4A4D55] uppercase font-semibold">
                            Deficit Score
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Gap Summary */}
                    {res.gap_summary && (
                      <div className="p-3.5 rounded-lg bg-[#EFF6FF] border border-[#DBEAFE]">
                        <h4 className="text-xs font-bold text-[#3B82F6] uppercase tracking-wider mb-1">
                          Core Literature Deficit
                        </h4>
                        <p className="text-xs text-[#1E2022] leading-relaxed">
                          {res.gap_summary}
                        </p>
                      </div>
                    )}

                    {/* Unaddressed Hypotheses */}
                    {res.unaddressed_hypotheses && res.unaddressed_hypotheses.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-[#1E2022] uppercase tracking-wider mb-2">
                          Unaddressed Hypotheses (What Papers Avoid)
                        </h4>
                        <ul className="space-y-1.5">
                          {res.unaddressed_hypotheses.map((h, i) => (
                            <li key={i} className="text-xs text-[#4A4D55] flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] mt-1.5 flex-shrink-0" />
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Contradictory Findings */}
                    {res.contradictory_findings && res.contradictory_findings.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-[#1E2022] uppercase tracking-wider mb-2">
                          Contradictory / Divergent Claims in Literature
                        </h4>
                        <ul className="space-y-1.5">
                          {res.contradictory_findings.map((c, i) => (
                            <li key={i} className="text-xs text-[#4A4D55] flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommended Experiments */}
                    {res.recommended_experiments && res.recommended_experiments.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-[#1E2022] uppercase tracking-wider mb-2">
                          Recommended Actionable Frontier Experiments
                        </h4>
                        <ul className="space-y-1.5">
                          {res.recommended_experiments.map((e, i) => (
                            <li key={i} className="text-xs text-[#4A4D55] flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                              <span>{e}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#4A4D55]">
              Synthesized publication-grade research intelligence briefs.
            </p>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleGenerateReport}
              isLoading={generatingReport}
            >
              Generate New Brief
            </Button>
          </div>

          {reports.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No reports generated yet"
              description="Synthesize an executive intelligence brief from your literature sources and gap findings."
              actionLabel="Generate Brief"
              onAction={handleGenerateReport}
            />
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id} className="p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                    <div>
                      <h3 className="text-base font-bold text-[#1E2022]">
                        {report.title}
                      </h3>
                      <p className="text-xs text-[#4A4D55] mt-0.5">
                        Generated on {new Date(report.created_at).toLocaleDateString()} by {report.generated_by_name}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      onClick={() => handleCopyReport(report.content)}
                    >
                      {copied ? 'Copied' : 'Copy Markdown'}
                    </Button>
                  </div>
                  <div className="prose prose-sm max-w-none text-xs text-[#1E2022] leading-relaxed whitespace-pre-line bg-[#F9F9FB] p-5 rounded-lg border border-[#E5E7EB] font-mono">
                    {report.content}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#4A4D55]">
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
                    <h4 className="text-sm font-semibold text-[#1E2022] flex items-center gap-1.5">
                      {note.is_pinned && <Pin className="w-3.5 h-3.5 text-[#3B82F6] fill-[#3B82F6]" />}
                      {note.title}
                    </h4>
                    <span className="text-[10px] text-[#4A4D55]">
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-[#4A4D55] leading-relaxed whitespace-pre-line">
                    {note.content}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Live Online Paper Search Modal (OpenAlex) */}
      <Modal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        title="Search Live Scientific Literature (OpenAlex)"
        description="Search over 250M scholarly works, journals, and preprints. Import directly to this project."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <form onSubmit={handleSearchOnline} className="flex gap-2">
            <Input
              placeholder="e.g. quantum error mitigation zero noise extrapolation"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="primary" isLoading={searching}>
              Search
            </Button>
          </form>

          {searching ? (
            <LoadingSpinner size="md" message="Scanning OpenAlex scholarly works..." />
          ) : searchResults.length === 0 ? (
            <p className="text-xs text-[#4A4D55] text-center py-6">
              Enter any research query to fetch peer-reviewed publications and preprints.
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
              {searchResults.map((paper, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg border border-[#E5E7EB] bg-[#F9F9FB] flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[11px] mb-1">
                      <span className="font-semibold text-[#3B82F6]">
                        {paper.journal || 'Academic Article'}
                      </span>
                      <span className="text-[#4A4D55]">
                        {paper.publication_year} • {paper.cited_by_count} citations
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-[#1E2022] leading-snug">
                      {paper.title}
                    </h5>
                    {paper.authors && (
                      <p className="text-[11px] text-[#4A4D55] mt-0.5">
                        {paper.authors.join(', ')}
                      </p>
                    )}
                    {paper.abstract && (
                      <p className="text-[11px] text-[#4A4D55] line-clamp-2 mt-1 leading-relaxed">
                        {paper.abstract}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
                    {paper.doi ? (
                      <span className="text-[10px] text-[#4A4D55] font-mono">
                        DOI: {paper.doi}
                      </span>
                    ) : <span />}
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<Plus className="w-3 h-3" />}
                      onClick={() => handleImportPaper(paper)}
                      isLoading={importingId === paper.title}
                    >
                      Import to Project
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Manual Source Modal */}
      <Modal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        title="Add Custom Source"
        description="Attach an academic paper or publication manually."
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
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
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
            <label className="block text-xs font-semibold text-[#1E2022] mb-1.5 uppercase tracking-wider">
              Content <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              className="w-full bg-white text-[#1E2022] border border-[#E5E7EB] rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6]"
              placeholder="Type your notes..."
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              required
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
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
