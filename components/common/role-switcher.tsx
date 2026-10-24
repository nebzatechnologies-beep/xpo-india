'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ShieldCheck, UserCheck, Briefcase, LogOut, ChevronDown, ChevronUp, Sparkles, RefreshCw } from 'lucide-react';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function RoleSwitcher() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [minimized, setMinimized] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/demo-switch');
      const data = await res.json();
      if (data.authenticated && data.user) {
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [pathname]);

  const handleSwitch = async (role: 'superadmin' | 'lead_creator' | 'lead_absorber' | 'logout') => {
    try {
      setLoadingRole(role);
      const res = await fetch('/api/auth/demo-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (err) {
      console.error('Role switch failed:', err);
    } finally {
      setLoadingRole(null);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'superadmin':
        return { label: 'Superadmin', icon: '👑', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'lead_creator':
        return { label: 'Lead Creator', icon: '📋', color: 'bg-red-100 text-[#E8192C] border-red-200' };
      case 'lead_absorber':
        return { label: 'Lead Absorber', icon: '⚡', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      default:
        return { label: 'Not Logged In', icon: '👤', color: 'bg-gray-100 text-[#717171] border-gray-200' };
    }
  };

  const currentBadge = getRoleBadge(currentUser?.role);

  return (
    <aside aria-label="Demo Role Switcher" className="fixed bottom-4 right-4 z-50 select-none">
      <div className="bg-[#1E1E24]/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-white/10 p-3.5 max-w-sm w-full transition-all">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-white/90 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#E8192C]" /> XPO Role Switcher
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentBadge.color}`}>
              {currentBadge.icon} {currentBadge.label}
            </span>
            <button
              onClick={() => setMinimized(!minimized)}
              className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              title={minimized ? 'Expand' : 'Minimize'}
            >
              {minimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Content (collapsible) */}
        {!minimized && (
          <div className="pt-2.5 space-y-2">
            {currentUser && (
              <div className="text-[11px] text-white/70 truncate pb-1">
                Active: <span className="font-semibold text-white">{currentUser.email}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleSwitch('superadmin')}
                disabled={loadingRole !== null}
                className={`flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all ${
                  currentUser?.role === 'superadmin'
                    ? 'bg-purple-600 text-white font-bold ring-2 ring-purple-300'
                    : 'bg-white/5 hover:bg-white/15 text-white/90 font-medium'
                } disabled:opacity-50`}
              >
                {loadingRole === 'superadmin' ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-300 mb-1" />
                ) : (
                  <span className="text-base mb-0.5">👑</span>
                )}
                <span className="text-[10px] font-bold">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitch('lead_creator')}
                disabled={loadingRole !== null}
                className={`flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all ${
                  currentUser?.role === 'lead_creator'
                    ? 'bg-[#E8192C] text-white font-bold ring-2 ring-red-300'
                    : 'bg-white/5 hover:bg-white/15 text-white/90 font-medium'
                } disabled:opacity-50`}
              >
                {loadingRole === 'lead_creator' ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-red-300 mb-1" />
                ) : (
                  <span className="text-base mb-0.5">📋</span>
                )}
                <span className="text-[10px] font-bold">Creator</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitch('lead_absorber')}
                disabled={loadingRole !== null}
                className={`flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all ${
                  currentUser?.role === 'lead_absorber'
                    ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-300'
                    : 'bg-white/5 hover:bg-white/15 text-white/90 font-medium'
                } disabled:opacity-50`}
              >
                {loadingRole === 'lead_absorber' ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-300 mb-1" />
                ) : (
                  <span className="text-base mb-0.5">⚡</span>
                )}
                <span className="text-[10px] font-bold">Absorber</span>
              </button>
            </div>

            {currentUser && (
              <button
                type="button"
                onClick={() => handleSwitch('logout')}
                disabled={loadingRole !== null}
                className="w-full mt-1 py-1.5 px-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3 h-3" /> Log Out
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
