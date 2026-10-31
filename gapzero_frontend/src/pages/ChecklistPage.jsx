import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ListChecks,
  CheckCircle2,
  Circle,
  AlertOctagon,
  AlertTriangle,
  Clock,
  HelpCircle,
  Search,
  Filter,
  RefreshCw,
  FolderGit2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
  Calendar
} from 'lucide-react';
import projectService from '../services/projectService';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import clsx from 'clsx';

export const ChecklistPage = () => {
  const [searchParams] = useSearchParams();
  const initialProjectId = searchParams.get('project') || '';

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  const [checklistItems, setChecklistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, completed
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadChecklist();
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      const data = await projectService.getProjects();
      const list = data.results || data || [];
      setProjects(list);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const loadChecklist = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedProjectId) {
        params.project = selectedProjectId;
      }
      const data = await projectService.getChecklist(params);
      const list = data.results || data || [];
      setChecklistItems(list);
    } catch (err) {
      console.error('Failed to load checklist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (item) => {
    try {
      setTogglingId(item.id);
      const updated = await projectService.toggleChecklistItem(item.id, !item.is_completed);
      setChecklistItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, ...updated } : it))
      );
    } catch (err) {
      console.error('Failed to toggle checklist item:', err);
    } finally {
      setTogglingId(null);
    }
  };

  // Filter items
  const filteredItems = checklistItems.filter((item) => {
    if (priorityFilter !== 'all' && item.priority !== priorityFilter) {
      return false;
    }
    if (statusFilter === 'active' && item.is_completed) {
      return false;
    }
    if (statusFilter === 'completed' && !item.is_completed) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = item.task_text?.toLowerCase().includes(q);
      const matchRat = item.rationale?.toLowerCase().includes(q);
      const matchFinding = item.finding_title?.toLowerCase().includes(q);
      if (!matchText && !matchRat && !matchFinding) return false;
    }
    return true;
  });

  // Calculate stats
  const totalTasks = checklistItems.length;
  const completedTasks = checklistItems.filter((i) => i.is_completed).length;
  const percentComplete = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Group items by priority
  const priorityGroups = ['critical', 'high', 'medium', 'low'];
  const groupedByPriority = priorityGroups.reduce((acc, p) => {
    acc[p] = filteredItems.filter((i) => i.priority === p);
    return acc;
  }, {});

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'critical':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertOctagon className="w-3 h-3" />
            Critical
          </span>
        );
      case 'high':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" />
            High
          </span>
        );
      case 'medium':
        return (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#141F36] text-[#94A3B8] border border-[#1E2C4A]">
            Low
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E2C4A] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Verification Checklist
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#141F36] text-[#60A5FA] border border-[#1E2C4A]">
              {completedTasks}/{totalTasks} Resolved ({percentComplete}%)
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1.5 max-w-2xl leading-relaxed">
            Prioritized actionable research tasks derived from identified literature gaps, competing contradictions, and freshness thresholds. Resolve empirical deficits before finalizing decisions.
          </p>
        </div>

        {/* Project Selector & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#0E1626] border border-[#1E2C4A] rounded-lg px-3 py-1.5">
            <FolderGit2 className="w-4 h-4 text-[#60A5FA]" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent text-xs text-white border-none focus:outline-none focus:ring-0 cursor-pointer pr-4"
            >
              <option value="" className="bg-[#0E1626] text-white">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#0E1626] text-white">
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={loadChecklist}
            leftIcon={<RefreshCw className={clsx('w-3.5 h-3.5', loading && 'animate-spin')} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Progress & Summary Bar */}
      <Card className="p-5 bg-[#0E1626] border-[#1E2C4A]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#60A5FA]">
              Empirical Deficit Resolution Progress
            </span>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-white">{percentComplete}%</span>
              <span className="text-xs text-[#94A3B8]">
                {completedTasks} completed out of {totalTasks} verification actions
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-[#94A3B8]">
                Critical:{' '}
                <strong className="text-white">
                  {checklistItems.filter((i) => i.priority === 'critical' && !i.is_completed).length}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-[#94A3B8]">
                High:{' '}
                <strong className="text-white">
                  {checklistItems.filter((i) => i.priority === 'high' && !i.is_completed).length}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-[#94A3B8]">
                Resolved: <strong className="text-emerald-400">{completedTasks}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full h-2.5 bg-[#080C15] rounded-full overflow-hidden mt-4 border border-[#1E2C4A]">
          <div
            className="h-full bg-gradient-to-r from-[#2563EB] to-emerald-500 transition-all duration-500 rounded-full"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </Card>

      {/* Filter Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0E1626] p-3 rounded-xl border border-[#1E2C4A]">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              statusFilter === 'all'
                ? 'bg-[#1E2C4A] text-white'
                : 'text-[#94A3B8] hover:text-white hover:bg-[#141F36]'
            )}
          >
            All Tasks ({checklistItems.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              statusFilter === 'active'
                ? 'bg-[#1E2C4A] text-white'
                : 'text-[#94A3B8] hover:text-white hover:bg-[#141F36]'
            )}
          >
            Pending ({checklistItems.filter((i) => !i.is_completed).length})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              statusFilter === 'completed'
                ? 'bg-[#1E2C4A] text-white'
                : 'text-[#94A3B8] hover:text-white hover:bg-[#141F36]'
            )}
          >
            Completed ({completedTasks})
          </button>
        </div>

        {/* Priority Filter & Search */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-[#080C15] border border-[#1E2C4A] rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-[#64748B]" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-xs text-[#94A3B8] border-none focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option value="all" className="bg-[#0E1626]">All Priorities</option>
              <option value="critical" className="bg-[#0E1626]">Critical Only</option>
              <option value="high" className="bg-[#0E1626]">High Only</option>
              <option value="medium" className="bg-[#0E1626]">Medium Only</option>
              <option value="low" className="bg-[#0E1626]">Low Only</option>
            </select>
          </div>

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#080C15] border border-[#1E2C4A] text-xs text-white placeholder-[#64748B] rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#3B82F6]"
            />
          </div>
        </div>
      </div>

      {/* Task List Groups */}
      {loading ? (
        <LoadingSpinner size="lg" message="Loading verification checklist..." />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No verification items found"
          description={
            checklistItems.length === 0
              ? 'Run the intelligence engine on your research project to automatically derive actionable verification tasks.'
              : 'No items match your active filters.'
          }
          actionLabel={checklistItems.length === 0 ? 'Run Intelligence Engine' : 'Clear Filters'}
          onAction={() => {
            if (checklistItems.length === 0) {
              window.location.href = '/intelligence';
            } else {
              setPriorityFilter('all');
              setStatusFilter('all');
              setSearchQuery('');
            }
          }}
        />
      ) : (
        <div className="space-y-6">
          {priorityGroups.map((pGroup) => {
            const itemsInGroup = groupedByPriority[pGroup];
            if (!itemsInGroup || itemsInGroup.length === 0) return null;

            return (
              <div key={pGroup} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                    {pGroup} Priority Verification
                  </h3>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#141F36] text-[#60A5FA]">
                    {itemsInGroup.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {itemsInGroup.map((item) => (
                    <Card
                      key={item.id}
                      className={clsx(
                        'p-4 border-[#1E2C4A] transition-all duration-150',
                        item.is_completed
                          ? 'bg-[#0E1626]/50 opacity-70'
                          : 'bg-[#0E1626] hover:border-[#3B82F6]/40'
                      )}
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Interactive Toggle Checkbox */}
                        <button
                          onClick={() => handleToggle(item)}
                          disabled={togglingId === item.id}
                          className={clsx(
                            'mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-colors flex-shrink-0 border',
                            item.is_completed
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'bg-[#080C15] border-[#1E2C4A] text-transparent hover:border-[#3B82F6]'
                          )}
                        >
                          <Check className={clsx('w-3.5 h-3.5 stroke-[3]', item.is_completed && 'text-white')} />
                        </button>

                        {/* Task Content */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {getPriorityBadge(item.priority)}

                            <span
                              className={clsx(
                                'text-sm font-semibold tracking-tight transition-all',
                                item.is_completed ? 'line-through text-[#64748B]' : 'text-white'
                              )}
                            >
                              {item.task_text}
                            </span>
                          </div>

                          {item.rationale && (
                            <p className="text-xs text-[#94A3B8] leading-relaxed">
                              <strong className="text-[#CBD5E1]">Rationale:</strong> {item.rationale}
                            </p>
                          )}

                          {/* Originating Finding Link */}
                          {item.finding_title && (
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[#64748B]">
                              <span>Linked finding:</span>
                              <Link
                                to={`/findings?project=${item.project}`}
                                className="text-[#3B82F6] hover:underline flex items-center gap-1 font-medium"
                              >
                                <span className="truncate max-w-sm">{item.finding_title}</span>
                                <ChevronRight className="w-3 h-3" />
                              </Link>
                              {item.completed_at && (
                                <span className="ml-auto text-[10px] text-emerald-400">
                                  Resolved on {new Date(item.completed_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChecklistPage;
