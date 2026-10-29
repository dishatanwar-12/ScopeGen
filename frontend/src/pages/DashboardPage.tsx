import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ArrowUpRight,
  Plus, 
  FileText, 
  Clock, 
  User, 
  LayoutTemplate,
  PenTool,
  UploadCloud,
  Layers,
  Users2,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';

const ARCHITECTURAL_THUMBS = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=160&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=160&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=160&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=160&auto=format&fit=crop&q=80',
];

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [templatesCount, setTemplatesCount] = useState<number>(0);
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [statsData, templatesData, aiData] = await Promise.allSettled([
          api.getDashboardStats(),
          api.getTemplates(),
          api.getAiStatus()
        ]);

        if (statsData.status === 'fulfilled') {
          setStats(statsData.value);
        }
        if (templatesData.status === 'fulfilled' && Array.isArray(templatesData.value)) {
          setTemplatesCount(templatesData.value.length);
        }
        if (aiData.status === 'fulfilled') {
          setAiStatus(aiData.value);
        }
      } catch (err: any) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const recentProposals = stats?.recent_proposals || [];

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="space-y-3.5 max-w-[1450px] mx-auto font-sans select-none pb-2">
      
      {/* 1. HERO SECTION (Screen-fitting panoramic architectural banner) */}
      <div className="relative overflow-hidden rounded-2xl border border-[#E7E2D8] bg-[#FAF8F5] shadow-2xs">
        {/* Panoramic architectural background */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=80"
            alt="ScopeGen architectural villa"
            className="w-full h-full object-cover object-right opacity-30 filter brightness-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/90 to-transparent"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 px-6 py-4 sm:px-7 sm:py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            <div className="space-y-1 max-w-xl">
              <div className="text-[10px] uppercase tracking-[0.22em] font-semibold text-[#73706B]">
                AI-Powered Proposal Assistant
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-[26px] font-serif font-medium text-[#1A1A1A] tracking-tight leading-snug">
                Turn Conversations into <span className="italic font-serif font-normal">Compelling Proposals</span>
              </h1>

              <p className="text-xs text-[#5C5954] max-w-lg leading-relaxed">
                Craft clear, professional, and client-ready proposals from your discovery notes — powered by NVIDIA's advanced LLM.
              </p>

              <div className="pt-1.5">
                <Link
                  to="/projects"
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-[#141518] hover:bg-[#25272F] text-white text-xs font-semibold shadow-xs transition-all group"
                >
                  <span>Create New Proposal</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Live Model Badge */}
            <div className="hidden lg:flex flex-col items-end justify-center shrink-0 space-y-1">
              <div className="inline-flex items-center space-x-2 bg-white/90 border border-[#E7E2D8] px-3 py-1.5 rounded-full shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] font-semibold text-[#1A1A1A]">NVIDIA NIM Online</span>
                <span className="text-[10px] text-[#73706B] font-mono">
                  {aiStatus?.model ? aiStatus.model.split('/').pop() : 'llama-3.2-11b'}
                </span>
              </div>
              <span className="text-[10px] text-[#8C877D] text-right">
                Deterministic commercial firewall active
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* 2. STATS ROW (4 Compact Metric Cards with Dynamic Data) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Metric 1: Total Proposals */}
        <div className="bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-start justify-between">
            <div className="w-7 h-7 rounded-lg bg-[#EDE7DF] border border-[#DDD5C9] flex items-center justify-center text-[#5C5954] shrink-0">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <svg className="w-14 h-5 text-[#73706B]" viewBox="0 0 100 35" fill="none">
              <path d="M0 28 Q 20 25, 35 22 T 70 12 T 100 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-[#1A1A1A] mt-1.5 font-sans">
            {isLoading ? '...' : (stats?.total_proposals ?? 0)}
          </div>
          <div className="text-xs text-[#73706B] font-medium">
            Total Proposals
          </div>
          <div className="text-[10px] text-[#2C8A4D] font-medium mt-0.5">
            {stats?.approved_proposals ?? 0} approved
          </div>
        </div>

        {/* Metric 2: In Progress */}
        <div className="bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-start justify-between">
            <div className="w-7 h-7 rounded-lg bg-[#EDE7DF] border border-[#DDD5C9] flex items-center justify-center text-[#5C5954] shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <svg className="w-14 h-5 text-[#73706B]" viewBox="0 0 100 35" fill="none">
              <path d="M0 30 Q 30 28, 50 20 T 80 18 T 100 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-[#1A1A1A] mt-1.5 font-sans">
            {isLoading ? '...' : (stats?.draft_proposals ?? 0)}
          </div>
          <div className="text-xs text-[#73706B] font-medium">
            In Progress
          </div>
          <div className="text-[10px] text-[#73706B] font-medium mt-0.5">
            {stats?.in_review_proposals ?? 0} in review
          </div>
        </div>

        {/* Metric 3: Clients */}
        <div className="bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-start justify-between">
            <div className="w-7 h-7 rounded-lg bg-[#EDE7DF] border border-[#DDD5C9] flex items-center justify-center text-[#5C5954] shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <svg className="w-14 h-5 text-[#73706B]" viewBox="0 0 100 35" fill="none">
              <path d="M0 26 Q 25 24, 45 28 T 75 14 T 100 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-[#1A1A1A] mt-1.5 font-sans">
            {isLoading ? '...' : (stats?.total_clients ?? 0)}
          </div>
          <div className="text-xs text-[#73706B] font-medium">
            Clients
          </div>
          <div className="text-[10px] text-[#73706B] font-medium mt-0.5">
            {stats?.total_projects ?? 0} active project scopes
          </div>
        </div>

        {/* Metric 4: Templates */}
        <div className="bg-[#FAF7F2] border border-[#E7E2D8] rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-start justify-between">
            <div className="w-7 h-7 rounded-lg bg-[#EDE7DF] border border-[#DDD5C9] flex items-center justify-center text-[#5C5954] shrink-0">
              <LayoutTemplate className="w-3.5 h-3.5" />
            </div>
            <svg className="w-14 h-5 text-[#73706B]" viewBox="0 0 100 35" fill="none">
              <path d="M0 28 Q 30 25, 55 24 T 80 15 T 100 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-[#1A1A1A] mt-1.5 font-sans">
            {isLoading ? '...' : (templatesCount || 1)}
          </div>
          <div className="text-xs text-[#73706B] font-medium">
            Templates
          </div>
          <div className="text-[10px] text-[#2C8A4D] font-medium mt-0.5">
            Company-approved layouts
          </div>
        </div>

      </div>

      {/* 3. MIDDLE SECTION (3 Columns Grid: Recent Proposals + Dark AI Showcase + Quick Actions & Help) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        
        {/* Column 1: Recent Proposals (Dynamic real proposals with thumbnail matching ScopeGen mockup) */}
        <div className="lg:col-span-5 bg-[#FAF7F2] border border-[#E7E2D8] rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-[#EAE5DE]">
              <h2 className="text-xs sm:text-sm font-semibold text-[#1A1A1A]">Recent Proposals</h2>
              <Link
                to="/proposals"
                className="text-xs font-medium text-[#73706B] hover:text-[#1A1A1A] flex items-center space-x-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-[#EAE5DE] mt-1">
              {isLoading ? (
                <div className="py-8 text-center text-xs text-[#73706B]">Loading proposals...</div>
              ) : recentProposals.length === 0 ? (
                <div className="py-6 text-center space-y-2">
                  <div className="w-9 h-9 rounded-full bg-[#EDE7DF] flex items-center justify-center text-[#73706B] mx-auto">
                    <FileText className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-[#1A1A1A] font-medium">No proposals drafted yet</p>
                  <p className="text-[11px] text-[#73706B] max-w-xs mx-auto">
                    Create a new project scope or import notes to generate your first AI proposal draft.
                  </p>
                  <Link
                    to="/projects"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#141518] text-white text-[11px] font-semibold mt-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Create Project Intake</span>
                  </Link>
                </div>
              ) : (
                recentProposals.slice(0, 4).map((item, index) => (
                  <div key={item.id} className="py-2 flex items-center justify-between hover:bg-black/[0.02] rounded-xl px-1.5 transition-colors">
                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                      <img
                        src={ARCHITECTURAL_THUMBS[index % ARCHITECTURAL_THUMBS.length]}
                        alt={item.title}
                        className="w-9 h-9 rounded-lg object-cover border border-[#DDD7CE] shrink-0"
                      />
                      <div className="min-w-0">
                        <Link
                          to={`/proposals/${item.id}`}
                          className="text-xs font-semibold text-[#1A1A1A] hover:text-black truncate block leading-tight"
                        >
                          {item.title}
                        </Link>
                        <div className="text-[10px] text-[#73706B] mt-0.5 truncate">
                          {item.project_title || 'Client Project'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <Badge status={item.status} />
                      <span className="hidden sm:inline text-[10px] text-[#8C877D]">
                        {formatDate(item.updated_at)}
                      </span>
                      <Link
                        to={`/proposals/${item.id}`}
                        className="p-1 rounded-md text-[#73706B] hover:text-[#1A1A1A] hover:bg-[#EDE7DF] transition-colors"
                        title="Open proposal workspace"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Dark Editorial AI Showcase Card (Dynamic live model and safety status) */}
        <div className="lg:col-span-4 bg-[#141518] border border-[#23262D] rounded-2xl p-4 text-white shadow-md flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-2.5 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#8C909B]">
                AI That Understands Your Business
              </span>
              <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] bg-[#22242C] text-[#C5C8D0] border border-[#313540]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Active</span>
              </span>
            </div>

            <div>
              <div className="text-sm font-serif font-medium text-white tracking-tight">
                NVIDIA NIM Hosted Model
              </div>
              <p className="text-[11px] text-[#8C909B] font-mono mt-0.5">
                {aiStatus?.model || 'meta/llama-3.2-11b-vision-instruct'}
              </p>
            </div>

            {/* Checklist items */}
            <div className="space-y-1.5 pt-1 border-t border-[#23262D]">
              <div className="flex items-center space-x-2 text-xs text-[#C5C8D0]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Extract key insights from discovery notes</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-[#C5C8D0]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Generate structured SOW content sections</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-[#C5C8D0]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Maintain your approved brand voice</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-[#C5C8D0]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Deterministic zero price fabrication guarantee</span>
              </div>
            </div>
          </div>

          {/* Action Link to Settings */}
          <div className="pt-2.5 border-t border-[#23262D] flex items-center justify-between text-[11px] text-[#8C909B] relative z-10">
            <span>Verified commercial integrity</span>
            <Link
              to="/projects"
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              title="Start New Proposal"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Column 3: Quick Actions + Need Help Card */}
        <div className="lg:col-span-3 flex flex-col justify-between gap-3">
          
          {/* Quick Actions Card */}
          <div className="bg-[#FAF7F2] border border-[#E7E2D8] rounded-2xl p-3.5 shadow-2xs flex-1">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE5DE]">
              <h2 className="text-xs sm:text-sm font-semibold text-[#1A1A1A]">Quick Actions</h2>
              <Link
                to="/projects"
                className="w-5 h-5 rounded-full bg-[#141518] hover:bg-[#25272F] text-white flex items-center justify-center text-xs transition-colors shadow-2xs"
                title="New Project Intake"
              >
                <Plus className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-1.5 mt-2">
              <Link
                to="/projects"
                className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-black/[0.03] transition-colors group"
              >
                <div className="w-6 h-6 rounded-lg bg-[#EDE7DF] border border-[#DDD5C9] flex items-center justify-center text-[#5C5954] shrink-0">
                  <PenTool className="w-3 h-3" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#1A1A1A] group-hover:text-black leading-tight">
                    Create New Proposal
                  </div>
                  <div className="text-[10px] text-[#73706B] leading-tight">
                    Start from notes or a template
                  </div>
                </div>
              </Link>

              <Link
                to="/projects"
                className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-black/[0.03] transition-colors group"
              >
                <div className="w-6 h-6 rounded-lg bg-[#EDE7DF] border border-[#DDD5C9] flex items-center justify-center text-[#5C5954] shrink-0">
                  <UploadCloud className="w-3 h-3" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#1A1A1A] group-hover:text-black leading-tight">
                    Upload Discovery Notes
                  </div>
                  <div className="text-[10px] text-[#73706B] leading-tight">
                    Paste or upload meeting notes
                  </div>
                </div>
              </Link>

              <Link
                to="/templates"
                className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-black/[0.03] transition-colors group"
              >
                <div className="w-6 h-6 rounded-lg bg-[#EDE7DF] border border-[#DDD5C9] flex items-center justify-center text-[#5C5954] shrink-0">
                  <Layers className="w-3 h-3" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#1A1A1A] group-hover:text-black leading-tight">
                    Browse Templates
                  </div>
                  <div className="text-[10px] text-[#73706B] leading-tight">
                    Use pre-approved templates
                  </div>
                </div>
              </Link>

              <Link
                to="/clients"
                className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-black/[0.03] transition-colors group"
              >
                <div className="w-6 h-6 rounded-lg bg-[#EDE7DF] border border-[#DDD5C9] flex items-center justify-center text-[#5C5954] shrink-0">
                  <Users2 className="w-3 h-3" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#1A1A1A] group-hover:text-black leading-tight">
                    Manage Clients
                  </div>
                  <div className="text-[10px] text-[#73706B] leading-tight">
                    View and edit client details
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Need Help Card (Matching ScopeGen Mockup) */}
          <div className="bg-[#FAF7F2] border border-[#E7E2D8] rounded-2xl p-3 shadow-2xs flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-[#1A1A1A]">Need Help?</div>
              <div className="text-[10px] text-[#73706B]">
                Explore guides, API docs, or system settings.
              </div>
            </div>
            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="w-7 h-7 rounded-full bg-[#EDE7DF] hover:bg-[#DDD5C9] text-[#1A1A1A] flex items-center justify-center shrink-0 transition-colors"
              title="Open API Documentation"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

      </div>

      {/* 4. BOTTOM QUOTE BANNER (Matching Image 2 ScopeGen Design) */}
      <div className="rounded-xl border border-[#E7E2D8] bg-[#FAF8F5] py-2 px-5 flex items-center justify-between shadow-2xs">
        <p className="text-xs sm:text-[13px] font-serif italic text-[#33312E] tracking-normal">
          “AI is not just a tool, it's a partner in creating meaningful business relationships.”
        </p>
        <span className="font-serif font-medium text-xs sm:text-sm text-[#1A1A1A] shrink-0 ml-4">
          ScopeGen
        </span>
      </div>

    </div>
  );
};
