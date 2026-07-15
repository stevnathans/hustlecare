// lib/questionnaires/logo-design/config.ts
import type { QuestionnaireConfig } from "../types";
import { contactStepSchema } from "./schema";

export const logoDesignConfig: QuestionnaireConfig = {
  serviceSlug: "logo-design",
  serviceName: "Logo Design",
  estimatedMinutes: 8,
  reviewSectionLabels: {
    contact: "Contact Information",
    "business-overview": "Business Overview",
    personality: "Brand Personality",
    style: "Colors & Style",
    inspiration: "Inspiration & References",
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
      id: "business-overview",
      title: "About the business",
      icon: "🏢",
      fields: [
        { name: "businessOverview.description", label: "What does your business do?", type: "textarea", required: true },
        { name: "businessOverview.industry", label: "Industry", type: "text" },
        { name: "businessOverview.tagline", label: "Tagline (if you have one)", type: "text" },
      ],
    },
    {
      id: "personality",
      title: "Brand personality",
      icon: "✨",
      fields: [
        {
          name: "personality.style",
          label: "Which style feels closest to your brand?",
          type: "radio-cards",
          required: true,
          options: [
            { value: "modern-minimal", label: "Modern & Minimal", emoji: "⬜" },
            { value: "bold-playful", label: "Bold & Playful", emoji: "🎈" },
            { value: "classic-elegant", label: "Classic & Elegant", emoji: "🏛️" },
            { value: "warm-organic", label: "Warm & Organic", emoji: "🌿" },
            { value: "professional-corporate", label: "Professional & Corporate", emoji: "💼" },
            { value: "not-sure", label: "Not sure — surprise me", emoji: "🎲" },
          ],
        },
        {
          name: "personality.traits",
          label: "Which words describe your brand?",
          type: "checkbox-group",
          options: [
            { value: "trustworthy", label: "Trustworthy" },
            { value: "innovative", label: "Innovative" },
            { value: "friendly", label: "Friendly" },
            { value: "luxurious", label: "Luxurious" },
            { value: "affordable", label: "Affordable" },
            { value: "energetic", label: "Energetic" },
          ],
        },
      ],
    },
    {
      id: "style",
      title: "Colors & style",
      icon: "🎨",
      fields: [
        { name: "style.preferredColors", label: "Preferred colors (if any)", type: "text", placeholder: "e.g. emerald green, navy" },
        { name: "style.colorsToAvoid", label: "Colors to avoid", type: "text" },
        {
          name: "style.iconPreference",
          label: "Do you want an icon/symbol, or just text (wordmark)?",
          type: "radio-cards",
          options: [
            { value: "icon-and-text", label: "Icon + Text" },
            { value: "text-only", label: "Text Only (Wordmark)" },
            { value: "icon-only", label: "Icon Only" },
            { value: "no-preference", label: "No preference" },
          ],
        },
      ],
    },
    {
      id: "inspiration",
      title: "Inspiration & references",
      description: "Paste links to logos you like (or dislike) — helps us understand your taste.",
      icon: "🔗",
      fields: [
        {
          name: "inspiration.logosLiked",
          label: "Logos you like",
          type: "dynamic-list",
          itemLabel: "Reference",
          minItems: 0,
          itemFields: [{ name: "url", label: "Link", type: "link" }],
        },
        { name: "inspiration.competitorLogosToAvoid", label: "Competitor logos to avoid resembling", type: "textarea" },
        { name: "inspiration.additionalNotes", label: "Anything else the designer should know?", type: "textarea" },
      ],
    },
  ],
};