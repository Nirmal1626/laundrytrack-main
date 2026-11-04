import { NextRequest, NextResponse } from 'next/server';
import { accountErrorResponse, readRequestUser, requireStaff } from '../../../lib/api-auth';
import { AccountError } from '../../../lib/users';
import { deliverWhatsApp, whatsAppDigits } from '../../../lib/whatsapp';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const denied = requireStaff(await readRequestUser(request));
  if (denied) return denied;

  try {
    const body = await request.json();
    const phone = typeof body.phone === 'string' ? body.phone : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!whatsAppDigits(phone)) throw new AccountError('Enter a valid WhatsApp number. A 10-digit Indian mobile number is enough.', 400);
    if (!message || message.length > 1000) throw new AccountError('Enter the message to send.', 400);

    const whatsapp = await deliverWhatsApp({ phone, text: message, link: '' });
    return NextResponse.json({ ok: true, whatsapp });
  } catch (error) {
    return accountErrorResponse(error);
  }
}
