// lib/whatsapp.ts
//
// WhatsApp Business Platform (Cloud API) sender for TEMPLATE messages — the
// only kind a business can start a conversation with. Stays completely off
// until you set WHATSAPP_ENABLED=true, so it is safe to deploy now.
//
// ENV VARS
//   WHATSAPP_ENABLED            "true" to switch on
//   WHATSAPP_ACCESS_TOKEN       permanent token from a Meta "system user"
//   WHATSAPP_PHONE_NUMBER_ID    the Cloud API phone number's ID (not the number itself)
//   WHATSAPP_TEMPLATE_LANGUAGE  optional, defaults to "en"
//   WHATSAPP_GRAPH_VERSION      optional, defaults to "v21.0"
//
// Every template used in lib/applyAssistance/notifications.ts must be
// created and approved in Meta's WhatsApp Manager first (suggested wording
// is listed in that file).

export function isWhatsAppEnabled(): boolean {
  return (
    process.env.WHATSAPP_ENABLED === 'true' &&
    !!process.env.WHATSAPP_ACCESS_TOKEN &&
    !!process.env.WHATSAPP_PHONE_NUMBER_ID
  );
}

// Meta rejects template parameters containing newlines/tabs or long runs of spaces.
const cleanParam = (v: string) => v.replace(/\s+/g, ' ').trim().slice(0, 900) || '-';

export async function sendWhatsAppTemplate(args: {
  /** +254712345678 */
  toE164: string;
  template: string;
  params: string[];
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isWhatsAppEnabled()) return { success: false, error: 'WhatsApp is not enabled.' };

  const version = process.env.WHATSAPP_GRAPH_VERSION || 'v21.0';
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  try {
    const res = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: args.toE164.replace(/^\+/, ''),
        type: 'template',
        template: {
          name: args.template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en' },
          components: [
            {
              type: 'body',
              parameters: args.params.map((text) => ({ type: 'text', text: cleanParam(text) })),
            },
          ],
        },
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      messages?: { id: string }[];
      error?: { message?: string };
    };

    if (!res.ok) return { success: false, error: data.error?.message || `WhatsApp request failed (HTTP ${res.status}).` };
    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'WhatsApp request failed.' };
  }
}