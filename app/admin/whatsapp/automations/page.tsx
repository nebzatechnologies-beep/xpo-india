'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Workflow, Plus, Play, ToggleLeft, ToggleRight, CheckCircle2 } from 'lucide-react';

interface AutomationItem {
  id: string;
  name: string;
  trigger: string;
  conditions: string;
  templateName: string;
  status: string;
  lastExecuted: string;
}

export default function WhatsAppAutomationsPage() {
  const [automations, setAutomations] = useState<AutomationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [testSuccess, setTestSuccess] = useState('');
  const [form, setForm] = useState({
    name: 'Instant Absorber Notification on Lead Approval',
    trigger: 'Lead Approved by Superadmin',
    conditions: 'Absorber Capabilities match Subcategory & Active Subscription',
    templateName: 'xpo_lead_match_alert'
  });

  useEffect(() => {
    fetch('/api/whatsapp/automations')
      .then(res => res.json())
      .then(res => {
        if (res.success) setAutomations(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleStatus = async (item: AutomationItem) => {
    const res = await fetch('/api/whatsapp/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle', id: item.id })
    });
    const data = await res.json();
    if (data.success) {
      setAutomations(automations.map(a => a.id === item.id ? data.data : a));
    }
  };

  const handleTest = async (item: AutomationItem) => {
    const res = await fetch('/api/whatsapp/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'test', id: item.id })
    });
    const data = await res.json();
    if (data.success) {
      setTestSuccess(data.message);
      setTimeout(() => setTestSuccess(''), 3000);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/whatsapp/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (data.success) {
      setAutomations([data.data, ...automations]);
      setModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">WhatsApp Event Automations</h1>
          <p className="text-xs text-[#717171] mt-0.5">Automated rule triggers: Lead Approved, Proposals Received, Subscription Renewal reminders.</p>
        </div>

        <Button onClick={() => setModalOpen(true)} className="bg-[#E8192C] hover:bg-[#D01627] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> + New Automation Rule
        </Button>
      </div>

      {testSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {testSuccess}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {automations.map(auto => (
          <Card key={auto.id} className="p-5 rounded-2xl border border-[#EBEBEB] bg-white space-y-3 shadow-none flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant={auto.status === 'active' ? 'success' : 'neutral'} className="text-[10px]">
                  {auto.status.toUpperCase()}
                </Badge>
                <span className="text-[10px] text-[#717171]">Last run: {auto.lastExecuted}</span>
              </div>

              <h3 className="font-bold text-sm text-[#222222]">{auto.name}</h3>

              <div className="p-3 bg-neutral-50 rounded-xl border border-[#EBEBEB] space-y-1.5 text-xs text-[#555555]">
                <div><strong className="text-[#222222]">TRIGGER:</strong> {auto.trigger}</div>
                <div><strong className="text-[#222222]">CONDITIONS:</strong> {auto.conditions}</div>
                <div><strong className="text-[#222222]">ACTION:</strong> Send template <code className="text-[#E8192C] font-mono">{auto.templateName}</code></div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#EBEBEB] flex items-center justify-between">
              <button onClick={() => toggleStatus(auto)} className="flex items-center gap-1.5 text-xs font-semibold text-[#555555]">
                {auto.status === 'active' ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-neutral-400" />}
                <span>{auto.status === 'active' ? 'Active' : 'Disabled'}</span>
              </button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTest(auto)}
                className="text-xs rounded-xl border-[#EBEBEB] flex items-center gap-1"
              >
                <Play className="w-3 h-3 text-[#E8192C]" /> Test Trigger
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#EBEBEB] shadow-xl">
            <h3 className="text-base font-black text-[#222222]">Create Automation Rule</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Trigger Event</label>
                <select
                  value={form.trigger}
                  onChange={e => setForm({ ...form, trigger: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] outline-none"
                >
                  <option value="Lead Approved by Superadmin">Lead Approved by Superadmin</option>
                  <option value="10 Proposals Received on Lead">10 Proposals Received on Lead</option>
                  <option value="Subscription Renewal Expiring (3 Days)">Subscription Renewal Expiring (3 Days)</option>
                  <option value="Direct Connection Established">Direct Connection Established</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Condition Filter</label>
                <input
                  type="text"
                  value={form.conditions}
                  onChange={e => setForm({ ...form, conditions: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Action Template</label>
                <select
                  value={form.templateName}
                  onChange={e => setForm({ ...form, templateName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] outline-none font-mono"
                >
                  <option value="xpo_lead_match_alert">xpo_lead_match_alert</option>
                  <option value="xpo_direct_platform_invitation">xpo_direct_platform_invitation</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-[#E8192C] text-white">Save Rule</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
