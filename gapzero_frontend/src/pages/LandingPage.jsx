import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  Scale,
  Clock,
  ListChecks,
  CheckCircle2,
  FileText,
  Layers,
  Database
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#080C15] text-[#F8FAFC]">
      {/* Top Navigation */}
      <nav className="h-16 border-b border-[#1E2C4A] px-6 md:px-12 flex items-center justify-between sticky top-0 z-30 bg-[#080C15]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] flex items-center justify-center text-white font-black text-sm shadow-[0_0_15px_rgba(59,130,246,0.4)]">
            G0
          </div>
          <span className="text-base font-extrabold tracking-tight text-white">
            GAP<span className="text-[#3B82F6]">ZERO</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="secondary" size="sm">
              Dashboard
            </Button>
          </Link>
          <Link to="/new-research">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Start Research
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 md:px-12 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141F36] border border-[#1E2C4A] text-xs font-semibold text-[#60A5FA] shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
          Negative-Space Research Epistemology & Grounded Verification
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
          Discover What Is <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#60A5FA] to-[#3B82F6]">Missing</span> In Scientific Literature
        </h1>

        <p className="text-sm md:text-base text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
          Traditional research tools summarize what is already written. <strong>GAPZERO</strong> reveals the negative space: unaddressed hypotheses, cross-study empirical contradictions, and temporal freshness boundaries—grounded strictly in verbatim evidence.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/new-research">
            <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Start New Research Investigation
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button size="lg" variant="secondary">
              Open Intelligence Dashboard
            </Button>
          </Link>
        </div>

        {/* Epistemic Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-8 text-left">
          <div className="p-4 rounded-xl bg-[#0E1626] border border-[#1E2C4A]">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              100% Verbatim Passages
            </p>
            <p className="text-[11px] text-[#94A3B8] mt-1">
              Every atomic claim is verified against source text. Fabricated passages are rejected.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#0E1626] border border-[#1E2C4A]">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#60A5FA]" />
              Neutral Contradictions
            </p>
            <p className="text-[11px] text-[#94A3B8] mt-1">
              Conflicting metrics are preserved side-by-side without automated bias.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#0E1626] border border-[#1E2C4A]">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Absence != Proof of Absence
            </p>
            <p className="text-[11px] text-[#94A3B8] mt-1">
              Missing evidence in ingested sources is never misrepresented as universal proof.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-6 md:px-12 max-w-6xl mx-auto border-t border-[#1E2C4A]">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            How The GAPZERO Intelligence Engine Operates
          </h2>
          <p className="text-xs md:text-sm text-[#94A3B8]">
            Four autonomous modules transform raw documents into a verifiable negative-space graph.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Step 1 */}
          <Card className="p-5 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/20 border border-[#3B82F6]/40 flex items-center justify-center text-[#60A5FA] font-bold text-sm">
              01
            </div>
            <h3 className="text-sm font-bold text-white">Source Ingestion</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Ingest public URLs with SSRF defense, multi-page PDFs with PyMuPDF, and raw lab notes with SHA-256 deduplication.
            </p>
          </Card>

          {/* Step 2 */}
          <Card className="p-5 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/20 border border-[#3B82F6]/40 flex items-center justify-center text-[#60A5FA] font-bold text-sm">
              02
            </div>
            <h3 className="text-sm font-bold text-white">Claim Extraction</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Deconstruct text into atomic subjects, attributes, and measured values backed by verbatim supporting passages.
            </p>
          </Card>

          {/* Step 3 */}
          <Card className="p-5 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/20 border border-[#3B82F6]/40 flex items-center justify-center text-[#60A5FA] font-bold text-sm">
              03
            </div>
            <h3 className="text-sm font-bold text-white">Negative Space Scan</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Decompose objectives into testable subquestions, measure coverage voids, and detect cross-source tensions.
            </p>
          </Card>

          {/* Step 4 */}
          <Card className="p-5 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/20 border border-[#3B82F6]/40 flex items-center justify-center text-[#60A5FA] font-bold text-sm">
              04
            </div>
            <h3 className="text-sm font-bold text-white">Verification Roadmap</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Generate actionable, prioritized verification checklists and synthesize publication-grade research briefs.
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1E2C4A] py-8 text-center text-xs text-[#94A3B8]">
        <p>GAPZERO Research Intelligence Platform • Powered by Real LLM & OpenAlex Integration</p>
      </footer>
    </div>
  );
};

export default LandingPage;
