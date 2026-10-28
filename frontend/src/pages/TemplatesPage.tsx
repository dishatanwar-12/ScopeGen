import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Plus, 
  CheckCircle2, 
  Lock, 
  Palette, 
  FileText 
} from 'lucide-react';
import { api } from '../services/api';
import { ProposalTemplate } from '../types';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';

export const TemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<ProposalTemplate | null>(null);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTemplates();
      setTemplates(data);
      if (data.length > 0 && !selectedTemplate) {
        setSelectedTemplate(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Proposal Templates Library</h1>
        <p className="text-sm text-slate-500">
          Standardized proposal layouts, branding palettes, and required structural sections
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-1">
            Available Templates ({templates.length})
          </span>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading templates...</div>
          ) : (
            templates.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedTemplate?.id === tpl.id
                    ? 'bg-white border-brand-900 shadow-xs'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{tpl.name}</h3>
                  <Badge status={tpl.approval_status} />
                </div>

                <div className="mt-2 flex items-center space-x-2 text-xs text-slate-500">
                  {tpl.is_default && (
                    <span className="text-[10px] bg-brand-100 text-brand-800 font-semibold px-2 py-0.2 rounded">
                      STARTER TEMPLATE
                    </span>
                  )}
                  <span>v{tpl.current_version}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Template Detail Preview */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold text-slate-900">{selectedTemplate.name}</h2>
                    {selectedTemplate.is_default && (
                      <span className="text-[10px] bg-brand-100 text-brand-800 font-semibold px-2 py-0.5 rounded">
                        STARTER TEMPLATE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{selectedTemplate.description}</p>
                </div>
                <Badge status={selectedTemplate.approval_status} />
              </div>

              {/* Branding Configuration */}
              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px] mb-2 flex items-center space-x-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  <span>Branding & Header Style</span>
                </span>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 block text-[10px] font-semibold uppercase">Company Brand</span>
                    <strong className="text-slate-900">{selectedTemplate.branding?.company_name || 'Standard Consulting'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-semibold uppercase">Header Label</span>
                    <strong className="text-slate-900">{selectedTemplate.branding?.header_text || 'Statement of Work'}</strong>
                  </div>
                </div>
              </div>

              {/* Sections Schema */}
              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px] mb-2 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Configured Sections ({selectedTemplate.sections_schema?.length || 0})</span>
                </span>

                <div className="space-y-2">
                  {selectedTemplate.sections_schema?.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-slate-400 font-semibold w-5">{idx + 1}.</span>
                        <strong className="text-slate-900">{s.title}</strong>
                        <span className="text-slate-400 font-mono text-[10px]">({s.key})</span>
                      </div>

                      {s.key === 'commercial_terms' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          COMMERCIAL FIREWALL PROTECTED
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">
              Select a template to view section configuration.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

