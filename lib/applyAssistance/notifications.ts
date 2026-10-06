// lib/applyAssistance/notifications.ts
//
// Every automatic message for an "Apply For Me" request, in one place.
// Email always goes out (Resend); WhatsApp goes out as well once it is
// switched on. Each send — success or failure — is written to the
// request's timeline, so admin can see exactly what the customer was told.
//
// WHATSAPP TEMPLATES to create and get approved in Meta's WhatsApp Manager
// (category: Utility, language: English). {{n}} are the variables, in order:
//
//   apply_payment_received
//     Hi {{1}}, we have received your payment for your {{2}}. Please upload your documents here: {{3}}
//   apply_docs_complete
//     Hi {{1}}, we now have everything we need for your {{2}}. We are starting your application.
//   apply_doc_rejected
//     Hi {{1}}, we could not accept your {{2}}. Reason: {{3}}. Please upload a new one here: {{4}}
//   apply_submitted
//     Hi {{1}}, your {{2}} application has been submitted. Reference: {{3}}. Track it here: {{4}}
//   apply_completed
//     Hi {{1}}, your {{2}} is ready. Download it here: {{3}}
//   apply_payment_reminder
//     Hi {{1}}, you started an application for your {{2}} but have not paid yet. Continue here: {{3}}

import { prisma } from '@/lib/prisma';
import { sendEmail, INFO_EMAIL } from '@/lib/email';
import { isWhatsAppEnabled, sendWhatsAppTemplate } from '@/lib/whatsapp';
import { logEvent } from '@/lib/applyAssistance/events';
import ApplyAssistanceEmail, { type ApplyAssistanceEmailProps } from '@/emails/ApplyAssistanceEmail';
import { notify } from '@/lib/notify';
import { formatCurrency } from '@/lib/currency';
import { DEFAULT_MARKET } from '@/lib/markets';

export type CustomerNotice = 'PAID' | 'DOCS_COMPLETE' | 'DOC_REJECTED' | 'SUBMITTED' | 'COMPLETED';

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://hustlecare.net').replace(/\/$/, '');
}

// In-app (bell) notification. Uses the same notify() your payment code uses.
// A failure here must never stop the email or WhatsApp from going out.
async function inApp(
  userId: string | null | undefined,
  type: 'INFO' | 'SUCCESS' | 'WARNING',
  title: string,
  message: string,
  link: string,
): Promise<void> {
  if (!userId) return;
  try {
    await notify({ userId, title, message, type, link });
  } catch (err) {
    console.error('[apply] in-app notification failed:', err);
  }
}

interface Content {
  subject: string;
  email: ApplyAssistanceEmailProps;
  whatsapp: { template: string; params: string[] };
}

export async function notifyCustomer(
  requestId: string,
  notice: CustomerNotice,
  extra: { docLabel?: string; reason?: string } = {},
): Promise<void> {
  const r = await prisma.applyAssistanceRequest.findUnique({ where: { id: requestId } });
  if (!r || !r.publicToken) return;
  // Opting out (see the optout route) stops REMINDERS only. Messages about a
  // request the customer has paid for are service messages and still go out.

  const trackUrl = `${siteUrl()}/apply-help/track/${r.publicToken}`;
  const first = r.contactName.trim().split(/\s+/)[0] || 'there';
  const what = r.requirementName;
  const where = r.countyName ? ` in ${r.countyName}` : '';

  let content: Content;

  if (notice === 'PAID') {
    const [offering, payment] = await Promise.all([
      r.templateId
        ? prisma.applyServiceOffering.findUnique({
            where: { templateId: r.templateId },
            include: { documents: { orderBy: { displayOrder: 'asc' } } },
          })
        : null,
      prisma.applyAssistancePayment.findFirst({
        where: { requestId: r.id, status: 'SUCCESSFUL' },
        orderBy: { paidAt: 'desc' },
      }),
    ]);
    const required = (offering?.documents ?? []).filter((d) => d.isRequired).map((d) => d.label);
    content = {
      subject: required.length ? 'Payment received — next, your documents' : 'Payment received — we are on it',
      email: {
        heading: 'Payment received',
        paragraphs: [
          `Hi ${first}, thank you. We have received your payment for your ${what}${where}.`,
          required.length
            ? 'To start your application, please upload these documents. Photos taken with your phone are fine.'
            : 'We have everything we need to start. We will keep you updated as your application moves along.',
        ],
        bulletsTitle: required.length ? 'What we need' : undefined,
        bullets: required.length ? required : undefined,
        ctaLabel: required.length ? 'Upload your documents' : 'Track your application',
        ctaUrl: trackUrl,
        footnote: `Keep this link — it is how you follow your application.${
          payment?.receiptNumber ? ` M-Pesa receipt: ${payment.receiptNumber}.` : ''
        }`,
      },
      whatsapp: { template: 'apply_payment_received', params: [first, what, trackUrl] },
    };
  } else if (notice === 'DOCS_COMPLETE') {
    content = {
      subject: 'We have your documents',
      email: {
        heading: 'We have everything we need',
        paragraphs: [
          `Hi ${first}, thanks for sending your documents. We now have everything we need for your ${what}${where}.`,
          'Our team is starting your application and we will let you know as soon as it has been submitted.',
        ],
        ctaLabel: 'Track your application',
        ctaUrl: trackUrl,
      },
      whatsapp: { template: 'apply_docs_complete', params: [first, what] },
    };
  } else if (notice === 'DOC_REJECTED') {
    const label = extra.docLabel || 'document';
    const reason = extra.reason || 'it was not clear enough';
    content = {
      subject: `Please upload your ${label} again`,
      email: {
        heading: 'One document needs replacing',
        paragraphs: [
          `Hi ${first}, we could not accept your ${label}.`,
          `Reason: ${reason}`,
          'Please upload a new one and we will carry on with your application.',
        ],
        ctaLabel: 'Upload a new document',
        ctaUrl: trackUrl,
      },
      whatsapp: { template: 'apply_doc_rejected', params: [first, label, reason, trackUrl] },
    };
  } else if (notice === 'SUBMITTED') {
    const ref = r.authorityReference;
    content = {
      subject: `Your ${what} application has been submitted`,
      email: {
        heading: 'Your application has been submitted',
        paragraphs: [
          `Hi ${first}, we have submitted your ${what}${where}.`,
          ref ? `Reference number: ${ref}` : 'We will let you know as soon as there is an update from the authority.',
        ],
        ctaLabel: 'Track your application',
        ctaUrl: trackUrl,
      },
      whatsapp: { template: 'apply_submitted', params: [first, what, ref || 'to follow', trackUrl] },
    };
  } else {
    content = {
      subject: `Your ${what} is ready`,
      email: {
        heading: 'Your documents are ready',
        paragraphs: [`Hi ${first}, your ${what}${where} is ready.`, 'You can download it from your tracking page.'],
        ctaLabel: 'Download your documents',
        ctaUrl: trackUrl,
        footnote: 'Thank you for trusting Hustlecare with your application.',
      },
      whatsapp: { template: 'apply_completed', params: [first, what, trackUrl] },
    };
  }

  // ── Email ──────────────────────────────────────────────────────────────────
  if (r.contactEmail) {
    const res = await sendEmail({
      to: r.contactEmail,
      subject: content.subject,
      react: ApplyAssistanceEmail(content.email),
      type: 'NOTIFICATION',
      userId: r.userId ?? undefined,
      metadata: { applyRequestId: r.id, notice },
    });
    if (res.success) {
      await logEvent(prisma, r.id, 'MESSAGE_SENT', `Email sent: ${content.subject}`, {
        channel: 'EMAIL',
        template: notice,
        providerMessageId: res.id,
        deliveryStatus: 'sent',
      });
    } else {
      await logEvent(prisma, r.id, 'MESSAGE_FAILED', `Email failed: ${content.subject} (${res.error ?? 'unknown error'})`, {
        channel: 'EMAIL',
        template: notice,
        deliveryStatus: 'failed',
      });
    }
  }

  // ── In-app bell (only for customers who were signed in when they applied) ──
  await inApp(
    r.userId,
    notice === 'DOC_REJECTED' ? 'WARNING' : notice === 'SUBMITTED' ? 'INFO' : 'SUCCESS',
    content.email.heading,
    content.email.paragraphs.slice(0, 2).join('\n'),
    `/apply-help/track/${r.publicToken}`,
  );

  // ── WhatsApp (only once switched on and templates are approved) ────────────
  if (isWhatsAppEnabled() && r.contactPhoneE164) {
    const res = await sendWhatsAppTemplate({
      toE164: r.contactPhoneE164,
      template: content.whatsapp.template,
      params: content.whatsapp.params,
    });
    if (res.success) {
      await logEvent(prisma, r.id, 'MESSAGE_SENT', `WhatsApp sent: ${content.subject}`, {
        channel: 'WHATSAPP',
        template: content.whatsapp.template,
        providerMessageId: res.messageId,
        deliveryStatus: 'sent',
      });
    } else {
      await logEvent(prisma, r.id, 'MESSAGE_FAILED', `WhatsApp failed: ${content.subject} (${res.error ?? 'unknown error'})`, {
        channel: 'WHATSAPP',
        template: content.whatsapp.template,
        deliveryStatus: 'failed',
      });
    }
  }
}

/** Heads-up email to you when a request needs attention. */
export async function notifyAdmin(requestId: string, notice: 'PAID' | 'READY'): Promise<void> {
  const r = await prisma.applyAssistanceRequest.findUnique({ where: { id: requestId } });
  if (!r) return;

  const adminUrl = `${siteUrl()}/admin/apply-requests`;
  const summary = `${r.requirementName}${r.countyName ? ` · ${r.countyName}` : ''}${r.businessName ? ` · for ${r.businessName}` : ''}`;

  const email: ApplyAssistanceEmailProps =
    notice === 'READY'
      ? {
          heading: 'Ready to apply',
          paragraphs: [
            `${r.contactName} has paid and uploaded every required document.`,
            summary,
            `Phone: ${r.contactPhone}${r.contactEmail ? ` · Email: ${r.contactEmail}` : ''}`,
          ],
          ctaLabel: 'Open in admin',
          ctaUrl: adminUrl,
        }
      : {
          heading: 'New paid request',
          paragraphs: [
            `${r.contactName} has paid for help applying.`,
            summary,
            `Phone: ${r.contactPhone}${r.contactEmail ? ` · Email: ${r.contactEmail}` : ''}`,
            'They have been emailed what to upload. You will get another email when everything is in.',
          ],
          ctaLabel: 'Open in admin',
          ctaUrl: adminUrl,
        };

  // In-app bell for every active admin.
  const admins = await prisma.user.findMany({ where: { role: 'admin', isActive: true }, select: { id: true } });
  for (const admin of admins) {
    await inApp(
      admin.id,
      notice === 'READY' ? 'SUCCESS' : 'INFO',
      email.heading,
      `${r.contactName} — ${summary}`,
      '/admin/apply-requests',
    );
  }

  await sendEmail({
    to: process.env.APPLY_ADMIN_EMAIL || INFO_EMAIL,
    subject: notice === 'READY' ? `Ready to apply: ${r.requirementName} — ${r.contactName}` : `New paid request: ${r.requirementName} — ${r.contactName}`,
    react: ApplyAssistanceEmail(email),
    type: 'NOTIFICATION',
    metadata: { applyRequestId: r.id, notice: `ADMIN_${notice}` },
  });
}

/**
 * Abandoned-lead reminder. attempt 1–3 come from the scheduled job; "manual"
 * is the admin's "send reminder now" button.
 */
export async function notifyLeadReminder(requestId: string, attempt: 1 | 2 | 3 | 'manual'): Promise<void> {
  const r = await prisma.applyAssistanceRequest.findUnique({ where: { id: requestId } });
  if (!r || !r.publicToken || r.stage !== 'LEAD' || r.optedOutAt || !r.contactConsentAt) return;

  const base = siteUrl();
  const resumeUrl = `${base}/apply-help?resume=${r.publicToken}`;
  const stopUrl = `${base}/api/apply-assistance/optout?token=${r.publicToken}`;
  const first = r.contactName.trim().split(/\s+/)[0] || 'there';
  const what = r.requirementName;
  const where = r.countyName ? ` in ${r.countyName}` : '';
  const fee = r.serviceFee ? formatCurrency(r.serviceFee, DEFAULT_MARKET) : null;

  let subject: string;
  let email: ApplyAssistanceEmailProps;

  if (attempt === 3) {
    subject = `Last reminder: your ${what} application`;
    email = {
      heading: 'Last reminder',
      paragraphs: [
        `Hi ${first}, this is the last reminder we will send about your ${what}${where}.`,
        'If you still want us to handle the application, you can pick up where you left off. If not, no problem at all.',
      ],
      ctaLabel: 'Continue to payment',
      ctaUrl: resumeUrl,
      unsubscribeUrl: stopUrl,
    };
  } else if (attempt === 2) {
    subject = `Still need help with your ${what}?`;
    email = {
      heading: `Still need help with your ${what}?`,
      paragraphs: [
        `Hi ${first}, we can take the whole application off your hands${where ? ` for your business${where}` : ''}.`,
        fee
          ? `You pay the ${fee} service fee by M-Pesa, send us your documents from your phone, and we do the rest.`
          : 'Pay the service fee by M-Pesa, send us your documents from your phone, and we do the rest.',
      ],
      ctaLabel: 'Continue to payment',
      ctaUrl: resumeUrl,
      unsubscribeUrl: stopUrl,
    };
  } else {
    subject = `Finish your ${what} application`;
    email = {
      heading: attempt === 'manual' ? 'Following up on your request' : 'You are one step away',
      paragraphs: [
        `Hi ${first}, you started an application for your ${what}${where} but have not paid yet.`,
        fee
          ? `The service fee is ${fee}. Pay by M-Pesa and we take it from there. You only need to upload your documents.`
          : 'Pay the service fee by M-Pesa and we take it from there. You only need to upload your documents.',
      ],
      ctaLabel: 'Continue to payment',
      ctaUrl: resumeUrl,
      unsubscribeUrl: stopUrl,
    };
  }

  const templateName = `REMINDER_${attempt}`;

  if (r.contactEmail) {
    const res = await sendEmail({
      to: r.contactEmail,
      subject,
      react: ApplyAssistanceEmail(email),
      type: 'NOTIFICATION',
      userId: r.userId ?? undefined,
      metadata: { applyRequestId: r.id, notice: templateName },
    });
    if (res.success) {
      await logEvent(prisma, r.id, 'MESSAGE_SENT', `Reminder email sent (${attempt === 'manual' ? 'by you' : `${attempt} of 3`}): ${subject}`, {
        actor: attempt === 'manual' ? 'admin' : 'system',
        channel: 'EMAIL',
        template: templateName,
        providerMessageId: res.id,
        deliveryStatus: 'sent',
      });
    } else {
      await logEvent(prisma, r.id, 'MESSAGE_FAILED', `Reminder email failed: ${res.error ?? 'unknown error'}`, {
        channel: 'EMAIL',
        template: templateName,
        deliveryStatus: 'failed',
      });
    }
  }

  if (isWhatsAppEnabled() && r.contactPhoneE164) {
    const res = await sendWhatsAppTemplate({
      toE164: r.contactPhoneE164,
      template: 'apply_payment_reminder',
      params: [first, what, resumeUrl],
    });
    if (res.success) {
      await logEvent(prisma, r.id, 'MESSAGE_SENT', `Reminder WhatsApp sent: ${subject}`, {
        actor: attempt === 'manual' ? 'admin' : 'system',
        channel: 'WHATSAPP',
        template: 'apply_payment_reminder',
        providerMessageId: res.messageId,
        deliveryStatus: 'sent',
      });
    } else {
      await logEvent(prisma, r.id, 'MESSAGE_FAILED', `Reminder WhatsApp failed: ${res.error ?? 'unknown error'}`, {
        channel: 'WHATSAPP',
        template: 'apply_payment_reminder',
        deliveryStatus: 'failed',
      });
    }
  }
}