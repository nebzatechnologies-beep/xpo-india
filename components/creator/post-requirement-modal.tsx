'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  X,
  PlusCircle,
  Building2,
  Layers,
  Globe2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface DynamicField {
  id: string;
  label: string;
  key: string;
  type: string;
  placeholder?: string;
  description?: string;
  required: boolean;
}

interface PostRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PostRequirementModal({
  isOpen,
  onClose,
  onSuccess,
}: PostRequirementModalProps) {
  const router = useRouter();

  // Cascading taxonomy states
  const [sectors, setSectors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);

  const [leadType, setLeadType] = useState('buy');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  // Dynamic custom fields based on category
  const [customFields, setCustomFields] = useState<DynamicField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  // Lead core details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState('IN');
  const [city, setCity] = useState('Pune, Maharashtra');
  const [budgetOpen, setBudgetOpen] = useState(true); // Price is never mandatory
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [budgetCurrency, setBudgetCurrency] = useState('INR');
  const [deadline, setDeadline] = useState('');
  const [quantity, setQuantity] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [allowGlobalBids, setAllowGlobalBids] = useState(true);
  const [tags, setTags] = useState('CNC, Aluminum, ISO9001');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  // Load taxonomy tree on open
  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/taxonomy/tree')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setSectors(res.data.sectors || []);
          setCategories(res.data.categories || []);
          setSubcategories(res.data.subcategories || []);

          if (res.data.sectors?.length > 0 && !selectedSector) {
            const firstSec = res.data.sectors[0].code;
            setSelectedSector(firstSec);

            const filteredCats = res.data.categories.filter((c: any) => c.parentSectorCode === firstSec);
            if (filteredCats.length > 0) {
              const firstCat = filteredCats[0].slug || filteredCats[0].code;
              setSelectedCategory(firstCat);

              const filteredSubs = res.data.subcategories.filter((s: any) => s.parentCategoryCode === filteredCats[0].code);
              if (filteredSubs.length > 0) {
                setSelectedSubcategory(filteredSubs[0].code);
              }
            }
          }
        }
      })
      .catch((err) => console.error('Failed to load taxonomy:', err));
  }, [isOpen]);

  // Sector cascade
  const handleSectorChange = (secCode: string) => {
    setSelectedSector(secCode);
    const filteredCats = categories.filter((c: any) => c.parentSectorCode === secCode);
    if (filteredCats.length > 0) {
      const catCode = filteredCats[0].slug || filteredCats[0].code;
      setSelectedCategory(catCode);
      const filteredSubs = subcategories.filter((s: any) => s.parentCategoryCode === filteredCats[0].code);
      setSelectedSubcategory(filteredSubs[0]?.code || '');
    } else {
      setSelectedCategory('');
      setSelectedSubcategory('');
    }
  };

  // Category cascade & dynamic fields fetch
  const handleCategoryChange = (catSlugOrCode: string) => {
    setSelectedCategory(catSlugOrCode);
    const catObj = categories.find((c: any) => c.slug === catSlugOrCode || c.code === catSlugOrCode);
    if (catObj) {
      const filteredSubs = subcategories.filter((s: any) => s.parentCategoryCode === catObj.code);
      setSelectedSubcategory(filteredSubs[0]?.code || '');
    }
  };

  useEffect(() => {
    if (!selectedCategory) return;
    fetch(`/api/taxonomy/form-builder?classificationCode=${selectedCategory}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setCustomFields(res.data.fields || []);
        }
      })
      .catch(() => setCustomFields([]));
  }, [selectedCategory]);

  const handleCustomFieldChange = (key: string, val: any) => {
    setCustomFieldValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg('Please specify both the requirement title and technical specifications.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);

      const payload = {
        title,
        description,
        type: leadType,
        sector: selectedSector,
        category: selectedCategory,
        subcategory: selectedSubcategory,
        country,
        city,
        budgetOpenForDiscussion: budgetOpen,
        budgetMin: budgetOpen && !budgetMin ? undefined : Number(budgetMin) || undefined,
        budgetMax: budgetOpen && !budgetMax ? undefined : Number(budgetMax) || undefined,
        budgetCurrency,
        deadline: deadline || undefined,
        quantity: quantity || undefined,
        attachments: attachmentUrl ? [attachmentUrl] : [],
        tags: parsedTags,
        customFields: customFieldValues,
        allowGlobalBids,
      };

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to publish requirement');
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onSuccess) onSuccess();
        router.push('/creator/my-leads');
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error publishing requirement');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4 p-0 animate-in fade-in duration-150">
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl border border-[#E5E7EB] shadow-2xl max-w-2xl w-full h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Swipe / Sheet Drag Indicator */}
        <div className="w-12 h-1 rounded-full bg-slate-300 mx-auto mt-2 mb-1 sm:hidden shrink-0" />

        {/* Modal Top Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#E5E7EB] flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-red-50 text-[#E8192C] flex items-center justify-center shrink-0">
              <PlusCircle className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold text-[#111827] truncate">Post a Requirement</h2>
              <p className="text-[10px] sm:text-[11px] text-[#6B7280] truncate">
                Broadcast your RFQ to qualified manufacturers & verified suppliers.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1">
          {success ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-extrabold text-[#111827]">Requirement Published Successfully!</h3>
              <p className="text-xs text-[#6B7280] max-w-md mx-auto">
                Your requirement has been listed on the live exchange. Qualified suppliers will be notified immediately via WhatsApp & Email.
              </p>
            </div>
          ) : (
            <form id="post-requirement-form" onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-[#E8192C] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Requirement Type Segment */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#374151] uppercase tracking-wider">
                  Requirement Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'buy', label: 'Procure / Buy', desc: 'Direct raw materials or finished goods' },
                    { id: 'subcontract', label: 'Sub-contract', desc: 'Outsource manufacturing or job work' },
                    { id: 'talent', label: 'Hire Talent', desc: 'Specialized engineers or consultants' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setLeadType(t.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        leadType === t.id
                          ? 'border-[#E8192C] bg-red-50/50 shadow-xs'
                          : 'border-[#E5E7EB] hover:bg-[#F9FAFB]'
                      }`}
                    >
                      <div className="text-xs font-bold text-[#111827]">{t.label}</div>
                      <div className="text-[10px] text-[#6B7280] mt-0.5 leading-tight">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cascading Taxonomy Tree */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#374151] flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#6B7280]" />
                    Industrial Sector
                  </label>
                  <select
                    value={selectedSector}
                    onChange={(e) => handleSectorChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#111827] focus:outline-hidden focus:border-[#E8192C]"
                  >
                    {sectors.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#374151] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#6B7280]" />
                    Category Classification
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#111827] focus:outline-hidden focus:border-[#E8192C]"
                  >
                    {categories
                      .filter((c) => !selectedSector || c.parentSectorCode === selectedSector)
                      .map((c) => (
                        <option key={c.code} value={c.slug || c.code}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#374151]">
                    Requirement Headline <span className="text-[#E8192C]">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Urgent requirement for 5,000 Precision CNC Machined Aluminum Flanges"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-xs rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#374151]">
                    Technical Specifications & Scope <span className="text-[#E8192C]">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe material grade, required certifications (e.g. ISO 9001, AS9100), tolerances, monthly delivery batches, and packaging criteria..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] focus:outline-hidden focus:border-[#E8192C] resize-none"
                    required
                  />
                </div>
              </div>

              {/* Dynamic Custom Fields (if category has schema) */}
              {customFields.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#111827]">
                    <FileSpreadsheet className="w-4 h-4 text-[#E8192C]" />
                    <span>Industry Custom Specifications</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {customFields.map((field) => (
                      <div key={field.id} className="space-y-1">
                        <label className="text-[11px] font-semibold text-[#4B5563]">
                          {field.label} {field.required && <span className="text-[#E8192C]">*</span>}
                        </label>
                        <Input
                          placeholder={field.placeholder || ''}
                          value={customFieldValues[field.key] || ''}
                          onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                          className="text-xs rounded-xl h-8 bg-white"
                          required={field.required}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity, Deadline & Attachments */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#374151]">Required Quantity / Batch Size</label>
                  <Input
                    placeholder="e.g. 5,000 units or 100 kg"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#374151]">Delivery Deadline / Timeline</label>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#374151]">Specification Sheet / Drawing Link (Optional)</label>
                <Input
                  placeholder="e.g. https://drive.google.com/file/... or CAD link"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="text-xs rounded-xl"
                />
              </div>

              {/* Commercials: Budget Open for Discussion (Price is never mandatory) */}
              <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#111827]">
                      Budget / Price is Open for Discussion (Optional)
                    </span>
                    <p className="text-[11px] text-[#6B7280]">
                      Price is never mandatory on XPO. All final pricing is negotiated directly with partners off-platform.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={budgetOpen}
                    onChange={(e) => setBudgetOpen(e.target.checked)}
                    className="w-4 h-4 rounded text-[#E8192C] accent-[#E8192C]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E5E7EB]">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#374151]">Currency</label>
                    <select
                      value={budgetCurrency}
                      onChange={(e) => setBudgetCurrency(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#111827] focus:outline-hidden focus:border-[#E8192C]"
                    >
                      <option value="INR">INR (₹) Domestic</option>
                      <option value="USD">USD ($) Global</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#374151]">
                      Target Min {budgetOpen ? '(Optional)' : ''}
                    </label>
                    <Input
                      type="number"
                      placeholder={budgetOpen ? 'Optional' : 'e.g. 200000'}
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                      className="text-xs rounded-xl bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#374151]">
                      Target Max {budgetOpen ? '(Optional)' : ''}
                    </label>
                    <Input
                      type="number"
                      placeholder={budgetOpen ? 'Optional' : 'e.g. 500000'}
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                      className="text-xs rounded-xl bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Location & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#374151]">Delivery Location / Hub</label>
                  <Input
                    placeholder="e.g. Pune / Peenya, Bangalore"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#374151]">Filter Tags (Comma Separated)</label>
                  <Input
                    placeholder="CNC, Aluminum, ISO9001"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Cross-border Liquidity Toggle */}
              <div className="p-3.5 rounded-2xl border border-blue-100 bg-blue-50/50 flex items-start gap-3">
                <Globe2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#111827]">
                      Enable Cross-Border Sourcing
                    </span>
                    <input
                      type="checkbox"
                      checked={allowGlobalBids}
                      onChange={(e) => setAllowGlobalBids(e.target.checked)}
                      className="w-4 h-4 rounded text-[#E8192C] focus:ring-red-500 accent-[#E8192C]"
                    />
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    Allow foreign engineering talent & international suppliers to submit bids on this requirement. Indian buyers can seamlessly hire foreign suppliers.
                  </p>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        {!success && (
          <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-t border-[#E5E7EB] flex items-center justify-between shrink-0 bg-[#F9FAFB] gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl text-xs font-semibold px-4 h-9 sm:h-9"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              form="post-requirement-form"
              size="sm"
              isLoading={loading}
              className="rounded-xl text-xs font-bold bg-[#E8192C] hover:bg-[#C0111F] text-white flex items-center gap-1.5 shadow-sm px-5 h-9 sm:h-9"
            >
              <PlusCircle className="w-4 h-4" />
              Publish Requirement
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
