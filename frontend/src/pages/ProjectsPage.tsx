import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  FolderKanban, 
  Plus, 
  ArrowRight, 
  FileText, 
  Building2, 
  Clock, 
  Trash2, 
  Edit3,
  Search
} from 'lucide-react';
import { api } from '../services/api';
import { Project, Client, ServicePackage, ProposalTemplate } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const ProjectsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const clientIdFilter = searchParams.get('client_id');

  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Create Project Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_id: clientIdFilter || '',
    title: '',
    project_type: 'Custom Generative AI & Cloud',
    business_problem: '',
    desired_outcomes: '',
    existing_environment: '',
    known_constraints: '',
    required_integrations: '',
    delivery_approach: '',
    target_dates: '',
    service_package_id: '',
    proposal_template_id: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [projData, clientData, pkgData, tplData] = await Promise.all([
        api.getProjects(clientIdFilter || undefined),
        api.getClients(),
        api.getPackages('approved'),
        api.getTemplates(),
      ]);
      setProjects(projData);
      setClients(clientData);
      setPackages(pkgData);
      setTemplates(tplData);

      if (clientIdFilter) {
        setFormData((prev) => ({ ...prev, client_id: clientIdFilter }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [clientIdFilter]);

  const handleOpenCreate = () => {
    setFormData({
      client_id: clientIdFilter || (clients.length > 0 ? clients[0].id : ''),
      title: '',
      project_type: 'Custom Generative AI & Cloud',
      business_problem: '',
      desired_outcomes: '',
      existing_environment: '',
      known_constraints: '',
      required_integrations: '',
      delivery_approach: '',
      target_dates: '',
      service_package_id: packages.length > 0 ? packages[0].id : '',
      proposal_template_id: templates.length > 0 ? templates[0].id : ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id) {
      alert('Please select a client account.');
      return;
    }
    setIsSaving(true);
    try {
      await api.createProject(formData);
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.detail || 'Failed to create project.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete project '${title}'?`)) return;
    try {
      await api.deleteProject(id);
      fetchData();
    } catch (err: any) {
      alert(err.detail || 'Failed to delete project.');
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.client_name && p.client_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    p.project_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-slate-900">Project Scopes</h1>
          <p className="text-xs text-slate-500">
            Client engagement briefs, discovery inputs, and Statement of Work definitions
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-[#235c3b] hover:bg-[#1b472e] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Project Intake</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between max-w-md">
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects or clients..."
            className="w-full px-3.5 py-2 pl-9 rounded-xl border border-[#E5E8E2] text-xs focus:outline-hidden focus:ring-2 focus:ring-[#235c3b]/20 focus:border-[#235c3b] bg-white transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
        </div>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full p-12 text-center text-sm text-slate-400">Loading projects...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No projects found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create a new project scope to attach discovery notes and generate proposals.
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-4 py-2 bg-brand-900 text-white text-xs font-semibold rounded-lg hover:bg-brand-800 transition-colors"
            >
              Start New Project Intake
            </button>
          </div>
        ) : (
          filteredProjects.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-xs font-semibold text-brand-700 flex items-center space-x-1.5 truncate">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{p.client_name || 'Client'}</span>
                  </span>
                  <div className="flex items-center space-x-1">
                    <Badge status={p.status} />
                    <button
                      onClick={() => handleDelete(p.id, p.title)}
                      title="Delete Project"
                      className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-2 line-clamp-1">{p.title}</h3>
                <span className="inline-block text-[11px] text-slate-500 font-medium mt-0.5">
                  {p.project_type}
                </span>

                <p className="mt-3 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {p.business_problem}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>{p.notes_count ?? 0} notes &bull; {p.docs_count ?? 0} files</span>
                  </span>
                  <span>{p.proposals_count ?? 0} proposals</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(p.updated_at).toLocaleDateString()}</span>
                </span>
                <Link
                  to={`/projects/${p.id}`}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-900 rounded-lg text-xs font-semibold transition-colors"
                >
                  <span>Discovery & Review</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Project Intake"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Client Account *</label>
              <select
                required
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- Choose Client --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Type *</label>
              <input
                type="text"
                required
                value={formData.project_type}
                onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                placeholder="Custom Generative AI, Cloud Migration, Web App"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Project Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enterprise Route Optimization & Dispatch SOW"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Attach Approved Service Package</label>
              <select
                value={formData.service_package_id}
                onChange={(e) => setFormData({ ...formData, service_package_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- Select Approved Package --</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} ({pkg.pricing_model === 'fixed_fee' ? `${pkg.currency} ${pkg.fixed_fee_amount?.toLocaleString()}` : pkg.pricing_model})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Proposal Template</label>
              <select
                value={formData.proposal_template_id}
                onChange={(e) => setFormData({ ...formData, proposal_template_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- Standard Starter Template --</option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} {tpl.is_default ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Business Problem & Client Pain Points *</label>
            <textarea
              required
              rows={3}
              value={formData.business_problem}
              onChange={(e) => setFormData({ ...formData, business_problem: e.target.value })}
              placeholder="Describe the operational bottleneck, legacy limitation, or business challenge..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Desired Outcomes & Success Metrics *</label>
            <textarea
              required
              rows={2}
              value={formData.desired_outcomes}
              onChange={(e) => setFormData({ ...formData, desired_outcomes: e.target.value })}
              placeholder="E.g., Automate 80% of route exceptions, reduce latency under 200ms..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Existing Technical Environment</label>
              <input
                type="text"
                value={formData.existing_environment}
                onChange={(e) => setFormData({ ...formData, existing_environment: e.target.value })}
                placeholder="AWS, PostgreSQL, Kubernetes, Legacy REST API"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Known Constraints or Target Dates</label>
              <input
                type="text"
                value={formData.known_constraints}
                onChange={(e) => setFormData({ ...formData, known_constraints: e.target.value })}
                placeholder="Zero downtime cutover, SOC2 audit requirements"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-brand-900 hover:bg-brand-800 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

