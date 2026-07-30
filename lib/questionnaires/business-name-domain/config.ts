// lib/questionnaires/business-name-domain/config.ts
import type { QuestionnaireConfig, PackageTierConfig } from "../types";
import { contactStepSchema } from "./schema";

// Matches the pricing cards on the Business Name + Domain landing page.
const packageTiers: PackageTierConfig[] = [
  {
    id: "quick",
    name: "Quick Names",
    tag: "Best for quick decisions",
    priceLabel: "$40",
    includes: ["10 name ideas", "Domain availability check", "1 round of refinement"],
  },
  {
    id: "complete",
    name: "Complete Naming",
    tag: "Most popular",
    priceLabel: "$80",
    includes: ["20 name ideas", "Domain + social handle check", "Trademark quick-check", "2 rounds of refinement"],
  },
  {
    id: "brand-ready",
    name: "Brand Ready",
    tag: "Best for serious brands",
    priceLabel: "$130",
    includes: ["30 name ideas", "Full domain, social & trademark check", "Naming rationale document", "Unlimited refinement rounds"],
  },
];

export const businessNameDomainConfig: QuestionnaireConfig = {
  serviceSlug: "business-name-domain",
  serviceName: "Business Name + Domain",
  estimatedMinutes: 5,
  packageTiers,
  reviewSectionLabels: {
    contact: "Contact Information",
    description: "Business Description",
    preferences: "Style & Keywords",
    avoid: "Names to Avoid",
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
      id: "description",
      title: "About the business",
      icon: "🏢",
      fields: [
        { name: "description.whatItDoes", label: "What does the business do?", type: "textarea", required: true },
        { name: "description.industry", label: "Industry", type: "text" },
        { name: "description.targetAudience", label: "Who is it for?", type: "textarea" },
      ],
    },
    {
      id: "preferences",
      title: "Style & keywords",
      icon: "✨",
      fields: [
        { name: "preferences.keywords", label: "Words or themes you'd like included", type: "text", placeholder: "e.g. fresh, swift, hustle" },
        {
          name: "preferences.namingStyle",
          label: "Naming style",
          type: "radio-cards",
          options: [
            { value: "descriptive", label: "Descriptive", description: "Clearly says what you do" },
            { value: "invented", label: "Invented / Made-up", description: "Unique, brandable word" },
            { value: "short-punchy", label: "Short & Punchy", description: "One or two syllables" },
            { value: "no-preference", label: "No preference" },
          ],
        },
        { name: "preferences.preferredExtensions", label: "Preferred domain extension(s)", type: "text", placeholder: "e.g. .com, .co.ke" },
      ],
    },
    {
      id: "avoid",
      title: "Names to avoid",
      icon: "🚫",
      fields: [
        { name: "avoid.namesToAvoid", label: "Any names or words to avoid?", type: "textarea" },
        { name: "avoid.competitorNames", label: "Competitor names (so we don't clash)", type: "textarea" },
      ],
    },
  ],
};