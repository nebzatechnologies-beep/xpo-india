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