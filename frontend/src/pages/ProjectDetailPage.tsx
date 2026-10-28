import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  FileText, 
  Upload, 
  Sparkles, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  ArrowRight, 
  ShieldAlert, 
  Package, 
  FileUp,
  FileCheck2,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import { Project, DiscoveryNote, SourceDocument, ServicePackage, ProposalTemplate, FactReviewData } from '../types';
import { Badge } from '../components/ui/Badge';

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [notes, setNotes] = useState<DiscoveryNote[]>([]);
  const [documents, setDocuments] = useState<SourceDocument[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);

  // Selected package/template
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Fact Review Data
  const [factReview, setFactReview] = useState<FactReviewData | null>(null);
  const [isReviewingFacts, setIsReviewingFacts] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // New Note State
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteType, setNewNoteType] = useState('meeting_notes');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // File Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // Active Tab: 'notes' | 'documents' | 'review'
  const [activeTab, setActiveTab] = useState<'notes' | 'documents' | 'review'>('notes');

  const fetchProjectData = async () => {
    if (!projectId) return;
    try {
      const [proj, noteList, docList, pkgList, tplList] = await Promise.all([
        api.getProject(projectId),
        api.getNotes(projectId),
        api.getDocuments(projectId),
        api.getPackages('approved'),
        api.getTemplates(),
      ]);
      setProject(proj);
      setNotes(noteList);
      setDocuments(docList);
      setPackages(pkgList);
      setTemplates(tplList);

      setSelectedPackageId(proj.service_package_id || (pkgList.length > 0 ? pkgList[0].id : ''));
      setSelectedTemplateId(proj.proposal_template_id || (tplList.length > 0 ? tplList[0].id : ''));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !newNoteContent.trim()) return;
    setIsAddingNote(true);
    try {
      await api.addNote(projectId, {
        note_type: newNoteType,
        content: newNoteContent.trim(),
      });
      setNewNoteContent('');
      const updatedNotes = await api.getNotes(projectId);
      setNotes(updatedNotes);
    } catch (err: any) {
      alert(err.detail || 'Failed to add note.');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await api.deleteNote(noteId);
      if (projectId) {
        const updatedNotes = await api.getNotes(projectId);
        setNotes(updatedNotes);
      }
    } catch (err: any) {
      alert(err.detail || 'Failed to delete note.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;
    setIsUploading(true);
    setUploadMessage(null);
    try {
      const res = await api.uploadDocument(projectId, file);
      setUploadMessage(res.message);
      const updatedDocs = await api.getDocuments(projectId);
      setDocuments(updatedDocs);
    } catch (err: any) {
      alert(err.detail || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await api.deleteDocument(docId);
      if (projectId) {
        const updatedDocs = await api.getDocuments(projectId);
        setDocuments(updatedDocs);
      }
    } catch (err: any) {
      alert(err.detail || 'Failed to delete document.');
    }
  };

  // Run Step 7 Fact Review
  const handleReviewFacts = async () => {
    if (!projectId) return;
    setIsReviewingFacts(true);
    setActiveTab('review');
    try {
      const data = await api.reviewFacts({
        project_id: projectId,
        service_package_id: selectedPackageId || undefined,
        proposal_template_id: selectedTemplateId || undefined,
      });
      setFactReview(data);
    } catch (err: any) {
      alert(err.detail || 'Failed to review project facts.');
    } finally {
      setIsReviewingFacts(false);
    }
  };

  // Trigger Step 8 Real NVIDIA NIM Proposal Generation
  const handleGenerateProposal = async () => {
    if (!projectId) return;
    if (!selectedPackageId) {
      alert('Please select an approved service package before generating a proposal.');
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);
    try {
      const proposal = await api.generateProposal({
        project_id: projectId,
        service_package_id: selectedPackageId,
        proposal_template_id: selectedTemplateId || undefined,
      });
      // Redirect directly to the generated proposal workspace
      navigate(`/proposals/${proposal.id}`);
    } catch (err: any) {
      setGenerateError(err.detail || 'Proposal generation failed. Please verify NVIDIA credentials and inputs.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!project) {
    return <div className="p-12 text-center text-sm text-slate-400">Loading project context...</div>;
  }

  const selectedPkg = packages.find((p) => p.id === selectedPackageId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Breadcrumb & Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-2 text-xs text-slate-500 mb-2">
          <Link to="/projects" className="hover:text-slate-800">Projects</Link>
          <span>/</span>
          <span className="font-semibold text-slate-900">{project.title}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
              <Badge status={project.status} />
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
              <span className="font-semibold text-brand-700">{project.client_name}</span>
              <span>&bull;</span>
              <span>{project.project_type}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleReviewFacts}
              disabled={isReviewingFacts}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-brand-900 hover:bg-brand-800 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-300" />
              <span>{isReviewingFacts ? 'Analyzing Scope...' : 'Step 7: Review Facts'}</span>
            </button>
          </div>
        </div>

        {/* Project Problem & Outcomes Preview */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-semibold text-slate-700 block uppercase tracking-wider text-[10px]">Problem Statement</span>
            <p className="text-slate-600 mt-0.5 leading-relaxed">{project.business_problem}</p>
          </div>
          <div>
            <span className="font-semibold text-slate-700 block uppercase tracking-wider text-[10px]">Target Outcomes</span>
            <p className="text-slate-600 mt-0.5 leading-relaxed">{project.desired_outcomes}</p>
          </div>
        </div>
      </div>

      {/* Package & Template Selection Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
          Step 5 & 6: Approved Service Package & Template Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Select Approved Service Package *
            </label>
            <select
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">-- Choose Approved Package --</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} ({pkg.pricing_model === 'fixed_fee' ? `${pkg.currency} ${pkg.fixed_fee_amount?.toLocaleString()}` : pkg.pricing_model})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Select Proposal Template
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} {tpl.is_default ? '(Default)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedPkg && (
          <div className="mt-3 p-3 bg-emerald-50/60 rounded-lg border border-emerald-200/70 text-xs text-emerald-900 flex items-center justify-between">
            <span className="font-semibold flex items-center space-x-1.5">
              <Package className="w-4 h-4 text-emerald-700" />
              <span>Commercial Terms: {selectedPkg.pricing_model === 'fixed_fee' ? `Total Fixed Investment: ${selectedPkg.currency} ${selectedPkg.fixed_fee_amount?.toLocaleString()}` : selectedPkg.pricing_model}</span>
            </span>
            <span className="text-[11px] text-emerald-800 font-medium">Approved Package</span>
          </div>
        )}
      </div>

      {/* Tabs: Discovery Notes vs Uploaded Documents vs Pre-Generation Review */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'notes'
                ? 'border-brand-900 text-brand-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Discovery Notes ({notes.length})
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'documents'
                ? 'border-brand-900 text-brand-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Uploaded Documents ({documents.length})
          </button>
          <button
            onClick={handleReviewFacts}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'review'
                ? 'border-brand-900 text-brand-900'
                : 'border-transparent text-brand-700 hover:text-brand-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pre-Generation Fact Review</span>
          </button>
        </nav>
      </div>

      {/* TAB 1: Discovery Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          {/* Add Note Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Add Discovery & Interview Notes
            </h3>
            <form onSubmit={handleAddNote} className="space-y-3">
              <div className="flex items-center space-x-3">
                <select
                  value={newNoteType}
                  onChange={(e) => setNewNoteType(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-medium focus:ring-2 focus:ring-brand-500"
                >
                  <option value="meeting_notes">Meeting Notes</option>
                  <option value="interview">Discovery Interview</option>
                  <option value="requirements">Structured Requirements</option>
                  <option value="pain_points">Client Goals & Pain Points</option>
                  <option value="constraints">Explicit Constraints</option>
                  <option value="technical">Technical Architecture</option>
                  <option value="risks">Project Risks</option>
                  <option value="open_questions">Open Questions</option>
                  <option value="decisions">Agreed Decisions</option>
                </select>
              </div>

              <textarea
                required
                rows={3}
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Paste client discovery notes, technical constraints, or agreed architectural decisions..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isAddingNote || !newNoteContent.trim()}
                  className="px-4 py-1.5 bg-brand-900 hover:bg-brand-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  {isAddingNote ? 'Saving Note...' : 'Add Note'}
                </button>
              </div>
            </form>
          </div>

          {/* Notes List */}
          <div className="space-y-3">
            {notes.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                No discovery notes captured yet. Add notes or upload interview documents to inform proposal generation.
              </div>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-start justify-between">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-600 mb-1.5">
                      {note.note_type.replace(/_/g, ' ')}
                    </span>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap">{note.content}</p>
                    <span className="text-[10px] text-slate-400 mt-2 block">
                      {new Date(note.created_at).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    title="Delete Note"
                    className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Uploaded Documents */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Upload Dropzone */}
          <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-300 text-center">
            <FileUp className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">Upload Discovery Documents</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Upload client interview documents, RFPs, or notes in TXT, PDF, or DOCX formats. Content is safely extracted and sanitized.
            </p>

            <label className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-brand-900 hover:bg-brand-800 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Extracting Text...' : 'Choose File to Upload'}</span>
              <input
                type="file"
                accept=".txt,.pdf,.docx"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>

            {uploadMessage && (
              <p className="text-xs text-emerald-700 mt-2 font-medium">{uploadMessage}</p>
            )}
          </div>

          {/* Documents List */}
          <div className="space-y-3">
            {documents.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                No documents uploaded yet.
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{doc.original_filename}</h4>
                      <span className="text-[11px] text-slate-500 uppercase font-mono">
                        {doc.file_type} &bull; {(doc.file_size_bytes / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      title="Delete Document"
                      className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 font-mono">
                    <span className="block font-semibold text-slate-700 text-[10px] uppercase font-sans mb-1">
                      Sanitized Text Preview:
                    </span>
                    {doc.extracted_text_preview}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Pre-Generation Fact Review (Step 7) */}
      {activeTab === 'review' && (
        <div className="space-y-6">
          {generateError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <strong className="font-semibold">Generation Failed: </strong>
                {generateError}
              </div>
            </div>
          )}

          {isReviewingFacts ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <div className="w-8 h-8 border-3 border-brand-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-800">Analyzing Project Facts & Gaps...</p>
              <p className="text-xs text-slate-500 mt-1">Cross-referencing notes, uploaded files, and approved package data.</p>
            </div>
          ) : factReview ? (
            <div className="space-y-6">
              {/* Readiness Score Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-slate-900">{factReview.readiness_score}%</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-800 border border-brand-200">
                      Proposal Readiness Score
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Deterministic assessment of factual completeness prior to calling NVIDIA NIM.
                  </p>
                </div>

                <button
                  onClick={handleGenerateProposal}
                  disabled={isGenerating || !selectedPackageId}
                  className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>{isGenerating ? 'Generating Proposal via NVIDIA NIM...' : 'Step 8: Generate Proposal'}</span>
                </button>
              </div>

              {/* Review Breakdown Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Confirmed Facts */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Confirmed Project Facts ({factReview.confirmed_facts.length})</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    {factReview.confirmed_facts.map((fact, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <strong className="text-slate-700 font-semibold">{fact.label}: </strong>
                        <span className="text-slate-600">{fact.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Missing Information Checklist */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    <span>Missing Information Checklist ({factReview.missing_information.length})</span>
                  </h4>
                  {factReview.missing_information.length === 0 ? (
                    <p className="text-xs text-emerald-700">All required baseline fields provided.</p>
                  ) : (
                    <div className="space-y-2 text-xs">
                      {factReview.missing_information.map((item, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/60 text-amber-900 flex items-start space-x-2">
                          <span className="text-amber-600 font-bold">&bull;</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scope Ambiguities & Contradictions */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Potential Scope Contradictions ({factReview.contradictions.length})</span>
                  </h4>
                  {factReview.contradictions.length === 0 ? (
                    <p className="text-xs text-slate-500">No contradictory statements detected across discovery inputs.</p>
                  ) : (
                    <div className="space-y-2 text-xs">
                      {factReview.contradictions.map((item, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800">
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Commercial Safeguard Status */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <Package className="w-4 h-4 text-brand-600" />
                    <span>Commercial Protection Status</span>
                  </h4>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                    <div>
                      <span className="font-semibold text-slate-700">Package: </span>
                      <span className="text-slate-900">{factReview.commercial_status.package_name || 'None selected'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Billing Model: </span>
                      <span className="text-slate-900">{factReview.commercial_status.pricing_model || 'Unspecified'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Investment Status: </span>
                      <span className={factReview.commercial_status.has_pricing ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                        {factReview.commercial_status.has_pricing
                          ? `${factReview.commercial_status.currency} ${factReview.commercial_status.fixed_fee_amount?.toLocaleString() || factReview.commercial_status.hourly_rate + '/hr'}`
                          : 'Pricing not provided — confirmation required'}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 italic">
                    AI generation is prevented from inventing prices or payment terms.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

