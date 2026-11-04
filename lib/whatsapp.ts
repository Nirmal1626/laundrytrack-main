import twilio from 'twilio';

export type WhatsAppHandoff = {
  phone: string;
  text: string;
  link: string;
  url: string;
  sent: boolean;
  channel: 'twilio' | 'whatsapp';
  notice?: string;
};

export function whatsAppDigits(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return '';
}

export function whatsAppShareUrl(phone: string, text: string) {
  const digits = whatsAppDigits(phone);
  if (!digits) return '';
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function configuredValue(name: string) {
  const value = process.env[name]?.trim() ?? '';
  if (!value || value.startsWith('your_') || value.includes('your_account') || value.includes('your_auth')) return '';
  return value;
}

function twilioFromDigits() {
  return whatsAppDigits(configuredValue('TWILIO_WHATSAPP_NUMBER'));
}

function twilioConfigured() {
  return Boolean(configuredValue('TWILIO_ACCOUNT_SID') && configuredValue('TWILIO_AUTH_TOKEN') && twilioFromDigits());
}

async function sendViaTwilio(phone: string, body: string) {
  const accountSid = configuredValue('TWILIO_ACCOUNT_SID');
  const authToken = configuredValue('TWILIO_AUTH_TOKEN');
  const from = twilioFromDigits();
  const to = whatsAppDigits(phone);
  if (!accountSid || !authToken || !from || !to) return false;

  const client = twilio(accountSid, authToken);
  await client.messages.create({
    from: `whatsapp:+${from}`,
    to: `whatsapp:+${to}`,
    body,
  });
  return true;
}

export async function deliverWhatsApp(input: { phone: string; text: string; link: string }): Promise<WhatsAppHandoff> {
  const handoff: WhatsAppHandoff = {
    phone: input.phone,
    text: input.text,
    link: input.link,
    url: whatsAppShareUrl(input.phone, input.text),
    sent: false,
    channel: 'whatsapp',
  };

  if (!handoff.url) {
    return { ...handoff, notice: 'Enter a valid mobile number so WhatsApp can open the chat.' };
  }

  if (!twilioConfigured()) return handoff;

  try {
    const sent = await sendViaTwilio(input.phone, input.text);
    if (!sent) return handoff;
    return { ...handoff, sent: true, channel: 'twilio' };
  } catch {
    console.error('WhatsApp gateway failed');
    return {
      ...handoff,
      sent: false,
      channel: 'whatsapp',
      notice: 'The WhatsApp gateway did not send this message. Use the button to send it from WhatsApp.',
    };
  }
}
