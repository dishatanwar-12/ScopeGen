import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Cpu, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Server
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [isLoadingAiStatus, setIsLoadingAiStatus] = useState(false);

  const checkAiStatus = async () => {
    setIsLoadingAiStatus(true);
    try {
      const data = await api.getAiStatus();
      setAiStatus(data);
    } catch (err: any) {
      setAiStatus({
        configured: false,
        status: 'error',
        message: err.detail || 'Failed to connect to backend AI verification endpoint.'
      });
    } finally {
      setIsLoadingAiStatus(false);
    }
  };

  useEffect(() => {
    checkAiStatus();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings & AI Status</h1>
        <p className="text-sm text-slate-500">
          Account details, security policies, and NVIDIA NIM hosted model status
        </p>
      </div>

      {/* NVIDIA NIM Hosted Inference Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">NVIDIA NIM Hosted Model Integration</h2>
              <p className="text-xs text-slate-500">Live verification against NVIDIA API Catalog</p>
            </div>
          </div>

          <button
            onClick={checkAiStatus}
            disabled={isLoadingAiStatus}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAiStatus ? 'animate-spin' : ''}`} />
            <span>Test Connectivity</span>
          </button>
        </div>

        {isLoadingAiStatus ? (
          <div className="p-6 text-center text-xs text-slate-400">Verifying NVIDIA NIM connection...</div>
        ) : aiStatus ? (
          <div className="space-y-3">
            <div className={`p-4 rounded-xl border text-xs flex items-start space-x-3 ${
              aiStatus.status === 'connected'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : aiStatus.status === 'unconfigured'
                ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                : 'bg-red-50/70 border-red-200 text-red-900'
            }`}>
              {aiStatus.status === 'connected' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <strong className="font-bold text-sm block">
                  {aiStatus.status === 'connected' ? 'Connected to NVIDIA NIM API' : 'NVIDIA Key Notice'}
                </strong>
                <p className="mt-0.5">{aiStatus.message}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">Configured Model</span>
                <span className="text-slate-900">{aiStatus.model || 'meta/llama-3.3-70b-instruct'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">Endpoint</span>
                <span className="text-slate-900 truncate block">{aiStatus.base_url || 'https://integrate.api.nvidia.com/v1'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">API Key Protection</span>
                <span className="text-emerald-700 font-bold font-sans">Server-Side Kept</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">User Profile</h2>
            <p className="text-xs text-slate-500">Active credentials and role permissions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">Full Name</span>
            <span className="text-sm font-bold text-slate-900">{user?.full_name}</span>
          </div>

          <div>
            <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">Email Address</span>
            <span className="text-sm font-bold text-slate-900">{user?.email}</span>
          </div>

          <div>
            <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">Role Permission</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase font-mono inline-block mt-0.5">
              {user?.role}
            </span>
          </div>

          <div>
            <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">Tenant Isolation</span>
            <span className="text-xs text-emerald-800 font-semibold inline-flex items-center space-x-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Isolated to Account ({user?.id.slice(0, 8)}...)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
