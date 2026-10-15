// lib/services/orders/notifications.ts
//
// Every automatic message for a service order (business plan, website, ...).
// Email always goes out; WhatsApp too once it is switched on; the in-app bell
// for customers who were signed in and for every admin. Each send is written
// to the order's timeline.
//
// WHATSAPP TEMPLATES to create in Meta's WhatsApp Manager (Utility, English):
//   service_order_received   Hi {{1}}, we received your {{2}} order ({{3}}). Pay the deposit and track it here: {{4}}
//   service_deposit_received Hi {{1}}, we received your deposit and started work on your {{2}}. Track it here: {{3}}
//   service_preview_ready    Hi {{1}}, the preview of your {{2}} is ready. Review it here: {{3}}
//   service_balance_due      Hi {{1}}, your {{2}} is ready. Pay the balance to download it: {{3}}
//   service_completed        Hi {{1}}, your final {{2}} files are ready to download: {{3}}
//   service_payment_reminder Hi {{1}}, you have not paid the deposit for your {{2}} yet. Continue here: {{3}}

import { prisma } from '@/lib/prisma';
import { sendEmail, INFO_EMAIL } from '@/lib/email';
import { isWhatsAppEnabled, sendWhatsAppTemplate } from '@/lib/whatsapp';
import { notify } from '@/lib/notify';
import { normalizeKenyanPhone } from '@/lib/phone';
import { getDeep } from '@/lib/questionnaires/get-deep';
import { getQuestionnaireConfig } from '@/lib/questionnaires/registry';
import { logOrderEvent } from '@/lib/services/orders/events';
import ApplyAssistanceEmail, { type ApplyAssistanceEmailProps } from '@/emails/ApplyAssistanceEmail';

export type OrderNotice =
  | 'SUBMITTED'
  | 'DEPOSIT_PAID'
  | 'PREVIEW_READY'
  | 'BALANCE_DUE'
  | 'COMPLETED'
  | 'REMINDER_1'
  | 'REMINDER_2'
  | 'REMINDER_3'
  | 'REMINDER_MANUAL';

export type AdminOrderNotice = 'SUBMITTED' | 'DEPOSIT_PAID' | 'REVISION_REQUESTED' | 'APPROVED' | 'BALANCE_PAID';

const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://hustlecare.net').replace(/\/$/, '');

const ksh = (n: number | null | undefined) => `KSh ${Math.round(n ?? 0).toLocaleString('en-US')}`;

async function loadContext(orderId: string) {
  const order = await prisma.questionnaireDraft.findUnique({ where: { id: orderId } });
  if (!order || !order.publicToken) return null;

  const answers = (order.answers ?? {}) as Record<string, never>;
  const fullName = String(getDeep(answers, 'contact.fullName') ?? '').trim();
  const businessName = String(getDeep(answers, 'contact.businessName') ?? '').trim();
  const service = await prisma.service.findUnique({ where: { slug: order.serviceSlug }, select: { name: true } });
  const serviceName = service?.name ?? getQuestionnaireConfig(order.serviceSlug)?.serviceName ?? order.serviceSlug;

  return {
    order,
    first: fullName.split(/\s+/)[0] || 'there',
    fullName: fullName || 'A customer',
    businessName,
    serviceName,
    orderNumber: order.orderNumber ?? '',
    trackUrl: `${siteUrl()}/order/${order.publicToken}`,
  };
}

async function inApp(
  userId: string | null | undefined,
  type: 'INFO' | 'SUCCESS' | 'WARNING',
  title: string,
  message: string,
  link: string,
) {
  if (!userId) return;
  try {
    await notify({ userId, title, message, type, link });
  } catch (err) {
    console.error('[orders] in-app notification failed:', err);
  }
}

export async function notifyOrderCustomer(orderId: string, notice: OrderNotice): Promise<void> {
  const ctx = await loadContext(orderId);
  if (!ctx) return;
  const { order, first, serviceName, orderNumber, trackUrl } = ctx;

  const isReminder = notice.startsWith('REMINDER');
  if (isReminder && (order.optedOutAt || !order.contactConsentAt || order.stage !== 'AWAITING_DEPOSIT')) return;

  const pkg = order.packageName ? ` (${order.packageName})` : '';
  const stopUrl = `${siteUrl()}/api/service-orders/optout?token=${order.publicToken}`;
  const dueText = order.dueDate
    ? `We expect to deliver by ${order.dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}.`
    : '';
  const revisionsLeft = Math.max(0, (order.revisionsAllowed ?? 0) - order.revisionsUsed);

  let subject: string;
  let email: ApplyAssistanceEmailProps;
  let whatsapp: { template: string; params: string[] };
  let bell: 'INFO' | 'SUCCESS' | 'WARNING' = 'INFO';

  switch (notice) {
    case 'SUBMITTED': {
      const priced = !!order.totalAmount;
      subject = `We received your ${serviceName} order (${orderNumber})`;
      email = {
        heading: 'We received your order',
        paragraphs: [
          `Hi ${first}, thank you. We have received your ${serviceName} order${pkg}.`,
          priced
            ? `To get started, pay the ${ksh(order.depositAmount)} ${(order.balanceAmount ?? 0) > 0 ? 'deposit' : 'fee'} by M-Pesa.${
                (order.balanceAmount ?? 0) > 0 ? ` The remaining ${ksh(order.balanceAmount)} is due only when the work is ready.` : ''
              }`
            : 'We will contact you shortly with the price and the next steps.',
          'You can also upload your logo, photos or documents on your order page.',
        ],
        ctaLabel: priced ? 'Pay and track your order' : 'Track your order',
        ctaUrl: trackUrl,
        footnote: `Order reference: ${orderNumber}. Keep this link private; it is how you follow your order.`,
      };
      whatsapp = { template: 'service_order_received', params: [first, serviceName, orderNumber, trackUrl] };
      bell = 'SUCCESS';
      break;
    }
    case 'DEPOSIT_PAID':
      subject = `Payment received — we have started your ${serviceName}`;
      email = {
        heading: 'We have started your order',
        paragraphs: [
          `Hi ${first}, we have received your payment and started work on your ${serviceName}.`,
          dueText || 'We will keep you updated as it moves along.',
          'You can upload logos, photos or documents on your order page at any time.',
        ],
        ctaLabel: 'Open your order',
        ctaUrl: trackUrl,
        footnote: `Order reference: ${orderNumber}`,
      };
      whatsapp = { template: 'service_deposit_received', params: [first, serviceName, trackUrl] };
      bell = 'SUCCESS';
      break;
    case 'PREVIEW_READY':
      subject = `The preview of your ${serviceName} is ready`;
      email = {
        heading: 'Your preview is ready',
        paragraphs: [
          `Hi ${first}, the preview of your ${serviceName} is ready for you to review.`,
          revisionsLeft > 0
            ? `You can approve it, or ask for changes (${revisionsLeft} revision round${revisionsLeft === 1 ? '' : 's'} left in your package).`
            : 'You can approve it, or reply to this email to discuss changes.',
        ],
        ctaLabel: 'Review your preview',
        ctaUrl: trackUrl,
      };
      whatsapp = { template: 'service_preview_ready', params: [first, serviceName, trackUrl] };
      bell = 'INFO';
      break;
    case 'BALANCE_DUE':
      subject = `Your ${serviceName} is ready`;
      email = {
        heading: 'Your work is ready',
        paragraphs: [
          `Hi ${first}, your ${serviceName} is complete.`,
          `Pay the remaining ${ksh(order.balanceAmount)} by M-Pesa and the final files unlock for download straight away.`,
        ],
        ctaLabel: 'Pay balance and download',
        ctaUrl: trackUrl,
      };
      whatsapp = { template: 'service_balance_due', params: [first, serviceName, trackUrl] };
      bell = 'SUCCESS';
      break;
    case 'COMPLETED':
      subject = `Your final ${serviceName} files are ready`;
      email = {
        heading: 'Your files are ready',
        paragraphs: [`Hi ${first}, your final ${serviceName} files are ready to download.`, 'Thank you for choosing Hustlecare.'],
        ctaLabel: 'Download your files',
        ctaUrl: trackUrl,
        footnote: `Order reference: ${orderNumber}`,
      };
      whatsapp = { template: 'service_completed', params: [first, serviceName, trackUrl] };
      bell = 'SUCCESS';
      break;
    default: {
      const n = notice === 'REMINDER_MANUAL' ? 0 : Number(notice.slice(-1));
      subject = n === 3 ? `Last reminder: your ${serviceName} order` : `Finish your ${serviceName} order`;
      email = {
        heading: n === 3 ? 'Last reminder' : 'You are one step away',
        paragraphs: [
          `Hi ${first}, you submitted your ${serviceName} order${pkg} but have not paid the deposit yet.`,
          n === 3
            ? 'This is the last reminder we will send. Pay the deposit when you are ready and we start straight away.'
            : `Pay the ${ksh(order.depositAmount)} deposit by M-Pesa and we start work straight away.`,
        ],
        ctaLabel: 'Continue to payment',
        ctaUrl: trackUrl,
        unsubscribeUrl: stopUrl,
      };
      whatsapp = { template: 'service_payment_reminder', params: [first, serviceName, trackUrl] };
    }
  }

  // Email
  if (order.contactEmail) {
    const res = await sendEmail({
      to: order.contactEmail,
      subject,
      react: ApplyAssistanceEmail(email),
      type: 'NOTIFICATION',
      userId: order.userId ?? undefined,
      metadata: { orderId, notice },
    });
    await logOrderEvent(
      prisma,
      orderId,
      res.success ? 'MESSAGE_SENT' : 'MESSAGE_FAILED',
      res.success ? `Email sent: ${subject}` : `Email failed: ${subject} (${res.error ?? 'unknown error'})`,
      {
        actor: notice === 'REMINDER_MANUAL' ? 'admin' : 'system',
        channel: 'EMAIL',
        template: notice,
        providerMessageId: res.id,
        deliveryStatus: res.success ? 'sent' : 'failed',
      },
    );
  }

  // In-app bell (signed-in customers only)
  if (!isReminder) await inApp(order.userId, bell, email.heading, email.paragraphs.slice(0, 2).join('\n'), `/order/${order.publicToken}`);

  // WhatsApp (only once switched on and templates are approved)
  const phone = normalizeKenyanPhone(order.contactPhone);
  if (isWhatsAppEnabled() && phone) {
    const res = await sendWhatsAppTemplate({ toE164: phone, template: whatsapp.template, params: whatsapp.params });
    await logOrderEvent(
      prisma,
      orderId,
      res.success ? 'MESSAGE_SENT' : 'MESSAGE_FAILED',
      res.success ? `WhatsApp sent: ${subject}` : `WhatsApp failed: ${subject} (${res.error ?? 'unknown error'})`,
      {
        channel: 'WHATSAPP',
        template: whatsapp.template,
        providerMessageId: res.messageId,
        deliveryStatus: res.success ? 'sent' : 'failed',
      },
    );
  }
}

/** Heads-up to you (email + bell for every admin). */
export async function notifyOrderAdmin(orderId: string, notice: AdminOrderNotice, extra: { message?: string } = {}): Promise<void> {
  const ctx = await loadContext(orderId);
  if (!ctx) return;
  const { order, fullName, businessName, serviceName, orderNumber } = ctx;

  const summary = `${serviceName}${order.packageName ? ` · ${order.packageName}` : ''}${businessName ? ` · ${businessName}` : ''}`;
  const adminUrl = `${siteUrl()}/admin/orders`;

  const copy: Record<AdminOrderNotice, { heading: string; lines: string[]; type: 'INFO' | 'SUCCESS' | 'WARNING' }> = {
    SUBMITTED: {
      heading: 'New order submitted',
      lines: [`${fullName} submitted an order (${orderNumber}).`, summary, order.totalAmount ? 'Waiting for the deposit.' : 'No price set: contact them to agree one.'],
      type: 'INFO',
    },
    DEPOSIT_PAID: {
      heading: 'Deposit paid: start work',
      lines: [`${fullName} paid the deposit for ${orderNumber}.`, summary, order.dueDate ? `Due ${order.dueDate.toLocaleDateString('en-GB')}.` : ''],
      type: 'SUCCESS',
    },
    REVISION_REQUESTED: {
      heading: 'Changes requested',
      lines: [`${fullName} asked for changes on ${orderNumber}.`, summary, extra.message ? `“${extra.message}”` : ''],
      type: 'WARNING',
    },
    APPROVED: {
      heading: 'Customer approved the preview',
      lines: [`${fullName} approved ${orderNumber}.`, summary, (order.balanceAmount ?? 0) > 0 ? 'They have been asked to pay the balance.' : 'Nothing left to pay; final files are unlocked.'],
      type: 'SUCCESS',
    },
    BALANCE_PAID: {
      heading: 'Balance paid',
      lines: [`${fullName} paid the balance for ${orderNumber}. Final files are unlocked.`, summary],
      type: 'SUCCESS',
    },
  };

  const c = copy[notice];
  const admins = await prisma.user.findMany({ where: { role: 'admin', isActive: true }, select: { id: true } });
  for (const a of admins) await inApp(a.id, c.type, c.heading, `${fullName} — ${summary}`, '/admin/orders');

  await sendEmail({
    to: process.env.APPLY_ADMIN_EMAIL || INFO_EMAIL,
    subject: `${c.heading}: ${orderNumber} — ${fullName}`,
    react: ApplyAssistanceEmail({
      heading: c.heading,
      paragraphs: c.lines.filter(Boolean),
      ctaLabel: 'Open in admin',
      ctaUrl: adminUrl,
    }),
    type: 'NOTIFICATION',
    metadata: { orderId, notice: `ADMIN_${notice}` },
  });
}