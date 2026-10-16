import { withArticle } from '@/lib/grammar';
import { marketCountryPhrase, marketLicenceWord, type MarketCode } from '@/lib/markets';
import { TITLE_MAX, DESCRIPTION_MAX, pickWithinLimit } from '@/lib/seo-fit';

export interface CategorySeoContext {
  businessName: string;
  categoryName: string;
  count: number;
  year: number;
  market: MarketCode;
}

interface TemplateArgs extends CategorySeoContext {
  /** "a Barbershop" / "an Event Planning" */
  a: string;
  /** "Kenya" / "the US" — use as `in ${country}` */
  country: string;
  /** "licences" / "licenses", and capitalised */
  lic: string;
  Lic: string;
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
  titles: ({ count, categoryName, businessName, year, a, country }) => [
    `${count} ${categoryName} Requirements for ${a} ${businessName} Business in ${country} (${year})`,
    `${count} ${categoryName} Requirements for ${a} ${businessName} Business in ${country}`,
    `${categoryName} Requirements for ${a} ${businessName} Business`,
  ],
  descriptions: ({ categoryName, businessName, a, country }) => [
    `Every ${categoryName.toLowerCase()} requirement for ${a} ${businessName} business in ${country}, with costs and options — part of the full ${businessName} requirements checklist.`,
    `Every ${categoryName.toLowerCase()} requirement for ${a} ${businessName} business in ${country}, with costs and options.`,
  ],
  h1: ({ count, categoryName, businessName, a }) =>
    `${count} ${categoryName} Requirements for ${a} ${businessName} Business`,
  intro: ({ categoryName, businessName }) =>
    `Part of the full ${businessName} requirements checklist — every ${categoryName.toLowerCase()} item, with costs and options.`,
};

// Keyed by lowercase RequirementCategory name (template.category).
const TEMPLATES: Record<string, CategorySeoTemplate> = {
  legal: {
    titles: ({ businessName, year, country, Lic }) => [
      `${businessName} Business ${Lic}s, Permits & Legal Requirements in ${country} (${year})`,
      `${businessName} Business ${Lic}s & Permits in ${country} (${year})`,
      `${businessName} Business ${Lic}s & Permits in ${country}`,
    ],
    descriptions: ({ a, country, lic }) => [
      `Find the ${lic}s, permits and legal steps you need to start ${a} Business in ${country}. Review available fees and download your checklist as a PDF.`,
      `Find the ${lic}s, permits and legal steps to start ${a} Business in ${country}. Review fees and download your checklist as a PDF.`,
    ],
    h1: ({ businessName, country, Lic }) =>
      `${businessName} Business ${Lic}s, Permits and Legal Requirements in ${country}`,
    // County selection only exists in Kenya (see CountyProvider).
    intro: ({ a, country, lic, market }) =>
      `The ${lic}s, permits and legal steps for ${a} business in ${country}, with available fees. ${
        market === 'KE'
          ? 'Select your county to see local permit costs and add what applies to your plan.'
          : 'Review the fees for each item and add what applies to your plan.'
      }`,
  },

  equipment: {
    titles: ({ count, a, country }) => [
      `${count} Must-Have Equipment to Start ${a} Business in ${country}`,
      `${count} Equipment to Start ${a} Business in ${country}`,
      `Equipment to Start ${a} Business in ${country}`,
    ],
    descriptions: ({ a, country }) => [
      `Find the equipment you need to start ${a} Business in ${country}. Compare available prices, select items and download your checklist as a PDF on Hustlecare.`,
      `Find the equipment you need to start ${a} Business in ${country}. Compare prices, select items and download your checklist as a PDF.`,
    ],
    h1: ({ count, a, country }) =>
      `${count} Must-Have Equipment to Start ${a} Business in ${country}`,
    intro: ({ a, country }) =>
      `Equipment for ${a} business in ${country}, with available prices. Compare options and add items to your plan as you go.`,
  },

  software: {
    titles: ({ a, country }) => [
      `Software You Need to Start ${a} Business in ${country}`,
      `Software to Start ${a} Business in ${country}`,
    ],
    descriptions: ({ a, country }) => [
      `Discover software to help you start and run ${a} Business in ${country}. Explore available tools and prices, then download your business checklist as a PDF.`,
      `Discover software to help you start and run ${a} Business in ${country}. Explore tools and prices, then download your checklist as a PDF.`,
    ],
    h1: ({ a, country }) => `Software You Need to Start ${a} Business in ${country}`,
    intro: ({ a, country }) =>
      `Tools to help you start and run ${a} business in ${country}, with available prices. Compare options and add what fits to your plan.`,
  },

  documents: {
    titles: ({ a, country }) => [
      `Documents You Need to Start ${a} Business in ${country}`,
      `Documents to Start ${a} Business in ${country}`,
    ],
    descriptions: ({ a, country }) => [
      `See which documents you need to start ${a} Business in ${country}. Organize your paperwork and download your business checklist as a PDF on Hustlecare.`,
      `See which documents you need to start ${a} Business in ${country}. Organize your paperwork and download your checklist as a PDF.`,
    ],
    h1: ({ a, country }) => `Documents You Need to Start ${a} Business in ${country}`,
    intro: ({ a, country }) =>
      `The paperwork ${a} business in ${country} needs, in one place. Review each document and add it to your plan.`,
  },

  'branding resources': {
    titles: ({ count, a, country }) => [
      `Marketing ${a} Business in ${country}: ${count} Resources You Must Have`,
      `Marketing ${a} Business in ${country}: ${count} Must-Have Resources`,
      `${count} Marketing Resources for ${a} Business in ${country}`,
    ],
    descriptions: ({ businessName, country }) => [
      `Find branding and marketing resources for your ${businessName} Business in ${country}. Explore signage and branded materials, then download your checklist as a PDF.`,
      `Find branding and marketing resources for your ${businessName} Business in ${country}. Explore signage and branded materials, then get your checklist.`,
    ],
    h1: ({ count, a, country }) =>
      `Marketing ${a} Business in ${country}: ${count} Resources You Must Have`,
    intro: ({ a, country }) =>
      `Signage, branded materials and other marketing resources for ${a} business in ${country}, with available prices.`,
  },

  'operating expenses': {
    titles: ({ businessName, year }) => [
      `${businessName} Business Operating Expenses [Updated ${year} Breakdown]`,
      `${businessName} Business Operating Expenses (${year})`,
      `${businessName} Business Operating Expenses`,
    ],
    descriptions: ({ a, country }) => [
      `Plan for the ongoing costs of running ${a} Business in ${country}. Review recurring expenses and use the breakdown to prepare your operating budget.`,
      `Plan the ongoing costs of running ${a} Business in ${country}. Review recurring expenses and prepare your operating budget.`,
    ],
    h1: ({ businessName, country }) => `${businessName} Business Operating Expenses in ${country}`,
    intro: ({ a, country }) =>
      `The recurring costs of running ${a} business in ${country}. Review each expense to prepare your operating budget.`,
  },

  stock: {
    titles: ({ count, a, country }) => [
      `Stock for ${a} Business in ${country}: ${count} Products to Sell`,
      `${count} Products to Stock in ${a} Business in ${country}`,
      `Products to Stock in ${a} Business`,
    ],
    descriptions: ({ businessName, country }) => [
      `Browse the products a ${businessName} business in ${country} can stock and sell, with demand levels and prices. Add items to your plan and download your checklist as a PDF.`,
      `Browse products a ${businessName} business in ${country} can stock and sell, with demand levels and prices. Add items to your plan.`,
    ],
    h1: ({ count, a, country }) => `${count} Products to Stock in ${a} Business in ${country}`,
    intro: ({ a, country }) =>
      `Products ${a} business in ${country} can stock and sell, shown by demand level. These are inventory ideas, not startup requirements.`,
  },

  uncategorized: {
    titles: ({ a, country }) => [
      `Other Items You Need to Start ${a} Business in ${country}`,
      `Other Items to Start ${a} Business in ${country}`,
    ],
    descriptions: ({ a, country }) => [
      `Explore other items that may help you start ${a} Business in ${country}. Build your requirements list and download your checklist as a PDF on Hustlecare.`,
      `Explore other items that may help you start ${a} Business in ${country}. Build your requirements list and download your checklist as a PDF.`,
    ],
    h1: ({ a, country }) => `Other Items You Need to Start ${a} Business in ${country}`,
    intro: ({ a, country }) =>
      `Other items that may help you start ${a} business in ${country}. Add the ones that apply to your requirements list.`,
  },
};

export function getCategorySeo(ctx: CategorySeoContext) {
  const t = TEMPLATES[ctx.categoryName.trim().toLowerCase()] ?? DEFAULT_TEMPLATE;
  const lic = marketLicenceWord(ctx.market);
  const args: TemplateArgs = {
    ...ctx,
    a: withArticle(ctx.businessName),
    country: marketCountryPhrase(ctx.market),
    lic,
    Lic: lic.charAt(0).toUpperCase() + lic.slice(1),
  };
  return {
    title: pickWithinLimit(t.titles(args), TITLE_MAX),
    description: pickWithinLimit(t.descriptions(args), DESCRIPTION_MAX),
    h1: t.h1(args),
    intro: t.intro(args),
  };
}