import React, { useState } from 'react';
import { Search, Bell, ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="bg-[#F3EFEA] border-b border-[#E7E2D8] sticky top-0 z-30 px-8 py-3.5">
      <div className="flex items-center justify-between gap-6">
        {/* Search Bar matching ScopeGen design */}
        <div className="relative max-w-md w-full">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#8C877D] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search proposals, clients, templates..."
              className="w-full pl-10 pr-14 py-2 text-xs md:text-sm bg-[#EAE5DE] border border-[#DDD7CE] rounded-xl text-[#1A1A1A] placeholder-[#8C877D] focus:outline-hidden focus:ring-1 focus:ring-[#111215] transition-all"
            />
            <div className="absolute right-3 flex items-center pointer-events-none">
              <span className="text-[10px] font-medium text-[#73706B] bg-[#F3EFEA]/80 border border-[#DDD7CE] px-1.5 py-0.5 rounded shadow-2xs">
                ⌘ K
              </span>
            </div>
          </div>
        </div>

        {/* Right Action Icons: Notification Bell & User Profile */}
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <button
            type="button"
            className="relative w-9 h-9 rounded-full flex items-center justify-center text-[#4A4742] hover:text-[#1A1A1A] hover:bg-[#EAE5DE] transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#E05238] rounded-full ring-2 ring-[#F3EFEA]"></span>
          </button>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-[#EAE5DE] transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-[#EAE5DE] border border-[#DDD7CE] flex items-center justify-center text-[#5C5954]">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="hidden sm:block text-left pr-1">
                <div className="text-xs font-semibold text-[#1A1A1A] leading-tight">
                  {user?.full_name || 'Sarah Khan'}
                </div>
                <div className="text-[10px] text-[#73706B] capitalize leading-tight">
                  Project Manager
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#73706B]" />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-[#FAF8F5] border border-[#E7E2D8] rounded-2xl shadow-xl py-1.5 z-50 text-xs">
                <div className="px-3 py-2 border-b border-[#E7E2D8]">
                  <p className="font-semibold text-[#1A1A1A]">{user?.full_name || 'Sarah Khan'}</p>
                  <p className="text-[11px] text-[#73706B] truncate">{user?.email || 'sarah@scopegen.ai'}</p>
                </div>
                {user ? (
                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors rounded-b-xl"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <a
                    href="/login"
                    className="block px-3 py-2 text-[#1A1A1A] hover:bg-[#EAE5DE] transition-colors"
                  >
                    Sign In
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
