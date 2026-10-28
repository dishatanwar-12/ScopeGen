import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, AlertCircle, Lock, Mail, User } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('consultant');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await register(email, password, fullName, role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.detail || 'Failed to create account. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-brand-900 flex items-center justify-center text-white shadow-sm">
            <FileText className="w-6 h-6 text-brand-300" />
          </div>
          <span className="font-bold text-2xl text-slate-900 tracking-tight">ProposalCraft</span>
        </Link>
        <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
          Create your account
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Morgan"
                  className="w-full px-3 py-2 pl-9 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Work Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@consulting.com"
                  className="w-full px-3 py-2 pl-9 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password (min 8 characters)
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 pl-9 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Account Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="consultant">Consultant / Practice Lead</option>
                <option value="reviewer">Proposal Reviewer / QA</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-brand-900 hover:bg-brand-800 text-white font-semibold text-sm shadow-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Create Workspace Account</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

