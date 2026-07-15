/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/questionnaires/financial-projections/config.ts
import type { QuestionnaireConfig } from "../types";
import { contactStepSchema, businessBasicsStepSchema } from "./schema";

const needsFunding = (answers: Record<string, any>) => answers?.funding?.needsFunding === "yes";
const isProductOrBoth = (answers: Record<string, any>) =>
  ["product", "both"].includes(answers?.businessBasics?.offeringType);

export const financialProjectionsConfig: QuestionnaireConfig = {
  serviceSlug: "financial-projections",
  serviceName: "Financial Projections",
  estimatedMinutes: 12,
  reviewSectionLabels: {
    contact: "Contact Information",
    "business-basics": "Business Basics",
    "products-pricing": "Products & Pricing",
    "startup-costs": "Startup Costs",
    expenses: "Monthly Expenses",
    revenue: "Revenue Assumptions",
    funding: "Funding",
  },
  steps: [
    {
      id: "contact",
      title: "Let's start with your details",
      icon: "👋",
      validationSchema: contactStepSchema,
      fields: [
        { name: "contact.fullName", label: "Full name", type: "text", required: true },
        { name: "contact.email", label: "Email", type: "email", required: true },
        { name: "contact.phone", label: "Phone number", type: "tel", required: true },
        { name: "contact.businessName", label: "Business name", type: "text", required: true },
      ],
    },
    {
      id: "business-basics",
      title: "About the business",
      icon: "🏢",
      validationSchema: businessBasicsStepSchema,
      fields: [
        {
          name: "businessBasics.offeringType",
          label: "Products, services, or both?",
          type: "radio-cards",
          required: true,
          options: [
            { value: "product", label: "Products" },
            { value: "service", label: "Services" },
            { value: "both", label: "Both" },
          ],
        },
        { name: "businessBasics.description", label: "Brief description", type: "textarea", required: true },
      ],
    },
    {
      id: "products-pricing",
      title: "Products & pricing",
      icon: "📦",
      fields: [
        {
          name: "productsPricing.items",
          label: "Products & Services",
          type: "dynamic-list",
          itemLabel: "Product/Service",
          minItems: 0,
          itemFields: [
            { name: "name", label: "Name", type: "text", required: true },
            { name: "sellingPrice", label: "Selling price", type: "currency" },
            { name: "cost", label: "Cost", type: "currency" },
            { name: "expectedMonthlySales", label: "Expected monthly sales (units)", type: "number" },
          ],
        },
      ],
    },
    {
      id: "startup-costs",
      title: "Startup costs",
      icon: "🧮",
      fields: [
        {
          name: "startupCosts.items",
          label: "Startup cost items",
          type: "dynamic-list",
          itemLabel: "Cost Item",
          minItems: 0,
          itemFields: [
            { name: "item", label: "Item", type: "text", required: true },
            { name: "quantity", label: "Quantity", type: "number" },
            { name: "cost", label: "Cost", type: "currency" },
          ],
        },
      ],
    },
    {
      id: "expenses",
      title: "Monthly expenses",
      icon: "💸",
      fields: [
        { name: "expenses.rent", label: "Rent", type: "currency" },
        { name: "expenses.utilities", label: "Utilities", type: "currency" },
        { name: "expenses.payroll", label: "Payroll", type: "currency" },
        { name: "expenses.marketing", label: "Marketing", type: "currency" },
        { name: "expenses.transport", label: "Transport", type: "currency" },
        { name: "expenses.inventory", label: "Inventory", type: "currency", visibleIf: isProductOrBoth },
        { name: "expenses.loanRepayments", label: "Loan repayments", type: "currency" },
      ],
    },
    {
      id: "revenue",
      title: "Revenue assumptions",
      icon: "📈",
      fields: [
        { name: "revenue.expectedMonthlySales", label: "Expected monthly revenue", type: "currency" },
        { name: "revenue.growthAssumptions", label: "Growth assumptions", type: "textarea", helperText: "How do you expect revenue to change month to month?" },
        { name: "revenue.seasonality", label: "Seasonality", type: "textarea" },
      ],
    },
    {
      id: "funding",
      title: "Funding",
      icon: "💰",
      fields: [
        {
          name: "funding.needsFunding",
          label: "Do you need funding?",
          type: "radio-cards",
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ],
        },
        { name: "funding.amount", label: "Funding amount needed", type: "currency", visibleIf: needsFunding },
        { name: "funding.repaymentAssumptions", label: "Repayment assumptions", type: "textarea", visibleIf: needsFunding },
      ],
    },
  ],
};