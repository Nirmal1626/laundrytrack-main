import { NextRequest, NextResponse } from 'next/server';
import { accountErrorResponse, readRequestUser, requireOwner } from '../../../lib/api-auth';
import { createExpense, listExpenses } from '../../../lib/orders';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const denied = requireOwner(await readRequestUser(request));
  if (denied) return denied;
  try {
    const expenses = await listExpenses();
    return NextResponse.json({ expenses });
  } catch (error) {
    return accountErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const denied = requireOwner(await readRequestUser(request));
  if (denied) return denied;
  try {
    const body = await request.json();
    const expense = await createExpense(body);
    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    return accountErrorResponse(error);
  }
}
