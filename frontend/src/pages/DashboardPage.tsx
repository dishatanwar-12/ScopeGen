import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileSignature, 
  Users, 
  FolderKanban, 
  HelpCircle, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (err: any) {
        setError(err.detail || 'Failed to load dashboard metrics.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-brand-700 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>NVIDIA NIM Powered Proposal Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.full_name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Convert client discovery notes into structured, contract-ready SOWs with verified commercial integrity.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Link
            to="/projects"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-brand-900 hover:bg-brand-800 text-white text-sm font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Project Intake</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Real Database Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total SOWs</span>
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">
              <FileSignature className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {isLoading ? '...' : stats?.total_proposals ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center space-x-1.5">
            <span className="text-emerald-700 font-medium">{stats?.approved_proposals ?? 0} approved</span>
            <span>&bull;</span>
            <span className="text-amber-700 font-medium">{stats?.draft_proposals ?? 0} in progress</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Clients</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {isLoading ? '...' : stats?.total_clients ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Accounts under active management
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Projects</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {isLoading ? '...' : stats?.total_projects ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Intake and discovery scopes
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Questions</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-2">
            {isLoading ? '...' : stats?.open_questions ?? 0}
          </div>
          <div className="text-xs text-amber-700 font-medium mt-1">
            Requiring stakeholder resolution
          </div>
        </div>
      </div>

      {/* Main Content Grid: Recent Proposals & Commercial Safeguards Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Proposals Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Proposals & SOWs</h2>
              <p className="text-xs text-slate-500">Latest active drafts generated via NVIDIA NIM</p>
            </div>
            <Link
              to="/proposals"
              className="text-xs font-semibold text-brand-700 hover:text-brand-800 flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading proposals...</div>
            ) : !stats?.recent_proposals || stats.recent_proposals.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No proposals drafted yet. Create a project and select an approved package to draft your first proposal!
              </div>
            ) : (
              stats.recent_proposals.map((item) => (
                <div key={item.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between">
                  <div className="min-w-0 pr-4">
                    <Link
                      to={`/proposals/${item.id}`}
                      className="text-sm font-semibold text-slate-900 hover:text-brand-700 truncate block"
                    >
                      {item.title}
                    </Link>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center space-x-2">
                      <span>{item.project_title}</span>
                      <span>&bull;</span>
                      <span>v{item.version}</span>
                      <span>&bull;</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(item.updated_at).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <Badge status={item.status} />
                    <Link
                      to={`/proposals/${item.id}`}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                    >
                      Open Editor
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Commercial Integrity Checklist Sidecard */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-900">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Commercial Safeguards Active</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            All AI-drafted scopes adhere to strict deterministic corporate policies:
          </p>

          <div className="space-y-3 pt-2">
            {[
              { title: 'Zero Price Fabrication', desc: 'Models are barred from calculating rates, fees, or discounts.' },
              { title: 'Approved Packages Only', desc: 'Deliverables must match company-authorized service cards.' },
              { title: 'Relative Milestones', desc: 'Sequencing is relative unless calendar dates are confirmed.' },
              { title: 'Explicit Gap Questions', desc: 'Missing scope elements trigger actionable review questions.' }
            ].map((rule, idx) => (
              <div key={idx} className="flex items-start space-x-2.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 font-semibold">{rule.title}: </strong>
                  <span className="text-slate-600">{rule.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Link
              to="/packages"
              className="text-xs font-semibold text-brand-700 hover:text-brand-800 flex items-center space-x-1"
            >
              <span>Manage Approved Packages</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

