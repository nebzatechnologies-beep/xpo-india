'use client';

import React, { useEffect, useState } from 'react';
import type { WhatsAppWorkflowConfig, WorkflowStepDefinition } from '@/lib/types/domain';
import { Save, Plus, Trash2, Loader2 } from 'lucide-react';

export default function AdminWhatsAppConversationBuilderPage() {
  const [workflows, setWorkflows] = useState<WhatsAppWorkflowConfig[]>([]);
  const [activeId, setActiveId] = useState<string>('welcome');
  const [current, setCurrent] = useState<WhatsAppWorkflowConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/admin/whatsapp/workflows');
      if (res.ok) {
        const d = await res.json();
        const list: WhatsAppWorkflowConfig[] = Array.isArray(d.workflows)
          ? d.workflows
          : Object.values(d.workflows || {});
        setWorkflows(list);
        const found = list.find((w) => w.id === 'welcome') || list[0] || null;
        setCurrent(found ? JSON.parse(JSON.stringify(found)) : null);
      }
    }
    void load();
  }, []);

  function selectWorkflow(id: string) {
    setActiveId(id);
    const found = workflows.find((w) => w.id === id) || null;
    setCurrent(found ? JSON.parse(JSON.stringify(found)) : null);
  }

  function updateStep(idx: number, patch: Partial<WorkflowStepDefinition>) {
    if (!current) return;
    setCurrent({
      ...current,
      steps: current.steps.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    });
  }

  function addStep() {
    if (!current) return;
    setCurrent({
      ...current,
      steps: [
        ...current.steps,
        {
          key: `step_${current.steps.length + 1}`,
          promptText: 'Enter your response:',
          fieldToSave: `custom_${current.steps.length + 1}`,
          inputType: 'text',
          required: true,
        },
      ],
    });
  }

  async function saveWorkflow() {
    if (!current) return;
    try {
      setSaving(true);
      setMsg(null);
      const res = await fetch('/api/admin/whatsapp/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(current),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to save workflow');
      setWorkflows((prev) => prev.map((w) => (w.id === current.id ? d.workflow : w)));
      setMsg(`Saved "${current.title}" workflow to Cloud Firestore!`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111827]">
          WhatsApp Conversation & Agent Flow Builder
        </h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Configure Welcome, Client, and Partner WhatsApp onboarding prompts and fallback messages.
          Natural-language messages also route automatically through the XPO Agent Engine.
        </p>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          {msg}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(['welcome', 'client', 'partner'] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => selectWorkflow(id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize border transition-colors ${
              activeId === id
                ? 'bg-[#111827] text-white border-[#111827]'
                : 'bg-white text-[#374151] border-[#D1D5DB] hover:bg-gray-50'
            }`}
          >
            {id} Flow
          </button>
        ))}
      </div>

      {current && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-5 text-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#111827]">{current.title}</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addStep}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-[#D1D5DB] font-bold hover:bg-gray-50"
              >
                <Plus className="w-3.5 h-3.5" /> Add Step
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveWorkflow()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E8192C] hover:bg-[#c81324] text-white font-bold transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{saving ? 'Saving...' : 'Save Flow'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1">Welcome / Entry Message</label>
              <textarea
                rows={3}
                value={current.welcomeMessage}
                onChange={(e) => setCurrent({ ...current, welcomeMessage: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB]"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Fallback / Invalid Input Prompt</label>
              <textarea
                rows={3}
                value={current.fallbackMessage}
                onChange={(e) => setCurrent({ ...current, fallbackMessage: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D1D5DB]"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="font-bold uppercase tracking-wider text-[#6B7280]">
              Guided Steps ({current.steps.length})
            </div>
            {current.steps.map((step, idx) => (
              <div
                key={step.key}
                className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-2"
              >
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    value={step.key}
                    onChange={(e) => updateStep(idx, { key: e.target.value })}
                    placeholder="step_key"
                    className="px-3 py-1.5 rounded-lg border border-[#D1D5DB] bg-white font-mono"
                  />
                  <input
                    type="text"
                    value={step.fieldToSave}
                    onChange={(e) => updateStep(idx, { fieldToSave: e.target.value })}
                    placeholder="fieldToSave"
                    className="px-3 py-1.5 rounded-lg border border-[#D1D5DB] bg-white font-mono"
                  />
                  <select
                    value={step.inputType}
                    onChange={(e) =>
                      updateStep(idx, {
                        inputType: e.target.value as WorkflowStepDefinition['inputType'],
                      })
                    }
                    className="px-3 py-1.5 rounded-lg border border-[#D1D5DB] bg-white"
                  >
                    <option value="text">Free Text</option>
                    <option value="buttons">Interactive Buttons (≤3)</option>
                    <option value="list">Interactive List (≤10)</option>
                    <option value="taxonomy_category">Live Taxonomy Category Picker</option>
                    <option value="document_optional">Optional Supporting Document</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrent({
                        ...current,
                        steps: current.steps.filter((_, i) => i !== idx),
                      })
                    }
                    className="inline-flex items-center justify-end gap-1 text-red-600 font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={step.promptText}
                  onChange={(e) => updateStep(idx, { promptText: e.target.value })}
                  placeholder="WhatsApp message prompt sent to recipient..."
                  className="w-full px-3 py-2 rounded-lg border border-[#D1D5DB] bg-white"
                />

                {(step.inputType === 'buttons' || step.inputType === 'list') && (
                  <div className="pt-2 border-t border-[#E5E7EB]">
                    <label className="block text-[10px] font-bold text-[#6B7280] mb-1">
                      {step.inputType === 'buttons'
                        ? 'Interactive Buttons (≤3, comma-separated titles):'
                        : 'Interactive List Items (≤10, comma-separated titles):'}
                    </label>
                    <input
                      type="text"
                      value={(step.options || []).map((o) => o.title).join(', ')}
                      onChange={(e) => {
                        const titles = e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean);
                        const nextOptions = titles.map((t, optIdx) => ({
                          id: `opt_${step.key}_${optIdx + 1}`,
                          title: t.slice(0, 20),
                        }));
                        updateStep(idx, { options: nextOptions });
                      }}
                      placeholder={
                        step.inputType === 'buttons'
                          ? 'e.g., Register as Client, Register as Partner'
                          : 'e.g., Accounting, IT Services, Legal, Marketing'
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-[#D1D5DB] bg-white text-xs"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
