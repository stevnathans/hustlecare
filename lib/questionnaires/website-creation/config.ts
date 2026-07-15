/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/questionnaires/website-creation/config.ts
import type { QuestionnaireConfig } from "../types";
import { contactStepSchema } from "./schema";

const hasDomainAlready = (answers: Record<string, any>) => answers?.domain?.hasDomain === "yes";
const sellsOnline = (answers: Record<string, any>) =>
  Array.isArray(answers?.goals?.siteGoals) && answers.goals.siteGoals.includes("sell-products");

export const websiteCreationConfig: QuestionnaireConfig = {
  serviceSlug: "website-creation",
  serviceName: "Website Creation",
  estimatedMinutes: 12,
  reviewSectionLabels: {
    contact: "Contact Information",
    "business-overview": "Business Overview",
    goals: "Site Goals",
    pages: "Pages Needed",
    design: "Design Preferences",
    domain: "Domain & Hosting",
    content: "Content Readiness",
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
        { name: "businessOverview.targetAudience", label: "Who is the website for?", type: "textarea" },
      ],
    },
    {
      id: "goals",
      title: "Site goals",
      icon: "🎯",
      fields: [
        {
          name: "goals.siteGoals",
          label: "What should the website do?",
          type: "checkbox-group",
          options: [
            { value: "sell-products", label: "Sell products online" },
            { value: "take-bookings", label: "Take bookings/appointments" },
            { value: "generate-leads", label: "Generate inquiries/leads" },
            { value: "info-only", label: "Just showcase information" },
            { value: "blog", label: "Publish articles/blog" },
          ],
        },
      ],
    },
    {
      id: "pages",
      title: "Pages needed",
      icon: "📄",
      fields: [
        {
          name: "pages.items",
          label: "Pages",
          type: "dynamic-list",
          itemLabel: "Page",
          minItems: 1,
          itemFields: [
            { name: "pageName", label: "Page name", type: "text", required: true, placeholder: "e.g. Home, About, Shop" },
            { name: "notes", label: "What should go on this page?", type: "textarea" },
          ],
        },
      ],
    },
    {
      id: "design",
      title: "Design preferences",
      icon: "🎨",
      fields: [
        { name: "design.brandColors", label: "Brand colors", type: "text" },
        { name: "design.logoUrl", label: "Logo link", type: "link" },
        {
          name: "design.styleReference",
          label: "Style direction",
          type: "radio-cards",
          options: [
            { value: "modern-minimal", label: "Modern & Minimal" },
            { value: "bold-colorful", label: "Bold & Colorful" },
            { value: "corporate", label: "Corporate & Professional" },
            { value: "not-sure", label: "Not sure — suggest something" },
          ],
        },
        { name: "design.referenceWebsites", label: "Websites you like the look of", type: "textarea", helperText: "Paste links, one per line" },
      ],
    },
    {
      id: "domain",
      title: "Domain & hosting",
      icon: "🌐",
      fields: [
        {
          name: "domain.hasDomain",
          label: "Do you already own a domain name?",
          type: "radio-cards",
          required: true,
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No, need help getting one" },
          ],
        },
        { name: "domain.existingDomain", label: "Your domain", type: "text", placeholder: "e.g. yourbusiness.com", visibleIf: hasDomainAlready },
        { name: "domain.preferredDomainIdeas", label: "Domain name ideas", type: "textarea", visibleIf: (a: Record<string, any>) => !hasDomainAlready(a) },
      ],
    },
    {
      id: "content",
      title: "Content readiness",
      description: "Paste links if you already have these ready. No links yet? Send via WhatsApp or email after submitting.",
      icon: "📁",
      fields: [
        {
          name: "content.photos",
          label: "Photos",
          type: "dynamic-list",
          itemLabel: "Photo Link",
          minItems: 0,
          itemFields: [{ name: "url", label: "Link", type: "link" }],
        },
        {
          name: "content.productCatalogUrl",
          label: "Product catalog / price list",
          type: "link",
          visibleIf: sellsOnline,
        },
        { name: "content.copyReady", label: "Do you already have website text written?", type: "radio-cards", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No, please help write it" }] },
      ],
    },
  ],
};