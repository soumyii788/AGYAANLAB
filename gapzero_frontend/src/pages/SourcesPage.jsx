import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, ExternalLink, Plus, Layers } from 'lucide-react';
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

  // Search Modal
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [importingTitle, setImportingTitle] = useState(null);

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
      setSources(sourcesRes.results || sourcesRes || []);
      const projs = projectsRes.results || [];
      setProjects(projs);
      if (projs.length > 0) {
        setSelectedProjectId(projs[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleImport = async (paper) => {
    if (!selectedProjectId) {
      alert('Please select a project to import into.');
      return;
    }
    setImportingTitle(paper.title);
    try {
      await projectService.importPaper(selectedProjectId, paper);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to import paper.');
    } finally {
      setImportingTitle(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E2022]">Literature & Scientific Sources</h1>
          <p className="text-xs text-[#4A4D55] mt-1">
            Search OpenAlex for peer-reviewed literature or inspect papers ingested across your projects.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Search className="w-4 h-4" />}
          onClick={() => setIsSearchOpen(true)}
        >
          Search Global Literature (OpenAlex)
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" message="Loading literature sources..." />
      ) : sources.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No literature sources indexed"
          description="Search live academic publications across 250M+ papers and import them into your projects."
          actionLabel="Search Global Literature"
          onAction={() => setIsSearchOpen(true)}
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
                    {source.relevance_score && (
                      <Badge variant="primary" size="sm">
                        {source.relevance_score}% Relevance
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-[#1E2022]">
                    {source.title}
                  </h3>

                  {source.authors && source.authors.length > 0 && (
                    <p className="text-xs text-[#4A4D55]">
                      {source.authors.join(', ')}
                    </p>
                  )}

                  {source.journal && (
                    <p className="text-xs text-[#4A4D55] italic">
                      Venue: {source.journal}
                    </p>
                  )}

                  {source.abstract && (
                    <p className="text-xs text-[#4A4D55] line-clamp-2 mt-1 leading-relaxed">
                      {source.abstract}
                    </p>
                  )}
                </div>

                {source.doi && (
                  <a
                    href={`https://doi.org/${source.doi}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#3B82F6] hover:underline flex-shrink-0 font-medium"
                  >
                    DOI <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Global OpenAlex Search Modal */}
      <Modal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        title="Search Global Scientific Literature"
        description="Live integration with OpenAlex — search 250M+ scholarly works and import to any project."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <form onSubmit={handleSearchOnline} className="flex gap-2">
            <Input
              placeholder="Search quantum computing, deep learning, CRISPR, perovskites..."
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
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
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
              Enter any query to search real research papers.
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
                    <h5 className="text-xs font-bold text-[#1E2022]">
                      {paper.title}
                    </h5>
                    {paper.authors && (
                      <p className="text-[11px] text-[#4A4D55] mt-0.5">
                        {paper.authors.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-end pt-2 border-t border-[#E5E7EB]">
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<Plus className="w-3 h-3" />}
                      onClick={() => handleImport(paper)}
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
