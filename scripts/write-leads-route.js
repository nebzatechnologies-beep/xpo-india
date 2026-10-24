const fs = require('fs');
const path = require('path');

const target = path.join(process.cwd(), 'app', 'api', 'leads', 'route.ts');
const dir = path.dirname(target);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const content = `import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import { Lead } from '@/lib/db/models/Lead';
import { auth } from '@/lib/auth/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q');
    const category = searchParams.get('category');
    const sector = searchParams.get('sector');
    const country = searchParams.get('country');
    const type = searchParams.get('type');
    const status = searchParams.get('status') || 'live';
    const creatorId = searchParams.get('creatorId');

    const filter: Record<string, any> = {};
    if (status !== 'all') filter.status = status;
    if (category) filter.category = category;
    if (sector) filter.sector = sector;
    if (country) filter.country = country;
    if (type) filter.type = type;
    if (creatorId) filter.creator = creatorId;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { xpoId: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const leads = await Lead.find(filter)
      .populate('category', 'name slug')
      .populate('sector', 'name slug')
      .populate('creator', 'name accountType country')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ success: true, leads });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { title, description, type, category, sector, subCategory, country, city, budgetMin, budgetMax, budgetCurrency, tags, attachments } = body;

    if (!title || !description || !category || !country) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const leadCount = await Lead.countDocuments();
    const xpoId = \`XPO-\${String(leadCount + 101).padStart(5, '0')}\`;

    const newLead = await Lead.create({
      xpoId,
      title,
      description,
      type: type || 'buy',
      status: 'live',
      creator: session.user.id,
      category,
      sector: sector || category,
      subCategory,
      country,
      city,
      budgetMin: budgetMin ? Number(budgetMin) : undefined,
      budgetMax: budgetMax ? Number(budgetMax) : undefined,
      budgetCurrency: budgetCurrency || 'INR',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t: string) => t.trim()) : []),
      attachments: attachments || [],
    });

    return NextResponse.json({ success: true, lead: newLead }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
`;

fs.writeFileSync(target, content, 'utf8');
console.log('Leads route written to:', target);
