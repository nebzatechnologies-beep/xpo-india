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