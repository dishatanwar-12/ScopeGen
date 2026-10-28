import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FileSignature, 
  Save, 
  Download, 
  RotateCcw, 
  History, 
  HelpCircle, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  AlertTriangle,
  FileDown,
  Layers,
  Check,
  Clock,
  Eye,
  Edit3
} from 'lucide-react';
import { api } from '../services/api';
import { Proposal, ProposalSection, ConfirmationQuestion, ProposalVersion } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const ProposalWorkspacePage: React.FC = () => {
  const { proposalId } = useParams<{ proposalId: string }>();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [activeContent, setActiveContent] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [activeTab, setActiveTab] = useState<'editor' | 'questions' | 'versions' | 'commercial'>('editor');

  // Modals & Popovers
  const [isRegeneratingSection, setIsRegeneratingSection] = useState(false);
  const [regenInstructions, setRegenInstructions] = useState('');
  const [isRegenModalOpen, setIsRegenModalOpen] = useState(false);

  const [versions, setVersions] = useState<ProposalVersion[]>([]);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [snapshotSummary, setSnapshotSummary] = useState('');

  const [selectedQuestion, setSelectedQuestion] = useState<ConfirmationQuestion | null>(null);
  const [questionAnswer, setQuestionAnswer] = useState('');
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);

  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchProposal = async () => {
    if (!proposalId) return;
    try {
      const data = await api.getProposal(proposalId);
      setProposal(data);
      if (data.sections && data.sections.length > 0 && !activeSectionId) {
        setActiveSectionId(data.sections[0].id);
        setActiveContent(data.sections[0].content_markdown);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProposal();
  }, [proposalId]);

  // When changing active section
  const handleSelectSection = (sec: ProposalSection) => {
    // If unsaved, trigger quick save of previous
    if (saveStatus === 'unsaved') {
      handleManualSave();
    }
    setActiveSectionId(sec.id);
    setActiveContent(sec.content_markdown);
    setSaveStatus('saved');
  };

  // Content change handler with debounce autosave
  const handleContentChange = (newVal: string) => {
    setActiveContent(newVal);
    setSaveStatus('unsaved');

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = setTimeout(async () => {
      await performSave(newVal);
    }, 2000); // 2 second autosave debounce
  };

  const performSave = async (contentToSave: string) => {
    if (!proposal || !activeSectionId) return;
    const currentSec = proposal.sections.find((s) => s.id === activeSectionId);
    if (!currentSec) return;

    setSaveStatus('saving');
    try {
      const updatedSec = await api.updateSection(proposal.id, activeSectionId, {
        content_markdown: contentToSave,
        version_lock: currentSec.version_lock,
      });

      // Update local state version_lock
      setProposal((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          sections: prev.sections.map((s) => (s.id === activeSectionId ? updatedSec : s)),
        };
      });
      setSaveStatus('saved');
    } catch (err: any) {
      setSaveStatus('unsaved');
      alert(err.detail || 'Failed to save section.');
    }
  };

  const handleManualSave = async () => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
    await performSave(activeContent);
  };

  // Regenerate single section
  const handleRegenerateSection = async () => {
    if (!proposal || !activeSection) return;
    setIsRegeneratingSection(true);
    try {
      const updatedSec = await api.regenerateSection(proposal.id, {
        section_key: activeSection.section_key,
        instructions: regenInstructions || undefined,
      });

      setActiveContent(updatedSec.content_markdown);
      setProposal((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          sections: prev.sections.map((s) => (s.id === updatedSec.id ? updatedSec : s)),
        };
      });
      setIsRegenModalOpen(false);
      setRegenInstructions('');
      setSaveStatus('saved');
    } catch (err: any) {
      alert(err.detail || 'Failed to regenerate section.');
    } finally {
      setIsRegeneratingSection(false);
    }
  };

  // Create Snapshot Version
  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposal) return;
    try {
      await api.createVersion(proposal.id, snapshotSummary || 'Manual draft snapshot');
      setIsSnapshotModalOpen(false);
      setSnapshotSummary('');
      loadVersions();
    } catch (err: any) {
      alert(err.detail || 'Failed to create snapshot version.');
    }
  };

  const loadVersions = async () => {
    if (!proposal) return;
    try {
      const verList = await api.getVersions(proposal.id);
      setVersions(verList);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!proposal) return;
    if (!confirm('Are you sure you want to restore to this snapshot? Current unsaved changes will be overwritten.')) return;
    try {
      const restored = await api.restoreVersion(proposal.id, versionId);
      setProposal(restored);
      if (restored.sections.length > 0) {
        setActiveSectionId(restored.sections[0].id);
        setActiveContent(restored.sections[0].content_markdown);
      }
      alert('Proposal successfully restored to snapshot version.');
    } catch (err: any) {
      alert(err.detail || 'Failed to restore snapshot.');
    }
  };

  // Status transitions
  const handleStatusChange = async (newStatus: string) => {
    if (!proposal) return;
    try {
      await api.updateProposalStatus(proposal.id, newStatus);
      fetchProposal();
    } catch (err: any) {
      alert(err.detail || 'Failed to update proposal status.');
    }
  };

  // Confirmation questions
  const handleOpenAnswer = (q: ConfirmationQuestion) => {
    setSelectedQuestion(q);
    setQuestionAnswer(q.answer || '');
    setIsAnswerModalOpen(true);
  };

  const handleSaveQuestion = async (resolve: boolean = false) => {
    if (!selectedQuestion) return;
    try {
      await api.updateQuestion(selectedQuestion.id, {
        answer: questionAnswer,
        status: resolve ? 'resolved' : 'answered',
      });
      setIsAnswerModalOpen(false);
      fetchProposal();
    } catch (err: any) {
      alert(err.detail || 'Failed to update question.');
    }
  };

  if (!proposal) {
    return <div className="p-12 text-center text-sm text-slate-400">Loading proposal workspace...</div>;
  }

  const activeSection = proposal.sections.find((s) => s.id === activeSectionId);
  const openQuestionsCount = proposal.questions.filter((q) => q.status === 'open').length;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Header Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <Link to="/proposals" className="hover:text-slate-800">Proposals</Link>
            <span>/</span>
            <span className="font-semibold text-slate-900">{proposal.title}</span>
          </div>

          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold text-slate-900">{proposal.title}</h1>
            <Badge status={proposal.status} />
            <span className="text-xs font-mono font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              v{proposal.current_version_number}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Client: <strong>{proposal.client_name}</strong> &bull; Package: <strong>{proposal.service_package_name || 'Standard'}</strong>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Save Status Indicator */}
          <div className="text-xs font-medium px-2 py-1 rounded flex items-center space-x-1.5 text-slate-500">
            {saveStatus === 'saving' && (
              <>
                <div className="w-2.5 h-2.5 border-2 border-brand-700 border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Autosaved</span>
              </>
            )}
            {saveStatus === 'unsaved' && (
              <>
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Unsaved changes</span>
              </>
            )}
          </div>

          <button
            onClick={handleManualSave}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>Save</span>
          </button>

          <button
            onClick={() => {
              loadVersions();
              setIsSnapshotModalOpen(true);
            }}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Snapshots</span>
          </button>

          {/* Export Dropdown / Buttons */}
          <button
            onClick={() => api.downloadPdf(proposal.id, proposal.title)}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-brand-900 hover:bg-brand-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={() => api.downloadDocx(proposal.id, proposal.title)}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export DOCX</span>
          </button>

          {/* Status Workflow Selector */}
          <select
            value={proposal.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-brand-500"
          >
            <option value="draft">Status: Draft</option>
            <option value="in_review">Status: In Review</option>
            <option value="approved">Status: Approved</option>
            <option value="archived">Status: Archived</option>
          </select>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-4 border-b border-slate-200 px-2">
        <button
          onClick={() => setActiveTab('editor')}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'editor'
              ? 'border-brand-900 text-brand-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>SOW Editor</span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'questions'
              ? 'border-brand-900 text-brand-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
          <span>Confirmation Questions</span>
          {openQuestionsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
              {openQuestionsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            loadVersions();
            setActiveTab('versions');
          }}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'versions'
              ? 'border-brand-900 text-brand-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Version History</span>
        </button>

        <button
          onClick={() => setActiveTab('commercial')}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'commercial'
              ? 'border-brand-900 text-brand-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Commercial Terms</span>
        </button>
      </div>

      {/* VIEW 1: SOW Editor with Section Sidebar */}
      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Section Navigation Column */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5 block">
              Proposal Sections
            </span>
            {proposal.sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => handleSelectSection(sec)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                  sec.id === activeSectionId
                    ? 'bg-brand-50 text-brand-900 font-semibold border border-brand-200/60'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{sec.title}</span>
                {sec.is_protected && (
                  <span className="text-[9px] bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded font-mono shrink-0 ml-1">
                    LOCKED
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Active Section Content & Regeneration Workspace */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            {activeSection ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{activeSection.title}</h2>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center space-x-2">
                      <span>Key: <code>{activeSection.section_key}</code></span>
                      <span>&bull;</span>
                      <span>Sources: {activeSection.source_references?.join(', ') || 'NVIDIA NIM Draft'}</span>
                    </div>
                  </div>

                  {!activeSection.is_protected && activeSection.section_key !== 'commercial_terms' && (
                    <button
                      onClick={() => setIsRegenModalOpen(true)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-900 text-xs font-semibold transition-colors self-start sm:self-auto"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-brand-700" />
                      <span>Regenerate Section</span>
                    </button>
                  )}
                </div>

                {/* Editor Textarea with Markdown Support */}
                <div className="space-y-2">
                  <textarea
                    rows={18}
                    value={activeContent}
                    onChange={(e) => handleContentChange(e.target.value)}
                    disabled={activeSection.is_protected}
                    placeholder="Enter section content in Markdown..."
                    className="w-full font-mono text-xs leading-relaxed p-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-[#FAFAFA] disabled:bg-slate-50"
                  />
                  <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
                    <span>Supports Markdown formatting, bullet lists, and tables.</span>
                    <span>Version Lock: {activeSection.version_lock}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-sm text-slate-400">
                Select a section from the left navigation to begin editing.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: Unresolved Confirmation Questions (Section 7) */}
      {activeTab === 'questions' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Missing Information & Confirmation Center</h2>
            <p className="text-xs text-slate-500">
              Questions automatically flagged by the AI and commercial guardrail requiring human client/consultant resolution.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {proposal.questions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No open confirmation questions for this proposal.
              </div>
            ) : (
              proposal.questions.map((q) => (
                <div key={q.id} className="py-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-slate-900">{q.question}</span>
                        <Badge status={q.status} />
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase font-semibold">
                          {q.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        <strong>Impact:</strong> {q.impact} &bull; <strong>Rationale:</strong> {q.rationale}
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenAnswer(q)}
                      className="px-3 py-1 bg-brand-900 hover:bg-brand-800 text-white rounded text-xs font-semibold shrink-0 ml-3 transition-colors"
                    >
                      {q.status === 'open' ? 'Provide Answer' : 'Edit Resolution'}
                    </button>
                  </div>

                  {q.answer && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-800">
                      <strong>Confirmed Resolution:</strong> {q.answer}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: Version History & Snapshots (Section 6 & 10) */}
      {activeTab === 'versions' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Proposal Snapshots & Version History</h2>
              <p className="text-xs text-slate-500">Restore or review previous states of this proposal draft</p>
            </div>
            <button
              onClick={() => setIsSnapshotModalOpen(true)}
              className="px-3 py-1.5 bg-brand-900 hover:bg-brand-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              Create New Snapshot
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {versions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading version history...</div>
            ) : (
              versions.map((ver) => (
                <div key={ver.id} className="py-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">Version {ver.version_number}</span>
                      <span className="text-xs text-slate-500">&bull;</span>
                      <span className="text-xs text-slate-600">{ver.change_summary}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      Saved on {new Date(ver.created_at).toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRestoreVersion(ver.id)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded transition-colors"
                  >
                    Restore This Version
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW 4: Commercial Safeguard Panel (Section 5) */}
      {activeTab === 'commercial' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Authoritative Commercial Terms</h2>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            These commercial numbers are generated deterministically by ProposalCraft AI from your 
            organization's approved service package. The AI inference model is barred from modifying these terms.
          </p>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3 font-mono">
            {proposal.sections.find((s) => s.section_key === 'commercial_terms')?.content_markdown ? (
              <div className="whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed">
                {proposal.sections.find((s) => s.section_key === 'commercial_terms')?.content_markdown}
              </div>
            ) : (
              <p className="text-slate-400">No commercial section found.</p>
            )}
          </div>
        </div>
      )}

      {/* Modal: Regenerate Single Section */}
      <Modal
        isOpen={isRegenModalOpen}
        onClose={() => setIsRegenModalOpen(false)}
        title={`Regenerate Section: ${activeSection?.title}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Provide guidance to NVIDIA NIM for rewriting this specific section. All other sections of your proposal will be safely preserved.
          </p>

          <textarea
            rows={4}
            value={regenInstructions}
            onChange={(e) => setRegenInstructions(e.target.value)}
            placeholder="E.g., Emphasize low-latency integration requirements, expand on delivery milestones, or align with SOC2 compliance..."
            className="w-full p-3 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500"
          />

          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={() => setIsRegenModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRegenerateSection}
              disabled={isRegeneratingSection}
              className="px-4 py-2 rounded-lg bg-brand-900 hover:bg-brand-800 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isRegeneratingSection ? 'Regenerating via NVIDIA NIM...' : 'Regenerate Section'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Create Snapshot */}
      <Modal
        isOpen={isSnapshotModalOpen}
        onClose={() => setIsSnapshotModalOpen(false)}
        title="Create Proposal Snapshot"
      >
        <form onSubmit={handleCreateSnapshot} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Snapshot Summary / Change Note *</label>
            <input
              type="text"
              required
              value={snapshotSummary}
              onChange={(e) => setSnapshotSummary(e.target.value)}
              placeholder="E.g., Client reviewed deliverables; added Samsara telematics scope"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsSnapshotModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-brand-900 hover:bg-brand-800 text-white text-xs font-semibold transition-colors"
            >
              Save Snapshot
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Answer Confirmation Question */}
      <Modal
        isOpen={isAnswerModalOpen}
        onClose={() => setIsAnswerModalOpen(false)}
        title="Resolve Confirmation Question"
      >
        {selectedQuestion && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200/60 text-xs text-amber-900">
              <strong className="block font-bold mb-1">{selectedQuestion.question}</strong>
              <p>Impact: {selectedQuestion.impact}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Authoritative Answer / Confirmed Decision *
              </label>
              <textarea
                rows={3}
                required
                value={questionAnswer}
                onChange={(e) => setQuestionAnswer(e.target.value)}
                placeholder="Enter client-confirmed details or authorized decision..."
                className="w-full p-3 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAnswerModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveQuestion(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Save Draft Answer
              </button>
              <button
                type="button"
                onClick={() => handleSaveQuestion(true)}
                className="px-4 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
              >
                Mark as Resolved
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
