'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, CheckCircle2, Smartphone, Plus } from 'lucide-react';
import Link from 'next/link';

export default function CreateTemplatePage() {
  const [form, setForm] = useState({
    name: 'xpo_vendor_lead_alert',
    category: 'MARKETING',
    language: 'en_US',
    headerText: 'XPO Opportunity Alert',
    bodyText: 'Hi {{1}}, a new procurement lead matching your capabilities in {{2}} has been posted with budget {{3}}.',
    footerText: 'XPO India Platform • Reply STOP to opt-out',
    buttonText: 'View Lead Details',
    buttonUrl: 'https://xpoindia.com/leads',
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/whatsapp/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        buttons: [{ type: 'URL', text: form.buttonText, url: form.buttonUrl }],
        variables: ['company_name', 'sector', 'budget']
      })
    });
    const data = await res.json();
    if (data.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-[#EBEBEB]">
        <div className="flex items-center gap-3">
          <Link href="/admin/whatsapp/templates">
            <Button variant="outline" size="sm" className="rounded-xl border-[#EBEBEB]">
              <ArrowLeft className="w-3.5 h-3.5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-black text-[#222222]">Create WhatsApp Message Template</h1>
            <p className="text-xs text-[#717171]">Submit compliant template payload to Meta Cloud API Graph v20.0.</p>
          </div>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Template Submitted & Approved by Meta API!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form */}
        <div className="lg:col-span-7">
          <Card className="p-6 rounded-2xl border border-[#EBEBEB] bg-white shadow-none">
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Template Name (Snake Case)</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] font-mono outline-none focus:border-[#E8192C]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] outline-none"
                  >
                    <option value="MARKETING">MARKETING</option>
                    <option value="UTILITY">UTILITY</option>
                    <option value="AUTHENTICATION">AUTHENTICATION</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Header Text (Optional)</label>
                <input
                  type="text"
                  value={form.headerText}
                  onChange={e => setForm({ ...form, headerText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] outline-none focus:border-[#E8192C]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Message Body (Use {'{{1}}'}, {'{{2}}'} for variables)</label>
                <textarea
                  rows={4}
                  required
                  value={form.bodyText}
                  onChange={e => setForm({ ...form, bodyText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] outline-none focus:border-[#E8192C]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Footer Text</label>
                <input
                  type="text"
                  value={form.footerText}
                  onChange={e => setForm({ ...form, footerText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={form.buttonText}
                    onChange={e => setForm({ ...form, buttonText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Target URL</label>
                  <input
                    type="text"
                    value={form.buttonUrl}
                    onChange={e => setForm({ ...form, buttonUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" size="sm" isLoading={saving} className="bg-[#E8192C] text-white">
                  <Save className="w-3.5 h-3.5 mr-1" /> Submit to Meta API
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Live Chat Bubble Preview */}
        <div className="lg:col-span-5">
          <Card className="p-6 rounded-2xl border border-[#DDD5C7] bg-[#EFEAE2] min-h-[420px] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="text-[10px] font-bold text-[#717171] uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-700" /> Live Chat Bubble Preview
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2 border border-[#E2D8C8]">
                {form.headerText && (
                  <div className="font-bold text-xs text-[#222222] pb-1 border-b border-neutral-100">
                    {form.headerText}
                  </div>
                )}
                <div className="text-xs text-[#333333] whitespace-pre-wrap leading-relaxed">
                  {form.bodyText.replace('{{1}}', '[Company Name]').replace('{{2}}', '[Manufacturing]').replace('{{3}}', '[₹5,00,000]')}
                </div>
                {form.footerText && (
                  <div className="text-[10px] text-[#717171] pt-1">
                    {form.footerText}
                  </div>
                )}
                <div className="text-[9px] text-[#999999] text-right font-mono">
                  10:30 AM • ✓✓
                </div>
              </div>

              {/* Action Button */}
              {form.buttonText && (
                <div className="p-2.5 bg-white rounded-xl shadow-xs text-center text-xs font-bold text-[#00A884] border border-[#E2D8C8] cursor-pointer hover:bg-neutral-50 transition-colors">
                  {form.buttonText} ↗
                </div>
              )}
            </div>

            <div className="text-[11px] text-[#717171] text-center pt-4">
              Meta WABA preview compliant with Graph API spec.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
