import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '../../../../lib/auth';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('laundrytrack_session')?.value;
  const user = token ? await verifySessionToken(token) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ user });
}