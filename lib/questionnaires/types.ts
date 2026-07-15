// lib/questionnaires/types.ts
//
// Shared type contracts for the questionnaire engine. Every service
// (business-plan-writing, website-creation, business-registration, ...)
// defines a QuestionnaireConfig that satisfies these interfaces. The
// engine components (WizardShell, StepContainer, ReviewScreen, reducer)
// never import service-specific code — they only ever consume this shape.

import { z } from "zod";

// ── Field-level types ────────────────────────────────────────────────────────

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "textarea"
  | "select"
  | "radio-cards"
  | "checkbox-group"
  | "currency"
  | "number"
  | "link"
  | "dynamic-list"
  | "date";

export interface SelectOption {
  value: string;
  label: string;
  description?: string; // used by radio-cards for helper text under the label
  emoji?: string;
}

/**
 * A single sub-field used inside a `dynamic-list` field's item shape.
 * e.g. a "Products & Services" dynamic list has sub-fields: name, description,
 * sellingPrice, cost, expectedMonthlySales, status.
 */
export interface DynamicListItemField {
  name: string;
  label: string;
  type: Exclude<FieldType, "dynamic-list">;
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  helperText?: string;
}

export interface FieldConfig {
  name: string; // dot-path into the answers object, e.g. "contact.email"
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  options?: SelectOption[]; // for select / radio-cards / checkbox-group
  itemFields?: DynamicListItemField[]; // for dynamic-list
  itemLabel?: string; // e.g. "Product" -> "Add Product"
  maxItems?: number;
  minItems?: number;
  currencySymbol?: string; // for currency fields, defaults to "KSh"
  rows?: number; // for textarea
  /**
   * Field-level conditional visibility, evaluated against the full answers
   * object. If omitted, the field is always visible (subject to step-level
   * visibility already being true).
   */
  visibleIf?: (answers: Record<string, any>) => boolean;
}

// ── Step-level types ─────────────────────────────────────────────────────────

export interface StepConfig {
  id: string; // stable key, e.g. "contact", "business-overview"
  title: string;
  description?: string; // shown under the step title, sets expectations
  icon?: string; // emoji, shown in step header
  fields: FieldConfig[];
  /**
   * Step-level conditional visibility. Evaluated against the full answers
   * object (including packageTier, business stage, etc.) every time the
   * user advances, so steps can appear/disappear as earlier answers change.
   */
  visibleIf?: (answers: Record<string, any>) => boolean;
  /** Zod schema used to validate this step's fields before allowing "Next". */
  validationSchema?: z.ZodTypeAny;
}

// ── Package tier (shared across service configs that have tiers) ────────────

export interface PackageTierConfig {
  id: string; // "starter" | "professional" | "investor", or service-specific
  name: string;
  tag: string;
  priceLabel: string; // "KSh 5,999"
  includes: string[];
}

// ── Top-level questionnaire config ───────────────────────────────────────────

export interface QuestionnaireConfig {
  serviceSlug: string; // must match the [service] route segment
  serviceName: string; // display name, e.g. "Business Plan Writing"
  estimatedMinutes: number; // shown as "Estimated completion time"
  packageTiers?: PackageTierConfig[]; // omit for services with no tiers
  steps: StepConfig[];
  /**
   * Human-readable section labels used on the Review screen, keyed by
   * the top-level answers key (e.g. "contact" -> "Contact Information").
   * Falls back to the step title if not provided.
   */
  reviewSectionLabels?: Record<string, string>;
}

// ── Answers / draft shapes ───────────────────────────────────────────────────

/**
 * The answers object is intentionally untyped (Record<string, any>) at the
 * engine level — each service's Zod schema is the actual source of truth
 * for shape validation. This keeps the generic engine decoupled from any
 * one service's data model.
 */
export type QuestionnaireAnswers = Record<string, any>;

export interface QuestionnaireDraftDTO {
  id: string;
  serviceSlug: string;
  packageTier: string | null;
  currentStep: number;
  answers: QuestionnaireAnswers;
  contactEmail: string | null;
  contactPhone: string | null;
  status: "draft" | "submitted";
  orderNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Reducer / engine state ───────────────────────────────────────────────────

export interface QuestionnaireState {
  draftId: string | null;
  serviceSlug: string;
  packageTier: string | null;
  currentStepIndex: number; // index into the *visible* steps array
  answers: QuestionnaireAnswers;
  status: "loading" | "ready" | "saving" | "submitting" | "submitted" | "error";
  errorMessage: string | null;
  orderNumber: string | null;
}

export type QuestionnaireAction =
  | { type: "HYDRATE_DRAFT"; draft: QuestionnaireDraftDTO }
  | { type: "SET_PACKAGE_TIER"; tier: string }
  | { type: "UPDATE_FIELD"; name: string; value: any }
  | { type: "UPDATE_FIELDS"; values: Record<string, any> }
  | { type: "GO_NEXT" }
  | { type: "GO_BACK" }
  | { type: "GO_TO_STEP"; index: number }
  | { type: "SET_STATUS"; status: QuestionnaireState["status"]; errorMessage?: string }
  | { type: "SUBMIT_SUCCESS"; orderNumber: string };