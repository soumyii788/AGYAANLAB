import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Search,
  Sparkles,
  ChevronUp,
  Play,
  Layers,
  Database,
  Award,
  ExternalLink,
  Flame,
  Clock,
  Gamepad2,
  CheckCircle2,
  TrendingUp,
  BarChart3
} from 'lucide-react';

export const LandingPage = () => {
  const [activeBenchmarkTab, setActiveBenchmarkTab] = useState('trending');

  const benchmarks = [
    {
      id: 1,
      title: 'Game Arena',
      description: 'Measuring the frontier of model capabilities through dynamic game-theoretic evaluation.',
      author: 'AGYAAN LAB',
      authorIcon: 'K',
      authorColor: 'bg-[#20BEFF] text-white',
      leaderboard: [
        { rank: '#1', model: 'Gemini 4 Argon', score: '535', highlight: true, color: 'bg-[#F9AB00]' },
        { rank: '#2', model: 'GPT-6 Astra', score: '491', highlight: false, color: 'bg-gray-300' },
        { rank: '#3', model: 'Claude Opus 5', score: '436', highlight: false, color: 'bg-gray-300' },
      ],
      moreCount: 36,
      updated: 'Updated 12d ago',
      votes: 190,
    },
    {
      id: 2,
      title: 'FACTS Grounding & Negative Space',
      description: 'Novel benchmark from Google DeepMind and AGYAAN LAB measuring citation veracity and hallucinated citations.',
      author: 'Google',
      authorIcon: 'G',
      authorColor: 'bg-blue-600 text-white',
      leaderboard: [
        { rank: '#1', model: 'GPT-6 Astra', score: '80%', highlight: true, color: 'bg-[#F9AB00]' },
        { rank: '#2', model: 'GPT-6.1 Sol', score: '78%', highlight: false, color: 'bg-gray-300' },
        { rank: '#3', model: 'Gemma 4 26B A4B', score: '78%', highlight: false, color: 'bg-gray-300' },
      ],
      moreCount: 12,
      updated: 'Updated 2d ago',
      votes: 83,
    },
    {
      id: 3,
      title: 'Enterprise Operations Bench',
      description: 'Evaluates LLMs against real-world, domain-specific enterprise operational workflows and logic.',
      author: 'IBM Research',
      authorIcon: 'IBM',
      authorColor: 'bg-indigo-900 text-white',
      leaderboard: [
        { rank: '#1', model: 'Gemini 3 Pro Preview', score: '64%', highlight: true, color: 'bg-[#F9AB00]' },
        { rank: '#2', model: 'o3', score: '60%', highlight: false, color: 'bg-gray-300' },
        { rank: '#3', model: 'GPT-5', score: '60%', highlight: false, color: 'bg-gray-300' },
      ],
      moreCount: 10,
      updated: 'Updated 1mo ago',
      votes: 426,
    },
    {
      id: 4,
      title: 'ParseBench: Doc OCR for AI Agents',
      description: 'Parsing multi-column text, scientific tables, and scanned research PDFs without fabrication.',
      author: 'LlamaIndex',
      authorIcon: '🦙',
      authorColor: 'bg-purple-700 text-white',
      leaderboard: [
        { rank: '#1', model: 'GPT-6.1 Sol', score: '80%', highlight: true, color: 'bg-[#F9AB00]' },
        { rank: '#2', model: 'GPT-6 Sol', score: '80%', highlight: true, color: 'bg-[#F9AB00]' },
        { rank: '#3', model: 'GPT-6 Astra', score: '79%', highlight: false, color: 'bg-gray-300' },
      ],
      moreCount: 31,
      updated: 'Updated 3d ago',
      votes: 237,
    },
  ];

  const competitions = [
    {
      id: 1,
      title: 'ARC Prize 2026 - ARC-AGI-3',
      description: 'Create an AI capable of fluid intelligence and novel reasoning on unseen patterns.',
      org: 'Abstraction and Reasoning Institute',
      type: 'Competition',
      typeColor: 'bg-amber-50 text-amber-800 border-amber-200/60',
      participants: '4,990 Teams · 5,693 Participants',
      prize: '$850,000',
      deadline: '2d to go',
      bgPattern: 'from-amber-900/10 to-yellow-900/5',
    },
    {
      id: 2,
      title: 'ARC Prize 2026 - ARC-AGI-2',
      description: 'Create an AI capable of novel inductive reasoning without task-specific retraining.',
      org: 'Abstraction and Reasoning Institute',
      type: 'Competition',
      typeColor: 'bg-amber-50 text-amber-800 border-amber-200/60',
      participants: '3,540 Teams · 3,955 Participants',
      prize: '$700,000',
      deadline: '2d to go',
      bgPattern: 'from-blue-900/10 to-cyan-900/5',
    },
    {
      id: 3,
      title: 'ARC Prize 2026 - Paper Track',
      description: 'Document your conceptual negative-space approach and proofs for the ARC Prize 2026.',
      org: 'Abstraction and Reasoning Institute',
      type: 'Hackathon',
      typeColor: 'bg-purple-50 text-purple-800 border-purple-200/60',
      participants: '356 Teams · 378 Participants',
      prize: '$450,000',
      deadline: '9d to go',
      bgPattern: 'from-purple-900/10 to-pink-900/5',
    },
    {
      id: 4,
      title: 'Google Quantum AI - Verifiable Quantum Circuit Compilation',
      description: 'Reducing the resources required for physical quantum applications and error mitigation.',
      org: 'Google Quantum AI',
      type: 'Competition',
      typeColor: 'bg-amber-50 text-amber-800 border-amber-200/60',
      participants: '1,716 Teams · 1,847 Participants',
      prize: '$150,000',
      deadline: '3mo to go',
      bgPattern: 'from-emerald-900/10 to-teal-900/5',
    },
  ];

  const expertVideos = [
    {
      id: 1,
      title: 'Interview: Designing Robust Evals',
      tag: 'Research Interview',
      color: 'bg-gradient-to-br from-[#E2D9CC] to-[#D5C7B3]',
    },
    {
      id: 2,
      title: 'Build AI Evals Locally with AGYAAN LAB...',
      tag: 'Tutorial',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 3,
      title: 'Live Q&A: Measuring Progress Toward AGI',
      tag: 'Live Stream',
      color: 'bg-gradient-to-br from-[#F9AB00] via-[#F4B400] to-[#E37400]',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#202124] selection:bg-[#20BEFF]/30">
      {/* ─── KAGGLE NAVBAR ──────────────────────────────────────── */}
      <header className="h-16 border-b border-gray-200/90 bg-white sticky top-0 z-50 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-1.5 select-none">
            <span className="text-2xl font-black tracking-tight text-[#202124]">
              agyaan<span className="text-[#20BEFF]">lab</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-gray-700">
            <a href="#competitions" className="px-3.5 py-1.5 rounded-full hover:bg-gray-100 transition-colors">Competitions</a>
            <a href="#benchmarks" className="px-3.5 py-1.5 rounded-full hover:bg-gray-100 transition-colors">Benchmarks</a>
            <Link to="/sources" className="px-3.5 py-1.5 rounded-full hover:bg-gray-100 transition-colors">Data Hub</Link>
            <Link to="/evidence" className="px-3.5 py-1.5 rounded-full hover:bg-gray-100 transition-colors">Evidence</Link>
            <Link to="/checklist" className="px-3.5 py-1.5 rounded-full hover:bg-gray-100 transition-colors">Verification</Link>
            <Link to="/reports" className="px-3.5 py-1.5 rounded-full hover:bg-gray-100 transition-colors">Reports</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors">
            <Search className="w-4 h-4" />
          </button>
          <Link
            to="/login"
            className="text-sm font-medium text-gray-700 hover:text-black px-3.5 py-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-[#202124] text-white px-5 py-2 text-sm font-medium hover:bg-black transition-all shadow-xs"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* ─── HERO SECTION (IMAGE 1) ──────────────────────────────── */}
      <section className="pt-16 pb-12 px-6 md:px-12 text-center max-w-5xl mx-auto space-y-4">
        <p className="font-mono text-xs text-gray-500 tracking-wider">
          Agyaan Lab is for Standard Setters
        </p>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#202124] leading-[1.1]">
          Evaluating what works at AI’s frontier
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed pt-2">
          Crowdsourced benchmarks, competitions, and negative-space intelligence where the community shapes real-world progress in AI.
        </p>
      </section>

      {/* ─── HERO TOPOGRAPHIC MOUNTAIN VISUAL + FLOATING CARD ─────── */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#F2ECE1] via-[#E8DFD0] to-[#E3D8C4] border border-gray-200/60 shadow-xs h-[340px] md:h-[400px] flex items-end justify-center">
          {/* Mountain Topographic SVG Graphic */}
          <svg className="w-full h-full absolute inset-0 object-cover" viewBox="0 0 1000 400" fill="none" preserveAspectRatio="none">
            <defs>
              <linearGradient id="mountGrad" x1="500" y1="120" x2="500" y2="400" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F9AB00" stopOpacity="0.85" />
                <stop offset="0.6" stopColor="#E37400" stopOpacity="0.9" />
                <stop offset="1" stopColor="#D56A00" stopOpacity="0.95" />
              </linearGradient>
            </defs>
            {/* Mountain shape */}
            <path d="M 120 400 L 500 120 L 880 400 Z" fill="url(#mountGrad)" />
            {/* White topographic snowcap */}
            <path d="M 450 170 L 500 120 L 550 170 L 525 185 L 500 165 L 475 190 Z" fill="#FFFFFF" opacity="0.9" />
            {/* Stylized wireframe lines */}
            <path d="M 500 120 L 320 360 M 500 120 L 680 360 M 420 220 L 580 220 M 360 300 L 640 300 M 500 120 L 500 400" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.7" />
            {/* Node markers */}
            <circle cx="500" cy="120" r="4" fill="#FFFFFF" />
            <circle cx="420" cy="220" r="3" fill="#FFFFFF" />
            <circle cx="580" cy="220" r="3" fill="#FFFFFF" />
            <circle cx="320" cy="360" r="3" fill="#FFFFFF" />
            <circle cx="680" cy="360" r="3" fill="#FFFFFF" />
          </svg>

          {/* Floating Kaggle Glassmorphic Card (Right) */}
          <div className="absolute right-6 sm:right-12 bottom-12 bg-white/95 backdrop-blur-md border border-gray-200/80 rounded-2xl p-4 sm:p-5 shadow-lg max-w-xs text-left z-10 transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span className="flex items-center gap-1.5 font-medium text-amber-700">
                <span className="w-1.5 h-3 bg-amber-600 rounded-full inline-block" />
                Competition
              </span>
              <span>17d ago</span>
            </div>
            <h4 className="text-sm font-bold text-[#202124] leading-snug">
              Name That LLM by AGYAAN LAB
            </h4>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
              <span>$50,000 Prize Pool</span>
              <span className="font-semibold text-blue-600">Join &rarr;</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TRUSTED BY TEAMS AT (IMAGE 1) ────────────────────────── */}
      <section className="py-12 border-b border-gray-200/80 text-center">
        <p className="font-mono text-xs text-gray-500 tracking-wider mb-8">
          Trusted by teams at
        </p>

        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 md:gap-14 text-gray-500 font-bold text-sm tracking-tight opacity-80">
          <span className="hover:text-black transition-colors">Jane Street</span>
          <span className="hover:text-black transition-colors text-base font-extrabold">∞ Meta</span>
          <span className="hover:text-black transition-colors font-mono tracking-widest text-base">IBM</span>
          <span className="hover:text-black transition-colors text-base font-semibold">Google</span>
          <span className="hover:text-black transition-colors text-base font-bold">OpenAI</span>
          <span className="hover:text-black transition-colors text-base font-semibold">DeepMind</span>
          <span className="hover:text-black transition-colors font-mono tracking-tighter">ARC PRIZE</span>
          <span className="hover:text-black transition-colors text-base">🦙 LlamaIndex</span>
        </div>
      </section>

      {/* ─── FEATURED BENCHMARKS (IMAGE 2) ────────────────────────── */}
      <section id="benchmarks" className="py-16 px-6 md:px-12 max-w-7xl mx-auto border-b border-gray-200/80">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-1.5">
              Featured Benchmarks
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-[#202124]">
              Discover the state-of-the-art in AI
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Top benchmarks from leading labs, researchers, and companies.
            </p>
          </div>

          <Link
            to="/findings"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 text-[#202124] px-5 py-2 text-sm font-medium hover:bg-gray-50 transition-all self-start md:self-auto shadow-2xs"
          >
            <span>View all</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveBenchmarkTab('trending')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeBenchmarkTab === 'trending'
                ? 'bg-[#202124] text-white shadow-xs'
                : 'text-gray-600 hover:text-black hover:bg-gray-100'
            }`}
          >
            Trending
          </button>
          <button
            onClick={() => setActiveBenchmarkTab('recently')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeBenchmarkTab === 'recently'
                ? 'bg-[#202124] text-white shadow-xs'
                : 'text-gray-600 hover:text-black hover:bg-gray-100'
            }`}
          >
            Recently added
          </button>
          <button
            onClick={() => setActiveBenchmarkTab('arena')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeBenchmarkTab === 'arena'
                ? 'bg-[#202124] text-white shadow-xs'
                : 'text-gray-600 hover:text-black hover:bg-gray-100'
            }`}
          >
            Game Arena
          </button>
        </div>

        {/* 4 Benchmark Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {benchmarks.map((b) => (
            <div
              key={b.id}
              className="bg-white border border-gray-200/90 rounded-2xl p-5 flex flex-col justify-between hover:border-gray-300 hover:shadow-xs transition-all duration-200"
            >
              <div>
                <h3 className="text-base font-bold text-[#202124]">{b.title}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                  {b.description}
                </p>

                {/* Author Badge */}
                <div className="flex items-center gap-2 mt-4 mb-5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${b.authorColor}`}>
                    {b.authorIcon}
                  </div>
                  <span className="text-xs font-medium text-gray-700">{b.author}</span>
                </div>

                {/* Leaderboard Rows */}
                <div className="space-y-2.5 pt-2 border-t border-gray-100">
                  {b.leaderboard.map((row, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-mono text-[11px]">{row.rank}</span>
                        <span className="font-medium text-[#202124] truncate px-2 text-[11px] flex-1">
                          {row.model}
                        </span>
                        <span className="font-bold text-[#202124] text-xs">{row.score}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${row.color}`}
                          style={{ width: `${85 - idx * 12}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="text-[11px] text-gray-400 font-medium pt-1">
                    + {b.moreCount} more models
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 text-xs">
                <span className="text-gray-400">{b.updated}</span>
                <button className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors font-medium text-xs">
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>{b.votes}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── COMPETITIONS AND HACKATHONS (IMAGE 3) ───────────────── */}
      <section id="competitions" className="py-16 px-6 md:px-12 max-w-7xl mx-auto border-b border-gray-200/80">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-1.5">
              Competitions and Hackathons
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-[#202124]">
              Put AI to work to solve real problems
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Compete for prizes or host a competition and put global AI practitioners to work.
            </p>
          </div>

          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 text-[#202124] px-5 py-2 text-sm font-medium hover:bg-gray-50 transition-all self-start md:self-auto shadow-2xs"
          >
            <span>Join a competition</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 2x2 Grid of Competition Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {competitions.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-gray-200/90 rounded-2xl p-6 flex flex-col justify-between hover:border-gray-300 hover:shadow-xs transition-all duration-200"
            >
              <div>
                {/* Org Header + Tag */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-mono text-[10px] font-bold">
                      {c.org[0]}
                    </div>
                    <span className="text-xs font-semibold text-gray-700 truncate max-w-[220px]">
                      {c.org}
                    </span>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${c.typeColor}`}>
                    {c.type}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#202124] hover:text-blue-600 transition-colors cursor-pointer">
                  {c.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  {c.description}
                </p>

                <p className="text-xs text-gray-400 mt-4">
                  {c.participants}
                </p>
              </div>

              {/* Footer Prize + Deadline */}
              <div className="flex items-center justify-between pt-4 mt-6 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#F9AB00]" />
                  <span className="text-sm font-bold text-[#202124]">{c.prize}</span>
                </div>
                <span className="text-xs font-medium text-gray-500">{c.deadline}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── MODELS & KNOWLEDGE SECTION (IMAGE 4) ────────────────── */}
      <section className="py-20 px-6 md:px-12 bg-[#F9F8F4] border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-1.5">
              Models
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#202124]">
              Explore over 52K models
            </h2>
          </div>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white text-[#202124] px-5 py-2 text-sm font-medium hover:bg-gray-50 transition-all self-start md:self-auto shadow-2xs"
          >
            <span>View all</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Isometric Models Graphic Grid */}
        <div className="max-w-5xl mx-auto py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {[
              { name: 'Gemini 4 Argon', provider: 'Google', icon: '✦', color: 'text-blue-600' },
              { name: 'GPT-6 Sol', provider: 'OpenAI', icon: '❂', color: 'text-emerald-700' },
              { name: 'Claude Opus 5', provider: 'Anthropic', icon: '✳', color: 'text-amber-800' },
              { name: 'Llama 4 405B', provider: 'Meta', icon: '∞', color: 'text-blue-700' },
              { name: 'Mistral Large 3', provider: 'Mistral', icon: 'Ⓜ', color: 'text-orange-600' },
              { name: 'Qwen 3.5 Max', provider: 'Alibaba', icon: '◈', color: 'text-purple-600' },
              { name: 'DeepSeek V3', provider: 'DeepSeek', icon: '🐳', color: 'text-cyan-600' },
              { name: 'Command R+', provider: 'Cohere', icon: '◬', color: 'text-rose-600' },
              { name: 'Phi-4 Mini', provider: 'Microsoft', icon: '❖', color: 'text-sky-600' },
              { name: 'Grok 3', provider: 'xAI', icon: '𝕏', color: 'text-black' },
              { name: 'Gemma 4 27B', provider: 'Google DeepMind', icon: '✧', color: 'text-blue-500' },
              { name: 'AGYAAN Negative-Space Engine', provider: 'AGYAAN LAB', icon: '⚡', color: 'text-[#20BEFF]' },
            ].map((m, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200/80 rounded-2xl p-4 flex flex-col items-center text-center hover:border-gray-300 hover:shadow-xs transition-all"
              >
                <span className={`text-2xl mb-2 ${m.color}`}>{m.icon}</span>
                <p className="text-xs font-bold text-[#202124] truncate w-full">{m.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{m.provider}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LEARN FROM OUR EXPERT COMMUNITY (IMAGE 5) ───────────── */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto border-b border-gray-200/80">
        <h2 className="text-3xl font-bold tracking-tight text-[#202124] mb-8">
          Learn from our expert community
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {expertVideos.map((v) => (
            <div
              key={v.id}
              className={`rounded-2xl overflow-hidden border border-gray-200/80 p-6 flex flex-col justify-between min-h-[260px] shadow-xs relative group cursor-pointer ${
                v.color || 'bg-gray-100'
              }`}
            >
              {v.image && (
                <img
                  src={v.image}
                  alt={v.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
                />
              )}
              {v.image && <div className="absolute inset-0 bg-black/40" />}

              {/* Play Button */}
              <div className="w-11 h-11 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#202124] shadow-xs relative z-10 group-hover:scale-110 transition-transform">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>

              {/* Title & Tag */}
              <div className="relative z-10">
                <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  v.image ? 'bg-white/20 text-white' : 'bg-black/10 text-gray-800'
                }`}>
                  {v.tag}
                </span>
                <h3 className={`text-lg font-bold mt-2 leading-snug ${
                  v.image ? 'text-white' : 'text-[#202124]'
                }`}>
                  {v.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── ABOUT AGYAAN LAB (IMAGE 5 FOOTER) ────────────────────── */}
      <footer className="py-16 px-6 md:px-12 max-w-7xl mx-auto text-xs text-gray-500 space-y-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-gray-400 mb-2">
            About AGYAAN LAB
          </p>
          <p className="text-sm text-gray-700 max-w-3xl leading-relaxed">
            AGYAAN LAB is the leading platform for independent, crowdsourced AI evaluation and negative-space research intelligence.
            Our benchmarks, empirical claim extraction engine, and verification checklists empower researchers to expose unaddressed scientific voids and contradictory claims across global literature.
          </p>
        </div>

        <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© 2026 AGYAAN LAB Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-black">Privacy</a>
            <a href="#" className="hover:text-black">Terms</a>
            <a href="#" className="hover:text-black">Documentation</a>
            <a href="#" className="hover:text-black">Kaggle Guidelines</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
