'use client';

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
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    role === 'lead_creator'
                      ? 'border-[#E8192C] bg-red-50/50 shadow-sm'
                      : 'border-[#EBEBEB] hover:border-gray-400 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-[#222222]">Client (Post Requirements)</span>
                    {role === 'lead_creator' && <CheckCircle2 className="w-4 h-4 text-[#E8192C]" />}
                  </div>
                  <div className="text-xs text-[#717171]">Client: Post requirements, specifications, and procurement needs for free.</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('lead_absorber')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    role === 'lead_absorber'
                      ? 'border-[#E8192C] bg-red-50/50 shadow-sm'
                      : 'border-[#EBEBEB] hover:border-gray-400 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-[#222222]">Partner (Fulfill & Provide)</span>
                    {role === 'lead_absorber' && <CheckCircle2 className="w-4 h-4 text-[#E8192C]" />}
                  </div>
                  <div className="text-xs text-[#717171]">Partner: Discover requirements, express interest, and connect directly with clients.</div>
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