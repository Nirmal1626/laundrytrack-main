import { NextRequest, NextResponse } from 'next/server';
import { accountErrorResponse } from '../../../../lib/api-auth';
import { createSessionToken } from '../../../../lib/auth';
import { registerCustomer } from '../../../../lib/users';

const cookieName = 'laundrytrack_session';

export async function POST(request: NextRequest) {
  let body: { email?: unknown; name?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Enter your name, email, and password.' }, { status: 400 });
  }

  if (typeof body.email !== 'string' || typeof body.name !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'Enter your name, email, and password.' }, { status: 400 });
  }

  try {
    const result = await registerCustomer({
      email: body.email,
      name: body.name,
      password: body.password,
    });
    const token = await createSessionToken(result.user);
    const response = NextResponse.json({ user: result.user }, { status: 201 });
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch (error) {
    return accountErrorResponse(error);
  }
}
