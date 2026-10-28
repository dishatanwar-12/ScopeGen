import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileSignature, 
  Search, 
  Clock, 
  Building2, 
  ArrowRight,
  Plus
} from 'lucide-react';
import { api } from '../services/api';
import { Proposal } from '../types';
import { Badge } from '../components/ui/Badge';

export const ProposalsListPage: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchProposals = async () => {
    setIsLoading(true);
    try {
      const data = await api.getProposals();
      setProposals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const filtered = proposals.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.client_name && p.client_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Proposals & Statements of Work</h1>
          <p className="text-sm text-slate-500">All drafted commercial proposals and SOW documents</p>
        </div>
        <Link
          to="/projects"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-900 hover:bg-brand-800 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Proposal Intake</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search proposals by title or client..."
            className="w-full px-3 py-2 pl-9 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="in_review">In Review</option>
          <option value="approved">Approved</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Proposals Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading proposals...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No proposals found. Start by creating a project and running fact review!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="min-w-0 pr-4">
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/proposals/${item.id}`}
                      className="text-base font-bold text-slate-900 hover:text-brand-700 truncate"
                    >
                      {item.title}
                    </Link>
                    <Badge status={item.status} />
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                      v{item.current_version_number}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="flex items-center space-x-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-700">{item.client_name || 'Client'}</span>
                    </span>
                    <span>&bull;</span>
                    <span>{item.service_package_name || 'Standard Service Package'}</span>
                    <span>&bull;</span>
                    <span className="flex items-center space-x-1 text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>Updated {new Date(item.updated_at).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <Link
                    to={`/proposals/${item.id}`}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-900 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

