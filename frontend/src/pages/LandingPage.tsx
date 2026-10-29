import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileCheck2, 
  ShieldCheck, 
  Cpu, 
  ArrowRight, 
  CheckCircle2, 
  FileDown, 
  Layers, 
  Lock,
  Sparkles
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8F9F8] flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 border-b border-[#ECEEE9] bg-gradient-to-b from-white via-white to-[#FAF8F5]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#EEF5F0] text-[#1E4D38] border border-[#D5E5DA] mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#c89839]" />
            <span>NVIDIA NIM Hosted LLM Inference Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-semibold text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Create Professional Proposals <br />
            <span className="text-[#235c3b] font-serif">with Verified AI</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Convert discovery notes, interviews, and client documents into structured, 
            contract-ready Statements of Work in minutes — backed by a
            <strong className="text-slate-900 font-semibold"> strict commercial integrity firewall</strong>.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-[#235c3b] hover:bg-[#1b472e] shadow-xs transition-colors"
            >
              <span>Start Drafting Proposals</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-medium text-slate-700 bg-white border border-[#ECEEE9] hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Sign In to Workspace
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#235c3b]" />
              <span>Zero Hallucinated Pricing</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#235c3b]" />
              <span>Approved Service Packages</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#235c3b]" />
              <span>ReportLab PDF & DOCX Exports</span>
            </span>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-16 bg-[#F8F9F8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-slate-900">
              Commercial Integrity by Design
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              The AI crafts the technical narrative, while authoritative financial terms are deterministically managed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-7 rounded-3xl border border-[#ECEEE9] shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-[#EEF5F0] border border-[#D5E5DA] flex items-center justify-center text-[#235c3b] mb-5">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Zero Price Invention</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Rates, payment milestones, and currency totals are injected exclusively from admin-approved packages — never hallucinated by LLMs.
              </p>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-[#ECEEE9] shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-[#EFF6FE] border border-[#DEEDFC] flex items-center justify-center text-[#2563EB] mb-5">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Approved Packages</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pre-approved scopes, deliverables, inclusions, and exclusions ensure complete consistency and minimize delivery risk.
              </p>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-[#ECEEE9] shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-[#FCF6EE] border border-[#F5EAD9] flex items-center justify-center text-[#A7632A] mb-5">
                <FileDown className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Executive Exports</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Download fully formatted, professional PDF proposals with two-pass pagination or editable Microsoft Word DOCX documents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-[#ECEEE9] bg-white text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4">
          ProPoseAI &copy; 2026. From Conversations to Compelling Proposals.
        </div>
      </footer>
    </div>
  );
};

