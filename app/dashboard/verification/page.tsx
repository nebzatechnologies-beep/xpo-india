'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import type { CustomerRole, VerificationRequest } from '@/lib/types/domain';
import { ShieldCheck, Upload, CheckCircle2, Loader2 } from 'lucide-react';

export default function VerificationKycPage() {
  const { user, refreshSession } = useAuth();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const activeRole: CustomerRole = user?.role || 'partner';
  const [documentType, setDocumentType] = useState<VerificationRequest['documentType']>(
    'gst_certificate'
  );
  const [documentNumber, setDocumentNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [storagePaths, setStoragePaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showReupload, setShowReupload] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/verification');
      if (res.ok) {
        const d = await res.json();
        setRequests(d.requests || []);
      }
    } catch {
      // Ignore initial load failure
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      setUploading(true);
      setErrorMsg(null);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/verification/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload verification document');
      }

      setStoragePaths((prev) => [...prev, data.storagePath]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const res = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: activeRole,
          documentType,
          documentNumber: documentNumber.trim() || undefined,
          companyName: companyName.trim() || undefined,
          websiteUrl: websiteUrl.trim() || undefined,
          storagePaths,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Submission failed');
      setSuccessMsg('KYC verification request submitted for Superadmin review!');
      setDocumentNumber('');
      setStoragePaths([]);
      await Promise.all([load(), refreshSession()]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit KYC');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">KYC & XPO Verified Badge</h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Verified Clients and Partners receive a priority ranking boost in matching and a
            Verified Trust Badge on profile cards.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold capitalize">
          <ShieldCheck className="w-4 h-4" />
          {(user?.verificationStatus || 'unverified').replace('_', ' ')}
        </span>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          {successMsg}
        </div>
      )}

      {user?.verificationStatus === 'verified' && (
        <div className="bg-white rounded-2xl border border-emerald-200 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827]">Account Verified with Trust Badge</h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Your KYC compliance documents have been verified by Superadmins. Your account displays the Verified Trust Badge and receives priority in matching.
              </p>
            </div>
          </div>
          <div className="pt-3 border-t border-[#F3F4F6] flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-[#6B7280]">Need to submit updated legal entity or tax compliance documents?</span>
            <button
              type="button"
              onClick={() => setShowReupload((prev) => !prev)}
              className="px-3.5 py-1.5 rounded-xl border border-[#D1D5DB] font-semibold text-[#374151] hover:bg-gray-50"
            >
              {showReupload ? 'Hide Update Form' : 'Update KYC Documents'}
            </button>
          </div>
        </div>
      )}

      {user?.verificationStatus !== 'verified' && requests.some((r) => r.status === 'verification_pending') && (
        <div className="bg-white rounded-2xl border border-amber-200 p-6 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold shrink-0">
              ⏳
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827]">KYC Review In Progress</h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Your submitted documents are in the active Superadmin review queue. Verified badges are granted once documents are validated.
              </p>
            </div>
          </div>
        </div>
      )}

      {(user?.verificationStatus !== 'verified' || showReupload) && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1">Account Role</label>
              <div className="px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] text-xs font-bold uppercase text-[#111827]">
                {activeRole}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1">Document Type</label>
              <select
                value={documentType}
                onChange={(e) =>
                  setDocumentType(e.target.value as VerificationRequest['documentType'])
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] bg-white text-xs"
              >
                <option value="gst_certificate">GST Registration Certificate</option>
                <option value="business_registration">CIN / LLP / MSME Udyam</option>
                <option value="trade_license">Trade License / EIN</option>
                <option value="identity_proof">PAN / Government ID</option>
                <option value="credential_certificate">Professional Degree / Credential</option>
                <option value="portfolio_evidence">Verified Work Portfolio</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1">
                GSTIN / Registration / ID Number
              </label>
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="29ABCDE1234F1Z5"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1">
                Registered Legal Entity Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Industrial Pvt Ltd"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1">
              Official Website / Portfolio URL (Optional)
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://acme.in"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1.5">
              Upload Encrypted KYC Document (Visible only to XPO Superadmins)
            </label>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-[#9CA3AF] text-xs font-semibold cursor-pointer hover:bg-[#F9FAFB]">
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#111827]" />
                  <span>Uploading encrypted proof...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Attach KYC Proof (PDF, PNG, JPG)</span>
                </>
              )}
              <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} accept=".pdf,.png,.jpg,.jpeg,.webp" />
            </label>
            {storagePaths.map((p) => (
              <div key={p} className="mt-1.5 text-[11px] text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {p.split('/').pop()}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting || uploading}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#111827] text-white text-xs font-bold hover:bg-black disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{submitting ? 'Submitting...' : 'Submit for Manual KYC Verification'}</span>
          </button>
        </form>
      )}

      {requests.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
          <h2 className="text-sm font-bold text-[#111827] mb-3">Submission History</h2>
          <div className="divide-y divide-[#F3F4F6] text-xs">
            {requests.map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold capitalize">{r.documentType.replace(/_/g, ' ')}</span>{' '}
                  • <span className="uppercase">{r.role}</span>
                  {r.reviewNotes && (
                    <p className="text-[#6B7280] mt-0.5">Reviewer Note: {r.reviewNotes}</p>
                  )}
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#F3F4F6] font-semibold capitalize">
                  {r.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
