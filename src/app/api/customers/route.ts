import { NextRequest, NextResponse } from 'next/server';
import { addOrGetCustomer, listCustomers, searchCustomers } from '@/lib/store';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const customers = q ? await searchCustomers(q) : await listCustomers();
  return NextResponse.json({ customers });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as unknown;
  const maybeName = (body as Record<string, unknown>)?.name;
  const name = typeof maybeName === 'string' ? maybeName : '';
  if (!name.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  const customer = await addOrGetCustomer(name);
  return NextResponse.json({ customer }, { status: 201 });
}
