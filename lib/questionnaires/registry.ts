// lib/questionnaires/registry.ts
//
// Single source of truth mapping a service's URL slug to its questionnaire
// config. The dynamic route app/services/[service]/questionnaire/page.tsx
// reads from here — it never imports a service config directly.
//
// TO ADD A NEW SERVICE:
//   1. Create lib/questionnaires/<slug>/config.ts (+ schema.ts)
//   2. Import it below and add one line to the registry map.
//   That's it — no new routes, no new components, no engine changes.

import type { QuestionnaireConfig } from "./types";

import { businessPlanWritingConfig } from "./business-plan-writing/config";
import { financialProjectionsConfig } from "./financial-projections/config";
import { pitchDeckConfig } from "./pitch-deck/config";
import { businessRegistrationConfig } from "./business-registration/config";
import { logoDesignConfig } from "./logo-design/config";
import { websiteCreationConfig } from "./website-creation/config";
import { businessNameDomainConfig } from "./business-name-domain/config";
import { googleBusinessProfileConfig } from "./google-business-profile/config";
import { socialMediaSetupConfig } from "./social-media-setup/config";

export const questionnaireRegistry: Record<string, QuestionnaireConfig> = {
  "business-plan-writing": businessPlanWritingConfig,
  "financial-projections": financialProjectionsConfig,
  "pitch-deck": pitchDeckConfig,
  "business-registration": businessRegistrationConfig,
  "logo-design": logoDesignConfig,
  "website-creation": websiteCreationConfig,
  "business-name-domain": businessNameDomainConfig,
  "google-business-profile": googleBusinessProfileConfig,
  "social-media-setup": socialMediaSetupConfig,
};

export function getQuestionnaireConfig(slug: string): QuestionnaireConfig | null {
  return questionnaireRegistry[slug] ?? null;
}

export function isValidServiceSlug(slug: string): boolean {
  return slug in questionnaireRegistry;
}

/** All slugs — useful for generateStaticParams on the dynamic route. */
export function getAllServiceSlugs(): string[] {
  return Object.keys(questionnaireRegistry);
}