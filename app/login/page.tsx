'use client';

import React, { Suspense, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { getClientAuth, isFirebaseClientConfigured } from '@/lib/firebase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { Phone, Mail, ShieldCheck, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/dashboard';
  const { refreshSession } = useAuth();

  const [mode, setMode] = useState<'phone' | 'email'>('phone');
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

  async function exchangeTokenAndRedirect(idToken: string, phoneRaw?: string) {
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken,
        phoneRaw,
        confirmedCountry: COUNTRY_BY_DIAL[countryCode] || 'IN',
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to establish server session');
    }
    await refreshSession();
    if (data.user?.isSuperadmin) {
      router.push(nextPath.startsWith('/admin') ? nextPath : '/admin/dashboard');
      return;
    }
    const role = data.user?.role === 'partner' ? 'partner' : 'client';
    const activeProfile = data.profiles?.[role];
    if (activeProfile && activeProfile.onboardingCompleted === false) {
      router.push(`/onboarding?role=${role}`);
      return;
    }
    if (role === 'partner') {
      router.push(nextPath.startsWith('/dashboard/partner') ? nextPath : '/dashboard/partner');
    } else {
      router.push(nextPath.startsWith('/dashboard/client') ? nextPath : '/dashboard/client');
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
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
        recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-login-container', {
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
      setError(err instanceof Error ? err.message : 'Unable to send SMS OTP');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!confirmationRef.current) return;
    try {
      setSubmitting(true);
      const cred = await confirmationRef.current.confirm(otpCode.trim());
      const idToken = await cred.user.getIdToken(true);
      await exchangeTokenAndRedirect(idToken, cred.user.phoneNumber || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP code');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!clientConfigured) {
      setError('Firebase Client API key is not configured yet in .env.local.');
      return;
    }
    try {
      setSubmitting(true);
      const auth = getClientAuth();
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await cred.user.getIdToken(true);
      await exchangeTokenAndRedirect(idToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-2xl font-black text-[#111827]">
          <span className="w-8 h-8 rounded-xl bg-[#E8192C] text-white flex items-center justify-center text-sm font-black">
            X
          </span>
          XPO
        </Link>
        <h1 className="mt-4 text-2xl font-extrabold text-[#111827]">
          Sign in to XPO
        </h1>
        <p className="mt-1 text-xs text-[#6B7280]">
          Dedicated Client & Partner workspaces synced live with WhatsApp
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-xs rounded-2xl border border-[#E5E7EB] sm:px-8 space-y-5">

          {!clientConfigured && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Firebase Keys Pending:</strong> Add{' '}
                <code>NEXT_PUBLIC_FIREBASE_API_KEY</code> and Firebase Admin credentials in{' '}
                <code>.env.local</code> to enable live OTP and Email authentication.
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#F3F4F6] mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('phone');
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition ${
                mode === 'phone'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <Phone className="w-3.5 h-3.5" /> WhatsApp / Mobile OTP
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('email');
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition ${
                mode === 'email'
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <Mail className="w-3.5 h-3.5" /> Email & Password
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          {mode === 'phone' ? (
            !otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                    WhatsApp / Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-[#D1D5DB] bg-white text-sm font-medium"
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+65">🇸🇬 +65</option>
                    </select>
                    <input
                      type="tel"
                      required
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="98765 43210"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm focus:outline-none focus:border-[#111827]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-[#111827] text-white text-sm font-semibold hover:bg-black disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                    Enter 6-Digit Verification OTP
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-center tracking-widest text-base font-bold focus:outline-none focus:border-[#111827]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-[#E8192C] text-white text-sm font-semibold hover:bg-[#c81324] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{submitting ? 'Verifying...' : 'Verify & Sign In'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-full text-xs text-[#6B7280] hover:text-[#111827]"
                >
                  Change phone number
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                  Work or Personal Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm focus:outline-none focus:border-[#111827]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm focus:outline-none focus:border-[#111827]"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-[#111827] text-white text-sm font-semibold hover:bg-black disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{submitting ? 'Signing In...' : 'Sign In'}</span>
              </button>
            </form>
          )}

          <div id="recaptcha-login-container" />

          <div className="mt-6 pt-5 border-t border-[#F3F4F6] flex items-center justify-between text-xs">
            <span className="text-[#6B7280]">New to XPO?</span>
            <Link href="/register" className="font-bold text-[#E8192C] hover:underline">
              Register as Client or Partner →
            </Link>
          </div>

          <div className="mt-3 text-center">
            <Link
              href="/admin/login"
              className="text-[11px] font-semibold text-[#111827] hover:text-black hover:underline inline-flex items-center gap-1"
            >
              Superadmin Portal →
            </Link>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[#6B7280]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Protected by Firebase Authentication & WhatsApp CRM Identity Linking
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
