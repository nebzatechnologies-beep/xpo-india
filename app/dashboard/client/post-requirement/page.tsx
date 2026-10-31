'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CustomerAgentPanel } from '@/components/agent/customer-agent-panel';
import { useAuth } from '@/lib/auth/auth-context';
import { isFirebaseClientConfigured } from '@/lib/firebase/client';
import { uploadToFirebase } from '@/lib/firebase/storage';
import type { CustomFormField } from '@/lib/types/domain';
import { ArrowRight, Bot, CheckCircle2, FileText, Loader2, Upload } from 'lucide-react';

interface TaxonomySectorNode {
  id: string;
  name: string;
  categories?: Array<{
    id: string;
    name: string;
    subcategories?: Array<{
      id: string;
      name: string;
      tags?: Array<{ id: string; name: string }>;
    }>;
  }>;
}

function PostRequirementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [mode, setMode] = useState<'agent' | 'form'>('agent');
  const [tree, setTree] = useState<TaxonomySectorNode[]>([]);
  const [sectorId, setSectorId] = useState(searchParams.get('sectorId') || '');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const [dynamicFields, setDynamicFields] = useState<CustomFormField[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, unknown>>({});

  const [title, setTitle] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [workLocation, setWorkLocation] = useState(user?.primaryCity || '');
  const [timeline, setTimeline] = useState('Immediate (Within 7 Days)');
  const [estimatedBudget, setEstimatedBudget] = useState('');
  const [uploadedPaths, setUploadedPaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (user?.primaryCity && !workLocation) {
      setWorkLocation(user.primaryCity);
    }
  }, [user?.primaryCity, workLocation]);

  useEffect(() => {
    async function loadTree() {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        const sectors: TaxonomySectorNode[] = data.tree || [];
        setTree(sectors);
        if (sectors.length > 0) {
          setSectorId((prev) => prev || sectors[0].id);
        }
      }
    }
    void loadTree();
  }, []);

  const currentSector = tree.find((s) => s.id === sectorId);
  const categories = currentSector?.categories || [];
  const currentCategory = categories.find((c) => c.id === categoryId);
  const subcategories = currentCategory?.subcategories || [];
  const currentSubcategory = subcategories.find((sc) => sc.id === subcategoryId);
  const availableTags = currentSubcategory?.tags || [];

  useEffect(() => {
    if (!categoryId) {
      setDynamicFields([]);
      return;
    }
    async function loadFormSchema() {
      const targetId = subcategoryId || categoryId;
      const res = await fetch(
        `/api/taxonomy/form-builder?targetId=${encodeURIComponent(targetId)}`
      );
      if (res.ok) {
        const data = await res.json();
        setDynamicFields(data.schema?.fields || []);
      }
    }
    void loadFormSchema();
  }, [categoryId, subcategoryId]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!isFirebaseClientConfigured()) {
      setError('Firebase Storage client key is pending in .env.local.');
      return;
    }
    try {
      setUploading(true);
      setError(null);
      const path = `requirements/${user.uid}/${Date.now()}_${file.name}`;
      const { storagePath } = await uploadToFirebase(file, path);
      setUploadedPaths((prev) => [...prev, storagePath]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'File upload failed');
    } finally {
      setUploading(false);
    }
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError(null);
    let redirected = false;
    try {
      setSubmitting(true);
      const clientRequestId = `${user?.uid || 'anon'}_req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const res = await fetch('/api/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientRequestId,
          title: title.trim(),
          categoryId,
          subcategoryId: subcategoryId || null,
          skillTagIds: selectedTagIds,
          specifications: specifications.trim(),
          customFields: customValues,
          workLocation: workLocation.trim(),
          timeline,
          estimatedBudget: estimatedBudget.trim() || null,
          supportingDocPaths: uploadedPaths,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit requirement');
      }
      redirected = true;
      router.push('/dashboard/client/requirements');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      if (!redirected) {
        submittingRef.current = false;
        setSubmitting(false);
      }
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827]">Post a Requirement</h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Always free for clients. Matched verified partners are notified instantly.
          </p>
        </div>

        {/* Mode Switcher: Conversational Agent vs Structured Form */}
        <div className="inline-flex p-1 rounded-xl bg-white border border-[#E5E7EB]">
          <button
            type="button"
            onClick={() => setMode('agent')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
              mode === 'agent'
                ? 'bg-[#111827] text-white'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            <Bot className="w-3.5 h-3.5" /> Conversational Agent
          </button>
          <button
            type="button"
            onClick={() => setMode('form')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
              mode === 'form'
                ? 'bg-[#111827] text-white'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Structured Form
          </button>
        </div>
      </div>

      {mode === 'agent' ? (
        <CustomerAgentPanel
          role="client"
          onActionCompleted={() => router.push('/dashboard/client/requirements')}
        />
      ) : (
        <>
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 space-y-5"
          >
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5">
                Requirement Headline *
              </label>
              <input
                type="text"
                required
                minLength={4}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Custom Corrugated E-Commerce Packaging — 25,000 Units/Month"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1.5">1. Sector *</label>
                <select
                  required
                  value={sectorId}
                  onChange={(e) => {
                    setSectorId(e.target.value);
                    setCategoryId('');
                    setSubcategoryId('');
                    setSelectedTagIds([]);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D1D5DB] bg-white text-xs"
                >
                  <option value="">Select Sector</option>
                  {tree.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1.5">
                  2. Category *
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setSubcategoryId('');
                    setSelectedTagIds([]);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D1D5DB] bg-white text-xs"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1.5">
                  3. Subcategory
                </label>
                <select
                  value={subcategoryId}
                  onChange={(e) => {
                    setSubcategoryId(e.target.value);
                    setSelectedTagIds([]);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D1D5DB] bg-white text-xs"
                >
                  <option value="">Optional Subcategory</option>
                  {subcategories.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {availableTags.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1.5">
                  4. Capability / Skill Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => {
                    const active = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                          active
                            ? 'bg-[#111827] text-white border-[#111827]'
                            : 'bg-[#F9FAFB] text-[#4B5563] border-[#E5E7EB]'
                        }`}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {dynamicFields.length > 0 && (
              <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-3">
                <div className="text-xs font-bold text-[#111827]">Category-Specific Details</div>
                {dynamicFields.map((field) => (
                  <div key={field.key}>
                    {field.type === 'checkbox' ? (
                      <label className="flex items-center gap-2 text-xs font-medium text-[#374151] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(customValues[field.key])}
                          onChange={(e) =>
                            setCustomValues((prev) => ({ ...prev, [field.key]: e.target.checked }))
                          }
                          className="rounded border-[#D1D5DB] text-[#111827] focus:ring-0"
                        />
                        <span>
                          {field.label} {field.required ? '*' : ''}
                        </span>
                      </label>
                    ) : (
                      <>
                        <label className="block text-xs font-medium text-[#374151] mb-1">
                          {field.label} {field.required ? '*' : ''}
                        </label>
                        {field.type === 'dropdown' ? (
                          <select
                            required={field.required}
                            value={String(customValues[field.key] || '')}
                            onChange={(e) =>
                              setCustomValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                            }
                            className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs"
                          >
                            <option value="">Select...</option>
                            {(field.options || []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : field.type === 'textarea' ? (
                          <textarea
                            rows={3}
                            required={field.required}
                            placeholder={field.placeholder || ''}
                            value={String(customValues[field.key] || '')}
                            onChange={(e) =>
                              setCustomValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                            }
                            className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs"
                          />
                        ) : (
                          <input
                            type={
                              field.type === 'number' || field.type === 'currency'
                                ? 'number'
                                : field.type === 'date'
                                  ? 'date'
                                  : field.type === 'url'
                                    ? 'url'
                                    : 'text'
                            }
                            required={field.required}
                            placeholder={field.placeholder || ''}
                            value={String(customValues[field.key] || '')}
                            onChange={(e) =>
                              setCustomValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                            }
                            className="w-full px-3 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs"
                          />
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5">
                Detailed Scope & Specifications * (Do not include phone numbers in description)
              </label>
              <textarea
                required
                rows={4}
                minLength={10}
                value={specifications}
                onChange={(e) => setSpecifications(e.target.value)}
                placeholder="Describe technical specifications, volume/quantity, quality standards, and deliverables..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1.5">
                  Work / Delivery Location *
                </label>
                <input
                  type="text"
                  required
                  value={workLocation}
                  onChange={(e) => setWorkLocation(e.target.value)}
                  placeholder="Bengaluru / Remote / Pan-India"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1.5">Timeline *</label>
                <select
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] bg-white text-xs"
                >
                  <option value="Urgent (24-48 Hours)">Urgent (24-48 Hours)</option>
                  <option value="Immediate (Within 7 Days)">Immediate (Within 7 Days)</option>
                  <option value="Within 2-4 Weeks">Within 2-4 Weeks</option>
                  <option value="Flexible / Ongoing Retainer">Flexible / Ongoing Retainer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1.5">
                  Estimated Budget (Optional)
                </label>
                <input
                  type="text"
                  value={estimatedBudget}
                  onChange={(e) => setEstimatedBudget(e.target.value)}
                  placeholder="e.g., ₹1,50,000 or Quotes Invited"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D5DB] text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5">
                Supporting Specifications / Drawings (PDF, Images, CAD — Optional)
              </label>
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-[#9CA3AF] text-xs font-semibold text-[#374151] cursor-pointer hover:bg-[#F9FAFB]">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>{uploading ? 'Uploading to Firebase Storage...' : 'Attach Document'}</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
              {uploadedPaths.length > 0 && (
                <div className="mt-2 space-y-1">
                  {uploadedPaths.map((p) => (
                    <div key={p} className="text-[11px] text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {p.split('/').pop()}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-[#E8192C] text-white text-sm font-bold hover:bg-[#C91424] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting & Dispatching...</span>
                </>
              ) : (
                <>
                  <span>Publish Requirement Free</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function PostRequirementPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-xs">Loading...</div>}>
      <PostRequirementContent />
    </Suspense>
  );
}
