'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Briefcase,
  CheckCircle2,
  LogOut,
  RefreshCw,
} from 'lucide-react';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    // Check if user is already signed in
    fetch('/api/auth/demo-switch')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  // Guaranteed instant 1-click demo login
  const handleDemoLogin = async (role: 'superadmin' | 'lead_creator' | 'lead_absorber') => {
    try {
      setDemoLoading(role);
      setErrorMsg('');

      const res = await fetch('/api/auth/demo-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();
      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setErrorMsg(data.error || 'Failed to authenticate demo account.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error during login.');
    } finally {
      setDemoLoading(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/demo-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'logout' }),
      });
      setCurrentUser(null);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const normalizedEmail = email.trim().toLowerCase();

      // Check if credentials match any of the 3 demo accounts for instant zero-latency routing
      if (normalizedEmail === 'admin@xpoindia.com' && password === 'XPOAdmin@2024') {
        await handleDemoLogin('superadmin');
        return;
      }
      if (normalizedEmail === 'creator@xpoindia.com' && password === 'Creator@2024') {
        await handleDemoLogin('lead_creator');
        return;
      }
      if (normalizedEmail === 'absorber@xpoindia.com' && password === 'Absorber@2024') {
        await handleDemoLogin('lead_absorber');
        return;
      }

      // Fallback for custom registered accounts using NextAuth credentials
      const { signIn } = await import('next-auth/react');
      const res = await signIn('credentials', {
        email: normalizedEmail,
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMsg('Invalid email or password. Please try again.');
        return;
      }

      let targetUrl = '/admin/dashboard';
      if (normalizedEmail.includes('creator')) {
        targetUrl = '/creator/dashboard';
      } else if (normalizedEmail.includes('absorber')) {
        targetUrl = '/absorber/opportunities';
      }
      window.location.href = targetUrl;
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const fillForm = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  const getRoleDashboard = (role: string) => {
    if (role === 'superadmin') return '/admin/dashboard';
    if (role === 'lead_creator') return '/creator/dashboard';
    return '/absorber/opportunities';
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-3">
          <span className="w-10 h-10 rounded-2xl bg-[#E8192C] flex items-center justify-center text-white font-extrabold text-xl shadow-md">
            X
          </span>
          <span className="text-2xl font-black tracking-tight text-[#222222]">
            XPO <span className="text-[#E8192C]">INDIA</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold text-[#222222] tracking-tight">Select Workspace & Sign In</h2>
        <p className="mt-1 text-sm text-[#717171]">Choose any role below for instant 1-click access or enter your credentials</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <Card className="p-7 sm:p-8 rounded-3xl border border-[#EBEBEB] shadow-xl bg-white space-y-6">
          {/* Active Session Notification if already logged in */}
          {currentUser && (
            <div className="p-4 rounded-2xl bg-neutral-900 text-white flex items-center justify-between gap-3 text-xs shadow-md">
              <div>
                <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">Currently Logged In</div>
                <div className="font-bold text-white flex items-center gap-1.5 mt-0.5">
                  <span>{currentUser.role === 'superadmin' ? '👑 Superadmin' : currentUser.role === 'lead_creator' ? '📋 Lead Creator' : '⚡ Lead Absorber'}</span>
                  <span className="text-white/60">({currentUser.email})</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={getRoleDashboard(currentUser.role)}
                  className="px-3 py-1.5 rounded-xl bg-[#E8192C] hover:bg-red-700 text-white font-bold text-xs transition-colors"
                >
                  Dashboard ↗
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
              {errorMsg}
            </div>
          )}

          {/* 3 Prominent 1-Click Role Login Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#E8192C] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Instant 1-Click Demo Logins
              </span>
              <Badge variant="outline" className="text-[10px] bg-red-50 border-red-200 text-[#E8192C] font-semibold">
                Guaranteed Access
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Superadmin Card */}
              <button
                type="button"
                onClick={() => handleDemoLogin('superadmin')}
                disabled={Boolean(demoLoading) || loading}
                className="w-full p-3.5 rounded-2xl bg-white border border-[#EBEBEB] hover:border-purple-300 hover:bg-purple-50/40 text-left flex items-center justify-between text-xs transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                    👑
                  </div>
                  <div>
                    <div className="font-bold text-[#222222] group-hover:text-purple-900 flex items-center gap-1.5">
                      Superadmin Workspace
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold uppercase">Admin</span>
                    </div>
                    <div className="text-[11px] text-[#717171] mt-0.5">
                      Taxonomy, CRM, Excel import, WhatsApp, Ledger
                    </div>
                  </div>
                </div>
                <div className="shrink-0 pl-2">
                  {demoLoading === 'superadmin' ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                  ) : (
                    <span className="text-xs font-bold text-purple-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Enter <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </button>

              {/* Lead Creator Card */}
              <button
                type="button"
                onClick={() => handleDemoLogin('lead_creator')}
                disabled={Boolean(demoLoading) || loading}
                className="w-full p-3.5 rounded-2xl bg-white border border-[#EBEBEB] hover:border-red-300 hover:bg-red-50/40 text-left flex items-center justify-between text-xs transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 text-[#E8192C] flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                    📋
                  </div>
                  <div>
                    <div className="font-bold text-[#222222] group-hover:text-[#E8192C] flex items-center gap-1.5">
                      Lead Creator Workspace
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-100 text-[#E8192C] font-bold uppercase">Buyer</span>
                    </div>
                    <div className="text-[11px] text-[#717171] mt-0.5">
                      Post buyer specifications & review incoming quotes
                    </div>
                  </div>
                </div>
                <div className="shrink-0 pl-2">
                  {demoLoading === 'lead_creator' ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#E8192C]" />
                  ) : (
                    <span className="text-xs font-bold text-[#E8192C] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Enter <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </button>

              {/* Lead Absorber Card */}
              <button
                type="button"
                onClick={() => handleDemoLogin('lead_absorber')}
                disabled={Boolean(demoLoading) || loading}
                className="w-full p-3.5 rounded-2xl bg-white border border-[#EBEBEB] hover:border-blue-300 hover:bg-blue-50/40 text-left flex items-center justify-between text-xs transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                    ⚡
                  </div>
                  <div>
                    <div className="font-bold text-[#222222] group-hover:text-blue-900 flex items-center gap-1.5">
                      Lead Absorber Workspace
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-bold uppercase">Provider</span>
                    </div>
                    <div className="text-[11px] text-[#717171] mt-0.5">
                      Browse leads, match skills, and submit bids
                    </div>
                  </div>
                </div>
                <div className="shrink-0 pl-2">
                  {demoLoading === 'lead_absorber' ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <span className="text-xs font-bold text-blue-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Enter <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#EBEBEB]" />
            </div>
            <div className="relative flex justify-center text-xs text-[#717171]">
              <span className="bg-white px-2">or type credentials manually</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#222222]">Email Address</label>
                <div className="text-[10px] text-[#717171] space-x-1">
                  <span>Quick-fill:</span>
                  <button
                    type="button"
                    onClick={() => fillForm('admin@xpoindia.com', 'XPOAdmin@2024')}
                    className="text-purple-700 hover:underline font-bold"
                  >
                    Admin
                  </button>
                  <span>|</span>
                  <button
                    type="button"
                    onClick={() => fillForm('creator@xpoindia.com', 'Creator@2024')}
                    className="text-[#E8192C] hover:underline font-bold"
                  >
                    Creator
                  </button>
                  <span>|</span>
                  <button
                    type="button"
                    onClick={() => fillForm('absorber@xpoindia.com', 'Absorber@2024')}
                    className="text-blue-700 hover:underline font-bold"
                  >
                    Absorber
                  </button>
                </div>
              </div>
              <Input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl border-[#EBEBEB] text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#222222]">Password</label>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-xl border-[#EBEBEB] text-sm"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-semibold mt-2 rounded-xl"
              isLoading={loading}
            >
              Sign In to XPO India
            </Button>
          </form>

          <div className="text-center text-xs text-[#717171] pt-2">
            Don&apos;t have an account yet?{' '}
            <Link href="/register" className="font-semibold text-[#E8192C] hover:underline">
              Create free account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}