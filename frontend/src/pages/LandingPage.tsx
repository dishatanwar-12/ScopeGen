import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileCheck2, 
  ShieldCheck, 
  Cpu, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  FileDown, 
  Layers, 
  Lock 
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 border-b border-slate-200/80 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 mb-6">
            <Cpu className="w-3.5 h-3.5 text-brand-600" />
            <span>NVIDIA NIM Hosted LLM Inference Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            High-Precision SOW & Proposal Drafting for IT Consultants & Agencies
          </h1>

          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Convert client discovery notes, interviews, and uploaded documents into structured, 
            contract-ready Statements of Work — powered by official NVIDIA NIM hosted models with a 
            <strong className="text-slate-900 font-semibold"> strict deterministic pricing firewall</strong>.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-lg text-base font-semibold text-white bg-brand-900 hover:bg-brand-800 shadow-sm transition-colors"
            >
              <span>Start Drafting Proposals</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-lg text-base font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Sign In to Workspace
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Zero Hallucinated Pricing</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ReportLab PDF & DOCX Export</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Enterprise Prompt Injection Defenses</span>
            </span>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-slate-900">Built Specifically for Commercial Integrity</h2>
          <p className="mt-2 text-sm text-slate-600">
            Unlike generic chatbots, ProposalCraft AI separates generative narrative synthesis from authoritative commercial data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Deterministic Pricing Firewall</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              The AI model is strictly prohibited from inventing fees, hourly rates, payment terms, or discounts. All commercial figures are sourced from approved service package records.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Real NVIDIA NIM LLM Hosted</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Leverages high-throughput, low-latency open LLMs hosted on NVIDIA NIM microservices. Structured JSON response validation with Pydantic ensures contract completeness.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
              <FileDown className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Polished PDF & DOCX Exports</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Export client-ready PDF deliverables with custom styling, deliverable tables, and headers/footers, or editable DOCX files for Microsoft Word revision workflows.
            </p>
          </div>
        </div>
      </section>

      {/* Workflow Step-by-Step */}
      <section className="bg-white py-16 border-t border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">End-to-End Proposal Engineering</h2>
          
          <div className="space-y-6">
            {[
              { step: '01', title: 'Capture Client & Project Context', desc: 'Define business objectives, constraints, target timeline, and existing tech stack.' },
              { step: '02', title: 'Ingest Discovery Notes & Documents', desc: 'Paste interview notes or upload TXT, PDF, and DOCX files. Content is sanitized against prompt injection.' },
              { step: '03', title: 'Select Approved Service Package', desc: 'Attach an authorized company service package containing verified deliverables and commercial rate terms.' },
              { step: '04', title: 'Review Pre-Generation Fact Breakdown', desc: 'Inspect confirmed facts, unconfirmed assumptions, and potential contradictions before invoking NVIDIA NIM.' },
              { step: '05', title: 'Interactive SOW Workspace & Export', desc: 'Refine sections in a rich-text editor, resolve confirmation questions, track versions, and export PDF/DOCX.' },
            ].map((s) => (
              <div key={s.step} className="flex items-start space-x-4 p-4 rounded-lg bg-[#F8FAFC] border border-slate-200/60">
                <span className="font-mono text-xs font-bold px-2 py-1 bg-brand-900 text-white rounded shrink-0">{s.step}</span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{s.title}</h4>
                  <p className="text-xs text-slate-600 mt-1">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          ProposalCraft AI &copy; 2026. Enterprise Proposal & Statement of Work Drafting Platform. NVIDIA NIM Powered.
        </div>
      </footer>
    </div>
  );
};
