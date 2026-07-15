/* eslint-disable @typescript-eslint/no-explicit-any */
// components/questionnaire-engine/fields/DynamicListField.tsx
"use client";

import type { FieldConfig, DynamicListItemField } from "@/lib/questionnaires/types";
import { FieldWrapper } from "./TextField";

interface Props {
  field: FieldConfig;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

function emptyItem(itemFields: DynamicListItemField[]): Record<string, any> {
  const item: Record<string, any> = {};
  for (const f of itemFields) item[f.name] = f.type === "checkbox-group" ? [] : "";
  return item;
}

function ItemFieldInput({
  itemField,
  value,
  onChange,
}: {
  itemField: DynamicListItemField;
  value: any;
  onChange: (value: any) => void;
}) {
  if (itemField.type === "select") {
    return (
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
      >
        <option value="" disabled>
          {itemField.placeholder ?? "Select…"}
        </option>
        {itemField.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (itemField.type === "currency" || itemField.type === "number") {
    return (
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.valueAsNumber)}
        placeholder={itemField.placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
      />
    );
  }

  if (itemField.type === "textarea") {
    return (
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={itemField.placeholder}
        rows={2}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
      />
    );
  }

  return (
    <input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={itemField.placeholder}
      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
    />
  );
}

export function DynamicListField({ field, value, onChange, error }: Props) {
  const items: Record<string, any>[] = Array.isArray(value) ? value : [];
  const itemFields = field.itemFields ?? [];

  function addItem() {
    if (field.maxItems && items.length >= field.maxItems) return;
    onChange([...items, emptyItem(itemFields)]);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function updateItemField(index: number, name: string, val: any) {
    const next = items.map((item, i) => (i === index ? { ...item, [name]: val } : item));
    onChange(next);
  }

  return (
    <FieldWrapper field={field} error={error}>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 relative">
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="absolute top-3 right-3 text-slate-400 hover:text-red-500 text-xs font-semibold"
            >
              Remove
            </button>
            <div className="grid sm:grid-cols-2 gap-3 pr-16">
              {itemFields.map((itemField) => (
                <div key={itemField.name} className={itemField.type === "textarea" ? "sm:col-span-2" : ""}>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    {itemField.label}
                    {itemField.required && <span className="text-emerald-600 ml-0.5">*</span>}
                  </label>
                  <ItemFieldInput
                    itemField={itemField}
                    value={item[itemField.name]}
                    onChange={(v) => updateItemField(index, itemField.name, v)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {(!field.maxItems || items.length < field.maxItems) && (
          <button
            type="button"
            onClick={addItem}
            className="w-full rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 py-3 text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
          >
            + Add {field.itemLabel ?? "Item"}
          </button>
        )}

        {items.length === 0 && field.minItems === 0 && (
          <p className="text-xs text-slate-400">Optional — add as many as apply, or skip.</p>
        )}
      </div>
    </FieldWrapper>
  );
}