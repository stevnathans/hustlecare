// lib/applyAssistance/config.ts
//
// Constants shared by the form (client) and the API routes (server).
// Nothing secret goes in this file — it is bundled into the browser.

/**
 * Email is required on the form for now, because WhatsApp isn't connected
 * yet and email is the only automatic channel. Flip to false once the
 * WhatsApp Cloud API is live and phone alone is enough.
 */
export const APPLY_REQUIRE_EMAIL = true;

/** How often the form asks the server "has the M-Pesa payment gone through?" */
export const STK_POLL_INTERVAL_MS = 3000;

/** How long the form keeps waiting for the M-Pesa PIN before offering "try again". */
export const STK_POLL_MAX_MS = 120_000;

export type ApplyPaymentMode = 'off' | 'manual' | 'daraja';