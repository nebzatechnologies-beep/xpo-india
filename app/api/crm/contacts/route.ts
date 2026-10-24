import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/lib/data/mock-db';

export async function GET(req: NextRequest) {
  const store = getMockStore();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('q')?.toLowerCase();
  const status = searchParams.get('status');
  const country = searchParams.get('country');

  let list = [...store.crmContacts];

  if (search) {
    list = list.filter((c: any) =>
      c.company.toLowerCase().includes(search) ||
      c.name.toLowerCase().includes(search) ||
      c.email.toLowerCase().includes(search) ||
      c.whatsapp.includes(search)
    );
  }

  if (status && status !== 'all') {
    list = list.filter((c: any) => c.status === status);
  }

  if (country && country !== 'all') {
    list = list.filter((c: any) => c.country === country);
  }

  return NextResponse.json({
    success: true,
    data: list,
    stats: {
      total: store.crmContacts.length,
      notContacted: store.crmContacts.filter((c: any) => c.status === 'not_contacted').length,
      contacted: store.crmContacts.filter((c: any) => c.status === 'contacted').length,
      registered: store.crmContacts.filter((c: any) => c.status === 'registered').length,
      subscribed: store.crmContacts.filter((c: any) => c.status === 'subscribed').length,
      optedInConsent: store.crmContacts.filter((c: any) => c.consentStatus === 'opted_in').length,
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getMockStore();

    if (body.action === 'updateStatus') {
      const contact = store.crmContacts.find((c: any) => c.id === body.id);
      if (contact) {
        contact.status = body.status;
        contact.lastContacted = new Date().toISOString();
        return NextResponse.json({ success: true, message: 'Status updated', data: contact });
      }
      return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });
    }

    if (body.action === 'optOut') {
      const contact = store.crmContacts.find((c: any) => c.id === body.id);
      if (contact) {
        contact.consentStatus = 'opted_out';
        contact.status = 'opted_out';
        return NextResponse.json({ success: true, message: 'Contact opted out', data: contact });
      }
    }

    const newContact = {
      id: 'crm_' + Date.now(),
      name: body.name,
      company: body.company,
      phone: body.phone,
      whatsapp: body.whatsapp || body.phone,
      email: body.email,
      website: body.website || '',
      country: body.country || 'India',
      city: body.city || '',
      industry: body.industry || 'Manufacturing',
      sectorCode: body.sectorCode || 'MFG',
      source: body.source || 'manual',
      status: 'not_contacted',
      consentStatus: 'opted_in',
      campaignHistoryCount: 0,
      notes: body.notes || '',
      createdAt: new Date().toISOString()
    };
    store.crmContacts.unshift(newContact);

    return NextResponse.json({ success: true, data: newContact });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
