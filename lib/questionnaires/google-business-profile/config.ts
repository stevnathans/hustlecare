/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/questionnaires/google-business-profile/config.ts
import type { QuestionnaireConfig, PackageTierConfig } from "../types";
import { contactStepSchema } from "./schema";

const hasExistingProfile = (answers: Record<string, any>) => answers?.existingProfile?.hasProfile === "yes";

// Matches the pricing cards on the Google Business Profile landing page.
const packageTiers: PackageTierConfig[] = [
  {
    id: "basic",
    name: "Basic Listing",
    tag: "Best for simple setup",
    priceLabel: "$50",
    includes: ["Profile creation", "Category & hours setup", "Business description"],
  },
  {
    id: "optimized",
    name: "Optimized Listing",
    tag: "Most popular",
    priceLabel: "$90",
    includes: ["Everything in Basic", "Photos uploaded", "Product/service listings", "Q&A seeding", "Review response templates"],
  },
  {
    id: "local-seo",
    name: "Local SEO Boost",
    tag: "Best for local visibility",
    priceLabel: "$150",
    includes: ["Everything in Optimized", "Keyword-optimised description", "3 starter Google Posts", "Citation consistency check", "Competitor comparison summary"],
  },
];

export const googleBusinessProfileConfig: QuestionnaireConfig = {
  serviceSlug: "google-business-profile",
  serviceName: "Google Business Profile Setup",
  estimatedMinutes: 8,
  packageTiers,
  reviewSectionLabels: {
    contact: "Contact Information",
    details: "Business Details",
    existingProfile: "Existing Profile",
    photos: "Photos",
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
      id: "details",
      title: "Business details",
      icon: "📍",
      fields: [
        { name: "details.address", label: "Business address", type: "text", required: true },
        { name: "details.category", label: "Business category", type: "text", required: true, placeholder: "e.g. Restaurant, Salon, Retail Store" },
        { name: "details.openingHours", label: "Opening hours", type: "textarea", helperText: "e.g. Mon–Fri 8am–6pm, Sat 9am–2pm" },
        { name: "details.website", label: "Website (if any)", type: "link" },
        { name: "details.description", label: "Business description", type: "textarea" },
        {
          name: "details.servesRemotely",
          label: "Do you serve customers at your location, or travel to them?",
          type: "radio-cards",
          options: [
            { value: "location", label: "Customers come to me" },
            { value: "travel", label: "I travel to customers" },
            { value: "both", label: "Both" },
          ],
        },
      ],
    },
    {
      id: "existingProfile",
      title: "Existing profile",
      icon: "🔍",
      fields: [
        {
          name: "existingProfile.hasProfile",
          label: "Do you already have a Google Business Profile?",
          type: "radio-cards",
          required: true,
          options: [
            { value: "yes", label: "Yes, needs updating" },
            { value: "no", label: "No, starting fresh" },
          ],
        },
        { name: "existingProfile.profileUrl", label: "Link to existing profile", type: "link", visibleIf: hasExistingProfile },
        { name: "existingProfile.issuesNotes", label: "What needs fixing?", type: "textarea", visibleIf: hasExistingProfile },
      ],
    },
    {
      id: "photos",
      title: "Photos",
      description: "Paste links if ready. No links yet? Send via WhatsApp or email after submitting.",
      icon: "📸",
      fields: [
        {
          name: "photos.items",
          label: "Photos (storefront, products, team, etc.)",
          type: "dynamic-list",
          itemLabel: "Photo Link",
          minItems: 0,
          itemFields: [{ name: "url", label: "Link", type: "link" }],
        },
      ],
    },
  ],
};