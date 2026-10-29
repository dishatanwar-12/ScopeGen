import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home,
  FilePlus2,
  Layers,
  Users,
  Package,
  FileText,
  Settings,
  Cpu
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'New Proposal', path: '/projects', icon: FilePlus2 },
    { label: 'Templates', path: '/templates', icon: Layers },
    { label: 'Clients', path: '/clients', icon: Users },
    { label: 'Service Packages', path: '/packages', icon: Package },
    { label: 'Proposals', path: '/proposals', icon: FileText },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#111215] border-r border-[#1E2026] flex flex-col shrink-0 min-h-screen select-none">
      {/* Brand Header */}
      <div className="p-6 pb-6">
        <NavLink to="/dashboard" className="flex items-center space-x-3 group">
          {/* ScopeGen Thin Eight-Pointed Star Icon */}
          <div className="text-white shrink-0">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              <line x1="4.93" y1="19.07" x2="19.07" y2="4.93" />
            </svg>
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight text-white font-sans">
              ScopeGen
            </div>
            <div className="text-[9px] uppercase tracking-[0.22em] text-[#71747D] font-medium">
              AI-Powered Proposals
            </div>
          </div>
        </NavLink>
      </div>

      {/* Nav Menu */}
      <div className="px-3.5 flex-1 space-y-1">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 text-[13px] rounded-xl transition-all ${
                    isActive
                      ? 'bg-[#1D1F26] text-white font-medium border border-[#2B2E38] shadow-xs'
                      : 'text-[#8C909B] hover:text-white hover:bg-[#18191E]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#8C909B]'}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs"></span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Powered by NVIDIA LLM card with dark 3D architectural texture */}
      <div className="p-4 mt-auto">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1C1D24] via-[#14151A] to-[#0A0A0D] border border-[#262832] p-4 shadow-lg">
          {/* Subtle curved wave background overlay */}
          <div className="absolute right-0 bottom-0 w-28 h-28 pointer-events-none opacity-25">
            <svg viewBox="0 0 100 100" fill="none">
              <path d="M100 0C60 20 20 60 0 100H100V0Z" fill="url(#metallicGlow)" />
              <defs>
                <linearGradient id="metallicGlow" x1="0" y1="0" x2="100" y2="100">
                  <stop stopColor="#D4AF37" stopOpacity="0.8" />
                  <stop offset="1" stopColor="#333333" stopOpacity="0.1" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="relative z-10">
            {/* NVIDIA pill */}
            <div className="inline-flex items-center space-x-2 bg-[#262832]/80 backdrop-blur-xs border border-[#3A3D4A] px-2.5 py-1 rounded-full text-[11px] text-white font-medium mb-2.5">
              <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-slate-400 to-white flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#111215]"></div>
              </div>
              <span className="text-[10px] text-[#A4A7B0]">Powered by</span>
              <span className="font-semibold text-white">NVIDIA LLM</span>
            </div>

            <p className="text-[11px] text-[#8C8F96] leading-relaxed">
              Transform ideas into professional proposals with AI.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
