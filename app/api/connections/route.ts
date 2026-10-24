import { NextRequest, NextResponse } from 'next/server';
import { xpoStore } from '@/lib/data/mock-db';

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({ success: true, connections: xpoStore.connections });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}