import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from './lib/auth';

const cookieName = 'laundrytrack_session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(cookieName)?.value;
  const user = token ? await verifySessionToken(token) : null;

  if (pathname.startsWith('/api/auth/')) return NextResponse.next();
  if (pathname === '/track' || pathname.startsWith('/track/') || pathname.startsWith('/api/track/')) return NextResponse.next();

  if (pathname === '/login' || pathname === '/signup') {
    if (!user) return NextResponse.next();
    return NextResponse.redirect(new URL(user.role === 'customer' ? '/customer' : '/', request.url));
  }

  if (!user) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname === '/customer' && user.role !== 'customer') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname === '/' && user.role === 'customer') {
    return NextResponse.redirect(new URL('/customer', request.url));
  }

  if (pathname.startsWith('/api/whatsapp') && user.role === 'customer') {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const response = NextResponse.next();
  response.headers.set('x-user-email', user.email);
  response.headers.set('x-user-role', user.role);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};