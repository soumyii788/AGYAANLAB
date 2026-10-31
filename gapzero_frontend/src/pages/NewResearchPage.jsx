import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Globe,
  FileText,
  FileEdit,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import projectService from '../services/projectService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const DOMAIN_OPTIONS = [
  { value: 'ai_ml', label: 'Artificial Intelligence & Machine Learning' },
  { value: 'biotechnology', label: 'Biotechnology & Genetic Engineering' },
  { value: 'medicine_health', label: 'Medicine & Healthcare' },
  { value: 'renewable_energy', label: 'Renewable Energy & Battery Storage' },
  { value: 'quantum_computing', label: 'Quantum Computing & Information' },
  { value: 'materials_science', label: 'Materials Science & Solid-State Physics' },
  { value: 'climate_science', label: 'Climate Science & Geophysics' },
  { value: 'neuroscience', label: 'Neuroscience & Cognitive Systems' },
  { value: 'general', label: 'General Scientific Inquiry' },
];

export const NewResearchPage = () => {
  const navigate = useNavigate();

  // Project Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('renewable_energy');
  const [keywords, setKeywords] = useState('');

  // Sources to Ingest
  const [urlInput, setUrlInput] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [textTitle, setTextTitle] = useState('');

  // Execution state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [progressMsg, setProgressMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Please enter a research title.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Please describe your research objective.');
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: Create the research project
      setProgressMsg('Creating research project container...');
      const kwList = keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      const project = await projectService.createProject({
        title: title.trim(),
        description: description.trim(),
        domain: domain,
        keywords: kwList,
        status: 'active',
      });

      const projectId = project.id;

      // Step 2: Ingest URL source if provided
      if (urlInput.trim()) {
        try {
          setProgressMsg('Fetching & validating URL source (SSRF-protected)...');
          await projectService.ingestUrl(projectId, urlInput.trim());
        } catch (err) {
          console.warn('URL ingestion notice:', err);
        }
      }

      // Step 3: Ingest PDF if provided
      if (pdfFile) {
        try {
          setProgressMsg('Parsing PDF with PyMuPDF & preserving page layers...');
          await projectService.ingestPdf(projectId, pdfFile.name, pdfFile);
        } catch (err) {
          console.warn('PDF ingestion notice:', err);
        }
      }

      // Step 4: Ingest Text if provided
      if (textContent.trim()) {
        try {
          setProgressMsg('Ingesting laboratory text notes & generating SHA-256 fingerprint...');
          await projectService.ingestText(
            projectId,
            textTitle.trim() || 'Preliminary Research Observations',
            textContent.trim()
          );
        } catch (err) {
          console.warn('Text ingestion notice:', err);
        }
      }

      // Navigate to project detail view
      navigate(`/projects/${projectId}`);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to initialize project.');
    } finally {
      setSubmitting(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 text-[#F8FAFC]">
      {/* Header */}
      <div className="pb-2 border-b border-[#1E2C4A]">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Launch New Research Investigation</h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#141F36] text-[#60A5FA] border border-[#1E2C4A]">
            GAPZERO
          </span>
        </div>
        <p className="text-xs text-[#94A3B8] mt-1">
          Define your research objective and attach preliminary sources (web pages, PDFs, or raw observations) for negative-space analysis.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Objective & Domain */}
        <Card className="p-6 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#3B82F6]" />
            1. Research Scope & Objective
          </h2>

          <Input
            label="Research Project Title"
            placeholder="e.g. Phase Stability of Formamidinium Halide Perovskites Under Thermal Stress"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#F8FAFC]">
              Research Objective & Hypotheses <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="State the central scientific question, expected bounds, mechanisms under investigation, and target empirical outcomes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#080C15] text-[#F8FAFC] border border-[#1E2C4A] rounded-lg px-3 py-2 text-xs placeholder:text-[#94A3B8]/50 focus:outline-none focus:border-[#3B82F6] transition-colors leading-relaxed"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#F8FAFC]">Research Domain</label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full bg-[#080C15] text-[#F8FAFC] border border-[#1E2C4A] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#3B82F6]"
              >
                {DOMAIN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Keywords & Tags (comma-separated)"
              placeholder="e.g. perovskites, degradation, cation exchange, photovoltaics"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>
        </Card>

        {/* Section 2: Ingest Sources (URL, PDF, Text) */}
        <Card className="p-6 space-y-5">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-[#60A5FA]" />
              2. Initial Source Ingestion (Optional)
            </h2>
            <p className="text-xs text-[#94A3B8] mt-1">
              Attach publications, web pages, or experiment notes to immediately seed the claim extraction engine.
            </p>
          </div>

          {/* Sub-item A: URL Ingestion */}
          <div className="p-4 rounded-xl bg-[#080C15] border border-[#1E2C4A] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Globe className="w-3.5 h-3.5 text-[#3B82F6]" />
              Public Web URL Ingestion
            </div>
            <Input
              placeholder="https://nature.com/articles/... or https://arxiv.org/abs/..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
            <p className="text-[11px] text-[#94A3B8]">
              Protected against SSRF (blocks private networks & loopback). Enforces robots.txt and 5 MB stream limit.
            </p>
          </div>

          {/* Sub-item B: PDF Upload */}
          <div className="p-4 rounded-xl bg-[#080C15] border border-[#1E2C4A] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <FileText className="w-3.5 h-3.5 text-[#60A5FA]" />
              PDF Document Upload (PyMuPDF)
            </div>
            <div className="border border-dashed border-[#1E2C4A] hover:border-[#3B82F6] rounded-xl p-5 text-center cursor-pointer transition-colors bg-[#0E1626]">
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setPdfFile(e.target.files[0])}
                className="hidden"
                id="initial-pdf-upload"
              />
              <label htmlFor="initial-pdf-upload" className="cursor-pointer space-y-1 block">
                <UploadCloud className="w-6 h-6 text-[#3B82F6] mx-auto" />
                {pdfFile ? (
                  <p className="text-xs font-bold text-white">
                    Selected: {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                ) : (
                  <div>
                    <p className="text-xs text-white font-medium">Click to attach a PDF document</p>
                    <p className="text-[10px] text-[#94A3B8]">Up to 15 MB • Preserves page numbers</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Sub-item C: Pasted Text */}
          <div className="p-4 rounded-xl bg-[#080C15] border border-[#1E2C4A] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <FileEdit className="w-3.5 h-3.5 text-emerald-400" />
              Pasted Research Notes / Raw Protocol
            </div>
            <Input
              placeholder="Material Title (e.g. Lab Notebook 2026: Trial A findings)"
              value={textTitle}
              onChange={(e) => setTextTitle(e.target.value)}
            />
            <textarea
              rows={3}
              placeholder="Paste raw research notes, experimental protocol excerpt, or laboratory observations..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="w-full bg-[#0E1626] text-[#F8FAFC] border border-[#1E2C4A] rounded-lg px-3 py-2 text-xs placeholder:text-[#94A3B8]/50 focus:outline-none focus:border-[#3B82F6] font-mono leading-relaxed"
            />
          </div>
        </Card>

        {/* Progress & Submit */}
        {progressMsg && (
          <div className="p-3 rounded-xl bg-[#141F36] border border-[#1E2C4A] text-xs text-[#60A5FA] flex items-center gap-2">
            <Sparkles className="w-4 h-4 animate-spin text-[#3B82F6]" />
            {progressMsg}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/dashboard')}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={submitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Initialize Project & Ingest Sources
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewResearchPage;
