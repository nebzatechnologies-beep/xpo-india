'use client';

import React, { useEffect, useState } from 'react';
import type { CustomFormField, TaxonomyCategory } from '@/lib/types/domain';
import { Plus, Trash2, Save } from 'lucide-react';

export default function AdminTaxonomyFormBuilderPage() {
  const [categories, setCategories] = useState<TaxonomyCategory[]>([]);
  const [targetId, setTargetId] = useState('');
  const [fields, setFields] = useState<CustomFormField[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadCats() {
      const res = await fetch('/api/taxonomy/categories');
      if (res.ok) {
        const d = await res.json();
        const cats: TaxonomyCategory[] = d.categories || [];
        setCategories(cats);
        if (cats.length > 0) setTargetId(cats[0].id);
      }
    }
    void loadCats();
  }, []);

  useEffect(() => {
    if (!targetId) return;
    async function loadSchema() {
      const res = await fetch(
        `/api/taxonomy/form-builder?targetId=${encodeURIComponent(targetId)}`
      );
      if (res.ok) {
        const d = await res.json();
        setFields(d.schema?.fields || []);
      }
    }
    void loadSchema();
  }, [targetId]);

  function addField() {
    setFields((prev) => [
      ...prev,
      {
        id: `fld_${Date.now()}`,
        label: 'New Specification Field',
        key: `field_${prev.length + 1}`,
        type: 'text',
        required: false,
        order: prev.length + 1,
      },
    ]);
  }

  async function saveSchema() {
    if (!targetId) return;
    try {
      setSaving(true);
      setMsg(null);
      const res = await fetch('/api/taxonomy/form-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: 'category',
          targetId,
          fields,
        }),
      });
      if (!res.ok) throw new Error('Failed to save dynamic form schema');
      setMsg('Dynamic category form schema saved to Cloud Firestore.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111827]">Dynamic Category Form Builder</h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Configure category-specific intake questions rendered automatically on Client Post
          Requirement forms.
        </p>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          {msg}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[#D1D5DB] bg-white text-xs font-bold"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={addField}
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" /> Add Field
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveSchema()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111827] hover:bg-black text-white text-xs font-semibold shadow-xs transition"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Schema'}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {fields.map((f, idx) => (
            <div
              key={f.id}
              className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] grid grid-cols-1 sm:grid-cols-5 gap-3 items-center text-xs"
            >
              <input
                type="text"
                value={f.label}
                onChange={(e) =>
                  setFields((prev) =>
                    prev.map((item, i) => (i === idx ? { ...item, label: e.target.value } : item))
                  )
                }
                placeholder="Label"
                className="px-3 py-2 rounded-lg border border-[#D1D5DB] bg-white"
              />
              <input
                type="text"
                value={f.key}
                onChange={(e) =>
                  setFields((prev) =>
                    prev.map((item, i) => (i === idx ? { ...item, key: e.target.value } : item))
                  )
                }
                placeholder="field_key"
                className="px-3 py-2 rounded-lg border border-[#D1D5DB] bg-white font-mono"
              />
              <select
                value={f.type}
                onChange={(e) =>
                  setFields((prev) =>
                    prev.map((item, i) =>
                      i === idx ? { ...item, type: e.target.value as CustomFormField['type'] } : item
                    )
                  )
                }
                className="px-3 py-2 rounded-lg border border-[#D1D5DB] bg-white"
              >
                <option value="text">Single-line Text</option>
                <option value="textarea">Multi-line Textarea</option>
                <option value="dropdown">Dropdown Select</option>
                <option value="number">Numeric Input</option>
                <option value="currency">Currency Amount</option>
                <option value="date">Date Picker</option>
                <option value="checkbox">Checkbox (Yes / No)</option>
                <option value="url">Web / Portfolio URL</option>
              </select>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={f.required}
                  onChange={(e) =>
                    setFields((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, required: e.target.checked } : item
                      )
                    )
                  }
                />
                Required
              </label>
              <button
                type="button"
                onClick={() => setFields((prev) => prev.filter((_, i) => i !== idx))}
                className="inline-flex items-center gap-1 text-red-600 font-bold justify-end"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>

              {f.type === 'dropdown' && (
                <div className="col-span-full pt-1.5 border-t border-[#E5E7EB] mt-1">
                  <label className="block text-[10px] font-bold text-[#6B7280] mb-1">
                    Dropdown Select Options (comma-separated):
                  </label>
                  <input
                    type="text"
                    value={(f.options || []).join(', ')}
                    onChange={(e) =>
                      setFields((prev) =>
                        prev.map((item, i) =>
                          i === idx
                            ? {
                                ...item,
                                options: e.target.value
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              }
                            : item
                        )
                      )
                    }
                    placeholder="e.g., Standard Delivery, Urgent 24h, Custom Timeline"
                    className="w-full px-3 py-1.5 rounded-lg border border-[#D1D5DB] bg-white text-xs"
                  />
                </div>
              )}
            </div>
          ))}
          {fields.length === 0 && (
            <p className="text-xs text-[#6B7280] py-4">
              No custom fields configured for this category yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
