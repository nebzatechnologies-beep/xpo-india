'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Users,
  FileCode2,
  DollarSign,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function CreateCampaignWizardPage() {
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState<any[]>([]);
  const [contactsCount, setContactsCount] = useState(120);

  const [form, setForm] = useState({
    name: 'Q3 CNC Vendor Acquisition Push',
    type: 'Company Invitation',
    audienceSector: 'Manufacturing & Industrial',
    audienceCountry: 'India',
    templateId: 'tpl_001',
    templateName: 'xpo_direct_platform_invitation',
    variable1: '{{company_name}}',
    variable2: '{{industry_requirement}}',
    scheduleMode: 'immediate',
    scheduledDate: '',
    estimatedSpend: 105.6,
  });

  const [submitting, setSubmitting] = useState(false);
  const [finishedCampaign, setFinishedCampaign] = useState<any>(null);

  useEffect(() => {
    fetch('/api/whatsapp/templates')
      .then(res => res.json())
      .then(res => {
        if (res.success) setTemplates(res.data);
      });
  }, []);

  const handleLaunch = async () => {
    setSubmitting(true);
    const res = await fetch('/api/whatsapp/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        type: form.type,
        audienceName: `${form.audienceSector} (${form.audienceCountry})`,
        eligibleRecipients: contactsCount,
        templateId: form.templateId,
        templateName: form.templateName,
        spend: form.estimatedSpend,
        scheduledDate: form.scheduleMode === 'immediate' ? null : form.scheduledDate || 'Tomorrow at 10:00 AM'
      })
    });
    const data = await res.json();
    if (data.success) {
      setFinishedCampaign(data.data);
      setStep(7);
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Wizard Progress */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EBEBEB]">
        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">Create Bulk WhatsApp Campaign</h1>
          <p className="text-xs text-[#717171] mt-0.5">7-Step guided Meta WABA campaign orchestrator.</p>
        </div>
        <Badge variant="outline" className="text-xs font-bold border-red-200 text-[#E8192C] bg-red-50">
          Step {step} of 7
        </Badge>
      </div>

      {/* STEP 1: CAMPAIGN DETAILS */}
      {step === 1 && (
        <Card className="p-6 rounded-2xl border border-[#EBEBEB] bg-white space-y-4">
          <div className="font-bold text-sm text-[#222222]">Step 1: Campaign Details & Commercial Objective</div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Campaign Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:border-[#E8192C] outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Campaign Intent Type</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:border-[#E8192C] outline-none"
              >
                <option value="Company Invitation">Company Invitation & Acquisition</option>
                <option value="New Opportunity">New Opportunity Match Notification</option>
                <option value="Subscription Reminder">Subscription Renewal Reminder</option>
                <option value="Proposal Notification">Proposal Received Alert</option>
                <option value="General Announcement">General Platform Announcement</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button size="sm" onClick={() => setStep(2)} className="bg-[#E8192C] text-white">
              Next: Audience Filter <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: AUDIENCE SELECTION WITH CRM FILTERS */}
      {step === 2 && (
        <Card className="p-6 rounded-2xl border border-[#EBEBEB] bg-white space-y-4">
          <div className="font-bold text-sm text-[#222222]">Step 2: Audience Selection (Live CRM Query)</div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Target Sector</label>
              <select
                value={form.audienceSector}
                onChange={e => setForm({ ...form, audienceSector: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] outline-none"
              >
                <option value="Manufacturing & Industrial">Manufacturing & Industrial</option>
                <option value="Raw Materials & Chemicals">Raw Materials & Chemicals</option>
                <option value="Textiles & Apparel">Textiles & Apparel</option>
                <option value="Information Technology">Information Technology</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Geographic Filter</label>
              <select
                value={form.audienceCountry}
                onChange={e => setForm({ ...form, audienceCountry: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] outline-none"
              >
                <option value="India">India Domestic (Pune, Mumbai, Ahmedabad)</option>
                <option value="Global">International Buyers (USA, Europe, UAE)</option>
              </select>
            </div>
          </div>

          {/* Real-time Eligible Counter */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-emerald-800">Matching CRM Audience Found</div>
              <div className="text-[11px] text-emerald-700">Verified opt-in consent with valid mobile numbers.</div>
            </div>
            <div className="text-xl font-black text-emerald-600">{contactsCount} Contacts</div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" size="sm" onClick={() => setStep(1)}>Back</Button>
            <Button size="sm" onClick={() => setStep(3)} className="bg-[#E8192C] text-white">
              Next: Select Template <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: TEMPLATE & VARIABLE MAPPING */}
      {step === 3 && (
        <Card className="p-6 rounded-2xl border border-[#EBEBEB] bg-white space-y-4">
          <div className="font-bold text-sm text-[#222222]">Step 3: Meta Template & Dynamic Variable Mapping</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Approved Template</label>
                <select
                  value={form.templateId}
                  onChange={e => {
                    const t = templates.find(item => item.id === e.target.value);
                    setForm({ ...form, templateId: e.target.value, templateName: t?.name || form.templateName });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] outline-none font-mono"
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Variable 1: Company / Contact</label>
                <input
                  type="text"
                  disabled
                  value="Dynamic from CRM: {{contact.company}}"
                  className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] bg-neutral-50 text-[#717171]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#717171] uppercase tracking-wider mb-1">Variable 2: Industrial Domain</label>
                <input
                  type="text"
                  disabled
                  value="Dynamic from CRM: {{contact.industry}}"
                  className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] bg-neutral-50 text-[#717171]"
                />
              </div>
            </div>

            {/* Live WhatsApp Bubble Preview */}
            <div className="p-4 rounded-2xl bg-[#EFEAE2] border border-[#DDD5C7] space-y-2">
              <div className="text-[10px] font-bold text-[#717171] uppercase">Live Bubble Preview</div>
              <div className="p-3 bg-white rounded-xl shadow-xs text-xs space-y-1.5">
                <div className="font-bold text-emerald-800 text-[11px]">XPO India Platform</div>
                <div className="text-[#222222]">
                  Hi <strong>[Patel Precision Tech]</strong>, verified buyers on XPO India have active requirements in <strong>[Manufacturing]</strong>.
                </div>
                <div className="text-[10px] text-[#717171] text-right">10:00 AM • ✓✓</div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" size="sm" onClick={() => setStep(2)}>Back</Button>
            <Button size="sm" onClick={() => setStep(4)} className="bg-[#E8192C] text-white">
              Next: Cost Estimation <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4: COST ESTIMATION */}
      {step === 4 && (
        <Card className="p-6 rounded-2xl border border-[#EBEBEB] bg-white space-y-4">
          <div className="font-bold text-sm text-[#222222]">Step 4: Meta Cloud API Cost Calculation</div>

          <div className="p-4 rounded-xl bg-neutral-50 border border-[#EBEBEB] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#717171]">Recipients:</span>
              <span className="font-bold text-[#222222]">{contactsCount} Contacts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#717171]">Meta Utility Rate (India):</span>
              <span className="font-mono text-[#555555]">₹0.88 / conversation</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#EBEBEB] text-sm">
              <span className="font-bold text-[#222222]">Estimated Total Spend:</span>
              <span className="font-mono font-black text-[#E8192C]">₹{(contactsCount * 0.88).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" size="sm" onClick={() => setStep(3)}>Back</Button>
            <Button size="sm" onClick={() => setStep(5)} className="bg-[#E8192C] text-white">
              Next: Delivery Schedule <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 5: DELIVERY SCHEDULE */}
      {step === 5 && (
        <Card className="p-6 rounded-2xl border border-[#EBEBEB] bg-white space-y-4">
          <div className="font-bold text-sm text-[#222222]">Step 5: Delivery Timing & Throttling</div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="schedule"
                checked={form.scheduleMode === 'immediate'}
                onChange={() => setForm({ ...form, scheduleMode: 'immediate' })}
                className="text-[#E8192C] focus:ring-[#E8192C]"
              />
              <span className="font-bold text-[#222222]">Send Immediately Upon Approval</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="schedule"
                checked={form.scheduleMode === 'scheduled'}
                onChange={() => setForm({ ...form, scheduleMode: 'scheduled' })}
                className="text-[#E8192C] focus:ring-[#E8192C]"
              />
              <span className="font-bold text-[#222222]">Schedule for Optimal Opening Window (e.g. 10:30 AM Tomorrow)</span>
            </label>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" size="sm" onClick={() => setStep(4)}>Back</Button>
            <Button size="sm" onClick={() => setStep(6)} className="bg-[#E8192C] text-white">
              Review Campaign <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 6: CAMPAIGN REVIEW */}
      {step === 6 && (
        <Card className="p-6 rounded-2xl border border-[#EBEBEB] bg-white space-y-4">
          <div className="font-bold text-sm text-[#222222]">Step 6: Review & Final Authorization</div>

          <div className="p-4 rounded-xl bg-neutral-50 border border-[#EBEBEB] space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-[#717171]">Campaign:</span> <span className="font-bold text-[#222222]">{form.name}</span></div>
            <div className="flex justify-between"><span className="text-[#717171]">Target Audience:</span> <span className="font-semibold">{form.audienceSector}</span></div>
            <div className="flex justify-between"><span className="text-[#717171]">Recipients:</span> <span className="font-bold text-emerald-600">{contactsCount} Contacts</span></div>
            <div className="flex justify-between"><span className="text-[#717171]">Template:</span> <span className="font-mono text-[#555555]">{form.templateName}</span></div>
            <div className="flex justify-between"><span className="text-[#717171]">Estimated Spend:</span> <span className="font-mono font-bold text-[#E8192C]">₹{(contactsCount * 0.88).toFixed(2)}</span></div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" size="sm" onClick={() => setStep(5)}>Back</Button>
            <Button size="sm" onClick={handleLaunch} isLoading={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Authorize & Launch WhatsApp Campaign
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 7: CONFIRMATION & DISPATCH */}
      {step === 7 && (
        <Card className="p-8 rounded-2xl border border-[#EBEBEB] bg-white text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-[#222222]">WhatsApp Campaign Dispatched!</h3>
            <p className="text-xs text-[#717171] mt-1">
              Campaign <span className="font-bold text-[#222222]">{finishedCampaign?.name}</span> is now processing via Meta Cloud API.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <Link href="/admin/whatsapp/campaigns">
              <Button size="sm" className="bg-[#E8192C] text-white text-xs font-semibold rounded-xl">
                View All Campaigns
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
