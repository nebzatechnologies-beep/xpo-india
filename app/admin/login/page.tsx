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
import { getXpoWhatsAppBotUrl } from '@/lib/whatsapp/demo-bot-link';
import {
  AlertCircle,
  ArrowRight,
  Mail,
  Phone,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/superadmin';
  const { refreshSession, signOut } = useAuth();

  const [mode, setMode] = useState<'email' | 'phone'>('email');
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

  async function exchangeTokenAndVerifyAdmin(idToken: string, phoneRaw?: string) {
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
      throw new Error(data.error || 'Failed to establish administrator session');
    }

    if (!data.user?.isSuperadmin) {
      await signOut();
      throw new Error(
        'Access Denied: This account is authenticated as a customer and does NOT have Superadministrator privileges. For standard marketplace access, sign in at /login.'
      );
    }

    await refreshSession();
    router.push(
      (nextPath.startsWith('/superadmin') || nextPath.startsWith('/admin')) && nextPath !== '/superadmin/login'
        ? nextPath
        : '/superadmin'
    );
  }

  async function handleQuickDemoAdminLogin() {
    setError(null);
    setMode('email');
    setEmail('kavalipavan22@gmail.com');
    setPassword('12345678');
    if (!clientConfigured) {
      router.push('/superadmin');
      return;
    }
    try {
      setSubmitting(true);
      const auth = getClientAuth();
      const cred = await signInWithEmailAndPassword(auth, 'kavalipavan22@gmail.com', '12345678');
      const idToken = await cred.user.getIdToken(true);
      await exchangeTokenAndVerifyAdmin(idToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo admin sign-in failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!clientConfigured) {
      setError(
        'Firebase Client API key is not configured in .env.local yet. Add NEXT_PUBLIC_FIREBASE_API_KEY.'
      );
      return;
    }
    try {
      setSubmitting(true);
      const auth = getClientAuth();
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await cred.user.getIdToken(true);
      await exchangeTokenAndVerifyAdmin(idToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!clientConfigured) {
      setError(
        'Firebase Client API key is not configured in .env.local yet. Add NEXT_PUBLIC_FIREBASE_API_KEY.'
      );
      return;
    }
    try {
      setSubmitting(true);
      const auth = getClientAuth();
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-admin-container', {
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
      setError(err instanceof Error ? err.message : 'Unable to send Superadmin OTP');
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
      await exchangeTokenAndVerifyAdmin(idToken, cred.user.phoneNumber || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid Admin OTP code');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F6F4] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-2xl font-black text-[#15171C]">
          <img src="/xpo-logo.png" alt="XPO India" className="h-9 w-auto object-contain" /><span className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F1E9FB] text-[#5B21B6] uppercase tracking-wider">Superadmin</span>
        </Link>
        <h1 className="mt-4 text-2xl font-extrabold text-[#15171C]">
          Platform Administration
        </h1>
        <p className="mt-1 text-xs text-[#4A4F59]">
          Sign in to access platform management, settings, and logs
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xs rounded-2xl border border-[#EBEBEB] sm:px-8 space-y-5">
          {!clientConfigured && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Firebase Keys Pending:</strong> Add{' '}
                <code>NEXT_PUBLIC_FIREBASE_API_KEY</code> and Firebase Admin credentials in{' '}
                <code>.env.local</code> to enable live administrator sign in.
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#F5F5F5] mb-6 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('email');
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold transition ${
                mode === 'email'
                  ? 'bg-white text-[#15171C] shadow-xs'
                  : 'text-[#4A4F59] hover:text-[#15171C]'
              }`}
            >
              <Mail className="w-3.5 h-3.5" /> Admin Email
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('phone');
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold transition ${
                mode === 'phone'
                  ? 'bg-white text-[#15171C] shadow-xs'
                  : 'text-[#4A4F59] hover:text-[#15171C]'
              }`}
            >
              <Phone className="w-3.5 h-3.5" /> Admin Phone OTP
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          {mode === 'email' ? (
            <form onSubmit={handleEmailSignIn} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#15171C] mb-1.5">
                  Admin Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@xpoindia.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDDDDD] text-sm focus:outline-none focus:border-[#15171C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#15171C] mb-1.5">
                  Admin Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDDDDD] text-sm focus:outline-none focus:border-[#15171C]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-[#15171C] hover:bg-black text-white font-semibold text-sm shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In as Admin</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : !otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#15171C] mb-1.5">
                  Authorized Admin Mobile Number
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-[#DDDDDD] bg-white text-sm font-medium"
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
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#DDDDDD] text-sm focus:outline-none focus:border-[#15171C]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-[#15171C] hover:bg-black text-white font-semibold text-sm shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Send Admin OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#15171C] mb-1.5">
                  Enter 6-Digit Admin Verification OTP
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDDDDD] text-center tracking-widest text-base font-bold focus:outline-none focus:border-[#15171C]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-[#C8102E] hover:bg-[#D01525] text-white font-semibold text-sm shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{submitting ? 'Verifying...' : 'Verify & Enter'}</span>
              </button>

              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="w-full text-center text-xs text-[#4A4F59] hover:text-[#15171C]"
              >
                Change phone number
              </button>
            </form>
          )}

          <div id="recaptcha-admin-container" />

          {/* Demo Testing Credentials Box */}
          <div className="mt-5 p-4 rounded-xl bg-[#FAFBFD] border border-[#E4E5E9] space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[#15171C]">🧪 Demo Testing Accounts (Password: 12345678)</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                LIVE FIREBASE
              </span>
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleQuickDemoAdminLogin()}
              className="w-full py-2.5 px-3 rounded-xl bg-[#C8102E] hover:bg-[#A50D25] text-white font-bold text-xs transition flex items-center justify-between"
            >
              <span>⚡ 1-Click Sign In as Superadmin</span>
              <span className="font-mono text-[11px] opacity-90">kavalipavan22@gmail.com</span>
            </button>
            <div className="grid grid-cols-1 gap-1.5 pt-1 text-[11px] text-[#4A4F59]">
              <div className="flex items-center justify-between">
                <span>👤 <b>Client Demo:</b> <code>pavan@gmail.com</code> / <code>12345678</code></span>
                <Link href="/login" className="text-[#C8102E] font-bold hover:underline">Test Client →</Link>
              </div>
              <div className="flex items-center justify-between">
                <span>🏭 <b>Partner Demo:</b> <code>partner@gmail.com</code> / <code>12345678</code></span>
                <Link href="/login" className="text-[#1E3A8A] font-bold hover:underline">Test Partner →</Link>
              </div>
            </div>
            <div className="pt-2 border-t border-[#E4E5E9]">
              <a
                href={getXpoWhatsAppBotUrl('general')}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                💬 Open Dummy XPO WhatsApp Chatbot →
              </a>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-[#F0F0F0] flex items-center justify-between text-xs">
            <span className="text-[#4A4F59]">Customer or Partner?</span>
            <Link href="/login" className="font-bold text-[#C8102E] hover:underline">
              Marketplace Login →
            </Link>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[#4A4F59]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Protected by Firebase Authentication & Admin Role Gate
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F6F6F4] flex items-center justify-center text-xs text-[#4A4F59]">
          Loading Admin Portal...
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}
