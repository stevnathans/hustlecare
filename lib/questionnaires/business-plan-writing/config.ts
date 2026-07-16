/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/questionnaires/business-plan-writing/config.ts
import type { QuestionnaireConfig, PackageTierConfig } from "../types";
import {
  step1ContactSchema,
  step2BusinessOverviewSchema,
  step9LegalSchema,
  step12FundingSchema,
} from "./schema";

// ── Package tiers ─────────────────────────────────────────────────────────────

const packageTiers: PackageTierConfig[] = [
  {
    id: "starter",
    name: "Starter",
    tag: "Best for early ideas",
    priceLabel: "KSh 5,999",
    includes: [
      "Executive Summary",
      "Business Description",
      "Products & Services",
      "Basic Market Overview",
      "Basic Customer Analysis",
      "Basic Competitor Analysis",
      "SWOT Analysis",
      "Marketing Plan",
      "Operations Plan",
      "Startup Cost Estimate",
      "Basic Financial Forecast (12 months)",
      "Implementation Timeline",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    tag: "Most Popular",
    priceLabel: "KSh 12,999",
    includes: [
      "Everything in Starter, plus:",
      "Detailed Market Analysis",
      "Industry Analysis",
      "Customer Analysis",
      "Competitor Analysis",
      "Pricing Strategy",
      "Sales Strategy",
      "Staffing Plan",
      "Organization Structure",
      "Risk Management",
      "Funding Requirements",
      "Break-even Analysis",
      "3-Year Financial Projections",
    ],
  },
  {
    id: "investor",
    name: "Investor",
    tag: "Best for Fundraising",
    priceLabel: "KSh 24,999",
    includes: [
      "Everything in Professional, plus:",
      "Comprehensive Industry Research",
      "Customer Personas",
      "Porter's Five Forces",
      "PESTLE Analysis",
      "Sales Funnel & Growth Strategy",
      "Funding Strategy & Investment Ask",
      "Equity Structure",
      "Ratio & Scenario Analysis",
      "5-Year Financial Projections",
      "Investment Readiness Review",
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const isTier = (tier: string) => (answers: Record<string, any>) => answers.packageTier === tier;
const isNotTier = (tier: string) => (answers: Record<string, any>) => answers.packageTier !== tier;
const isOperatingOrGrowing = (answers: Record<string, any>) =>
  ["operating", "growing"].includes(answers?.businessOverview?.businessStage);
const isProductOrBoth = (answers: Record<string, any>) =>
  ["product", "both"].includes(answers?.businessOverview?.offeringType);
const needsFunding = (answers: Record<string, any>) => answers?.funding?.needsFunding === "yes";

// ── Config ───────────────────────────────────────────────────────────────────

export const businessPlanWritingConfig: QuestionnaireConfig = {
  serviceSlug: "business-plan-writing",
  serviceName: "Business Plan Writing",
  estimatedMinutes: 20,
  packageTiers,
  reviewSectionLabels: {
    contact: "Contact Information",
    "business-overview": "Business Overview",
    "products-services": "Products & Services",
    "target-market": "Target Market",
    "market-analysis": "Market Analysis",
    marketing: "Marketing Strategy",
    operations: "Operations",
    management: "Management",
    legal: "Legal",
    swot: "SWOT Analysis",
    "startup-costs": "Startup Costs",
    funding: "Funding",
    financials: "Financial Information",
    uploads: "Uploads",
    "final-notes": "Final Notes",
  },
  steps: [
    // Step 1 — Contact Information
    {
      id: "contact",
      title: "Let's start with your details",
      description: "So we know who we're building this business plan for.",
      icon: "👋",
      validationSchema: step1ContactSchema,
      fields: [
        { name: "contact.fullName", label: "Full name", type: "text", required: true, placeholder: "Jane Wanjiru" },
        { name: "contact.email", label: "Email", type: "email", required: true, placeholder: "you@email.com" },
        { name: "contact.phone", label: "Phone number", type: "tel", required: true, placeholder: "+254 7xx xxx xxx" },
        {
          name: "contact.preferredCommunication",
          label: "Preferred communication",
          type: "select",
          options: [
            { value: "email", label: "Email" },
            { value: "phone", label: "Phone Call" },
            { value: "whatsapp", label: "WhatsApp" },
          ],
        },
        { name: "contact.country", label: "Country", type: "text", required: true, placeholder: "Kenya" },
        { name: "contact.businessName", label: "Business name", type: "text", required: true, placeholder: "e.g. Wanjiru Fresh Foods" },
        { name: "contact.businessLocation", label: "Business location", type: "text", required: true, placeholder: "e.g. Nairobi, Kenya" },
      ],
    },

    // Step 2 — Business Overview
    {
      id: "business-overview",
      title: "Tell us about your business",
      description: "The basics — where you're at, and what you're building.",
      icon: "🏢",
      validationSchema: step2BusinessOverviewSchema,
      fields: [
        {
          name: "businessOverview.businessStage",
          label: "Business stage",
          type: "radio-cards",
          required: true,
          options: [
            { value: "idea", label: "Idea", description: "Not yet started" },
            { value: "startup", label: "Startup", description: "Just launched" },
            { value: "operating", label: "Operating", description: "Running for a while" },
            { value: "growing", label: "Growing", description: "Scaling up" },
          ],
        },
        {
          name: "businessOverview.offeringType",
          label: "Does your business offer products, services, or both?",
          type: "radio-cards",
          required: true,
          options: [
            { value: "product", label: "Products", emoji: "📦" },
            { value: "service", label: "Services", emoji: "🛠️" },
            { value: "both", label: "Both", emoji: "🔀" },
          ],
        },
        { name: "businessOverview.description", label: "Describe your business", type: "textarea", required: true, helperText: "A couple of sentences is fine — what do you do and for whom?" },
        { name: "businessOverview.mission", label: "Mission", type: "textarea", helperText: "Optional — why does this business exist?" },
        { name: "businessOverview.vision", label: "Vision", type: "textarea", helperText: "Optional — where do you see it in a few years?" },
        { name: "businessOverview.goals", label: "Goals", type: "textarea" },
        { name: "businessOverview.businessModel", label: "Business model", type: "textarea", helperText: "How will the business make money?" },
        { name: "businessOverview.problemSolved", label: "What problem does this solve?", type: "textarea" },
        { name: "businessOverview.usp", label: "What makes you different?", type: "textarea", helperText: "Your unique selling proposition" },
      ],
    },

    // Step 3 — Products & Services
    {
      id: "products-services",
      title: "Products & services",
      description: "Add each product or service you offer, or plan to offer.",
      icon: "📦",
      fields: [
        {
          name: "productsServices.items",
          label: "Products & Services",
          type: "dynamic-list",
          itemLabel: "Product/Service",
          minItems: 0,
          itemFields: [
            { name: "name", label: "Name", type: "text", required: true, placeholder: "e.g. Weekly vegetable box" },
            { name: "description", label: "Description", type: "textarea" },
            { name: "sellingPrice", label: "Selling price", type: "currency" },
            { name: "cost", label: "Cost to produce/deliver", type: "currency" },
            { name: "expectedMonthlySales", label: "Expected monthly sales (units)", type: "number" },
            {
              name: "status",
              label: "Status",
              type: "select",
              options: [
                { value: "existing", label: "Existing" },
                { value: "planned", label: "Planned" },
              ],
            },
          ],
        },
      ],
    },

    // Step 4 — Target Market
    {
      id: "target-market",
      title: "Who are your customers?",
      icon: "🎯",
      fields: [
        { name: "targetMarket.demographics", label: "Customer demographics", type: "textarea", helperText: "Age, income level, lifestyle, etc." },
        { name: "targetMarket.needs", label: "Customer needs", type: "textarea" },
        { name: "targetMarket.problems", label: "Customer problems", type: "textarea" },
        { name: "targetMarket.buyingBehaviour", label: "Buying behaviour", type: "textarea", helperText: "How and where do they usually buy?" },
        { name: "targetMarket.averageSpending", label: "Average spending per customer", type: "currency" },
        { name: "targetMarket.location", label: "Customer location", type: "text" },
        {
          name: "targetMarket.customerType",
          label: "Customer type",
          type: "radio-cards",
          options: [
            { value: "b2b", label: "B2B", description: "You sell to other businesses" },
            { value: "b2c", label: "B2C", description: "You sell to individual customers" },
            { value: "both", label: "Both" },
          ],
        },
      ],
    },

    // Step 5 — Market Analysis
    {
      id: "market-analysis",
      title: "Market analysis",
      icon: "🔍",
      fields: [
        {
          name: "marketAnalysis.competitors",
          label: "Competitors",
          type: "dynamic-list",
          itemLabel: "Competitor",
          minItems: 0,
          itemFields: [
            { name: "name", label: "Competitor name", type: "text", required: true },
            { name: "strengths", label: "Strengths", type: "textarea" },
            { name: "weaknesses", label: "Weaknesses", type: "textarea" },
          ],
        },
        { name: "marketAnalysis.industryTrends", label: "Industry trends", type: "textarea" },
        { name: "marketAnalysis.seasonality", label: "Seasonality", type: "textarea", helperText: "Does demand change through the year?" },
        { name: "marketAnalysis.opportunities", label: "Opportunities", type: "textarea" },
        { name: "marketAnalysis.threats", label: "Threats", type: "textarea" },
        {
          name: "marketAnalysis.industryAnalysis",
          label: "Industry analysis",
          type: "textarea",
          helperText: "Included in Professional and Investor plans",
          visibleIf: isNotTier("starter"),
        },
        {
          name: "marketAnalysis.customerPersonas",
          label: "Customer personas",
          type: "textarea",
          helperText: "Describe 2–3 typical customer profiles",
          visibleIf: isTier("investor"),
        },
        {
          name: "marketAnalysis.portersFiveForces",
          label: "Porter's Five Forces notes",
          type: "textarea",
          helperText: "Any notes on competitive rivalry, supplier/buyer power, threat of new entrants or substitutes",
          visibleIf: isTier("investor"),
        },
        {
          name: "marketAnalysis.pestle",
          label: "PESTLE notes",
          type: "textarea",
          helperText: "Political, Economic, Social, Technological, Legal, Environmental factors affecting your business",
          visibleIf: isTier("investor"),
        },
      ],
    },

    // Step 6 — Marketing Strategy
    {
      id: "marketing",
      title: "Marketing strategy",
      icon: "📣",
      fields: [
        { name: "marketing.brandPositioning", label: "Brand positioning", type: "textarea" },
        {
          name: "marketing.channels",
          label: "Marketing channels",
          type: "checkbox-group",
          options: [
            { value: "social-media", label: "Social Media" },
            { value: "seo", label: "SEO / Search" },
            { value: "referrals", label: "Referrals" },
            { value: "email", label: "Email" },
            { value: "print", label: "Print / Flyers" },
            { value: "paid-ads", label: "Paid Ads" },
          ],
        },
        { name: "marketing.pricingStrategy", label: "Pricing strategy", type: "textarea" },
        { name: "marketing.promotionStrategy", label: "Promotion strategy", type: "textarea" },
        { name: "marketing.salesStrategy", label: "Sales strategy", type: "textarea" },
        { name: "marketing.customerRetention", label: "Customer retention", type: "textarea" },
        {
          name: "marketing.marketingBudget",
          label: "Marketing budget",
          type: "currency",
          helperText: "Included in the Investor plan",
          visibleIf: isTier("investor"),
        },
        { name: "marketing.salesFunnel", label: "Sales funnel", type: "textarea", visibleIf: isTier("investor") },
        { name: "marketing.growthStrategy", label: "Growth strategy", type: "textarea", visibleIf: isTier("investor") },
        { name: "marketing.expansionPlan", label: "Expansion plan", type: "textarea", visibleIf: isTier("investor") },
      ],
    },

    // Step 7 — Operations
    {
      id: "operations",
      title: "Operations",
      icon: "⚙️",
      fields: [
        { name: "operations.location", label: "Business location", type: "text" },
        { name: "operations.openingHours", label: "Opening hours", type: "text" },
        { name: "operations.equipment", label: "Equipment needed", type: "textarea" },
        { name: "operations.suppliers", label: "Suppliers", type: "textarea" },
        { name: "operations.production", label: "Production process", type: "textarea" },
        {
          name: "operations.inventory",
          label: "Inventory management",
          type: "textarea",
          visibleIf: isProductOrBoth,
        },
        { name: "operations.technology", label: "Technology used", type: "textarea" },
        { name: "operations.dailyWorkflow", label: "Daily workflow", type: "textarea" },
        { name: "operations.qualityControl", label: "Quality control", type: "textarea" },
        {
          name: "operations.staffingPlan",
          label: "Staffing plan",
          type: "textarea",
          helperText: "Included in Professional and Investor plans",
          visibleIf: isNotTier("starter"),
        },
      ],
    },

    // Step 8 — Management
    {
      id: "management",
      title: "Management & team",
      icon: "👥",
      fields: [
        { name: "management.ownerExperience", label: "Owner's experience", type: "textarea" },
        { name: "management.ownerEducation", label: "Owner's education", type: "textarea" },
        {
          name: "management.team",
          label: "Team members",
          type: "dynamic-list",
          itemLabel: "Team Member",
          minItems: 0,
          itemFields: [
            { name: "name", label: "Name", type: "text" },
            { name: "role", label: "Role", type: "text" },
          ],
        },
        {
          name: "management.existingEmployeesNote",
          label: "Current employees",
          type: "textarea",
          helperText: "Roles and headcount today",
          visibleIf: isOperatingOrGrowing,
        },
        { name: "management.futureHiring", label: "Future hiring plans", type: "textarea" },
        {
          name: "management.orgStructure",
          label: "Organization structure",
          type: "textarea",
          helperText: "Included in Professional and Investor plans",
          visibleIf: isNotTier("starter"),
        },
      ],
    },

    // Step 9 — Legal
    {
      id: "legal",
      title: "Legal & compliance",
      icon: "⚖️",
      validationSchema: step9LegalSchema,
      fields: [
        {
          name: "legal.registrationStatus",
          label: "Registration status",
          type: "select",
          required: true,
          options: [
            { value: "not-registered", label: "Not registered yet" },
            { value: "in-progress", label: "In progress" },
            { value: "registered", label: "Registered" },
          ],
        },
        { name: "legal.licenses", label: "Licenses required or held", type: "textarea" },
        { name: "legal.insurance", label: "Insurance", type: "textarea" },
        { name: "legal.tax", label: "Tax considerations", type: "textarea" },
        { name: "legal.compliance", label: "Other compliance requirements", type: "textarea" },
      ],
    },

    // Step 10 — SWOT
    {
      id: "swot",
      title: "SWOT analysis",
      description: "Your own perspective — we'll refine this in the final plan.",
      icon: "🧭",
      fields: [
        { name: "swot.strengths", label: "Strengths", type: "textarea" },
        { name: "swot.weaknesses", label: "Weaknesses", type: "textarea" },
        { name: "swot.opportunities", label: "Opportunities", type: "textarea" },
        { name: "swot.threats", label: "Threats", type: "textarea" },
      ],
    },

    // Step 11 — Startup Costs
    {
      id: "startup-costs",
      title: "Startup costs",
      description: "List everything you'll need to spend on to get started.",
      icon: "🧮",
      fields: [
        {
          name: "startupCosts.items",
          label: "Startup cost items",
          type: "dynamic-list",
          itemLabel: "Cost Item",
          minItems: 0,
          itemFields: [
            { name: "item", label: "Item", type: "text", required: true, placeholder: "e.g. Refrigerator" },
            { name: "quantity", label: "Quantity", type: "number" },
            { name: "cost", label: "Cost", type: "currency" },
          ],
        },
        {
          name: "financials.existingAssetsNote",
          label: "Existing assets",
          type: "textarea",
          helperText: "Equipment, stock, or assets you already own",
          visibleIf: isOperatingOrGrowing,
        },
      ],
    },

    // Step 12 — Funding (hidden entirely for Starter tier)
    {
      id: "funding",
      title: "Funding",
      icon: "💰",
      visibleIf: isNotTier("starter"),
      validationSchema: step12FundingSchema,
      fields: [
        {
          name: "funding.needsFunding",
          label: "Do you need funding?",
          type: "radio-cards",
          required: true,
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ],
        },
        { name: "funding.amount", label: "Funding amount needed", type: "currency", visibleIf: needsFunding },
        { name: "funding.purpose", label: "Purpose of funding", type: "textarea", visibleIf: needsFunding },
        { name: "funding.source", label: "Preferred funding source", type: "text", helperText: "e.g. bank loan, SACCO, investor, grant", visibleIf: needsFunding },
        { name: "funding.repaymentAssumptions", label: "Repayment assumptions", type: "textarea", visibleIf: needsFunding },
        {
          name: "funding.investmentAsk",
          label: "Investment ask",
          type: "currency",
          helperText: "Included in the Investor plan",
          visibleIf: isTier("investor"),
        },
        { name: "funding.equityStructure", label: "Equity structure", type: "textarea", visibleIf: isTier("investor") },
        { name: "funding.fundingStrategy", label: "Funding strategy", type: "textarea", visibleIf: isTier("investor") },
      ],
    },

    // Step 13 — Financial Information
    {
      id: "financials",
      title: "Financial information",
      icon: "📊",
      fields: [
        { name: "financials.expectedSales", label: "Expected monthly sales revenue", type: "currency" },
        { name: "financials.rent", label: "Rent", type: "currency" },
        { name: "financials.utilities", label: "Utilities", type: "currency" },
        { name: "financials.payroll", label: "Payroll", type: "currency" },
        { name: "financials.marketingExpense", label: "Marketing", type: "currency" },
        { name: "financials.transport", label: "Transport", type: "currency" },
        { name: "financials.inventoryExpense", label: "Inventory", type: "currency", visibleIf: isProductOrBoth },
        { name: "financials.loanRepayments", label: "Loan repayments", type: "currency" },
        { name: "financials.growthAssumptions", label: "Growth assumptions", type: "textarea", helperText: "How do you expect sales to grow over time?" },
        {
          name: "financials.historicalRevenue",
          label: "Historical revenue",
          type: "textarea",
          helperText: "Roughly, what has revenue looked like so far?",
          visibleIf: isOperatingOrGrowing,
        },
        {
          name: "financials.breakEvenAnalysis",
          label: "Break-even notes",
          type: "textarea",
          helperText: "Included in Professional and Investor plans",
          visibleIf: isNotTier("starter"),
        },
        {
          name: "financials.financialAssumptions",
          label: "Key financial assumptions",
          type: "textarea",
          visibleIf: isTier("investor"),
        },
        {
          name: "financials.ratioAnalysisNotes",
          label: "Ratio analysis notes",
          type: "textarea",
          visibleIf: isTier("investor"),
        },
        {
          name: "financials.scenarioAnalysisNotes",
          label: "Scenario analysis notes",
          type: "textarea",
          helperText: "Best case / worst case thinking, if you have any",
          visibleIf: isTier("investor"),
        },
      ],
    },

    // Step 14 — Uploads
    {
      id: "uploads",
      title: "Files & documents",
      description: "Paste links if you already have these hosted (Google Drive, Dropbox, etc). Don't have links? You can send files via WhatsApp or email after submitting — we'll show you how.",
      icon: "📁",
      fields: [
        { name: "uploads.logoUrl", label: "Logo", type: "link" },
        { name: "uploads.registrationDocUrl", label: "Business registration document", type: "link" },
        {
          name: "uploads.photos",
          label: "Photos",
          type: "dynamic-list",
          itemLabel: "Photo Link",
          minItems: 0,
          itemFields: [{ name: "url", label: "Link", type: "link" }],
        },
        {
          name: "uploads.financialStatementUrl",
          label: "Existing financial statements",
          type: "link",
          visibleIf: isOperatingOrGrowing,
        },
        { name: "uploads.proposalUrl", label: "Existing business proposal (if any)", type: "link" },
        { name: "uploads.otherNotes", label: "Other files — describe what you'll send", type: "textarea" },
      ],
    },

    // Step 15 — Final Notes
    {
      id: "final-notes",
      title: "Anything else?",
      icon: "📝",
      fields: [
        { name: "finalNotes.additionalInfo", label: "Anything else we should know?", type: "textarea" },
        { name: "finalNotes.specialRequests", label: "Special requests", type: "textarea" },
        { name: "finalNotes.deadline", label: "Do you have a deadline?", type: "date" },
      ],
    },
  ],
};