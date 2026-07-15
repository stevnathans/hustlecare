/* eslint-disable @typescript-eslint/no-explicit-any */
// components/questionnaire-engine/fields/TextField.tsx
"use client";

import type { FieldConfig } from "@/lib/questionnaires/types";

interface BaseProps {
  field: FieldConfig;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

function FieldWrapper({ field, error, children }: { field: FieldConfig; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {field.label}
        {field.required && <span className="text-emerald-600 ml-0.5">*</span>}
      </label>
      {field.helperText && <p className="text-xs text-slate-400 mb-2">{field.helperText}</p>}
      {children}
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  );
}

export function TextField({ field, value, onChange, error }: BaseProps) {
  const inputType = field.type === "email" ? "email" : field.type === "tel" ? "tel" : field.type === "number" ? "number" : field.type === "date" ? "date" : "text";
  return (
    <FieldWrapper field={field} error={error}>
      <input
        type={inputType}
        value={value ?? ""}
        onChange={(e) => onChange(inputType === "number" ? e.target.valueAsNumber : e.target.value)}
        placeholder={field.placeholder}
        className={`w-full rounded-xl border px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors ${
          error ? "border-red-300" : "border-slate-200"
        }`}
      />
    </FieldWrapper>
  );
}

export function TextAreaField({ field, value, onChange, error }: BaseProps) {
  return (
    <FieldWrapper field={field} error={error}>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={field.rows ?? 4}
        className={`w-full rounded-xl border px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors resize-none ${
          error ? "border-red-300" : "border-slate-200"
        }`}
      />
    </FieldWrapper>
  );
}

export function CurrencyField({ field, value, onChange, error }: BaseProps) {
  const symbol = field.currencySymbol ?? "KSh";
  return (
    <FieldWrapper field={field} error={error}>
      <div className={`flex items-center rounded-xl border overflow-hidden ${error ? "border-red-300" : "border-slate-200"} focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500`}>
        <span className="px-3 py-2.5 text-sm text-slate-400 bg-slate-50 border-r border-slate-200">{symbol}</span>
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.valueAsNumber)}
          placeholder={field.placeholder ?? "0"}
          className="w-full px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />
      </div>
    </FieldWrapper>
  );
}

export function LinkField({ field, value, onChange, error }: BaseProps) {
  return (
    <FieldWrapper field={field} error={error}>
      <input
        type="url"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder ?? "https://drive.google.com/…"}
        className={`w-full rounded-xl border px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors ${
          error ? "border-red-300" : "border-slate-200"
        }`}
      />
    </FieldWrapper>
  );
}

export { FieldWrapper };