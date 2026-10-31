import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  BookOpen,
  ExternalLink,
  Plus,
  Globe,
  FileText,
  FileEdit,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Eye,
  UploadCloud,
  FileCheck,
  CheckCircle2,
  X,
  Filter,
  Sparkles
} from 'lucide-react';
import projectService from '../services/projectService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

export const SourcesPage = () => {
  const [sources, setSources] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');

  // Ingestion Modal State
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [ingestTab, setIngestTab] = useState('url'); // 'url' | 'pdf' | 'text'
  const [targetProjectId, setTargetProjectId] = useState('');
  const [submittingIngest, setSubmittingIngest] = useState(false);
  const [ingestError, setIngestError] = useState('');

  // Form Inputs
  const [urlInput, setUrlInput] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfTitle, setPdfTitle] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');

  // OpenAlex Search Modal State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [importingTitle, setImportingTitle] = useState(null);

  // Preview Modal State
  const [previewSource, setPreviewSource] = useState(null);
  const [selectedPreviewPage, setSelectedPreviewPage] = useState(0);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Reprocess state
  const [reprocessingId, setReprocessingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sourcesRes, projectsRes] = await Promise.all([
        projectService.getAllSources(),
        projectService.getProjects(),
      ]);
      const srcList = sourcesRes.results || sourcesRes || [];
      setSources(srcList);
      const projs = projectsRes.results || projectsRes || [];
      setProjects(projs);
      if (projs.length > 0 && !targetProjectId) {
        setTargetProjectId(projs[0].id);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  // URL Ingestion Handler
  const handleIngestURL = async (e) => {
    e.preventDefault();
    setIngestError('');
    if (!urlInput.trim()) {
      setIngestError('Please enter a valid website URL.');
      return;
    }
    if (!targetProjectId) {
      setIngestError('Please select a target research project.');
      return;
    }

    setSubmittingIngest(true);
    try {
      await projectService.ingestUrl(targetProjectId, urlInput.trim());
      setUrlInput('');
      setIsIngestModalOpen(false);
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'URL ingestion failed.';
      setIngestError(msg);
      // Still refresh to show failed source record if created
      fetchData();
    } finally {
      setSubmittingIngest(false);
    }
  };

  // PDF Ingestion Handler
  const handleIngestPDF = async (e) => {
    e.preventDefault();
    setIngestError('');
    if (!pdfFile) {
      setIngestError('Please select a PDF file to upload.');
      return;
    }
    if (pdfFile.size > 15 * 1024 * 1024) {
      setIngestError('File size exceeds the 15 MB limit.');
      return;
    }
    if (!targetProjectId) {
      setIngestError('Please select a target research project.');
      return;
    }

    setSubmittingIngest(true);
    try {
      await projectService.ingestPdf(targetProjectId, pdfTitle.trim(), pdfFile);
      setPdfFile(null);
      setPdfTitle('');
      setIsIngestModalOpen(false);
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'PDF ingestion failed.';
      setIngestError(msg);
    } finally {
      setSubmittingIngest(false);
    }
  };

  // Text Ingestion Handler
  const handleIngestText = async (e) => {
    e.preventDefault();
    setIngestError('');
    if (!textContent.trim()) {
      setIngestError('Please provide the research content to ingest.');
      return;
    }
    if (!targetProjectId) {
      setIngestError('Please select a target research project.');
      return;
    }

    setSubmittingIngest(true);
    try {
      await projectService.ingestText(targetProjectId, textTitle.trim(), textContent.trim());
      setTextTitle('');
      setTextContent('');
      setIsIngestModalOpen(false);
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Text ingestion failed.';
      setIngestError(msg);
    } finally {
      setSubmittingIngest(false);
    }
  };

  // Reprocess Handler
  const handleReprocess = async (sourceId) => {
    setReprocessingId(sourceId);
    try {
      await projectService.reprocessSource(sourceId);
      await fetchData();
    } catch (err) {
      alert(`Reprocessing failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setReprocessingId(null);
    }
  };

  // Delete Handler
  const handleDeleteSource = async (sourceId) => {
    if (!window.confirm('Are you sure you want to delete this source? This action cannot be undone.')) {
      return;
    }
    try {
      await projectService.deleteSource(sourceId);
      setSources((prev) => prev.filter((s) => s.id !== sourceId));
      if (previewSource?.id === sourceId) {
        setPreviewSource(null);
      }
    } catch (err) {
      alert(`Delete failed: ${err.response?.data?.error || err.message}`);
    }
  };

  // Open Preview Modal
  const handleOpenPreview = async (source) => {
    try {
      // Fetch full source details to get extracted_pages
      const full = await projectService.getSource(source.id);
      setPreviewSource(full);
      setSelectedPreviewPage(0);
    } catch {
      setPreviewSource(source);
      setSelectedPreviewPage(0);
    }
  };

  // Online Paper Search Handler
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

  const handleImportPaper = async (paper) => {
    if (!targetProjectId) {
      alert('Please select a project to import into.');
      return;
    }
    setImportingTitle(paper.title);
    try {
      await projectService.importPaper(targetProjectId, paper);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to import paper.');
    } finally {
      setImportingTitle(null);
    }
  };

  // Filtering
  const filteredSources = sources.filter((s) => {
    if (typeFilter !== 'all' && s.source_type !== typeFilter) return false;
    if (statusFilter !== 'all' && s.processing_status !== statusFilter) return false;
    if (projectFilter !== 'all' && s.project !== parseInt(projectFilter)) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchTitle = s.title?.toLowerCase().includes(q);
      const matchUrl = s.original_url?.toLowerCase().includes(q);
      const matchText = s.extracted_text_preview?.toLowerCase().includes(q) || s.extracted_text?.toLowerCase().includes(q);
      const matchHash = s.content_hash?.toLowerCase().includes(q);
      if (!matchTitle && !matchUrl && !matchText && !matchHash) return false;
    }
    return true;
  });

  const completedCount = sources.filter((s) => s.processing_status === 'completed').length;
  const ocrNeededCount = sources.filter((s) => s.processing_status === 'ocr_needed').length;
  const failedCount = sources.filter((s) => s.processing_status === 'failed').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#1E2022] tracking-tight">Source Ingestion & Literature</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#3B82F6] border border-[#DBEAFE]">
              AGYAAN LAB
            </span>
          </div>
          <p className="text-xs text-[#4A4D55] mt-1">
            Ingest public web pages (SSRF-protected), extract multi-page PDFs via PyMuPDF, paste raw research notes, or import peer-reviewed papers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Search className="w-3.5 h-3.5" />}
            onClick={() => setIsSearchOpen(true)}
          >
            Search OpenAlex
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => {
              setIngestError('');
              setIsIngestModalOpen(true);
            }}
          >
            Ingest New Source
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-xs">
          <p className="text-[11px] font-medium text-[#4A4D55] uppercase tracking-wider">Total Sources</p>
          <p className="text-2xl font-bold text-[#1E2022] mt-1">{sources.length}</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-xs">
          <p className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">Completed / Extracted</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{completedCount}</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-xs">
          <p className="text-[11px] font-medium text-amber-700 uppercase tracking-wider">Scanned / OCR Needed</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{ocrNeededCount}</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-xs">
          <p className="text-[11px] font-medium text-rose-700 uppercase tracking-wider">Extraction Failed</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{failedCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white border border-[#E5E7EB]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#4A4D55] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by title, URL, SHA-256 hash, or text snippet..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F9F9FB] border border-[#E5E7EB] rounded-lg text-[#1E2022] placeholder-[#4A4D55] focus:outline-none focus:border-[#3B82F6] focus:bg-white transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs bg-[#F9F9FB] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-[#1E2022] focus:outline-none focus:border-[#3B82F6]"
            >
              <option value="all">All Types</option>
              <option value="url">Web URL</option>
              <option value="pdf">PDF Document</option>
              <option value="text">Pasted Text</option>
              <option value="paper">Academic Paper</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-[#F9F9FB] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-[#1E2022] focus:outline-none focus:border-[#3B82F6]"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="ocr_needed">OCR Needed</option>
              <option value="failed">Failed</option>
              <option value="processing">Processing</option>
            </select>

            {/* Project Filter */}
            {projects.length > 0 && (
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="text-xs bg-[#F9F9FB] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 text-[#1E2022] focus:outline-none focus:border-[#3B82F6] max-w-[160px] truncate"
              >
                <option value="all">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            )}

            {(searchFilter || typeFilter !== 'all' || statusFilter !== 'all' || projectFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchFilter('');
                  setTypeFilter('all');
                  setStatusFilter('all');
                  setProjectFilter('all');
                }}
                className="text-xs text-[#4A4D55] hover:text-[#1E2022]"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Sources List / Empty State */}
      {loading ? (
        <LoadingSpinner size="lg" message="Loading ingested research sources..." />
      ) : filteredSources.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={sources.length === 0 ? 'No sources ingested yet' : 'No matching sources'}
          description={
            sources.length === 0
              ? 'Ingest live web pages, upload PDF papers, paste laboratory notes, or search open science databases.'
              : 'Try adjusting your search query or status/type filters.'
          }
          actionLabel={sources.length === 0 ? 'Ingest First Source' : 'Clear Filters'}
          onAction={() => {
            if (sources.length === 0) {
              setIsIngestModalOpen(true);
            } else {
              setSearchFilter('');
              setTypeFilter('all');
              setStatusFilter('all');
              setProjectFilter('all');
            }
          }}
        />
      ) : (
        <div className="space-y-3">
          {filteredSources.map((source) => {
            const isCompleted = source.processing_status === 'completed';
            const isOcrNeeded = source.processing_status === 'ocr_needed';
            const isFailed = source.processing_status === 'failed';
            const isProcessing = source.processing_status === 'processing';

            return (
              <div
                key={source.id}
                className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5 shadow-xs hover:border-[#3B82F6]/50 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    {/* Top Row: Type & Status Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Type Badge */}
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#3B82F6] border border-[#DBEAFE]">
                        {source.source_type === 'url' && <Globe className="w-3 h-3" />}
                        {source.source_type === 'pdf' && <FileText className="w-3 h-3" />}
                        {source.source_type === 'text' && <FileEdit className="w-3 h-3" />}
                        {source.source_type === 'paper' && <BookOpen className="w-3 h-3" />}
                        {source.source_type}
                      </span>

                      {/* Processing Status Badge */}
                      {isCompleted && (
                        <Badge variant="success" size="sm" dot>
                          Extracted
                        </Badge>
                      )}
                      {isOcrNeeded && (
                        <Badge variant="warning" size="sm" dot>
                          OCR Needed
                        </Badge>
                      )}
                      {isFailed && (
                        <Badge variant="danger" size="sm" dot>
                          Extraction Failed
                        </Badge>
                      )}
                      {isProcessing && (
                        <Badge variant="primary" size="sm" dot>
                          Processing...
                        </Badge>
                      )}

                      {/* Content Hash Pill */}
                      {source.content_hash && (
                        <span
                          className="font-mono text-[10px] text-[#4A4D55] bg-[#F9F9FB] px-2 py-0.5 rounded border border-[#E5E7EB] flex items-center gap-1 cursor-pointer hover:border-[#3B82F6]"
                          title="SHA-256 Content Hash (Click to copy)"
                          onClick={() => {
                            navigator.clipboard.writeText(source.content_hash);
                            alert(`Copied SHA-256: ${source.content_hash}`);
                          }}
                        >
                          <span className="font-semibold text-[#1E2022]">SHA:</span>
                          {source.content_hash.slice(0, 8)}...{source.content_hash.slice(-6)}
                        </span>
                      )}

                      {/* Page Count */}
                      {source.page_count && source.page_count > 1 && (
                        <span className="text-[11px] text-[#4A4D55] bg-[#F9F9FB] px-2 py-0.5 rounded border border-[#E5E7EB]">
                          {source.page_count} pages
                        </span>
                      )}

                      {/* File Size */}
                      {source.file_size && (
                        <span className="text-[11px] text-[#4A4D55]">
                          {(source.file_size / 1024).toFixed(1)} KB
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3
                      onClick={() => handleOpenPreview(source)}
                      className="text-sm font-bold text-[#1E2022] hover:text-[#3B82F6] cursor-pointer transition-colors leading-snug"
                    >
                      {source.title || 'Untitled Ingested Source'}
                    </h3>

                    {/* URL Links */}
                    {(source.original_url || source.url || source.canonical_url) && (
                      <div className="flex items-center gap-3 text-xs text-[#4A4D55]">
                        <span className="truncate max-w-md">
                          <span className="font-medium text-[#1E2022]">URL:</span>{' '}
                          <a
                            href={source.canonical_url || source.original_url || source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#3B82F6] hover:underline inline-flex items-center gap-1"
                          >
                            {source.canonical_url || source.original_url || source.url}
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </span>
                      </div>
                    )}

                    {/* Publication & Ingestion Dates */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#4A4D55]">
                      {source.publication_date && (
                        <span>
                          <strong className="text-[#1E2022]">Published:</strong> {source.publication_date}
                        </span>
                      )}
                      {source.created_at && (
                        <span>
                          <strong className="text-[#1E2022]">Ingested:</strong>{' '}
                          {new Date(source.created_at).toLocaleDateString()}
                        </span>
                      )}
                      {source.project_title && (
                        <span>
                          <strong className="text-[#1E2022]">Project:</strong> {source.project_title}
                        </span>
                      )}
                    </div>

                    {/* Visible Error Banner (Requirement: Keep source extraction errors visible) */}
                    {source.error_message && (
                      <div
                        className={`text-xs p-2.5 rounded-lg border flex items-start gap-2 mt-2 ${
                          isOcrNeeded
                            ? 'bg-amber-50/70 text-amber-800 border-amber-200'
                            : 'bg-rose-50/70 text-rose-800 border-rose-200'
                        }`}
                      >
                        {isOcrNeeded ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold">
                            {isOcrNeeded ? 'OCR Required Notice' : 'Extraction Error'}
                          </p>
                          <p className="mt-0.5 text-[11px] leading-relaxed">{source.error_message}</p>
                        </div>
                        {(source.source_type === 'url' || source.source_type === 'pdf') && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="text-[11px] h-7 px-2"
                            leftIcon={
                              <RefreshCw
                                className={`w-3 h-3 ${reprocessingId === source.id ? 'animate-spin' : ''}`}
                              />
                            }
                            onClick={() => handleReprocess(source.id)}
                            isLoading={reprocessingId === source.id}
                          >
                            Retry
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Extracted Text Preview (Never fabricate content) */}
                    {source.extracted_text_preview && (
                      <p className="text-xs text-[#4A4D55] line-clamp-2 mt-2 font-mono bg-[#F9F9FB] p-2 rounded border border-[#E5E7EB]">
                        {source.extracted_text_preview}
                      </p>
                    )}
                  </div>

                  {/* Right Action Buttons */}
                  <div className="flex items-center sm:flex-col gap-2 flex-shrink-0 pt-1">
                    <Link to="/evidence">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full text-xs"
                        leftIcon={<FileCheck className="w-3.5 h-3.5 text-[#3B82F6]" />}
                      >
                        Claims
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenPreview(source)}
                    >
                      View Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      onClick={() => handleDeleteSource(source.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* INGEST SOURCE MODAL (URL, PDF, TEXT)                                      */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        title="Ingest Research Source"
        description="Add web pages, research papers, laboratory PDFs, or pasted raw notes to your knowledge base."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {/* Target Project Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#1E2022]">Target Research Project</label>
            <select
              value={targetProjectId}
              onChange={(e) => setTargetProjectId(e.target.value)}
              className="w-full text-xs bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#1E2022] focus:outline-none focus:border-[#3B82F6]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Ingestion Tabs */}
          <div className="flex border-b border-[#E5E7EB]">
            <button
              onClick={() => {
                setIngestTab('url');
                setIngestError('');
              }}
              className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 ${
                ingestTab === 'url'
                  ? 'border-[#3B82F6] text-[#3B82F6]'
                  : 'border-transparent text-[#4A4D55] hover:text-[#1E2022]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Web URL
            </button>
            <button
              onClick={() => {
                setIngestTab('pdf');
                setIngestError('');
              }}
              className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 ${
                ingestTab === 'pdf'
                  ? 'border-[#3B82F6] text-[#3B82F6]'
                  : 'border-transparent text-[#4A4D55] hover:text-[#1E2022]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Upload PDF
            </button>
            <button
              onClick={() => {
                setIngestTab('text');
                setIngestError('');
              }}
              className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 ${
                ingestTab === 'text'
                  ? 'border-[#3B82F6] text-[#3B82F6]'
                  : 'border-transparent text-[#4A4D55] hover:text-[#1E2022]'
              }`}
            >
              <FileEdit className="w-3.5 h-3.5" />
              Paste Text
            </button>
          </div>

          {/* Ingestion Error Alert */}
          {ingestError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Ingestion Notice</p>
                <p className="mt-0.5">{ingestError}</p>
              </div>
            </div>
          )}

          {/* TAB 1: URL INGESTION */}
          {ingestTab === 'url' && (
            <form onSubmit={handleIngestURL} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#1E2022]">Public Website URL</label>
                <Input
                  placeholder="https://nature.com/articles/... or https://arxiv.org/abs/..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  required
                />
              </div>

              <div className="p-3 rounded-lg bg-[#F9F9FB] border border-[#E5E7EB] text-[11px] text-[#4A4D55] space-y-1">
                <p className="font-semibold text-[#1E2022]">Security & Extraction Protocols:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>SSRF Protection: Rejects localhost, loopback, private RFC 1918 IPs, and AWS/cloud metadata.</li>
                  <li>Complies with website <code className="text-[#1E2022]">robots.txt</code> crawl policies.</li>
                  <li>Streaming response limit strictly enforced at 5 MB.</li>
                  <li>Extracts page title, publication date, canonical URL, and readable body paragraphs.</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                <Button type="button" variant="secondary" onClick={() => setIsIngestModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={submittingIngest}>
                  Fetch & Ingest URL
                </Button>
              </div>
            </form>
          )}

          {/* TAB 2: PDF INGESTION */}
          {ingestTab === 'pdf' && (
            <form onSubmit={handleIngestPDF} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#1E2022]">Document Title (Optional)</label>
                <Input
                  placeholder="Leave empty to use PDF embedded title or filename"
                  value={pdfTitle}
                  onChange={(e) => setPdfTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#1E2022]">PDF File (Max 15 MB)</label>
                <div className="border-2 border-dashed border-[#E5E7EB] hover:border-[#3B82F6] rounded-xl p-6 text-center cursor-pointer transition-colors bg-[#F9F9FB]">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => setPdfFile(e.target.files[0])}
                    className="hidden"
                    id="pdf-upload-input"
                  />
                  <label htmlFor="pdf-upload-input" className="cursor-pointer space-y-2 block">
                    <UploadCloud className="w-8 h-8 text-[#3B82F6] mx-auto" />
                    {pdfFile ? (
                      <div>
                        <p className="text-xs font-bold text-[#1E2022]">{pdfFile.name}</p>
                        <p className="text-[11px] text-[#4A4D55]">
                          {(pdfFile.size / 1024 / 1024).toFixed(2)} MB • Ready for PyMuPDF extraction
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-medium text-[#1E2022]">
                          Click to select a PDF or drag and drop
                        </p>
                        <p className="text-[11px] text-[#4A4D55]">
                          PDF files up to 15 MB with text layer
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#F9F9FB] border border-[#E5E7EB] text-[11px] text-[#4A4D55] space-y-1">
                <p className="font-semibold text-[#1E2022]">PyMuPDF Extraction Engine:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Preserves exact page numbering and structure per page.</li>
                  <li>Scanned PDFs without digital text layers are identified and tagged as <strong>OCR Needed</strong>.</li>
                  <li>Calculates SHA-256 fingerprint to block duplicate document uploads.</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                <Button type="button" variant="secondary" onClick={() => setIsIngestModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={submittingIngest} disabled={!pdfFile}>
                  Upload & Extract PDF
                </Button>
              </div>
            </form>
          )}

          {/* TAB 3: TEXT INGESTION */}
          {ingestTab === 'text' && (
            <form onSubmit={handleIngestText} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#1E2022]">Material Title</label>
                <Input
                  placeholder="e.g. Lab Notes: Phase 2 Trial Observations"
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-[#1E2022]">Pasted Research Content</label>
                  <span className="text-[10px] text-[#4A4D55]">
                    {textContent.length} characters • {textContent.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <textarea
                  rows={8}
                  placeholder="Paste research excerpts, protocol notes, lab findings, or raw article text here..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="w-full text-xs font-mono p-3 bg-white border border-[#E5E7EB] rounded-lg text-[#1E2022] placeholder-[#4A4D55] focus:outline-none focus:border-[#3B82F6]"
                  required
                />
              </div>

              <div className="p-3 rounded-lg bg-[#F9F9FB] border border-[#E5E7EB] text-[11px] text-[#4A4D55]">
                Content is stored faithfully without fabrication and indexed with a SHA-256 hash to prevent identical submissions.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                <Button type="button" variant="secondary" onClick={() => setIsIngestModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={submittingIngest} disabled={!textContent.trim()}>
                  Save & Ingest Text
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* FULL EXTRACTED TEXT & PAGE PREVIEW MODAL                                  */}
      {/* ========================================================================= */}
      {previewSource && (
        <Modal
          isOpen={Boolean(previewSource)}
          onClose={() => setPreviewSource(null)}
          title={previewSource.title || 'Extracted Source Content'}
          description={`Ingested as ${previewSource.source_type?.toUpperCase()} • Status: ${previewSource.processing_status}`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4">
            {/* Metadata Bar */}
            <div className="bg-[#F9F9FB] p-3 rounded-lg border border-[#E5E7EB] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-[#4A4D55] block text-[10px] uppercase font-semibold">Source Type</span>
                <span className="font-semibold text-[#1E2022]">{previewSource.source_type}</span>
              </div>
              <div>
                <span className="text-[#4A4D55] block text-[10px] uppercase font-semibold">Processing Status</span>
                <span className="font-semibold text-[#1E2022] capitalize">{previewSource.processing_status}</span>
              </div>
              <div>
                <span className="text-[#4A4D55] block text-[10px] uppercase font-semibold">Pages / Size</span>
                <span className="font-semibold text-[#1E2022]">
                  {previewSource.page_count || 1} page(s) • {(previewSource.file_size / 1024).toFixed(1)} KB
                </span>
              </div>
              <div>
                <span className="text-[#4A4D55] block text-[10px] uppercase font-semibold">Published / Date</span>
                <span className="font-semibold text-[#1E2022]">
                  {previewSource.publication_date || previewSource.publication_year || 'N/A'}
                </span>
              </div>
            </div>

            {/* SHA-256 Hash with Copy */}
            {previewSource.content_hash && (
              <div className="flex items-center justify-between p-2.5 bg-[#F9F9FB] rounded-lg border border-[#E5E7EB] text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="font-semibold text-[#1E2022] flex-shrink-0">SHA-256 Fingerprint:</span>
                  <code className="text-[11px] font-mono text-[#4A4D55] truncate">
                    {previewSource.content_hash}
                  </code>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7 px-2"
                  onClick={() => {
                    navigator.clipboard.writeText(previewSource.content_hash);
                    setCopiedHash(true);
                    setTimeout(() => setCopiedHash(false), 2000);
                  }}
                >
                  {copiedHash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span className="ml-1">{copiedHash ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
            )}

            {/* Error message notice if present */}
            {previewSource.error_message && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                  previewSource.processing_status === 'ocr_needed'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">
                    {previewSource.processing_status === 'ocr_needed' ? 'OCR Required Notice' : 'Ingestion Error'}
                  </p>
                  <p className="mt-0.5 text-[11px]">{previewSource.error_message}</p>
                </div>
              </div>
            )}

            {/* Multi-page Navigation for PDF/Pages */}
            {previewSource.extracted_pages && previewSource.extracted_pages.length > 1 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#1E2022]">Extracted Pages ({previewSource.extracted_pages.length}):</span>
                  <span className="text-[#4A4D55] text-[11px]">
                    Showing Page {previewSource.extracted_pages[selectedPreviewPage]?.page} of {previewSource.extracted_pages.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-[#F9F9FB] rounded-lg border border-[#E5E7EB]">
                  {previewSource.extracted_pages.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedPreviewPage(idx)}
                      className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                        selectedPreviewPage === idx
                          ? 'bg-[#3B82F6] text-white shadow-xs'
                          : 'bg-white text-[#4A4D55] border border-[#E5E7EB] hover:bg-slate-50'
                      }`}
                    >
                      Page {p.page} ({p.char_count || p.text?.length || 0} ch)
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted Text Content */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1E2022]">
                  {previewSource.extracted_pages && previewSource.extracted_pages.length > 1
                    ? `Page ${previewSource.extracted_pages[selectedPreviewPage]?.page} Text Content:`
                    : 'Full Extracted Text:'}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-xs h-7 px-2.5"
                  onClick={() => {
                    const txtToCopy =
                      previewSource.extracted_pages && previewSource.extracted_pages.length > 1
                        ? previewSource.extracted_pages[selectedPreviewPage]?.text
                        : previewSource.extracted_text;
                    navigator.clipboard.writeText(txtToCopy || '');
                    setCopiedText(true);
                    setTimeout(() => setCopiedText(false), 2000);
                  }}
                >
                  {copiedText ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span className="ml-1">{copiedText ? 'Copied Content' : 'Copy Text'}</span>
                </Button>
              </div>

              <div className="max-h-[380px] overflow-y-auto p-4 rounded-lg bg-[#F9F9FB] border border-[#E5E7EB] font-mono text-xs text-[#1E2022] whitespace-pre-wrap leading-relaxed select-text">
                {previewSource.extracted_pages && previewSource.extracted_pages.length > 1
                  ? previewSource.extracted_pages[selectedPreviewPage]?.text || 'No text extracted on this page.'
                  : previewSource.extracted_text || previewSource.abstract || 'No extracted text content available.'}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E5E7EB]">
              <Button variant="primary" onClick={() => setPreviewSource(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* GLOBAL OPENALEX SEARCH MODAL                                              */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        title="Search Global Scientific Literature"
        description="Search 250M+ scholarly works from OpenAlex and import directly to your research projects."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <form onSubmit={handleSearchOnline} className="flex gap-2">
            <Input
              placeholder="Search quantum computing, deep learning, CRISPR, battery materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="primary" isLoading={searching}>
              Search
            </Button>
          </form>

          {projects.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#4A4D55] font-semibold">Target Project:</span>
              <select
                value={targetProjectId}
                onChange={(e) => setTargetProjectId(e.target.value)}
                className="bg-white border border-[#E5E7EB] rounded-md px-2.5 py-1 text-xs text-[#1E2022] focus:outline-none focus:border-[#3B82F6]"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {searching ? (
            <LoadingSpinner size="md" message="Scanning open literature..." />
          ) : searchResults.length === 0 ? (
            <p className="text-xs text-[#4A4D55] text-center py-6">
              Enter any research query to discover verified academic papers.
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
                        {paper.journal || 'Academic Paper'}
                      </span>
                      <span className="text-[#4A4D55]">
                        {paper.publication_year} • {paper.cited_by_count} citations
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-[#1E2022]">{paper.title}</h5>
                    {paper.authors && (
                      <p className="text-[11px] text-[#4A4D55] mt-0.5">{paper.authors.join(', ')}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-end pt-2 border-t border-[#E5E7EB]">
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<Plus className="w-3 h-3" />}
                      onClick={() => handleImportPaper(paper)}
                      isLoading={importingTitle === paper.title}
                    >
                      Import to Selected Project
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default SourcesPage;
