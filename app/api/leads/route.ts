import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import { Lead } from '@/lib/db/models/Lead';
import { auth } from '@/lib/auth/auth';
import { xpoStore } from '@/lib/data/mock-db';
import { triggerN8nEventBackground } from '@/lib/integrations/n8n/emit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q') || searchParams.get('search');
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'live';

    try {
      await connectDB();
      const filter: Record<string, any> = {};
      if (status !== 'all') filter.status = status;
      if (category && category !== 'all') filter.category = category;
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { xpoId: { $regex: search, $options: 'i' } },
        ];
      }
      const leads = await Lead.find(filter)
        .populate('category', 'name slug')
        .populate('creator', 'name accountType country')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      if (leads && leads.length > 0) {
        return NextResponse.json({ success: true, leads });
      }
    } catch (e) {
      console.warn('[GET /api/leads] Using in-memory fallback store');
    }

    // Fallback in-memory filter
    let filtered = [...xpoStore.leads];
    if (status !== 'all') {
      filtered = filtered.filter((l) => l.status === status);
    }
    if (category && category !== 'all') {
      filtered = filtered.filter((l) => l.category?._id === category || l.category?.slug === category || l.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.xpoId.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ success: true, leads: filtered });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id || '67489a12bcde345678900002';
    const userName = session?.user?.name || 'Verified Creator';
    const body = await req.json();

    const {
      title,
      description,
      type = 'buy',
      category,
      country = 'IN',
      city,
      budgetMin,
      budgetMax,
      budgetCurrency = 'INR',
      budgetOpenForDiscussion = false,
      deadline,
      quantity,
      attachments = [],
      tags,
      customFields,
      allowGlobalBids = true,
    } = body;

    if (!title || !description) {
      return NextResponse.json({ success: false, error: 'Title and description are required' }, { status: 400 });
    }

    const xpoId = `XPO-${Math.floor(10000 + Math.random() * 90000)}`;
    const selectedCat = xpoStore.categories.find((c: any) => c._id === category || c.slug === category) || xpoStore.categories[0];

    const newLead = {
      _id: `lead_${Date.now()}`,
      xpoId,
      title,
      description,
      type,
      status: 'live',
      creator: {
        _id: userId,
        name: userName,
        company: 'Client Enterprise',
        country,
        city: city || 'Mumbai, Maharashtra',
        phone: '+91 9820011223',
        email: session?.user?.email || 'creator@xpoindia.com',
        isVerified: true,
      },
      category: selectedCat,
      country,
      city: city || 'Pan-India',
      budgetMin: budgetOpenForDiscussion || !budgetMin ? undefined : Number(budgetMin),
      budgetMax: budgetOpenForDiscussion || !budgetMax ? undefined : Number(budgetMax),
      budgetCurrency: budgetOpenForDiscussion ? 'Open' : budgetCurrency,
      budgetOpenForDiscussion: Boolean(budgetOpenForDiscussion),
      deadline: deadline || 'Open for discussion',
      quantity: quantity || undefined,
      attachments: Array.isArray(attachments) ? attachments : [],
      customFields: customFields || {},
      allowGlobalBids: Boolean(allowGlobalBids),
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t: string) => t.trim()) : []),
      createdAt: new Date().toISOString(),
    };

    // Prepend to store
    xpoStore.leads.unshift(newLead);

    // Tell Hostinger n8n that a new lead has been created
    triggerN8nEventBackground('lead.created', {
      leadId: newLead._id,
      xpoId: newLead.xpoId,
      title: newLead.title,
      description: newLead.description,
      type: newLead.type,
      category: newLead.category,
      country: newLead.country,
      city: newLead.city,
      budgetMin: newLead.budgetMin,
      budgetMax: newLead.budgetMax,
      budgetCurrency: newLead.budgetCurrency,
      budgetOpenForDiscussion: newLead.budgetOpenForDiscussion,
      deadline: newLead.deadline,
      quantity: newLead.quantity,
      creator: newLead.creator,
      createdAt: newLead.createdAt,
    });

    // Try persisting to DB in background (non-blocking)
    connectDB()
      .then(() =>
        Lead.create({
          xpoId,
          title,
          description,
          type,
          status: 'live',
          creator: userId,
          category: selectedCat._id,
          country,
          city,
          budgetMin,
          budgetMax,
          budgetCurrency,
          tags: newLead.tags,
        })
      )
      .catch(() => {
        // Ignored if DB offline
      });

    return NextResponse.json({ success: true, lead: newLead }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}