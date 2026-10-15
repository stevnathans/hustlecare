// lib/services/seed-data.ts
//
// What the catalog starts with: today's services and prices, copied from the
// landing pages. Used ONLY by the admin "Import current services" button,
// which never overwrites anything you have already edited.
//
// Notes on values that were not on the pages and were filled in with a
// sensible default — please check them in admin after importing:
//   - Business plan turnaround: 7–10 days (from the FAQ) for every tier
//   - Revision rounds: 2 for every package
//   - Deposit: 50% for every package
// Website prices use the landing page (KSh 25,000 / 45,000 / 85,000); the
// questionnaire config had USD prices and a "business" tier, which the
// patch script corrects to "professional".

export interface SeedPackage {
  key: string;
  name: string;
  tag: string;
  price: number;
  depositPercent: number;
  turnaroundMinDays: number | null;
  turnaroundMaxDays: number | null;
  revisionRounds: number;
  features: string[];
  isPopular: boolean;
}

export interface SeedService {
  slug: string;
  name: string;
  shortDescription: string;
  emoji: string;
  category: 'PLANNING' | 'LEGAL' | 'BRANDING' | 'DIGITAL';
  ctaLabel: string;
  displayOrder: number;
  packages: SeedPackage[];
  documents: { label: string; description: string | null; isRequired: boolean }[];
}

export const SEED_SERVICES: SeedService[] = [
  {
    slug: 'business-plan-writing',
    name: 'Business Plan Writing',
    shortDescription: 'Create a professional business plan with market research and financial projections.',
    emoji: '📋',
    category: 'PLANNING',
    ctaLabel: 'Create Business Plan',
    displayOrder: 10,
    packages: [
      {
        key: 'starter',
        name: 'Starter',
        tag: 'Best for early ideas',
        price: 5999,
        depositPercent: 50,
        turnaroundMinDays: 7,
        turnaroundMaxDays: 10,
        revisionRounds: 2,
        isPopular: false,
        features: [
          'Executive Summary',
          'Business Description',
          'Products & Services',
          'Basic Market Overview',
          'Basic Customer Analysis',
          'Basic Competitor Analysis',
          'SWOT Analysis',
          'Marketing Plan',
          'Operations Plan',
          'Startup Cost Estimate',
          'Basic Financial Forecast (12 months)',
          'Implementation Timeline',
        ],
      },
      {
        key: 'professional',
        name: 'Professional',
        tag: 'Most Popular',
        price: 12999,
        depositPercent: 50,
        turnaroundMinDays: 7,
        turnaroundMaxDays: 10,
        revisionRounds: 2,
        isPopular: true,
        features: [
          'Everything in Starter, plus:',
          'Detailed Market & Industry Analysis',
          'Customer & Competitor Analysis',
          'Pricing & Sales Strategy',
          'Staffing Plan & Org Structure',
          'Risk Management',
          'Funding Requirements & Use of Funds',
          'Break-even Analysis',
          '3-Year Financial Projections',
          'P&L, Cash Flow, Balance Sheet',
        ],
      },
      {
        key: 'investor',
        name: 'Investor',
        tag: 'Best for Fundraising',
        price: 24999,
        depositPercent: 50,
        turnaroundMinDays: 7,
        turnaroundMaxDays: 10,
        revisionRounds: 2,
        isPopular: false,
        features: [
          'Everything in Professional, plus:',
          'Comprehensive Industry Research',
          'Customer Personas',
          "Porter's Five Forces & PESTLE",
          'Marketing Budget & Sales Funnel',
          'Growth & Expansion Plan',
          'Funding Strategy & Investment Ask',
          'Equity Structure',
          'Ratio & Scenario Analysis',
          '5-Year Financial Projections',
          'Investment Readiness Review',
        ],
      },
    ],
    documents: [
      { label: 'Business logo', description: null, isRequired: false },
      { label: 'Business registration certificate', description: null, isRequired: false },
      { label: 'Existing financial statements', description: 'If the business is already operating', isRequired: false },
      { label: 'Existing business proposal', description: null, isRequired: false },
    ],
  },
  {
    slug: 'logo-design',
    name: 'Logo Design',
    shortDescription: 'Get a professional logo and brand identity for your business.',
    emoji: '🎨',
    category: 'BRANDING',
    ctaLabel: 'Design My Logo',
    displayOrder: 20,
    packages: [],
    documents: [],
  },
  {
    slug: 'website-creation',
    name: 'Website Creation',
    shortDescription: 'Launch a professional website for your business.',
    emoji: '🌐',
    category: 'DIGITAL',
    ctaLabel: 'Build My Website',
    displayOrder: 30,
    packages: [
      {
        key: 'starter',
        name: 'Starter',
        tag: 'Ideal for new businesses',
        price: 25000,
        depositPercent: 50,
        turnaroundMinDays: 5,
        turnaroundMaxDays: 7,
        revisionRounds: 2,
        isPopular: false,
        features: [
          'Up to 5 pages',
          'Mobile responsive design',
          'Contact form & WhatsApp integration',
          'Basic SEO, Google Maps & SSL setup',
          'Training + 14 days support',
        ],
      },
      {
        key: 'professional',
        name: 'Professional',
        tag: 'Recommended',
        price: 45000,
        depositPercent: 50,
        turnaroundMinDays: 7,
        turnaroundMaxDays: 14,
        revisionRounds: 2,
        isPopular: true,
        features: [
          'Everything in Starter',
          'Up to 10 pages, Blog & Gallery',
          'Google Analytics & Search Console setup',
          'Speed optimization & On-page SEO',
          'Multiple contact forms & Social integration',
          '30 days support',
        ],
      },
      {
        key: 'premium',
        name: 'Premium',
        tag: 'Complete digital solution',
        price: 85000,
        depositPercent: 50,
        turnaroundMinDays: 14,
        turnaroundMaxDays: 21,
        revisionRounds: 2,
        isPopular: false,
        features: [
          'Everything in Professional',
          'Custom design & Premium animations',
          'Booking or Quotation system',
          'M-Pesa payment integration',
          'Member login & Basic CRM',
          'Advanced SEO, 90 days support & 2 hrs staff training',
        ],
      },
    ],
    documents: [
      { label: 'Business logo', description: null, isRequired: false },
      { label: 'Photos for the website', description: 'Products, premises, team', isRequired: false },
      { label: 'Product catalogue or price list', description: null, isRequired: false },
      { label: 'Written content for your pages', description: 'If you already have it', isRequired: false },
    ],
  },
  {
    slug: 'business-registration',
    name: 'Business Registration',
    shortDescription: 'Register your business and make it legally operational.',
    emoji: '⚖️',
    category: 'LEGAL',
    ctaLabel: 'Register My Business',
    displayOrder: 40,
    packages: [],
    documents: [],
  },
  {
    slug: 'financial-projections',
    name: 'Financial Projections',
    shortDescription: 'Understand your startup costs and revenue expectations.',
    emoji: '📊',
    category: 'PLANNING',
    ctaLabel: 'Create Financial Plan',
    displayOrder: 50,
    packages: [],
    documents: [],
  },
  {
    slug: 'pitch-deck',
    name: 'Pitch Deck Creation',
    shortDescription: 'Prepare a professional pitch deck for investors or lenders.',
    emoji: '🚀',
    category: 'PLANNING',
    ctaLabel: 'Create Pitch Deck',
    displayOrder: 60,
    packages: [],
    documents: [],
  },
  {
    slug: 'business-name-domain',
    name: 'Business Name + Domain',
    shortDescription: 'Find the perfect business name and domain for your brand.',
    emoji: '💡',
    category: 'BRANDING',
    ctaLabel: 'Find My Business Name',
    displayOrder: 70,
    packages: [],
    documents: [],
  },
  {
    slug: 'google-business-profile',
    name: 'Google Business Profile Setup',
    shortDescription: 'Get your business listed on Google to attract local customers.',
    emoji: '📍',
    category: 'DIGITAL',
    ctaLabel: 'Set Up Google Listing',
    displayOrder: 80,
    packages: [],
    documents: [],
  },
  {
    slug: 'social-media-setup',
    name: 'Social Media Setup',
    shortDescription: 'Launch your business on key social platforms.',
    emoji: '📣',
    category: 'DIGITAL',
    ctaLabel: 'Start Social Media',
    displayOrder: 90,
    packages: [],
    documents: [],
  },
];