import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  CheckCircle2, 
  ShieldCheck, 
  Archive, 
  Layers, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { api } from '../services/api';
import { ServicePackage } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';

export const PackagesPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPkg, setSelectedPkg] = useState<ServicePackage | null>(null);

  // Create Package Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Cloud Infrastructure',
    description: '',
    intended_use: '',
    pricing_model: 'fixed_fee',
    currency: 'USD',
    fixed_fee_amount: 35000,
    hourly_rate: 150,
    payment_schedule: '50% upon signing, 50% upon acceptance',
    commercial_terms: 'Net 30. Taxes and cloud compute fees excluded.',
    included_deliverables: [
      { name: 'Architecture Blueprint', description: 'Technical design document and topology diagrams' }
    ],
    included_activities: ['Discovery interviews', 'Infrastructure deployment'],
    excluded_activities: ['Legacy source code refactoring'],
    dependencies: ['Client provides cloud admin access'],
    constraints: ['Must be completed in 6 weeks']
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPackages();
      setPackages(data);
      if (data.length > 0 && !selectedPkg) {
        setSelectedPkg(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await api.approvePackage(id);
      fetchPackages();
    } catch (err: any) {
      alert(err.detail || 'Failed to approve package.');
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this package?')) return;
    try {
      await api.archivePackage(id);
      fetchPackages();
    } catch (err: any) {
      alert(err.detail || 'Failed to archive package.');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.createPackage(formData);
      setIsModalOpen(false);
      fetchPackages();
    } catch (err: any) {
      alert(err.detail || 'Failed to create service package.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Approved Service Packages</h1>
          <p className="text-sm text-slate-500">
            Catalog of company-authorized deliverables, activity boundaries, and approved rate schedules
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-900 hover:bg-brand-800 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Service Package</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Package Catalog Column */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-1">
            Service Catalog ({packages.length})
          </span>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading catalog...</div>
          ) : (
            packages.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => setSelectedPkg(pkg)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedPkg?.id === pkg.id
                    ? 'bg-white border-brand-900 shadow-xs'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{pkg.name}</h3>
                  <Badge status={pkg.approval_status} />
                </div>
                <span className="text-[11px] font-medium text-brand-700 block mt-1">
                  {pkg.category}
                </span>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>v{pkg.current_version}</span>
                  <span className="font-semibold text-slate-900">
                    {pkg.pricing_model === 'fixed_fee' && pkg.fixed_fee_amount
                      ? `${pkg.currency} ${pkg.fixed_fee_amount.toLocaleString()}`
                      : pkg.pricing_model === 'time_and_materials' && pkg.hourly_rate
                      ? `${pkg.currency} ${pkg.hourly_rate}/hr`
                      : 'Unpriced'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Package Details Specification Card */}
        <div className="lg:col-span-2">
          {selectedPkg ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold text-slate-900">{selectedPkg.name}</h2>
                    <Badge status={selectedPkg.approval_status} />
                  </div>
                  <span className="text-xs text-slate-500 mt-0.5 block">
                    Category: <strong>{selectedPkg.category}</strong> &bull; Version: <strong>{selectedPkg.current_version}</strong>
                  </span>
                </div>

                {isAdmin && (
                  <div className="flex items-center space-x-2">
                    {selectedPkg.approval_status !== 'approved' && (
                      <button
                        onClick={() => handleApprove(selectedPkg.id)}
                        className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve Package</span>
                      </button>
                    )}
                    {selectedPkg.approval_status !== 'archived' && (
                      <button
                        onClick={() => handleArchive(selectedPkg.id)}
                        className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Description & Intended Use */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">Package Description</span>
                  <p className="text-slate-700 mt-1 leading-relaxed">{selectedPkg.description}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">Intended Use Case</span>
                  <p className="text-slate-700 mt-1 leading-relaxed">{selectedPkg.intended_use}</p>
                </div>
              </div>

              {/* Authoritative Structured Commercial Safeguards */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center space-x-2 font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Approved Commercial Terms (AI Protected)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Model</span>
                    <strong className="text-slate-900">{selectedPkg.pricing_model.replace(/_/g, ' ')}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Rate / Total</span>
                    <strong className="text-slate-900">
                      {selectedPkg.fixed_fee_amount
                        ? `${selectedPkg.currency} ${selectedPkg.fixed_fee_amount.toLocaleString()}`
                        : selectedPkg.hourly_rate
                        ? `${selectedPkg.currency} ${selectedPkg.hourly_rate}/hr`
                        : 'Unspecified'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Currency</span>
                    <strong className="text-slate-900">{selectedPkg.currency || 'None'}</strong>
                  </div>
                </div>

                {selectedPkg.payment_schedule && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Payment Schedule</span>
                    <p className="text-slate-800 mt-0.5">{selectedPkg.payment_schedule}</p>
                  </div>
                )}
              </div>

              {/* Included Deliverables */}
              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px] mb-2">
                  Included Package Deliverables ({selectedPkg.included_deliverables?.length || 0})
                </span>
                <div className="space-y-2">
                  {selectedPkg.included_deliverables?.map((d, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                      <strong className="text-slate-900 font-semibold">{d.name}: </strong>
                      <span className="text-slate-600">{d.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inclusions vs Exclusions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px] mb-1">
                    Approved Activities
                  </span>
                  <ul className="space-y-1 list-disc list-inside text-slate-700">
                    {selectedPkg.included_activities?.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px] mb-1">
                    Explicit Exclusions
                  </span>
                  <ul className="space-y-1 list-disc list-inside text-slate-700">
                    {selectedPkg.excluded_activities?.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">
              Select a package from the catalog to review approved specifications.
            </div>
          )}
        </div>
      </div>

      {/* Create Package Modal (Admin) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Authorized Service Package"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Package Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enterprise AI Agent Deployment"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Artificial Intelligence"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
            <textarea
              required
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Intended Use Case *</label>
            <textarea
              required
              rows={2}
              value={formData.intended_use}
              onChange={(e) => setFormData({ ...formData, intended_use: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Pricing fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pricing Model</label>
              <select
                value={formData.pricing_model}
                onChange={(e) => setFormData({ ...formData, pricing_model: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="fixed_fee">Fixed Fee</option>
                <option value="time_and_materials">Time & Materials</option>
                <option value="retainer">Retainer</option>
                <option value="unspecified">Unspecified (Confirmation Required)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                placeholder="USD, EUR, INR"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fixed Fee / Rate</label>
              <input
                type="number"
                value={formData.fixed_fee_amount}
                onChange={(e) => setFormData({ ...formData, fixed_fee_amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Schedule</label>
            <input
              type="text"
              value={formData.payment_schedule}
              onChange={(e) => setFormData({ ...formData, payment_schedule: e.target.value })}
              placeholder="40% deposit, 30% milestone 2, 30% signoff"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
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
              {isSaving ? 'Creating Package...' : 'Create Service Package'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

