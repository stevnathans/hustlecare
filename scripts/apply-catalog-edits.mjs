// scripts/apply-catalog-edits.mjs
//
// Makes the handful of small edits that connect your existing service pages
// to the database catalog. The pricing and service files are long and only a
// few single lines change, so this applies exactly those lines instead of
// re-sending whole files.
//
//   Run from the project root:   node scripts/apply-catalog-edits.mjs
//
// - Each file is backed up first (file.bak) the first time it is changed.
// - Safe to run twice: lines that were already changed are reported as
//   "not found" and skipped.
// - If a line can't be found (the file differs from what was expected) it
//   says so and changes nothing in that file for that line — nothing is guessed.

import fs from 'node:fs';
import path from 'node:path';

const EDITS = [
  {
    file: 'app/services/ServicesClient.tsx',
    changes: [
      ['function ServicesGrid() {', 'function ServicesGrid({ items }: { items?: Service[] | null }) {'],
      [
        '{services.map(({ emoji, title, desc, href, cta }) => (',
        '{(items && items.length > 0 ? items : services).map(({ emoji, title, desc, href, cta }) => (',
      ],
      ['const categories: Category[] = [', 'const staticCategories: Category[] = ['],
      [
        'function CategoriesSection() {',
        `function CategoriesSection({ items }: { items?: Service[] | null }) {
  // With a catalog, each category lists its real services; otherwise the built-in list.
  const categories: Category[] =
    items && items.length > 0
      ? staticCategories
          .map((c) => ({ ...c, services: items.filter((s) => s.category === c.id).map((s) => s.title) }))
          .filter((c) => c.services.length > 0)
      : staticCategories;`,
      ],
      ['export default function ServicesClient() {', 'export default function ServicesClient({ catalogServices }: { catalogServices?: Service[] | null }) {'],
      ['<ServicesGrid />', '<ServicesGrid items={catalogServices} />'],
      ['<CategoriesSection />', '<CategoriesSection items={catalogServices} />'],
    ],
  },
  {
    file: 'app/services/business-plan-writing/BusinessPlanWritingClient.tsx',
    changes: [
      ['function PricingCards() {', 'function PricingCards({ catalogPlans }: { catalogPlans?: Plan[] | null }) {'],
      [
        '{plans.map(({ id, name, tag, price, items, cta, popular }) => (',
        '{(catalogPlans && catalogPlans.length > 0 ? catalogPlans : plans).map(({ id, name, tag, price, items, cta, popular }) => (',
      ],
      [
        'export default function BusinessPlanWritingClient() {',
        'export default function BusinessPlanWritingClient({ catalogPlans }: { catalogPlans?: Plan[] | null }) {',
      ],
      ['<PricingCards />', '<PricingCards catalogPlans={catalogPlans} />'],
    ],
  },
  {
    file: 'app/services/website-creation/WebsiteCreationClient.tsx',
    changes: [
      ['function PricingCards() {', 'function PricingCards({ catalogPlans }: { catalogPlans?: Plan[] | null }) {'],
      [
        '{plans.map(({ id, name, tag, price, items, delivery, cta, popular }) => (',
        '{(catalogPlans && catalogPlans.length > 0 ? catalogPlans : plans).map(({ id, name, tag, price, items, delivery, cta, popular }) => (',
      ],
      [
        'export default function WebsiteCreationClient() {',
        'export default function WebsiteCreationClient({ catalogPlans }: { catalogPlans?: Plan[] | null }) {',
      ],
      ['<PricingCards />', '<PricingCards catalogPlans={catalogPlans} />'],
    ],
  },
  {
    // Prices now live in the database, so the questionnaire config no longer
    // carries (conflicting) copies. Tier ids must match the landing page.
    file: 'lib/questionnaires/types.ts',
    changes: [
      ['  priceLabel: string; // "KSh 5,999"', '  priceLabel?: string; // deprecated — prices live in the database (ServicePackage)'],
      ['  includes: string[];', '  includes?: string[]; // deprecated — package contents live in the database'],
    ],
  },
  {
    file: 'lib/questionnaires/website-creation/config.ts',
    changes: [
      ['    id: "business",', '    id: "professional",'],
      ['    name: "Business Website",', '    name: "Professional Website",'],
      ['    priceLabel: "$180",', ''],
      ['    priceLabel: "$350",', ''],
      ['    priceLabel: "$600",', ''],
      ['    includes: ["3 pages", "Mobile responsive design", "Contact form", "Social media links"],', ''],
      ['    includes: ["Up to 6 pages", "Modern professional design", "Mobile responsive layout", "Contact forms", "Basic SEO structure"],', ''],
      ['    includes: ["Up to 10 pages", "Premium custom design", "Blog or content section", "Advanced contact forms", "SEO optimization"],', ''],
    ],
  },
];

const count = (text, find) => text.split(find).length - 1;
let problems = 0;

for (const { file, changes } of EDITS) {
  const full = path.resolve(process.cwd(), file);
  if (!fs.existsSync(full)) {
    console.log(`✗ ${file}: file not found (run this from the project root)`);
    problems += 1;
    continue;
  }

  let text = fs.readFileSync(full, 'utf8');
  const original = text;
  console.log(`\n${file}`);

  for (const [find, replace] of changes) {
    const n = count(text, find);
    const shown = find.trim().slice(0, 70);
    if (n === 1) {
      text = text.replace(find, () => replace);
      console.log(`  ✓ changed:  ${shown}`);
    } else if (n === 0) {
      console.log(`  – skipped (not found, maybe already changed):  ${shown}`);
    } else {
      console.log(`  ✗ found ${n} times, left alone:  ${shown}`);
      problems += 1;
    }
  }

  if (text !== original) {
    if (!fs.existsSync(`${full}.bak`)) fs.writeFileSync(`${full}.bak`, original);
    fs.writeFileSync(full, text);
  }
}

console.log(problems === 0 ? '\nDone.' : `\nDone, with ${problems} problem(s) above.`);
process.exit(problems === 0 ? 0 : 1);
