'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileSpreadsheet,
  Trash2,
  Eye,
  Save,
  CheckCircle2,
  Smartphone,
  Globe,
  Settings2,
  Type,
  AlignLeft,
  Hash,
  DollarSign,
  Calendar,
  List,
  CheckSquare,
  Paperclip,
  Image,
  Link2,
} from 'lucide-react';

interface FormField {
  id: string;
  label: string;
  key: string;
  type: string;
  placeholder?: string;
  description?: string;
  required: boolean;
  order: number;
}

export default function FormBuilderPage() {
  const [selectedClassification, setSelectedClassification] = useState('manufacturing-industrial');
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'web' | 'whatsapp'>('web');

  const availableFieldTypes = [
    { type: 'text', label: 'Short Text', icon: Type },
    { type: 'textarea', label: 'Long Description', icon: AlignLeft },
    { type: 'number', label: 'Numeric Quantity', icon: Hash },
    { type: 'currency', label: 'Budget / Currency', icon: DollarSign },
    { type: 'date', label: 'Target Date', icon: Calendar },
    { type: 'dropdown', label: 'Single Select Dropdown', icon: List },
    { type: 'checkbox', label: 'Multi Checkbox', icon: CheckSquare },
    { type: 'file', label: 'Technical Document / CAD', icon: Paperclip },
    { type: 'image', label: 'Part Reference Image', icon: Image },
    { type: 'url', label: 'External Spec URL', icon: Link2 },
  ];

  useEffect(() => {
    fetch(`/api/taxonomy/form-builder?classificationCode=${selectedClassification}`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setFields(res.data.fields || []);
          if (res.data.fields?.length > 0) {
            setSelectedFieldId(res.data.fields[0].id);
          }
        }
      });
  }, [selectedClassification]);

  const addField = (fieldType: string) => {
    const newField: FormField = {
      id: `fld_${Date.now()}`,
      label: `New ${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} Field`,
      key: `field_${Date.now().toString(36)}`,
      type: fieldType,
      placeholder: 'Enter details...',
      description: 'Specifications required for this classification.',
      required: true,
      order: fields.length + 1
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const removeField = (id: string) => {
    const next = fields.filter(f => f.id !== id);
    setFields(next);
    if (selectedFieldId === id) {
      setSelectedFieldId(next[0]?.id || null);
    }
  };

  const selectedField = fields.find(f => f.id === selectedFieldId);

  const updateSelectedField = (patch: Partial<FormField>) => {
    setFields(fields.map(f => f.id === selectedFieldId ? { ...f, ...patch } : f));
  };

  const handlePublish = async () => {
    setSaving(true);
    const res = await fetch('/api/taxonomy/form-builder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        classificationCode: selectedClassification,
        fields,
        leadTypeCode: 'buy'
      })
    });
    const data = await res.json();
    if (data.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-[#EBEBEB]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 text-[#E8192C] flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#717171] uppercase tracking-wider">Classification Schema</div>
            <select
              value={selectedClassification}
              onChange={e => setSelectedClassification(e.target.value)}
              className="text-sm font-black text-[#222222] bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="manufacturing-industrial">Manufacturing & Industrial</option>
              <option value="cnc-machining">Precision CNC Machining</option>
              <option value="sheet-metal">Heavy Sheet Metal Fabrication</option>
              <option value="polymers-resins">Industrial Polymers & Resins</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewModalOpen(true)}
            className="text-xs font-semibold rounded-xl border-[#EBEBEB] flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-[#717171]" /> Dual Preview
          </Button>

          <Button
            size="sm"
            onClick={handlePublish}
            isLoading={saving}
            className="bg-[#E8192C] hover:bg-[#D01627] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 px-4"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" /> Published!
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" /> Publish Schema
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 3-Column Visual Canvas Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Field Library */}
        <div className="lg:col-span-3 space-y-3">
          <Card className="p-4 rounded-2xl border border-[#EBEBEB] bg-white space-y-3">
            <div className="font-bold text-xs text-[#222222] pb-2 border-b border-[#EBEBEB]">
              Field Library (Click to Add)
            </div>
            <div className="space-y-1.5">
              {availableFieldTypes.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    onClick={() => addField(item.type)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#555555] hover:text-[#222222] hover:bg-neutral-50 border border-transparent hover:border-[#EBEBEB] transition-all text-left"
                  >
                    <Icon className="w-3.5 h-3.5 text-[#E8192C]" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Centre Column: Interactive Form Canvas */}
        <div className="lg:col-span-5 space-y-3">
          <Card className="p-5 rounded-2xl border border-[#EBEBEB] bg-white min-h-[550px] space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#EBEBEB]">
                <div className="font-bold text-xs text-[#222222]">Form Canvas ({fields.length} Custom Fields)</div>
                <span className="text-[10px] text-[#717171]">Click field to inspect & edit</span>
              </div>

              {fields.length === 0 ? (
                <div className="py-12 text-center text-[#717171] text-xs">
                  No custom fields defined. Click any item from the left library to add.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {fields.map((field) => {
                    const isSelected = selectedFieldId === field.id;
                    return (
                      <div
                        key={field.id}
                        onClick={() => setSelectedFieldId(field.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#E8192C] bg-red-50/20 shadow-sm'
                            : 'border-[#EBEBEB] bg-[#FCFCFC] hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-xs text-[#222222] flex items-center gap-1.5">
                            <span>{field.label}</span>
                            {field.required && <span className="text-[#E8192C] font-bold">*</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 text-[#555555] font-mono uppercase">
                              {field.type}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeField(field.id);
                              }}
                              className="text-neutral-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="text-[11px] text-[#717171] mt-1 italic">
                          Placeholder: &quot;{field.placeholder}&quot;
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Field Property Inspector */}
        <div className="lg:col-span-4 space-y-3">
          <Card className="p-5 rounded-2xl border border-[#EBEBEB] bg-white min-h-[550px]">
            {selectedField ? (
              <div className="space-y-4 text-xs">
                <div className="font-bold text-xs text-[#222222] pb-2 border-b border-[#EBEBEB] flex items-center gap-1.5">
                  <Settings2 className="w-4 h-4 text-[#E8192C]" /> Property Inspector
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#717171] uppercase tracking-wider mb-1">
                    Field Label
                  </label>
                  <input
                    type="text"
                    value={selectedField.label}
                    onChange={e => updateSelectedField({ label: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:border-[#E8192C] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#717171] uppercase tracking-wider mb-1">
                    Database Key
                  </label>
                  <input
                    type="text"
                    value={selectedField.key}
                    onChange={e => updateSelectedField({ key: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:border-[#E8192C] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#717171] uppercase tracking-wider mb-1">
                    Placeholder Text
                  </label>
                  <input
                    type="text"
                    value={selectedField.placeholder || ''}
                    onChange={e => updateSelectedField({ placeholder: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:border-[#E8192C] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#717171] uppercase tracking-wider mb-1">
                    Help Description
                  </label>
                  <textarea
                    rows={2}
                    value={selectedField.description || ''}
                    onChange={e => updateSelectedField({ description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#EBEBEB] focus:border-[#E8192C] outline-none"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-[#EBEBEB]">
                  <span className="font-bold text-[#222222]">Mandatory Requirement</span>
                  <input
                    type="checkbox"
                    checked={selectedField.required}
                    onChange={e => updateSelectedField({ required: e.target.checked })}
                    className="w-4 h-4 text-[#E8192C] focus:ring-[#E8192C]"
                  />
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-[#717171] text-xs">
                Select a field on the canvas to configure properties.
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* DUAL PREVIEW MODAL */}
      {previewModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 border border-[#EBEBEB] shadow-2xl max-h-[90vh] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-[#EBEBEB]">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={previewMode === 'web' ? 'primary' : 'outline'}
                  onClick={() => setPreviewMode('web')}
                  className={`text-xs font-semibold rounded-xl ${previewMode === 'web' ? 'bg-[#E8192C] text-white' : ''}`}
                >
                  <Globe className="w-3.5 h-3.5 mr-1" /> Creator Web Form
                </Button>
                <Button
                  size="sm"
                  variant={previewMode === 'whatsapp' ? 'primary' : 'outline'}
                  onClick={() => setPreviewMode('whatsapp')}
                  className={`text-xs font-semibold rounded-xl ${previewMode === 'whatsapp' ? 'bg-emerald-600 text-white' : ''}`}
                >
                  <Smartphone className="w-3.5 h-3.5 mr-1" /> WhatsApp Flow
                </Button>
              </div>

              <button onClick={() => setPreviewModalOpen(false)} className="text-[#717171] hover:text-[#222222] font-bold text-sm">
                ✕
              </button>
            </div>

            {/* PREVIEW CONTENT */}
            <div className="flex-1 overflow-y-auto pr-1">
              {previewMode === 'web' ? (
                <div className="p-6 rounded-2xl bg-neutral-50 border border-[#EBEBEB] space-y-4 text-xs">
                  <div className="font-black text-sm text-[#222222]">Post Lead: Custom Specifications</div>
                  {fields.map((f, i) => (
                    <div key={i} className="space-y-1">
                      <label className="font-bold text-[#333333] block">
                        {f.label} {f.required && <span className="text-[#E8192C]">*</span>}
                      </label>
                      <input
                        disabled
                        type="text"
                        placeholder={f.placeholder}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#EBEBEB] text-[#717171]"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="max-w-sm mx-auto p-4 rounded-3xl bg-[#EFEAE2] border border-[#DDD5C7] space-y-3">
                  <div className="p-3 bg-white rounded-2xl shadow-sm text-xs space-y-1">
                    <div className="font-bold text-emerald-800">XPO Lead Specification Flow</div>
                    <div className="text-[11px] text-[#555555]">Please reply with the following details for your requirement:</div>
                  </div>
                  {fields.map((f, i) => (
                    <div key={i} className="p-2.5 bg-white rounded-xl shadow-xs text-xs space-y-0.5">
                      <div className="font-bold text-[#222222]">Step {i + 1}: {f.label}</div>
                      <div className="text-[10px] text-[#717171]">{f.placeholder}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#EBEBEB] flex justify-end">
              <Button size="sm" onClick={() => setPreviewModalOpen(false)} className="bg-neutral-900 text-white text-xs">
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
