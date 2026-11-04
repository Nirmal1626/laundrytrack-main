import { NextRequest, NextResponse } from 'next/server';
import { accountErrorResponse, readRequestUser, requireStaff } from '../../../lib/api-auth';
import { createOrder, listOrders, requestOrigin } from '../../../lib/orders';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const denied = requireStaff(await readRequestUser(request));
  if (denied) return denied;
  try {
    const orders = await listOrders();
    return NextResponse.json({ orders });
  } catch (error) {
    return accountErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const denied = requireStaff(await readRequestUser(request));
  if (denied) return denied;
  try {
    const body = await request.json();
    const result = await createOrder(body, requestOrigin(request));
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return accountErrorResponse(error);
  }
}
