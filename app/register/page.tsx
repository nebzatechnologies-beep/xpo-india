'use client';

import React, { Suspense, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  updateProfile,
  type ConfirmationResult,
} from 'firebase/auth';
import { getClientAuth, isFirebaseClientConfigured } from '@/lib/firebase/client';
import { useAuth } from '@/lib/auth/auth-context';
import type { CustomerRole } from '@/lib/types/domain';
import { Building2, Handshake, AlertCircle, Loader2 } from 'lucide-react';

const ROLE_OPTIONS: Array<{
  role: CustomerRole;
  title: string;
  desc: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    role: 'client',
    title: 'Register as a Client',
    desc: 'Post requirements free, view 5 interested Partner profiles free, and connect directly.',
    badge: 'Post Free + 5 Free Views',
    icon: Building2,
  },
  {
    role: 'partner',
    title: 'Register as a Partner',
    desc: 'Receive matching Client requirements on WhatsApp and respond within 5 minutes.',
    badge: '5 Free Applications',
    icon: Handshake,
  },
];

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoleParam = searchParams.get('role') as CustomerRole | null;
  const { refreshSession } = useAuth();

  const [selectedRole, setSelectedRole] = useState<CustomerRole>(
    initialRoleParam === 'partner' ? 'partner' : 'client'
  );
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneInput, setPhoneInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const clientConfigured = isFirebaseClientConfigured();

  const COUNTRY_BY_DIAL: Record<string, string> = {
    '+91': 'IN',
    '+1': 'US',
    '+44': 'GB',
    '+971': 'AE',
    '+65': 'SG',
  };

  async function finalizeRegistration(idToken: string, phoneRaw?: string) {
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken,
        displayName: displayName.trim(),
        city: city.trim(),
        phoneRaw,
        confirmedCountry: COUNTRY_BY_DIAL[countryCode] || 'IN',
        initialRole: selectedRole,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration session failed');
    }
    await refreshSession();
    router.push(`/onboarding?role=${selectedRole}`);
  }

  async function handleSendPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!clientConfigured) {
      setError('Firebase Client API key is not configured yet in .env.local.');
      return;
    }
    try {
      setSubmitting(true);
      const auth = getClientAuth();
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-register-container', {
          size: 'invisible',
        });
      }
      const digits = phoneInput.replace(/[^\d]/g, '');
      const fullPhone = phoneInput.trim().startsWith('+')
        ? phoneInput.trim()
        : `${countryCode}${digits}`;

      const result = await signInWithPhoneNumber(auth, fullPhone, recaptchaRef.current);
      confirmationRef.current = result;
      setOtpSent(true);
    } catch (err) {
      try {
        recaptchaRef.current?.clear();
      } catch {
        // Ignore clear errors
      }
      recaptchaRef.current = null;
      setError(err instanceof Error ? err.message : 'Unable to send OTP');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!confirmationRef.current) return;
    try {
      setSubmitting(true);
      const cred = await confirmationRef.current.confirm(otpCode.trim());
      if (displayName.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      }
      const idToken = await cred.user.getIdToken(true);
      await finalizeRegistration(idToken, cred.user.phoneNumber || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEmailRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!clientConfigured) {
      setError('Firebase Client API key is not configured yet in .env.local.');
      return;
    }
    try {
      setSubmitting(true);
      const auth = getClientAuth();
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      }
      const idToken = await cred.user.getIdToken(true);
      const digits = phoneInput.replace(/[^\d]/g, '');
      const fullPhone = digits ? `${countryCode}${digits}` : undefined;
      await finalizeRegistration(idToken, fullPhone);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-black text-[#111827]">
            <span className="w-8 h-8 rounded-xl bg-[#E8192C] text-white flex items-center justify-center text-sm font-black">
              X
            </span>
            XPO
          </Link>
          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-[#111827]">
            Create Your XPO Account
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6B7280]">
            Select your account type — Client (find the right Partner) or Partner (find new Clients).
          </p>
        </div>

        <div className="mt-8 bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 shadow-xs">
          {!clientConfigured && (
            <div className="mb-6 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Firebase Keys Pending:</strong> Configure{' '}
                <code>NEXT_PUBLIC_FIREBASE_API_KEY</code> and Firebase Admin service account keys in{' '}
                <code>.env.local</code> to activate live sign-ups.
              </div>
            </div>
          )}

          <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-3">
            1. Choose Your Account Role
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {ROLE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = selectedRole === opt.role;
              return (
                <button
                  key={opt.role}
                  type="button"
                  onClick={() => setSelectedRole(opt.role)}
                  className={`text-left p-4 rounded-xl border transition ${
                    active
                      ? 'border-[#111827] bg-gray-50 ring-1 ring-[#111827]'
                      : 'border-[#E5E7EB] hover:border-[#9CA3AF]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Icon className="w-4 h-4 text-[#E8192C] shrink-0" />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {opt.badge}
                    </span>
                  </div>
                  <div className="mt-2.5 font-bold text-sm text-[#111827]">{opt.title}</div>
                  <div className="text-xs text-[#6B7280] mt-1 leading-relaxed">{opt.desc}</div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#F3F4F6] mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('phone');
                setError(null);
              }}
              className={`py-2 rounded-lg text-xs font-semibold ${
                authMethod === 'phone' ? 'bg-white text-[#111827] shadow-xs' : 'text-[#6B7280]'
              }`}
            >
              WhatsApp / Mobile OTP
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('email');
                setError(null);
              }}
              className={`py-2 rounded-lg text-xs font-semibold ${
                authMethod === 'email' ? 'bg-white text-[#111827] shadow-xs' : 'text-[#6B7280]'
              }`}
            >
              Email & Password
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          {authMethod === 'phone' ? (
            !otpSent ? (
              <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Aarav Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Location / City</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Bengaluru"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    WhatsApp Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-[#D1D5DB] bg-white text-sm"
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+971">🇦🇪 +971</option>
                    </select>
                    <input
                      type="tel"
                      required
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="98765 43210"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-[#111827] text-white text-sm font-semibold hover:bg-black disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{submitting ? 'Sending OTP...' : 'Verify WhatsApp / Mobile & Continue'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Enter 6-Digit OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-center tracking-widest text-base font-bold"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-[#E8192C] text-white text-sm font-semibold hover:bg-[#c81324] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{submitting ? 'Creating Account...' : 'Complete Registration'}</span>
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handleEmailRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Aarav Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Location / City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Mumbai"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="founder@company.in"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm"
                />
              </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    WhatsApp Number {selectedRole === 'partner' ? '*' : '(for 5-min lead & Partner alerts)'}
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-[#D1D5DB] bg-white text-sm"
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+65">🇸🇬 +65</option>
                    </select>
                    <input
                      type="tel"
                      required={selectedRole === 'partner'}
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="98765 43210"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm"
                    />
                  </div>
                </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Password (min 8 chars)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-[#111827] text-white text-sm font-semibold hover:bg-black disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{submitting ? 'Creating Account...' : `Register as ${selectedRole === 'partner' ? 'Partner' : 'Client'}`}</span>
              </button>
            </form>
          )}

          <div id="recaptcha-register-container" />

          <div className="mt-6 pt-5 border-t border-[#F3F4F6] flex items-center justify-between text-xs">
            <span className="text-[#6B7280]">Already invited or registered on XPO?</span>
            <Link href="/login" className="font-bold text-[#111827] hover:underline">
              Sign in →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
