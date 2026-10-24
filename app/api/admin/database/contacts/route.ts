import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db/mongoose';
import { CrmContact } from '@/lib/db/models';
import { ok, err } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    if (userRole !== 'superadmin' && userRole !== 'staff') return err('Forbidden', 403);

    await connectDB();
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
    const skip = (page - 1) * limit;

    const country = searchParams.get('country');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');

    const filter: Record<string, any> = {};
    if (country && country !== 'all') filter.country = country;
    if (tag && tag !== 'all') filter.tags = tag;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const [contacts, total] = await Promise.all([
      CrmContact.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CrmContact.countDocuments(filter),
    ]);

    return ok({
      contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[GET /api/admin/database/contacts]', error);
    return err('Failed to fetch CRM contacts', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    if (userRole !== 'superadmin' && userRole !== 'staff') return err('Forbidden', 403);

    await connectDB();
    const body = await req.json();
    const { name, email, phone, company, country, city, industry, tags = [] } = body;

    if (!name && !company) return err('Name or Company name is required', 400);

    const contact = await CrmContact.create({
      name,
      email,
      phone,
      company,
      country: country || 'India',
      city,
      industry,
      tags: Array.isArray(tags) ? tags : [tags],
      source: 'manual',
      status: 'prospect',
    });

    return ok(contact, 201);
  } catch (error) {
    console.error('[POST /api/admin/database/contacts]', error);
    return err('Failed to create contact', 500);
  }
}
