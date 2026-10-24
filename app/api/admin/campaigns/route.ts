import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db/mongoose';
import { Campaign, CrmContact } from '@/lib/db/models';
import { ok, err } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    if (userRole !== 'superadmin' && userRole !== 'staff') return err('Forbidden', 403);

    await connectDB();
    const campaigns = await Campaign.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return ok(campaigns);
  } catch (error) {
    console.error('[GET /api/admin/campaigns]', error);
    return err('Failed to fetch campaigns', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    if (userRole !== 'superadmin' && userRole !== 'staff') return err('Forbidden', 403);

    await connectDB();
    const body = await req.json();
    const {
      name,
      channel = 'whatsapp',
      template,
      subject,
      messageBody,
      audienceFilter = {},
    } = body;

    if (!name || (!messageBody && !template)) {
      return err('Campaign name and message/template are required', 400);
    }

    // Determine target recipient count based on filters
    const filter: Record<string, any> = {};
    if (audienceFilter.countries?.length) {
      filter.country = { $in: audienceFilter.countries };
    }
    if (audienceFilter.tags?.length) {
      filter.tags = { $in: audienceFilter.tags };
    }

    const recipientCount = await CrmContact.countDocuments(filter);

    const campaign = await Campaign.create({
      name,
      channel,
      status: 'scheduled',
      template,
      subject,
      messageBody,
      audienceFilter,
      totalRecipients: recipientCount,
      stats: {
        queued: recipientCount,
        sent: 0,
        delivered: 0,
        read: 0,
        replied: 0,
        failed: 0,
        optedOut: 0,
        clicked: 0,
        registered: 0,
        leadCreated: 0,
        subscriptionPurchased: 0,
      },
      scheduledAt: new Date(),
      createdBy: session?.user?.id,
    });

    return ok(campaign, 201);
  } catch (error) {
    console.error('[POST /api/admin/campaigns]', error);
    return err('Failed to create campaign', 500);
  }
}
