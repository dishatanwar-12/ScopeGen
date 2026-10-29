import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Lock, Mail } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.detail || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = (role: 'admin' | 'consultant') => {
    if (role === 'admin') {
      setEmail('admin@proposalcraft.ai');
      setPassword('Admin12345!');
    } else {
      setEmail('consultant@proposalcraft.ai');
      setPassword('Consultant12345!');
    }
  };

  return (
    <div className="min-h-screen bg-[#F3EFEA] flex flex-col justify-center py-12 sm:px-6 lg:px-8 select-none">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex flex-col items-center">
          <div className="flex items-center space-x-2.5 text-[#141518]">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              <line x1="4.93" y1="19.07" x2="19.07" y2="4.93" />
            </svg>
            <span className="font-sans font-bold text-2xl text-[#141518] tracking-tight">ScopeGen</span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#73706B] font-medium mt-1">
            AI-Powered Proposals
          </p>
        </Link>
        <h2 className="mt-5 text-2xl font-serif font-medium tracking-tight text-[#1A1A1A]">
          Sign in to your workspace
        </h2>
        <p className="mt-1 text-xs text-[#73706B]">
          Or{' '}
          <Link to="/register" className="font-semibold text-[#141518] hover:underline">
            create a new consultant account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#FAF8F5] py-8 px-6 shadow-xs border border-[#E7E2D8] rounded-3xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#73706B] uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-[#DDD7CE] bg-[#FAF8F5] text-sm text-[#1A1A1A] focus:outline-hidden focus:ring-1 focus:ring-[#141518] transition-all"
                />
                <Mail className="w-4 h-4 text-[#8C877D] absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#73706B] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-[#DDD7CE] bg-[#FAF8F5] text-sm text-[#1A1A1A] focus:outline-hidden focus:ring-1 focus:ring-[#141518] transition-all"
                />
                <Lock className="w-4 h-4 text-[#8C877D] absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-full bg-[#141518] hover:bg-[#25272F] text-white font-semibold text-sm shadow-md transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-5 border-t border-[#EAE5DE]">
            <p className="text-[10px] font-semibold text-[#8C877D] uppercase tracking-wider mb-2.5 text-center">
              Quick Development Logins
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('consultant')}
                className="py-2 px-2.5 rounded-xl border border-[#DDD7CE] bg-white hover:bg-[#F3EFEA] text-xs font-medium text-[#1A1A1A] transition-colors"
              >
                Lead Consultant
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('admin')}
                className="py-2 px-2.5 rounded-xl border border-[#DDD7CE] bg-white hover:bg-[#F3EFEA] text-xs font-medium text-[#1A1A1A] transition-colors"
              >
                Administrator
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


