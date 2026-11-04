import { NextRequest, NextResponse } from 'next/server';
import { accountErrorResponse, readRequestUser, requireStaff } from '../../../../lib/api-auth';
import { requestOrigin, updateOrder } from '../../../../lib/orders';
import { AccountError } from '../../../../lib/users';

export const runtime = 'nodejs';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = requireStaff(await readRequestUser(request));
  if (denied) return denied;

  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) return accountErrorResponse(new AccountError('Order not found.', 404));

  try {
    const body = await request.json();
    const result = await updateOrder(id, body, requestOrigin(request));
    return NextResponse.json(result);
  } catch (error) {
    return accountErrorResponse(error);
  }
}
