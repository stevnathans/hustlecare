/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/questionnaires/business-registration/config.ts
import type { QuestionnaireConfig, PackageTierConfig } from "../types";
import { contactStepSchema, entityStepSchema } from "./schema";

const isPartnershipOrLLC = (answers: Record<string, any>) =>
  ["partnership", "llc"].includes(answers?.entity?.businessType);

// Matches the pricing cards on the Business Registration landing page.
const packageTiers: PackageTierConfig[] = [
  {
    id: "basic",
    name: "Basic Registration",
    tag: "Best for simple businesses",
    priceLabel: "$80",
    includes: ["Registration guidance", "Document preparation support", "Registration checklist"],
  },
  {
    id: "standard",
    name: "Standard Registration",
    tag: "Most popular",
    priceLabel: "$150",
    includes: ["Full registration guidance", "Document preparation", "Submission assistance", "Compliance checklist"],
  },
  {
    id: "complete",
    name: "Complete Startup Registration",
    tag: "Best for new entrepreneurs",
    priceLabel: "$250",
    includes: [
      "Full registration assistance",
      "Document preparation",
      "Submission guidance",
      "Startup compliance overview",
      "Next-step business setup guidance",
    ],
  },
];

export const businessRegistrationConfig: QuestionnaireConfig = {
  serviceSlug: "business-registration",
  serviceName: "Business Registration",
  estimatedMinutes: 10,
  packageTiers,
  reviewSectionLabels: {
    contact: "Contact Information",
    entity: "Business Type",
    owners: "Owners / Shareholders",
    details: "Business Details",
    documents: "Documents",
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
      ],
    },
    {
      id: "entity",
      title: "Business type",
      icon: "⚖️",
      validationSchema: entityStepSchema,
      fields: [
        {
          name: "entity.businessType",
          label: "What type of entity do you want to register?",
          type: "radio-cards",
          required: true,
          options: [
            { value: "sole-proprietor", label: "Sole Proprietor", description: "Simplest, one owner" },
            { value: "partnership", label: "Partnership", description: "Two or more owners" },
            { value: "llc", label: "Limited Company (LLC)", description: "Separate legal entity" },
            { value: "not-sure", label: "Not sure yet", description: "We'll help you decide" },
          ],
        },
        { name: "entity.proposedBusinessName", label: "Proposed business name", type: "text", required: true },
        { name: "entity.alternativeNames", label: "Alternative names (if the first isn't available)", type: "textarea" },
      ],
    },
    {
      id: "owners",
      title: "Owners & shareholders",
      icon: "👥",
      fields: [
        {
          name: "owners.people",
          label: "Owners / Shareholders",
          type: "dynamic-list",
          itemLabel: "Owner",
          minItems: 1,
          itemFields: [
            { name: "fullName", label: "Full name", type: "text", required: true },
            { name: "idNumber", label: "ID / Passport number", type: "text" },
            { name: "kraPin", label: "KRA PIN", type: "text" },
            { name: "sharePercentage", label: "Ownership %", type: "number" },
          ],
        },
      ],
    },
    {
      id: "details",
      title: "Business details",
      icon: "📍",
      fields: [
        { name: "details.businessAddress", label: "Business address", type: "text" },
        { name: "details.businessActivity", label: "Nature of business activity", type: "textarea", required: true, helperText: "What will the business actually do?" },
        {
          name: "details.partnershipAgreementNeeded",
          label: "Do you need a partnership agreement drafted?",
          type: "radio-cards",
          visibleIf: isPartnershipOrLLC,
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ],
        },
      ],
    },
    {
      id: "documents",
      title: "Documents",
      description: "Paste links if you have these ready. No links? Send via WhatsApp or email after submitting.",
      icon: "📁",
      fields: [
        {
          name: "documents.idDocuments",
          label: "ID / Passport copies",
          type: "dynamic-list",
          itemLabel: "Document Link",
          minItems: 0,
          itemFields: [{ name: "url", label: "Link", type: "link" }],
        },
        { name: "documents.passportPhotoUrl", label: "Passport photo", type: "link" },
        { name: "documents.otherNotes", label: "Other documents — describe what you'll send", type: "textarea" },
      ],
    },
  ],
};