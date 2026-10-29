import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search, 
  Building2, 
  Mail, 
  Globe, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  FolderKanban,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Client } from '../types';
import { Modal } from '../components/ui/Modal';

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    company_name: '',
    primary_contact_name: '',
    contact_email: '',
    industry: '',
    website: '',
    background: '',
    internal_notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchClients = async (query?: string) => {
    setIsLoading(true);
    try {
      const data = await api.getClients(query);
      setClients(data);
    } catch (err: any) {
      setError(err.detail || 'Failed to load clients.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients(searchQuery);
  }, [searchQuery]);

  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormData({
      company_name: '',
      primary_contact_name: '',
      contact_email: '',
      industry: '',
      website: '',
      background: '',
      internal_notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      company_name: client.company_name,
      primary_contact_name: client.primary_contact_name,
      contact_email: client.contact_email,
      industry: client.industry,
      website: client.website || '',
      background: client.background || '',
      internal_notes: client.internal_notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingClient) {
        await api.updateClient(editingClient.id, formData);
      } else {
        await api.createClient(formData);
      }
      setIsModalOpen(false);
      fetchClients(searchQuery);
    } catch (err: any) {
      alert(err.detail || 'Failed to save client.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete client '${name}'? All associated projects and proposals will be removed.`)) {
      return;
    }
    try {
      await api.deleteClient(id);
      fetchClients(searchQuery);
    } catch (err: any) {
      alert(err.detail || 'Failed to delete client.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-slate-900">Clients & Accounts</h1>
          <p className="text-xs text-slate-500">Manage client profiles, contacts, and related SOW projects</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-[#235c3b] hover:bg-[#1b472e] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by company, contact, or industry..."
          className="w-full px-3.5 py-2 pl-9 rounded-xl border border-[#E5E8E2] text-xs focus:outline-hidden focus:ring-2 focus:ring-[#235c3b]/20 focus:border-[#235c3b] bg-white transition-all"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Client List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full p-12 text-center text-sm text-slate-400">Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No client accounts found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Get started by adding your first client account to begin drafting proposals.
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-4 py-2 bg-brand-900 text-white text-xs font-semibold rounded-lg hover:bg-brand-800 transition-colors"
            >
              Add First Client
            </button>
          </div>
        ) : (
          clients.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{c.company_name}</h3>
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 mt-1">
                      {c.industry}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      title="Edit Client"
                      className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.company_name)}
                      title="Delete Client"
                      className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{c.primary_contact_name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a href={`mailto:${c.contact_email}`} className="truncate hover:text-brand-700">
                      {c.contact_email}
                    </a>
                  </div>
                  {c.website && (
                    <div className="flex items-center space-x-2">
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a
                        href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-brand-700 hover:underline"
                      >
                        {c.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>

                {c.background && (
                  <p className="mt-3 text-xs text-slate-500 line-clamp-2 italic">
                    "{c.background}"
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium flex items-center space-x-1">
                  <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
                  <span>{c.project_count ?? 0} Projects</span>
                </span>
                <Link
                  to={`/projects?client_id=${c.id}`}
                  className="font-semibold text-brand-700 hover:text-brand-800"
                >
                  View Scopes &rarr;
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Client Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? 'Edit Client Record' : 'Create New Client'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Organization Name *</label>
              <input
                type="text"
                required
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Acme Global Logistics"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Industry Sector *</label>
              <input
                type="text"
                required
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="Supply Chain, Fintech, Healthcare"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Contact Name *</label>
              <input
                type="text"
                required
                value={formData.primary_contact_name}
                onChange={(e) => setFormData({ ...formData, primary_contact_name: e.target.value })}
                placeholder="Sarah Jenkins"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Email Address *</label>
              <input
                type="email"
                required
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="sarah@acme.com"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company Website (optional)</label>
            <input
              type="text"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://acme.com"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Client Background & Context</label>
            <textarea
              rows={2}
              value={formData.background}
              onChange={(e) => setFormData({ ...formData, background: e.target.value })}
              placeholder="Overview of company operations, fleet size, market presence..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Relationship Notes</label>
            <textarea
              rows={2}
              value={formData.internal_notes}
              onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
              placeholder="Internal strategic notes, procurement preferences..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
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
              {isSaving ? 'Saving...' : editingClient ? 'Update Client' : 'Create Client'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

