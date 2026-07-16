// lib/orders/format-answers.ts
//
// Pure, framework-agnostic formatter. Takes a QuestionnaireConfig and the
// raw `answers` JSON from a QuestionnaireDraft row and produces a list of
// readable sections — the same shape of output the customer-facing
// ReviewScreen renders, but as plain data so it can be used in the admin
// UI (or anywhere else) without pulling in the questionnaire engine's
// React context.

import type { QuestionnaireConfig, FieldConfig, StepConfig, DynamicListItemField } from "@/lib/questionnaires/types";
import { getDeep } from "@/lib/questionnaires/get-deep";

export interface FormattedField {
  label: string;
  value: string;
  raw: unknown;
  isEmpty: boolean;
  /** Present only for dynamic-list fields — lets the UI render each item's
   *  sub-fields with real labels instead of raw JSON keys. */
  itemFields?: DynamicListItemField[];
}

export interface FormattedSection {
  id: string;
  title: string;
  icon?: string;
  fields: FormattedField[];
}

function formatFieldValue(field: FieldConfig, value: unknown): { text: string; isEmpty: boolean } {
  if (value === undefined || value === null || value === "") {
    return { text: "—", isEmpty: true };
  }

  if (field.type === "dynamic-list") {
    const items = Array.isArray(value) ? value : [];
    if (items.length === 0) return { text: "None added", isEmpty: true };
    return { text: `${items.length} ${field.itemLabel ?? "item"}${items.length === 1 ? "" : "s"} added`, isEmpty: false };
  }

  if (field.type === "checkbox-group") {
    const selected = Array.isArray(value) ? value : [];
    if (selected.length === 0) return { text: "None selected", isEmpty: true };
    const labels = selected.map((v) => field.options?.find((o) => o.value === v)?.label ?? v);
    return { text: labels.join(", "), isEmpty: false };
  }

  if (field.type === "select" || field.type === "radio-cards") {
    const label = field.options?.find((o) => o.value === value)?.label ?? String(value);
    return { text: label, isEmpty: false };
  }

  if (field.type === "currency") {
    const num = Number(value);
    if (Number.isNaN(num)) return { text: "—", isEmpty: true };
    return { text: `${field.currencySymbol ?? "KSh"} ${num.toLocaleString()}`, isEmpty: false };
  }

  return { text: String(value), isEmpty: false };
}

/**
 * Returns dynamic-list items as structured rows for detail rendering
 * (e.g. showing each product/competitor/team member individually rather
 * than just "3 items added"). Used by the admin detail modal for an
 * expandable view.
 */
export function getDynamicListItems(
  answers: Record<string, unknown>,
  field: FieldConfig
): Record<string, unknown>[] {
  if (field.type !== "dynamic-list") return [];
  const value = getDeep(answers, field.name);
  return Array.isArray(value) ? value : [];
}

/**
 * Builds the full readable section list for an order. Filters out steps
 * and fields that were conditionally hidden for this particular answer
 * set (via visibleIf), matching exactly what the customer saw and filled
 * in during the wizard.
 */
export function formatOrderAnswers(
  config: QuestionnaireConfig,
  answers: Record<string, unknown>,
  packageTier: string | null
): FormattedSection[] {
  const answersWithTier = { ...answers, packageTier };

  const visibleSteps: StepConfig[] = config.steps.filter(
    (step) => !step.visibleIf || step.visibleIf(answersWithTier)
  );

  return visibleSteps
    .map((step) => {
      const visibleFields = step.fields.filter(
        (field) => !field.visibleIf || field.visibleIf(answersWithTier)
      );

      const fields: FormattedField[] = visibleFields.map((field) => {
        const raw = getDeep(answers, field.name);
        const { text, isEmpty } = formatFieldValue(field, raw);
        return {
          label: field.label,
          value: text,
          raw,
          isEmpty,
          ...(field.type === "dynamic-list" && { itemFields: field.itemFields }),
        };
      });

      return {
        id: step.id,
        title: config.reviewSectionLabels?.[step.id] ?? step.title,
        icon: step.icon,
        fields,
      };
    })
    .filter((section) => section.fields.length > 0);
}