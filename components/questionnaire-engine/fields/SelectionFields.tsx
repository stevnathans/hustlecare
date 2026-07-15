/* eslint-disable @typescript-eslint/no-explicit-any */
// components/questionnaire-engine/fields/SelectionFields.tsx
"use client";

import type { FieldConfig } from "@/lib/questionnaires/types";
import { FieldWrapper } from "./TextField";

interface BaseProps {
  field: FieldConfig;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export function SelectField({ field, value, onChange, error }: BaseProps) {
  return (
    <FieldWrapper field={field} error={error}>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl border px-4 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors ${
          error ? "border-red-300" : "border-slate-200"
        }`}
      >
        <option value="" disabled>
          {field.placeholder ?? "Select…"}
        </option>
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

export function RadioCardsField({ field, value, onChange, error }: BaseProps) {
  return (
    <FieldWrapper field={field} error={error}>
      <div className="grid sm:grid-cols-2 gap-3">
        {field.options?.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`text-left rounded-xl border-2 p-4 transition-all ${
                selected
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 hover:border-emerald-200 bg-white"
              }`}
            >
              {opt.emoji && <div className="text-xl mb-1.5">{opt.emoji}</div>}
              <div className={`font-semibold text-sm ${selected ? "text-emerald-700" : "text-slate-800"}`}>
                {opt.label}
              </div>
              {opt.description && <div className="text-xs text-slate-500 mt-0.5">{opt.description}</div>}
            </button>
          );
        })}
      </div>
    </FieldWrapper>
  );
}

export function CheckboxGroupField({ field, value, onChange, error }: BaseProps) {
  const selectedValues: string[] = Array.isArray(value) ? value : [];

  function toggle(optValue: string) {
    if (selectedValues.includes(optValue)) {
      onChange(selectedValues.filter((v) => v !== optValue));
    } else {
      onChange([...selectedValues, optValue]);
    }
  }

  return (
    <FieldWrapper field={field} error={error}>
      <div className="grid sm:grid-cols-2 gap-3">
        {field.options?.map((opt) => {
          const checked = selectedValues.includes(opt.value);
          return (
            <label
              key={opt.value}
              className={`flex items-center gap-3 rounded-xl border-2 p-3.5 cursor-pointer transition-all ${
                checked ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-emerald-200 bg-white"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(opt.value)}
                className="w-4 h-4 accent-emerald-600"
              />
              {opt.emoji && <span className="text-lg">{opt.emoji}</span>}
              <span className={`text-sm font-medium ${checked ? "text-emerald-700" : "text-slate-700"}`}>
                {opt.label}
              </span>
            </label>
          );
        })}
      </div>
    </FieldWrapper>
  );
}