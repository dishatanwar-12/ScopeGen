import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  FileSignature, 
  Package, 
  Layers, 
  Settings,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Clients', path: '/clients', icon: Users },
    { label: 'Projects', path: '/projects', icon: FolderKanban },
    { label: 'Proposals & SOW', path: '/proposals', icon: FileSignature },
    { label: 'Service Packages', path: '/packages', icon: Package },
    { label: 'Templates', path: '/templates', icon: Layers },
    { label: 'Settings & Status', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 flex-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-3 mb-2">
          Workspace
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-900 border border-brand-200/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 text-slate-500" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Commercial Safeguard Callout */}
      <div className="p-4 border-t border-slate-100 m-3 bg-slate-50 rounded-xl border border-slate-200/60">
        <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-800 mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Pricing Firewall Active</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          AI model strictly forbidden from fabricating commercial numbers or rates.
        </p>
      </div>
    </aside>
  );
};
