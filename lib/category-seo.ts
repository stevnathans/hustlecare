import { withArticle } from '@/lib/grammar';

export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;

/** First candidate within `max`; if none fit, the last (shortest) one. */
export function pickWithinLimit(candidates: string[], max: number): string {
  return candidates.find((c) => c.length <= max) ?? candidates[candidates.length - 1];
}

export interface CategorySeoContext {
  businessName: string;
  categoryName: string;
  count: number;
  year: number;
}

interface TemplateArgs extends CategorySeoContext {
  /** "a Barbershop" / "an Event Planning" */
  a: string;
}

interface CategorySeoTemplate {
  /** Longest/most-keyword-rich first, shortest last. */
  titles: (c: TemplateArgs) => string[];
  descriptions: (c: TemplateArgs) => string[];
  /** On-page H1 — no year, so server HTML and client render never disagree. */
  h1: (c: TemplateArgs) => string;
  intro: (c: TemplateArgs) => string;
}

const DEFAULT_TEMPLATE: CategorySeoTemplate = {
  titles: ({ count, categoryName, businessName, year, a }) => [
    `${count} ${categoryName} Requirements for ${a} ${businessName} Business in Kenya (${year})`,
    `${count} ${categoryName} Requirements for ${a} ${businessName} Business in Kenya`,
    `${categoryName} Requirements for ${a} ${businessName} Business`,
  ],
  descriptions: ({ categoryName, businessName, a }) => [
    `Every ${categoryName.toLowerCase()} requirement for ${a} ${businessName} business in Kenya, with costs and options — part of the full ${businessName} requirements checklist.`,
    `Every ${categoryName.toLowerCase()} requirement for ${a} ${businessName} business in Kenya, with costs and options.`,
  ],
  h1: ({ count, categoryName, businessName, a }) =>
    `${count} ${categoryName} Requirements for ${a} ${businessName} Business`,
  intro: ({ categoryName, businessName }) =>
    `Part of the full ${businessName} requirements checklist — every ${categoryName.toLowerCase()} item, with costs and options.`,
};

// Keyed by lowercase RequirementCategory name (template.category).
const TEMPLATES: Record<string, CategorySeoTemplate> = {
  legal: {
    titles: ({ businessName, year }) => [
      `${businessName} Business Licences, Permits & Legal Requirements in Kenya (${year})`,
      `${businessName} Business Licences & Permits in Kenya (${year})`,
      `${businessName} Business Licences & Permits in Kenya`,
    ],
    descriptions: ({ a }) => [
      `Find the licences, permits and legal steps you need to start ${a} Business in Kenya. Review available fees and download your checklist as a PDF.`,
      `Find the licences, permits and legal steps to start ${a} Business in Kenya. Review fees and download your checklist as a PDF.`,
    ],
    h1: ({ businessName }) =>
      `Legal Requirements to Start a ${businessName} Business in Kenya [All Licences & Permits]`,
    intro: ({ a }) =>
      `The licences, permits and legal steps for ${a} business in Kenya, with available fees. Select your county to see local permit costs and add what applies to your plan.`,
  },

  equipment: {
    titles: ({ count, a }) => [
      `${count} Must-Have Equipment to Start ${a} Business in Kenya`,
      `${count} Equipment to Start ${a} Business in Kenya`,
      `Equipment to Start ${a} Business in Kenya`,
    ],
    descriptions: ({ a }) => [
      `Find the equipment you need to start ${a} Business in Kenya. Compare available prices, select items and download your checklist as a PDF on Hustlecare.`,
      `Find the equipment you need to start ${a} Business in Kenya. Compare prices, select items and download your checklist as a PDF.`,
    ],
    h1: ({ count, a }) => `${count} Must-Have Equipment to Start ${a} Business in Kenya`,
    intro: ({ a }) =>
      `Equipment for ${a} business in Kenya, with available prices. Compare options and add items to your plan as you go.`,
  },

  software: {
    titles: ({ a }) => [
      `Software You Need to Start ${a} Business in Kenya`,
      `Software to Start ${a} Business in Kenya`,
    ],
    descriptions: ({ a }) => [
      `Discover software to help you start and run ${a} Business in Kenya. Explore available tools and prices, then download your business checklist as a PDF.`,
      `Discover software to help you start and run ${a} Business in Kenya. Explore tools and prices, then download your checklist as a PDF.`,
    ],
    h1: ({ a }) => `Software You Need to Start ${a} Business in Kenya`,
    intro: ({ a }) =>
      `Tools to help you start and run ${a} business in Kenya, with available prices. Compare options and add what fits to your plan.`,
  },

  documents: {
    titles: ({ a }) => [
      `Documents You Need to Start ${a} Business in Kenya`,
      `Documents to Start ${a} Business in Kenya`,
    ],
    descriptions: ({ a }) => [
      `See which documents you need to start ${a} Business in Kenya. Organize your paperwork and download your business checklist as a PDF on Hustlecare.`,
      `See which documents you need to start ${a} Business in Kenya. Organize your paperwork and download your checklist as a PDF.`,
    ],
    h1: ({ a }) => `Documents You Need to Start ${a} Business in Kenya`,
    intro: ({ a }) =>
      `The paperwork ${a} business in Kenya needs, in one place. Review each document and add it to your plan.`,
  },

  'branding resources': {
    titles: ({ count, a }) => [
      `Marketing ${a} Business in Kenya: ${count} Resources You Must Have`,
      `Marketing ${a} Business in Kenya: ${count} Must-Have Resources`,
      `${count} Marketing Resources for ${a} Business in Kenya`,
    ],
    descriptions: ({ businessName }) => [
      `Find branding and marketing resources for your ${businessName} Business in Kenya. Explore signage and branded materials, then download your checklist as a PDF.`,
      `Find branding and marketing resources for your ${businessName} Business in Kenya. Explore signage and branded materials, then get your checklist.`,
    ],
    h1: ({ count, a }) => `Marketing ${a} Business in Kenya: ${count} Resources You Must Have`,
    intro: ({ a }) =>
      `Signage, branded materials and other marketing resources for ${a} business in Kenya, with available prices.`,
  },

  'operating expenses': {
    titles: ({ businessName, year }) => [
      `${businessName} Business Operating Expenses [Updated ${year} Breakdown]`,
      `${businessName} Business Operating Expenses (${year})`,
      `${businessName} Business Operating Expenses`,
    ],
    descriptions: ({ a }) => [
      `Plan for the ongoing costs of running ${a} Business in Kenya. Review recurring expenses and use the breakdown to prepare your operating budget.`,
      `Plan the ongoing costs of running ${a} Business in Kenya. Review recurring expenses and prepare your operating budget.`,
    ],
    h1: ({ businessName }) => `${businessName} Business Operating Expenses in Kenya`,
    intro: ({ a }) =>
      `The recurring costs of running ${a} business in Kenya. Review each expense to prepare your operating budget.`,
  },

  stock: {
    titles: ({ count, a }) => [
      `Stock for ${a} Business in Kenya: ${count} Products to Sell`,
      `${count} Products to Stock in ${a} Business in Kenya`,
      `Products to Stock in ${a} Business`,
    ],
    descriptions: ({ businessName }) => [
      `Browse the products a ${businessName} business in Kenya can stock and sell, with demand levels and prices. Add items to your plan and download your checklist as a PDF.`,
      `Browse products a ${businessName} business in Kenya can stock and sell, with demand levels and prices. Add items to your plan.`,
    ],
    h1: ({ count, a }) => `${count} Products to Stock in ${a} Business in Kenya`,
    intro: ({ a }) =>
      `Products ${a} business in Kenya can stock and sell, shown by demand level. These are inventory ideas, not startup requirements.`,
  },

  uncategorized: {
    titles: ({ a }) => [
      `Other Items You Need to Start ${a} Business in Kenya`,
      `Other Items to Start ${a} Business in Kenya`,
    ],
    descriptions: ({ a }) => [
      `Explore other items that may help you start ${a} Business in Kenya. Build your requirements list and download your checklist as a PDF on Hustlecare.`,
      `Explore other items that may help you start ${a} Business in Kenya. Build your requirements list and download your checklist as a PDF.`,
    ],
    h1: ({ a }) => `Other Items You Need to Start ${a} Business in Kenya`,
    intro: ({ a }) =>
      `Other items that may help you start ${a} business in Kenya. Add the ones that apply to your requirements list.`,
  },
};

export function getCategorySeo(ctx: CategorySeoContext) {
  const t = TEMPLATES[ctx.categoryName.trim().toLowerCase()] ?? DEFAULT_TEMPLATE;
  const args: TemplateArgs = { ...ctx, a: withArticle(ctx.businessName) };
  return {
    title: pickWithinLimit(t.titles(args), TITLE_MAX),
    description: pickWithinLimit(t.descriptions(args), DESCRIPTION_MAX),
    h1: t.h1(args),
    intro: t.intro(args),
  };
}