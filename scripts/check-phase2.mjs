// scripts/check-phase2.mjs
//
// Checks that every piece of the new order flow is really in your project.
// The flow only works when ALL of them are in place; one old file left behind
// gives exactly the symptoms "no payment screen" and "orders show as unfinished".
//
//   Run from the project root:   node scripts/check-phase2.mjs
//
// It only reads files. It does not change anything.

import fs from 'node:fs';
import path from 'node:path';

const CHECKS = [
  ['prisma/schema.prisma', ['enum ServiceOrderStage', 'model ServiceOrderPayment', 'model Service {'], 'Add the services schema (prisma/services-schema.prisma), then run: npx prisma migrate dev && npx prisma generate'],
  ['app/api/questionnaire-drafts/[id]/submit/route.ts', ['AWAITING_DEPOSIT', 'publicToken'], 'This is still the OLD submit route. Replace it with the new one. (It is what turns a finished questionnaire into a payable order.)'],
  ['components/questionnaire-engine/ReviewScreen.tsx', ['Submit and pay', 'consent'], 'Old review screen. Replace it (the new one shows the price and a consent tick).'],
  ['components/questionnaire-engine/ConfirmationScreen.tsx', ['PayPanel'], 'Old confirmation screen. Replace it (the new one is the "pay your deposit" screen).'],
  ['components/questionnaire-engine/engine/draft-api.ts', ['consent', 'publicToken'], 'Old draft-api.ts. Replace it.'],
  ['components/questionnaire-engine/engine/context.tsx', ['getLastSubmitError', 'consent: boolean', 'publicToken'], 'Not patched. Run: node scripts/apply-phase2-edits.mjs'],
  ['components/questionnaire-engine/engine/reducer.ts', ['publicToken'], 'Not patched. Run: node scripts/apply-phase2-edits.mjs'],
  ['lib/questionnaires/types.ts', ['publicToken'], 'Not patched. Run: node scripts/apply-phase2-edits.mjs'],
  ['app/services/[service]/questionnaire/page.tsx', ['getCatalogPlans'], 'Old questionnaire page. Replace it with the new page.tsx plus QuestionnaireClient.tsx.'],
  ['app/services/[service]/questionnaire/QuestionnaireClient.tsx', ['plans'], 'Missing. Add QuestionnaireClient.tsx next to the questionnaire page.'],
  ['components/orders/PayPanel.tsx', ['payment-status'], 'Missing: components/orders/PayPanel.tsx'],
  ['app/api/service-orders/[token]/pay/route.ts', ['nextPayable'], 'Missing: the order payment routes under app/api/service-orders/'],
  ['app/api/payments/stk-callback/route.ts', ['serviceOrderPayment'], 'Old payment callback. Replace it (it must recognise order payments).'],
  ['app/order/[token]/page.tsx', ['OrderClient'], 'Missing: the customer order page under app/order/[token]/'],
  ['app/admin/orders/page.tsx', ['AWAITING_DEPOSIT'], 'Old admin orders page. Replace it with the new one.'],
  ['app/services/business-plan-writing/BusinessPlanWritingClient.tsx', ['catalogPlans'], 'Not patched. Run: node scripts/apply-catalog-edits.mjs'],
];

let bad = 0;
for (const [file, markers, hint] of CHECKS) {
  const full = path.resolve(process.cwd(), file);
  if (!fs.existsSync(full)) {
    console.log(`✗ ${file}\n    missing. ${hint}`);
    bad += 1;
    continue;
  }
  const text = fs.readFileSync(full, 'utf8');
  const missing = markers.filter((m) => !text.includes(m));
  if (missing.length) {
    console.log(`✗ ${file}\n    looks out of date. ${hint}`);
    bad += 1;
  } else {
    console.log(`✓ ${file}`);
  }
}

console.log(
  bad === 0
    ? '\nAll the code is in place.\nTwo things this script cannot see (they live in your database):\n  1. /admin/services shows your services with prices (press "Import current services" if it is empty).\n  2. APPLY_PAYMENT_MODE is set to "manual" or "daraja" in your environment, and the server was restarted.'
    : `\n${bad} thing(s) to fix above.`,
);
process.exit(bad === 0 ? 0 : 1);
