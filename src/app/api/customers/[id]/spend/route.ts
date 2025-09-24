import { NextRequest, NextResponse } from 'next/server';
import { incrementSpend } from '@/lib/store';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const amount = Number(body.amount);
  if (!Number.isFinite(amount)) {
    return NextResponse.json({ error: 'amount must be a finite number' }, { status: 400 });
  }
  try {
    const customer = await incrementSpend(id, amount);
    return NextResponse.json({ customer });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
