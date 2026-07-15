// lib/questionnaires/social-media-setup/config.ts
import type { QuestionnaireConfig } from "../types";
import { contactStepSchema } from "./schema";

export const socialMediaSetupConfig: QuestionnaireConfig = {
  serviceSlug: "social-media-setup",
  serviceName: "Social Media Setup",
  estimatedMinutes: 8,
  reviewSectionLabels: {
    contact: "Contact Information",
    "business-overview": "Business Overview",
    platforms: "Platforms",
    assets: "Brand Assets",
    content: "Content Preferences",
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
        { name: "businessOverview.targetAudience", label: "Who is your target audience?", type: "textarea" },
      ],
    },
    {
      id: "platforms",
      title: "Platforms",
      icon: "📣",
      fields: [
        {
          name: "platforms.selected",
          label: "Which platforms do you want to set up?",
          type: "checkbox-group",
          options: [
            { value: "instagram", label: "Instagram" },
            { value: "facebook", label: "Facebook" },
            { value: "tiktok", label: "TikTok" },
            { value: "x", label: "X (Twitter)" },
            { value: "linkedin", label: "LinkedIn" },
            { value: "whatsapp-business", label: "WhatsApp Business" },
          ],
        },
        { name: "platforms.existingHandles", label: "Existing handles/usernames (if any)", type: "textarea" },
      ],
    },
    {
      id: "assets",
      title: "Brand assets",
      icon: "🎨",
      fields: [
        { name: "assets.logoUrl", label: "Logo link", type: "link" },
        { name: "assets.brandColors", label: "Brand colors", type: "text" },
        {
          name: "assets.photos",
          label: "Photos to use",
          type: "dynamic-list",
          itemLabel: "Photo Link",
          minItems: 0,
          itemFields: [{ name: "url", label: "Link", type: "link" }],
        },
      ],
    },
    {
      id: "content",
      title: "Content preferences",
      icon: "📝",
      fields: [
        {
          name: "content.tone",
          label: "Tone of voice",
          type: "radio-cards",
          options: [
            { value: "professional", label: "Professional" },
            { value: "friendly", label: "Friendly & Casual" },
            { value: "playful", label: "Playful & Fun" },
            { value: "inspirational", label: "Inspirational" },
          ],
        },
        { name: "content.postingFrequency", label: "How often do you want to post?", type: "select", options: [
          { value: "daily", label: "Daily" },
          { value: "few-times-week", label: "A few times a week" },
          { value: "weekly", label: "Weekly" },
          { value: "not-sure", label: "Not sure — advise me" },
        ] },
        { name: "content.contentIdeas", label: "Content ideas or topics you want covered", type: "textarea" },
      ],
    },
  ],
};