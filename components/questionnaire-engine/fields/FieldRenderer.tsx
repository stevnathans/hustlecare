/* eslint-disable @typescript-eslint/no-explicit-any */
// components/questionnaire-engine/fields/FieldRenderer.tsx
"use client";

import type { FieldConfig } from "@/lib/questionnaires/types";
import { getDeep } from "@/lib/questionnaires/get-deep";
import { useQuestionnaire } from "../engine/context";
import { TextField, TextAreaField, CurrencyField, LinkField } from "./TextField";
import { SelectField, RadioCardsField, CheckboxGroupField } from "./SelectionFields";
import { DynamicListField } from "./DynamicListField";

export function FieldRenderer({ field, error }: { field: FieldConfig; error?: string }) {
  const { answers, updateField } = useQuestionnaire();
  const value = getDeep(answers, field.name);
  const onChange = (v: any) => updateField(field.name, v);

  switch (field.type) {
    case "textarea":
      return <TextAreaField field={field} value={value} onChange={onChange} error={error} />;
    case "currency":
      return <CurrencyField field={field} value={value} onChange={onChange} error={error} />;
    case "link":
      return <LinkField field={field} value={value} onChange={onChange} error={error} />;
    case "select":
      return <SelectField field={field} value={value} onChange={onChange} error={error} />;
    case "radio-cards":
      return <RadioCardsField field={field} value={value} onChange={onChange} error={error} />;
    case "checkbox-group":
      return <CheckboxGroupField field={field} value={value} onChange={onChange} error={error} />;
    case "dynamic-list":
      return <DynamicListField field={field} value={value} onChange={onChange} error={error} />;
    case "text":
    case "email":
    case "tel":
    case "number":
    case "date":
    default:
      return <TextField field={field} value={value} onChange={onChange} error={error} />;
  }
}