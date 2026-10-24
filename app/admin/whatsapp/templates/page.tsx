'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileCode2, Plus, RefreshCw, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function WhatsAppTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  useEffect(() => {
    fetch('/api/whatsapp/templates')
      .then(res => res.json())
      .then(res => {
        if (res.success) setTemplates(res.data);
      });
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    const res = await fetch('/api/whatsapp/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sync' })
    });
    const data = await res.json();
    if (data.success) {
      setSyncMsg('Meta WABA Templates Synchronised Successfully!');
      setTimeout(() => setSyncMsg(''), 3000);
    }
    setSyncing(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">WhatsApp Message Templates</h1>
          <p className="text-xs text-[#717171] mt-0.5">Approved Meta WABA message templates with variable parameters and quick reply CTAs.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSync} isLoading={syncing} className="text-xs font-semibold rounded-xl border-[#EBEBEB] flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Sync from Meta API
          </Button>
          <Link href="/admin/whatsapp/templates/create">
            <Button size="sm" className="bg-[#E8192C] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Create Template
            </Button>
          </Link>
        </div>
      </div>

      {syncMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {syncMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(t => (
          <Card key={t.id} className="p-5 rounded-2xl border border-[#EBEBEB] bg-white space-y-3 shadow-none flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant={t.status === 'APPROVED' ? 'success' : 'warning'} className="text-[10px]">
                  {t.status}
                </Badge>
                <span className="text-[10px] text-[#717171] font-mono">{t.language}</span>
              </div>

              <h3 className="font-mono font-bold text-sm text-[#222222]">{t.name}</h3>
              <p className="text-[10px] text-[#717171] uppercase font-bold tracking-wider">{t.category}</p>

              <div className="p-3 bg-[#EFEAE2] rounded-xl text-xs text-[#222222] italic font-sans whitespace-pre-wrap border border-[#DDD5C7]">
                &quot;{t.bodyText}&quot;
              </div>
            </div>

            <div className="pt-2 border-t border-[#EBEBEB] flex items-center justify-between text-xs text-[#717171]">
              <span>Variables: {t.variables?.length || 0}</span>
              <span className="font-medium">Buttons: {t.buttons?.length || 0}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
