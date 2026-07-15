/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/questionnaires/pitch-deck/config.ts
import type { QuestionnaireConfig } from "../types";
import { contactStepSchema } from "./schema";

const isOperatingOrGrowing = (answers: Record<string, any>) =>
  ["operating", "growing"].includes(answers?.businessOverview?.businessStage);

export const pitchDeckConfig: QuestionnaireConfig = {
  serviceSlug: "pitch-deck",
  serviceName: "Pitch Deck Creation",
  estimatedMinutes: 15,
  reviewSectionLabels: {
    contact: "Contact Information",
    "business-overview": "Business Overview",
    "problem-solution": "Problem & Solution",
    market: "Market",
    "business-model": "Business Model",
    traction: "Traction",
    ask: "Funding Ask",
    team: "Team",
    design: "Design Preferences",
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
        { name: "contact.businessName", label: "Business/startup name", type: "text", required: true },
      ],
    },
    {
      id: "business-overview",
      title: "About the business",
      icon: "🏢",
      fields: [
        {
          name: "businessOverview.businessStage",
          label: "Business stage",
          type: "radio-cards",
          required: true,
          options: [
            { value: "idea", label: "Idea" },
            { value: "startup", label: "Startup" },
            { value: "operating", label: "Operating" },
            { value: "growing", label: "Growing" },
          ],
        },
        { name: "businessOverview.oneLinePitch", label: "One-line pitch", type: "text", helperText: "Describe your business in a single sentence" },
        { name: "businessOverview.industry", label: "Industry", type: "text" },
      ],
    },
    {
      id: "problem-solution",
      title: "Problem & solution",
      icon: "💡",
      fields: [
        { name: "problemSolution.problem", label: "What problem are you solving?", type: "textarea", required: true },
        { name: "problemSolution.solution", label: "How does your business solve it?", type: "textarea", required: true },
        { name: "problemSolution.usp", label: "What makes your solution different?", type: "textarea" },
      ],
    },
    {
      id: "market",
      title: "Market",
      icon: "🎯",
      fields: [
        { name: "market.targetCustomer", label: "Who is your target customer?", type: "textarea" },
        { name: "market.marketSize", label: "Estimated market size", type: "textarea", helperText: "Rough numbers are fine — we can help research exact figures" },
        {
          name: "market.competitors",
          label: "Key competitors",
          type: "dynamic-list",
          itemLabel: "Competitor",
          minItems: 0,
          itemFields: [{ name: "name", label: "Name", type: "text", required: true }],
        },
      ],
    },
    {
      id: "business-model",
      title: "Business model",
      icon: "⚙️",
      fields: [
        { name: "businessModel.revenueModel", label: "How do you make money?", type: "textarea" },
        { name: "businessModel.pricingStrategy", label: "Pricing strategy", type: "textarea" },
      ],
    },
    {
      id: "traction",
      title: "Traction",
      icon: "📈",
      visibleIf: isOperatingOrGrowing,
      fields: [
        { name: "traction.metrics", label: "Key metrics so far", type: "textarea", helperText: "Revenue, customers, growth rate, partnerships, etc." },
        { name: "traction.milestones", label: "Milestones achieved", type: "textarea" },
      ],
    },
    {
      id: "ask",
      title: "Funding ask",
      icon: "💰",
      fields: [
        {
          name: "ask.needsFunding",
          label: "Are you raising funding?",
          type: "radio-cards",
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ],
        },
        { name: "ask.amount", label: "Amount raising", type: "currency", visibleIf: (a: Record<string, any>) => a?.ask?.needsFunding === "yes" },
        { name: "ask.useOfFunds", label: "Use of funds", type: "textarea", visibleIf: (a: Record<string, any>) => a?.ask?.needsFunding === "yes" },
      ],
    },
    {
      id: "team",
      title: "Team",
      icon: "👥",
      fields: [
        {
          name: "team.members",
          label: "Team members",
          type: "dynamic-list",
          itemLabel: "Team Member",
          minItems: 0,
          itemFields: [
            { name: "name", label: "Name", type: "text" },
            { name: "role", label: "Role", type: "text" },
            { name: "background", label: "Background", type: "textarea" },
          ],
        },
      ],
    },
    {
      id: "design",
      title: "Design preferences",
      icon: "🎨",
      fields: [
        { name: "design.brandColors", label: "Brand colors (if any)", type: "text" },
        { name: "design.logoUrl", label: "Logo link", type: "link" },
        { name: "design.toneNotes", label: "Tone / style notes", type: "textarea", helperText: "e.g. bold and modern, minimal and clean, warm and approachable" },
      ],
    },
  ],
};