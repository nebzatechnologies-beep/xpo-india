const fs = require('fs');
const path = require('path');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeFile(relPath, content) {
  const fullPath = path.join(__dirname, '..', relPath);
  ensureDir(fullPath);
  fs.writeFileSync(fullPath, content.trim(), 'utf8');
  console.log(`Created: ${relPath}`);
}

// 1. app/(auth)/login/page.tsx
writeFile('app/(auth)/login/page.tsx', `'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles, UserCheck, Briefcase } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string, redirectPath?: string) => {
    if (e) e.preventDefault();
    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    if (!loginEmail || !loginPass) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      if (customEmail) {
        setDemoLoading(customEmail);
      } else {
        setLoading(true);
      }
      setErrorMsg('');

      const res = await signIn('credentials', {
        email: loginEmail,
        password: loginPass,
        redirect: false,
      });

      if (res?.error) {
        setErrorMsg('Invalid email or password. Please try again.');
        return;
      }

      if (redirectPath) {
        router.push(redirectPath);
      } else if (loginEmail.includes('admin')) {
        router.push('/admin/dashboard');
      } else if (loginEmail.includes('creator')) {
        router.push('/creator/dashboard');
      } else {
        router.push('/absorber/opportunities');
      }
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
      setDemoLoading(null);
    }
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
        <h2 className="text-2xl font-bold text-[#222222] tracking-tight">Welcome back</h2>
        <p className="mt-1 text-sm text-[#717171]">Log in to manage leads, respond to opportunities, or access transactions</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="p-8 rounded-3xl border border-[#EBEBEB] shadow-xl bg-white">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
              {errorMsg}
            </div>
          )}

          {/* Quick Demo Logins Section */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-red-50/50 via-white to-orange-50/30 border border-red-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#E8192C] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> 1-Click Demo Accounts
              </span>
              <Badge variant="outline" className="text-[10px] bg-white border-red-200 text-[#E8192C]">
                Ready to Test
              </Badge>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleLogin(undefined, 'admin@xpoindia.com', 'XPOAdmin@2024', '/admin/dashboard')}
                disabled={Boolean(demoLoading) || loading}
                className="w-full py-2.5 px-3 rounded-xl bg-white border border-[#EBEBEB] hover:border-[#222222] hover:bg-[#F7F7F7] text-left flex items-center justify-between text-xs font-semibold text-[#222222] transition-all disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">👑</span>
                  <div>
                    <div className="font-bold">Superadmin Demo</div>
                    <div className="text-[10px] text-[#717171]">admin@xpoindia.com</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#717171]" />
              </button>

              <button
                type="button"
                onClick={() => handleLogin(undefined, 'creator@xpoindia.com', 'Creator@2024', '/creator/dashboard')}
                disabled={Boolean(demoLoading) || loading}
                className="w-full py-2.5 px-3 rounded-xl bg-white border border-[#EBEBEB] hover:border-[#222222] hover:bg-[#F7F7F7] text-left flex items-center justify-between text-xs font-semibold text-[#222222] transition-all disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-red-100 text-[#E8192C] flex items-center justify-center font-bold">📋</span>
                  <div>
                    <div className="font-bold">Lead Creator Demo</div>
                    <div className="text-[10px] text-[#717171]">creator@xpoindia.com</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#717171]" />
              </button>

              <button
                type="button"
                onClick={() => handleLogin(undefined, 'absorber@xpoindia.com', 'Absorber@2024', '/absorber/opportunities')}
                disabled={Boolean(demoLoading) || loading}
                className="w-full py-2.5 px-3 rounded-xl bg-white border border-[#EBEBEB] hover:border-[#222222] hover:bg-[#F7F7F7] text-left flex items-center justify-between text-xs font-semibold text-[#222222] transition-all disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">⚡</span>
                  <div>
                    <div className="font-bold">Lead Absorber Demo</div>
                    <div className="text-[10px] text-[#717171]">absorber@xpoindia.com</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#717171]" />
              </button>
            </div>
          </div>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#EBEBEB]" />
            </div>
            <div className="relative flex justify-center text-xs text-[#717171]">
              <span className="bg-white px-2">or login with credentials</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#222222] mb-1">Email Address</label>
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
                <Link href="#" className="text-xs text-[#E8192C] hover:underline">
                  Forgot password?
                </Link>
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
              className="w-full font-semibold mt-2"
              isLoading={loading}
            >
              Sign In to XPO India
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-[#717171]">
            Don't have an account yet?{' '}
            <Link href="/register" className="font-semibold text-[#E8192C] hover:underline">
              Create free account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
`);

// 2. app/(auth)/register/page.tsx
writeFile('app/(auth)/register/page.tsx', `'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Building2, User, ArrowRight, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<'lead_creator' | 'lead_absorber'>('lead_creator');
  const [accountType, setAccountType] = useState<'business' | 'individual'>('business');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('IN');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg('');

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          company,
          password,
          role,
          accountType,
          country,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      // Auto sign-in
      const signInRes = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        router.push('/login');
      } else {
        router.push(role === 'lead_creator' ? '/creator/dashboard' : '/absorber/opportunities');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-3">
          <span className="w-10 h-10 rounded-2xl bg-[#E8192C] flex items-center justify-center text-white font-extrabold text-xl shadow-md">
            X
          </span>
          <span className="text-2xl font-black tracking-tight text-[#222222]">
            XPO <span className="text-[#E8192C]">INDIA</span>
          </span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#222222] tracking-tight">Create your XPO India account</h2>
        <p className="mt-1 text-sm text-[#717171]">Connect directly across industries. Zero commission middleman fees.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <Card className="p-8 rounded-3xl border border-[#EBEBEB] shadow-xl bg-white">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Step 1: Select Role */}
            <div>
              <label className="block text-xs font-semibold text-[#222222] mb-2 uppercase tracking-wider">
                1. What is your primary purpose?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('lead_creator')}
                  className={\`p-4 rounded-2xl border text-left transition-all \${
                    role === 'lead_creator'
                      ? 'border-[#E8192C] bg-red-50/50 shadow-sm'
                      : 'border-[#EBEBEB] hover:border-gray-400 bg-white'
                  }\`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-[#222222]">I Need Something</span>
                    {role === 'lead_creator' && <CheckCircle2 className="w-4 h-4 text-[#E8192C]" />}
                  </div>
                  <div className="text-xs text-[#717171]">Lead Creator: Post requirements, tenders, and buy requests.</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('lead_absorber')}
                  className={\`p-4 rounded-2xl border text-left transition-all \${
                    role === 'lead_absorber'
                      ? 'border-[#E8192C] bg-red-50/50 shadow-sm'
                      : 'border-[#EBEBEB] hover:border-gray-400 bg-white'
                  }\`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-[#222222]">I Offer Solutions</span>
                    {role === 'lead_absorber' && <CheckCircle2 className="w-4 h-4 text-[#E8192C]" />}
                  </div>
                  <div className="text-xs text-[#717171]">Lead Absorber: Discover buyer needs, submit proposals and supply.</div>
                </button>
              </div>
            </div>

            {/* Step 2: Account Type */}
            <div>
              <label className="block text-xs font-semibold text-[#222222] mb-2 uppercase tracking-wider">
                2. Account Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#222222]">
                  <input
                    type="radio"
                    checked={accountType === 'business'}
                    onChange={() => setAccountType('business')}
                    className="accent-[#E8192C]"
                  />
                  <Building2 className="w-4 h-4 text-[#717171]" /> Business / Company
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#222222]">
                  <input
                    type="radio"
                    checked={accountType === 'individual'}
                    onChange={() => setAccountType('individual')}
                    className="accent-[#E8192C]"
                  />
                  <User className="w-4 h-4 text-[#717171]" /> Individual / Freelancer
                </label>
              </div>
            </div>

            {/* Profile Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#222222] mb-1">Full Name</label>
                <Input
                  required
                  placeholder="e.g. Ramesh Verma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl border-[#EBEBEB] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#222222] mb-1">
                  {accountType === 'business' ? 'Company Name' : 'Trading Name'}
                </label>
                <Input
                  placeholder="e.g. Verma Precision Tools"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="rounded-xl border-[#EBEBEB] text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#222222] mb-1">Email Address</label>
                <Input
                  required
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border-[#EBEBEB] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#222222] mb-1">Mobile / WhatsApp Number</label>
                <Input
                  required
                  type="tel"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl border-[#EBEBEB] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#222222] mb-1">Set Password</label>
              <Input
                required
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border-[#EBEBEB] text-sm"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-semibold mt-2"
              isLoading={loading}
            >
              Complete Registration & Continue
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-[#717171]">
            Already registered on XPO India?{' '}
            <Link href="/login" className="font-semibold text-[#E8192C] hover:underline">
              Log in here
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
`);

// 3. app/(public)/pricing/page.tsx
writeFile('app/(public)/pricing/page.tsx', `'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PaywallModal } from '@/components/ui/paywall';
import { CheckCircle2, ShieldCheck, Zap, Globe2, CreditCard, RefreshCw } from 'lucide-react';

export default function PricingPage() {
  const [region, setRegion] = useState<'domestic' | 'international'>('domestic');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'creator' | 'absorber'>('absorber');

  const isDomestic = region === 'domestic';
  const price = isDomestic ? '₹999' : '$49';
  const gateway = isDomestic ? 'Razorpay (India)' : 'PayPal (Global)';

  const openCheckout = (role: 'creator' | 'absorber') => {
    setSelectedRole(role);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto">
          <Badge variant="outline" className="text-[#E8192C] border-red-200 bg-red-50/50 mb-3 px-3 py-1 font-semibold">
            Simple, Transparent Memberships
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-[#222222] tracking-tight">
            Direct connections. <br className="hidden sm:inline" />
            <span className="text-[#E8192C]">Zero middleman commissions.</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#717171] leading-relaxed">
            Unlike traditional brokered exchanges that slice 10% to 30% from every deal, XPO India operates on a simple flat annual access pass.
          </p>

          {/* Region Switcher */}
          <div className="mt-8 inline-flex p-1 bg-[#F7F7F7] rounded-full border border-[#EBEBEB]">
            <button
              onClick={() => setRegion('domestic')}
              className={\`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all \${
                isDomestic ? 'bg-white text-[#222222] shadow-sm' : 'text-[#717171] hover:text-[#222222]'
              }\`}
            >
              <CreditCard className="w-4 h-4 text-[#E8192C]" />
              Domestic (India - Razorpay)
            </button>
            <button
              onClick={() => setRegion('international')}
              className={\`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all \${
                !isDomestic ? 'bg-white text-[#222222] shadow-sm' : 'text-[#717171] hover:text-[#222222]'
              }\`}
            >
              <Globe2 className="w-4 h-4 text-blue-600" />
              International (PayPal)
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Creator Plan */}
          <Card className="p-8 rounded-3xl border border-[#EBEBEB] shadow-sm hover:shadow-xl transition-all relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className="border-gray-200 text-[#717171] font-semibold text-xs">
                  For Buyers & Businesses
                </Badge>
                <span className="text-xs text-[#717171] flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-emerald-600" /> AutoPay Ready
                </span>
              </div>
              <h3 className="text-2xl font-bold text-[#222222]">Lead Creator Pass</h3>
              <p className="text-xs text-[#717171] mt-1">For organizations and individuals who need products, services, or contracts executed.</p>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-[#222222]">{price}</span>
                <span className="text-sm font-medium text-[#717171]">/ year</span>
              </div>
              <p className="text-xs text-[#717171] mt-0.5">Processed securely via {gateway}</p>

              <ul className="mt-6 space-y-3">
                {[
                  'Post up to 50 active leads per month',
                  'Instant WhatsApp & Email broadcast to suppliers',
                  'Receive detailed bids & competitive quotes',
                  'Direct unmasked phone & WhatsApp contact',
                  '0% commission on contract value',
                  'Dedicated verified creator badge',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#484848]">
                    <CheckCircle2 className="w-4 h-4 text-[#E8192C] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              variant="outline"
              size="lg"
              className="w-full mt-8 font-semibold rounded-2xl"
              onClick={() => openCheckout('creator')}
            >
              Subscribe as Lead Creator
            </Button>
          </Card>

          {/* Absorber Plan */}
          <Card className="p-8 rounded-3xl border-2 border-[#E8192C] shadow-lg relative flex flex-col justify-between bg-gradient-to-b from-red-50/20 to-white">
            <div className="absolute -top-3.5 right-6">
              <span className="px-3 py-1 bg-[#E8192C] text-white text-[11px] font-bold uppercase rounded-full shadow-sm">
                Most Popular
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <Badge variant="default" className="bg-[#E8192C] text-white font-semibold text-xs">
                  For Providers & Sellers
                </Badge>
                <span className="text-xs text-[#717171] flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-emerald-600" /> AutoPay Ready
                </span>
              </div>
              <h3 className="text-2xl font-bold text-[#222222]">Lead Absorber Pass</h3>
              <p className="text-xs text-[#717171] mt-1">For manufacturers, contractors, freelancers, and service providers who fulfill demands.</p>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-[#222222]">{price}</span>
                <span className="text-sm font-medium text-[#717171]">/ year</span>
              </div>
              <p className="text-xs text-[#717171] mt-0.5">Processed securely via {gateway}</p>

              <ul className="mt-6 space-y-3">
                {[
                  'Browse unlimited buyer leads & sector opportunities',
                  'Direct unmasking of buyer phone & WhatsApp',
                  'Submit unlimited commercial proposals & bids',
                  'Priority delivery of leads in matching sectors',
                  'Zero transaction broker fees on deals closed',
                  'Verified Provider Checkmark on all submissions',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#484848]">
                    <CheckCircle2 className="w-4 h-4 text-[#E8192C] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full mt-8 font-semibold rounded-2xl shadow-md"
              onClick={() => openCheckout('absorber')}
            >
              Subscribe as Lead Absorber
            </Button>
          </Card>
        </div>

        {/* Feature Comparison Notice */}
        <div className="mt-14 max-w-3xl mx-auto p-6 rounded-3xl bg-[#F7F7F7] border border-[#EBEBEB] text-center">
          <h4 className="text-base font-bold text-[#222222] flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            No hidden costs. No escrow cuts. 100% direct transactions.
          </h4>
          <p className="text-xs text-[#717171] mt-2 max-w-xl mx-auto leading-relaxed">
            Both domestic Razorpay (₹999/yr) and international PayPal ($49/yr) support one-time checkout and recurring AutoPay. Cancel anytime from your account dashboard.
          </p>
        </div>
      </main>

      <Footer />

      <PaywallModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        role={selectedRole}
      />
    </div>
  );
}
`);

// 4. app/(public)/how-it-works/page.tsx
writeFile('app/(public)/how-it-works/page.tsx', `'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  FileText,
  Search,
  MessageSquareCheck,
  PhoneCall,
  CheckCircle2,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function HowItWorksPage() {
  const steps = [
    {
      number: '01',
      title: 'Someone Needs Something → Post a Lead',
      description: 'Whether it is 5,000 CNC machined flanges, a cold storage logistics fleet, an enterprise software rewrite, or bulk organic cotton greige fabric — create a structured requirement in minutes. Each requirement receives an official XPO tracking identifier (e.g. XPO-10021).',
      icon: FileText,
    },
    {
      number: '02',
      title: 'Relevant Providers Discover & Respond',
      description: 'Qualified manufacturers, contractors, consultancies, and suppliers discover the lead through sector filters, category feeds, and instant automated WhatsApp broadcasts. Absorbers review specifications and submit commercial quotations.',
      icon: Search,
    },
    {
      number: '03',
      title: 'Lead Creator Reviews Direct Proposals',
      description: 'The buyer compares quotes, delivery timelines, vendor certifications, and portfolio details side-by-side in their dedicated response dashboard. No confusing bid spam.',
      icon: MessageSquareCheck,
    },
    {
      number: '04',
      title: 'Direct Handshake & Connection',
      description: 'When the buyer connects with a proposal, full direct details (verified phone number, WhatsApp chat direct link, email, and corporate identity) are unlocked. The two parties finalize contracts, commercial terms, and transactions directly with ZERO broker cut.',
      icon: PhoneCall,
    },
  ];

  const caseStudies = [
    {
      sector: 'Manufacturing & Industrial',
      scenario: 'Automotive tier-1 vendor in Pune needed 20,000 sintered brass bushings with strict metallurgical tolerances within 3 weeks.',
      resolution: 'Matched with an ISO 9001 certified precision manufacturing unit in Rajkot within 48 hours. Direct offline inspection and delivery.',
    },
    {
      sector: 'IT & Cloud Architecture',
      scenario: 'US-based health-tech startup required HIPAA-compliant AWS cloud migration and Kubernetes orchestration.',
      resolution: 'Connected directly with an elite Bangalore DevOps consultancy via PayPal global pass. Zero escrow percentage taken.',
    },
    {
      sector: 'Logistics & Supply Chain',
      scenario: 'Pharma distributor required dedicated multi-temperature refrigerated reefer containers between Ahmedabad and Hyderabad.',
      resolution: 'Cold-chain fleet operator responded with real-time sensor tracking quotes. Direct bilateral service agreement executed.',
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <Badge variant="outline" className="text-[#E8192C] border-red-200 bg-red-50/50 mb-3 px-3 py-1 font-semibold">
            The XPO India Model
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-[#222222] tracking-tight">
            How XPO India Works
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#717171] leading-relaxed">
            The fundamental principle is straightforward: <span className="text-[#222222] font-semibold">Direct connection. Complete transparency. Zero middleman fees.</span>
          </p>
        </div>

        {/* 4 Steps Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <Card key={idx} className="p-8 rounded-3xl border border-[#EBEBEB] hover:border-gray-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-black text-[#E8192C]/40">{s.number}</span>
                    <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#E8192C] flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-[#222222] mb-2">{s.title}</h3>
                  <p className="text-sm text-[#717171] leading-relaxed">{s.description}</p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Real-World Case Studies */}
        <div className="mt-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#222222]">Cross-Industry Lead Exchanges</h2>
            <p className="text-sm text-[#717171] mt-1">XPO India operates across manufacturing, software, freight, legal, and commodity trade.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {caseStudies.map((c, i) => (
              <div key={i} className="p-6 rounded-3xl bg-[#F7F7F7] border border-[#EBEBEB]">
                <Badge variant="outline" className="bg-white border-gray-200 text-[#222222] font-semibold text-xs mb-3">
                  {c.sector}
                </Badge>
                <div className="text-xs font-semibold text-[#222222] mb-1">Requirement:</div>
                <p className="text-xs text-[#717171] mb-4 leading-relaxed">{c.scenario}</p>
                <div className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Outcome:
                </div>
                <p className="text-xs text-[#717171] leading-relaxed">{c.resolution}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 p-10 rounded-3xl bg-gradient-to-r from-[#222222] to-[#111111] text-white text-center flex flex-col items-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold">Ready to connect directly?</h2>
          <p className="text-sm text-gray-300 mt-2 max-w-lg">
            Join thousands of verified businesses and independent specialists across India and worldwide.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 justify-center">
            <Link href="/post-lead">
              <Button variant="primary" size="lg" className="rounded-2xl font-semibold">
                Post an Opportunity
              </Button>
            </Link>
            <Link href="/opportunities">
              <Button variant="outline" size="lg" className="rounded-2xl font-semibold bg-white/10 text-white border-white/20 hover:bg-white/20">
                Browse Live Leads
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
`);

// 5. app/(public)/categories/page.tsx
writeFile('app/(public)/categories/page.tsx', `'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ArrowRight, Factory, Code, Briefcase, Truck, ShoppingBag, Activity } from 'lucide-react';

const iconMap: Record<string, any> = {
  Factory,
  Code,
  Briefcase,
  Truck,
  ShoppingBag,
  Activity,
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCategories(data.categories || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <Badge variant="outline" className="text-[#E8192C] border-red-200 bg-red-50/50 mb-3 px-3 py-1 font-semibold">
            Cross-Sector Taxonomies
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-[#222222] tracking-tight">
            Explore Opportunities by Sector
          </h1>
          <p className="mt-3 text-base text-[#717171]">
            XPO India is sector-agnostic. Discover live leads and qualified partners across industrial, digital, professional, and trade sectors.
          </p>

          <div className="mt-8 max-w-md mx-auto relative">
            <Search className="w-5 h-5 text-[#717171] absolute left-3.5 top-3.5" />
            <Input
              placeholder="Search industries, categories, or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-4 py-3 rounded-2xl border-[#EBEBEB] text-sm"
            />
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map((cat) => {
            const Icon = iconMap[cat.icon] || Factory;
            return (
              <Link key={cat._id} href={\`/opportunities?category=\${cat._id}\`}>
                <Card className="p-6 rounded-3xl border border-[#EBEBEB] hover:border-[#222222] hover:shadow-md transition-all group h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#E8192C] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-[#222222] group-hover:text-[#E8192C] transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-[#717171] mt-1.5 leading-relaxed">
                      {cat.description || 'Verified commercial leads, tenders, and vendor exchange opportunities.'}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between text-xs font-semibold text-[#E8192C]">
                    <span>Browse Opportunities</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
`);

console.log('Auth and Public pages written successfully!');
