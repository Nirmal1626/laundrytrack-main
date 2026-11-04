import { NextResponse } from 'next/server';
import { accountErrorResponse } from '../../../../lib/api-auth';
import { getOrderByToken } from '../../../../lib/orders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { token: string } }) {
  try {
    const order = await getOrderByToken(params.token);
    if (!order) return NextResponse.json({ error: 'This tracking link is not valid.' }, { status: 404 });
    return NextResponse.json({ order });
  } catch (error) {
    return accountErrorResponse(error);
  }
}
