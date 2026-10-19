// lib/payments/manual-config.ts
//
// Where customers send money today, and the exact wording of the payment
// instructions used on screens and in emails. One place, so the number and the
// steps are identical everywhere.
//
// To change the number later, set NEXT_PUBLIC_MANUAL_PAY_NUMBER in your
// environment (for example "0722 000 000"); nothing else needs editing.
// Safe to import from both server and browser code.

export const MANUAL_PAY_NUMBER = (process.env.NEXT_PUBLIC_MANUAL_PAY_NUMBER || '0713 140 158').trim();

/** The same number in the 2547… form WhatsApp links use. */
export const MANUAL_PAY_WHATSAPP = (() => {
  const digits = MANUAL_PAY_NUMBER.replace(/\D/g, '');
  return digits.startsWith('0') ? `254${digits.slice(1)}` : digits;
})();

const ksh = (n: number) => `KSh ${Math.round(n).toLocaleString('en-US')}`;

/**
 * The payment steps, as plain lines for emails.
 *   fromPhone — the customer's own number, so we can match the payment
 *   orderRef  — quoted when they WhatsApp their confirmation message
 */
export function payInstructionLines(opts: { amount: number; fromPhone?: string | null; orderRef?: string | null }): string[] {
  return [
    'Open M-Pesa and choose Send Money.',
    `Enter the number ${MANUAL_PAY_NUMBER}.`,
    `Enter the amount ${ksh(opts.amount)}.`,
    ...(opts.fromPhone ? [`Pay from ${opts.fromPhone}, the number you gave us, so we can match your payment.`] : []),
    `Send your M-Pesa confirmation message to ${MANUAL_PAY_NUMBER} on WhatsApp${opts.orderRef ? `, quoting ${opts.orderRef}` : ''}.`,
    'We confirm payments by hand and email you as soon as we see yours.',
  ];
}