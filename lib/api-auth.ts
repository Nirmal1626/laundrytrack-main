import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, type SessionUser } from './auth';
import { AccountError } from './users';

export async function readRequestUser(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get('laundrytrack_session')?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function requireStaff(user: SessionUser | null) {
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (user.role === 'customer') return NextResponse.json({ error: 'This action is for the counter.' }, { status: 403 });
  return null;
}

export function requireOwner(user: SessionUser | null) {
  const denied = requireStaff(user);
  if (denied) return denied;
  if (user?.role !== 'owner') return NextResponse.json({ error: 'This section is available to the owner.' }, { status: 403 });
  return null;
}

export function accountErrorResponse(error: unknown) {
  if (error instanceof AccountError) {
    if (error.needsSetup) {
      return NextResponse.json({ needsSetup: true, name: error.accountName ?? '' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
}
