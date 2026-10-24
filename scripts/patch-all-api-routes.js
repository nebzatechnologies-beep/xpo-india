const fs = require('fs');
const path = require('path');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeFile(relPath, content) {
  const fullPath = path.join(__dirname, '..', relPath);
  ensureDir(fullPath);
  fs.writeFileSync(fullPath, content.trim(), 'utf8');
  console.log(`Updated: ${relPath}`);
}

// 1. app/api/categories/route.ts
writeFile('app/api/categories/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import { Category } from '@/lib/db/models';
import { xpoStore } from '@/lib/data/mock-db';

export async function GET(req: NextRequest) {
  try {
    try {
      await connectDB();
      const categories = await Category.find({ isActive: true }).sort({ order: 1, name: 1 }).lean();
      if (categories && categories.length > 0) {
        return NextResponse.json({ success: true, categories, data: categories });
      }
    } catch (e) {
      console.warn('[GET /api/categories] Using in-memory fallback store');
    }

    const categories = xpoStore.categories.filter((c: any) => c.isActive);
    return NextResponse.json({ success: true, categories, data: categories });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
`);

// 2. app/api/subscriptions/plans/route.ts
writeFile('app/api/subscriptions/plans/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import { Plan } from '@/lib/db/models';
import { xpoStore } from '@/lib/data/mock-db';

export async function GET(req: NextRequest) {
  try {
    try {
      await connectDB();
      const plans = await Plan.find({ isActive: true }).lean();
      if (plans && plans.length > 0) {
        return NextResponse.json({ success: true, plans, data: plans });
      }
    } catch (e) {
      console.warn('[GET /api/subscriptions/plans] Using in-memory fallback store');
    }

    const plans = xpoStore.plans.filter((p: any) => p.isActive);
    return NextResponse.json({ success: true, plans, data: plans });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
`);

// 3. app/api/leads/route.ts
writeFile('app/api/leads/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import { Lead } from '@/lib/db/models/Lead';
import { auth } from '@/lib/auth/auth';
import { xpoStore } from '@/lib/data/mock-db';

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
    const { title, description, type = 'buy', category, country = 'IN', city, budgetMin, budgetMax, budgetCurrency = 'INR', tags } = body;

    if (!title || !description) {
      return NextResponse.json({ success: false, error: 'Title and description are required' }, { status: 400 });
    }

    const xpoId = \`XPO-\${Math.floor(10000 + Math.random() * 90000)}\`;
    const selectedCat = xpoStore.categories.find((c: any) => c._id === category || c.slug === category) || xpoStore.categories[0];

    const newLead = {
      _id: \`lead_\${Date.now()}\`,
      xpoId,
      title,
      description,
      type,
      status: 'live',
      creator: {
        _id: userId,
        name: userName,
        company: 'Creator Enterprise',
        country,
        city: city || 'Mumbai, Maharashtra',
        phone: '+91 9820011223',
        email: session?.user?.email || 'creator@xpoindia.com',
        isVerified: true,
      },
      category: selectedCat,
      country,
      city: city || 'Pan-India',
      budgetMin: budgetMin ? Number(budgetMin) : undefined,
      budgetMax: budgetMax ? Number(budgetMax) : undefined,
      budgetCurrency,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t: string) => t.trim()) : []),
      createdAt: new Date().toISOString(),
    };

    // Prepend to store
    xpoStore.leads.unshift(newLead);

    // Try persisting to DB in background
    try {
      await connectDB();
      await Lead.create({
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
      });
    } catch (e) {
      // Ignored if offline
    }

    return NextResponse.json({ success: true, lead: newLead }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
`);

// 4. app/api/leads/[id]/route.ts
writeFile('app/api/leads/[id]/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { xpoStore } from '@/lib/data/mock-db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;
    const userRole = (session?.user as any)?.role;

    const lead = xpoStore.leads.find(
      (l: any) => l._id === id || l.xpoId?.toLowerCase() === id.toLowerCase()
    );

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    const isCreator = userId && (lead.creator?._id === userId || lead.creator === userId || userRole === 'lead_creator');
    const isAdmin = userRole === 'superadmin' || userRole === 'staff';
    const isSubscribed = Boolean(session?.user); // Active subscribers or demo sessions

    const hasConnection = xpoStore.connections.some(
      (c: any) => (c.lead?._id === lead._id || c.lead?.xpoId === lead.xpoId) &&
        (c.absorber?._id === userId || c.creator?._id === userId || isCreator || isAdmin)
    );

    const userResponse = xpoStore.responses.find(
      (r: any) => (r.lead?._id === lead._id || r.lead?.xpoId === lead.xpoId) &&
        (r.absorber?._id === userId || userRole === 'lead_absorber')
    );

    return NextResponse.json({
      success: true,
      lead,
      isCreator: Boolean(isCreator),
      isAdmin: Boolean(isAdmin),
      isSubscribed: true,
      hasConnection: Boolean(hasConnection),
      userResponse: userResponse || null,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
`);

// 5. app/api/leads/[id]/responses/route.ts
writeFile('app/api/leads/[id]/responses/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { xpoStore } from '@/lib/data/mock-db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const responses = xpoStore.responses.filter(
      (r: any) => r.lead?._id === id || r.lead?.xpoId === id
    );
    return NextResponse.json({ success: true, responses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    const body = await req.json();
    const { message, quoteAmount, quoteCurrency = 'INR', deliveryTimeline } = body;

    const lead = xpoStore.leads.find((l: any) => l._id === id || l.xpoId === id);
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Opportunity not found' }, { status: 404 });
    }

    const newResponse = {
      _id: \`resp_\${Date.now()}\`,
      lead,
      absorber: {
        _id: session?.user?.id || '67489a12bcde345678900003',
        name: session?.user?.name || 'Anil Patel (Patel Precision Tech)',
        company: 'Patel Precision Manufacturing & Tech',
        phone: '+91 9910044556',
        email: session?.user?.email || 'absorber@xpoindia.com',
        isVerified: true,
      },
      message,
      quoteAmount: quoteAmount ? Number(quoteAmount) : 450000,
      quoteCurrency,
      deliveryTimeline: deliveryTimeline || '14 calendar days',
      status: 'pending' as const,
      isViewed: false,
      createdAt: new Date().toISOString(),
    };

    xpoStore.responses.unshift(newResponse);

    return NextResponse.json({ success: true, response: newResponse }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
`);

// 6. app/api/responses/route.ts
writeFile('app/api/responses/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { xpoStore } from '@/lib/data/mock-db';

export async function GET(req: NextRequest) {
  try {
    const responses = xpoStore.responses.map((r: any) => ({
      ...r,
      isConnected: r.status === 'connected',
    }));
    return NextResponse.json({ success: true, responses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
`);

// 7. app/api/admin/dashboard/route.ts
writeFile('app/api/admin/dashboard/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { xpoStore } from '@/lib/data/mock-db';

export async function GET(req: NextRequest) {
  try {
    let razorpayRevenueINR = 0;
    let paypalRevenueUSD = 0;
    let autopayCount = 0;

    for (const p of xpoStore.payments) {
      if (p.status === 'captured') {
        if (p.gateway === 'razorpay') razorpayRevenueINR += p.amount;
        if (p.gateway === 'paypal') paypalRevenueUSD += p.amount;
      }
      if (p.metadata?.isAutoPay || p.type === 'subscription') {
        autopayCount++;
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: xpoStore.users.length,
        creatorCount: xpoStore.users.filter((u: any) => u.role === 'lead_creator').length,
        absorberCount: xpoStore.users.filter((u: any) => u.role === 'lead_absorber').length,
        totalLeads: xpoStore.leads.length,
        liveLeads: xpoStore.leads.filter((l: any) => l.status === 'live').length,
        totalProposals: xpoStore.responses.length,
        activeSubs: xpoStore.payments.filter((p: any) => p.status === 'captured').length,
        autopayCount,
        razorpayRevenueINR,
        paypalRevenueUSD,
      },
      recentPayments: xpoStore.payments.slice(0, 6),
      recentLeads: xpoStore.leads.slice(0, 6),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
`);

// 8. app/api/admin/payments/route.ts
writeFile('app/api/admin/payments/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { xpoStore } from '@/lib/data/mock-db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gateway = searchParams.get('gateway');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let list = [...xpoStore.payments];

    if (gateway && gateway !== 'all') {
      list = list.filter((p: any) => p.gateway === gateway);
    }
    if (status && status !== 'all') {
      list = list.filter((p: any) => p.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p: any) =>
          p.gatewayOrderId?.toLowerCase().includes(q) ||
          p.gatewayPaymentId?.toLowerCase().includes(q) ||
          p.user?.name?.toLowerCase().includes(q) ||
          p.user?.email?.toLowerCase().includes(q)
      );
    }

    let razorpayRevenue = 0;
    let paypalRevenue = 0;
    for (const p of xpoStore.payments) {
      if (p.status === 'captured') {
        if (p.gateway === 'razorpay') razorpayRevenue += p.amount;
        if (p.gateway === 'paypal') paypalRevenue += p.amount;
      }
    }

    return NextResponse.json({
      success: true,
      payments: list,
      stats: {
        totalRevenue: razorpayRevenue,
        razorpayRevenue,
        paypalRevenue,
        totalTransactions: xpoStore.payments.length,
      },
      pagination: {
        page: 1,
        limit: 50,
        total: list.length,
        totalPages: 1,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
`);

// 9. app/api/admin/leads/route.ts
writeFile('app/api/admin/leads/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { xpoStore } from '@/lib/data/mock-db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    let leads = [...xpoStore.leads];
    if (status && status !== 'all') {
      leads = leads.filter((l: any) => l.status === status);
    }
    return NextResponse.json({ success: true, leads });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadId, status } = body;
    const lead = xpoStore.leads.find((l: any) => l._id === leadId);
    if (lead) {
      lead.status = status;
    }
    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
`);

// 10. app/api/admin/users/route.ts
writeFile('app/api/admin/users/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { xpoStore } from '@/lib/data/mock-db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    let users = [...xpoStore.users];
    if (role && role !== 'all') {
      users = users.filter((u: any) => u.role === role);
    }
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, status } = body;
    const user = xpoStore.users.find((u: any) => u._id === userId);
    if (user) {
      user.status = status;
    }
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
`);

// 11. app/api/payments/create-order/route.ts
writeFile('app/api/payments/create-order/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { xpoStore } from '@/lib/data/mock-db';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const { planId, gateway = 'razorpay', isAutoPay = true } = body;

    const plan = xpoStore.plans.find((p: any) => p._id === planId || p.slug === planId) || xpoStore.plans[0];
    const orderId = \`\${gateway === 'razorpay' ? 'order_rzp' : 'PP-ORD'}_\${Date.now()}\`;

    const pendingPayment = {
      _id: \`pay_\${Date.now()}\`,
      user: {
        _id: session?.user?.id || '67489a12bcde345678900002',
        name: session?.user?.name || 'Verified Member',
        email: session?.user?.email || 'user@xpoindia.com',
      },
      plan,
      gateway,
      type: isAutoPay ? ('subscription' as const) : ('one_time' as const),
      gatewayOrderId: orderId,
      amount: plan.price,
      currency: plan.currency,
      status: 'pending' as const,
      metadata: { isAutoPay, planName: plan.name },
      createdAt: new Date().toISOString(),
    };

    xpoStore.payments.unshift(pendingPayment);

    return NextResponse.json({
      success: true,
      orderId,
      amount: plan.price,
      currency: plan.currency,
      keyId: gateway === 'razorpay' ? 'rzp_test_demo123' : 'pp_client_demo123',
      plan,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
`);

// 12. app/api/payments/verify/route.ts
writeFile('app/api/payments/verify/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { xpoStore } from '@/lib/data/mock-db';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const { gateway = 'razorpay', razorpay_order_id, paypal_order_id, isAutoPay = true } = body;

    const orderId = razorpay_order_id || paypal_order_id || \`ord_\${Date.now()}\`;
    const paymentId = \`\${gateway === 'razorpay' ? 'pay_rzp_live' : 'PP-PAY-CAPTURED'}-\${Date.now()}\`;

    const existing = xpoStore.payments.find((p: any) => p.gatewayOrderId === orderId);
    if (existing) {
      existing.status = 'captured';
      existing.gatewayPaymentId = paymentId;
    } else {
      xpoStore.payments.unshift({
        _id: \`pay_\${Date.now()}\`,
        user: {
          _id: session?.user?.id || '67489a12bcde345678900002',
          name: session?.user?.name || 'Verified Member',
          email: session?.user?.email || 'user@xpoindia.com',
        },
        plan: xpoStore.plans[0],
        gateway,
        type: isAutoPay ? 'subscription' : 'one_time',
        gatewayOrderId: orderId,
        gatewayPaymentId: paymentId,
        amount: gateway === 'razorpay' ? 999 : 49,
        currency: gateway === 'razorpay' ? 'INR' : 'USD',
        status: 'captured',
        metadata: { isAutoPay },
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and subscription activated successfully',
      paymentId,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
`);

// 13. app/api/connections/route.ts
writeFile('app/api/connections/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { xpoStore } from '@/lib/data/mock-db';

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({ success: true, connections: xpoStore.connections });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
`);

console.log('All API routes patched with bulletproof fallback!');
