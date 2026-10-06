// lib/phone.ts
//
// Kenyan mobile number helpers. Everything that sends a message or an
// M-Pesa prompt, and every duplicate check, works from the same normalised
// form (+254712345678), so "0712 345 678", "712345678", "+254 712 345 678"
// and "254712345678" all end up identical.

/** Returns the number as +2547XXXXXXXX / +2541XXXXXXXX, or null if it isn't a valid Kenyan mobile number. */
export function normalizeKenyanPhone(input: string | null | undefined): string | null {
  if (!input) return null;

  let digits = input.replace(/[^\d]/g, '');

  // 00254712345678 → 254712345678
  if (digits.startsWith('00')) digits = digits.slice(2);

  if (/^0[17]\d{8}$/.test(digits)) {
    digits = '254' + digits.slice(1); // 0712345678
  } else if (/^[17]\d{8}$/.test(digits)) {
    digits = '254' + digits; // 712345678
  }

  if (!/^254[17]\d{8}$/.test(digits)) return null;
  return '+' + digits;
}

/** The format Safaricom's Daraja API expects: 254712345678 (no plus sign). */
export function toMpesaMsisdn(e164: string): string {
  return e164.replace(/^\+/, '');
}

/** +254712345678 → 0712 345 678, for showing back to the customer. */
export function formatPhoneLocal(e164: string): string {
  const m = /^\+254([17]\d{2})(\d{3})(\d{3})$/.exec(e164);
  if (!m) return e164;
  return `0${m[1]} ${m[2]} ${m[3]}`;
}