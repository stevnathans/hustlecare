/* eslint-disable @typescript-eslint/no-explicit-any */
// components/questionnaire-engine/ReviewScreen.tsx
"use client";

import { useEffect, useState } from "react";
import { useQuestionnaire } from "./engine/context";
import { getDeep } from "@/lib/questionnaires/get-deep";
import type { FieldConfig } from "@/lib/questionnaires/types";

interface PlanSummary {
  id: string;
  name: string;
  priceAmount: number;
  depositPercent: number;
}

const ksh = (n: number) => `KSh ${Math.round(n).toLocaleString("en-US")}`;

function formatValue(field: FieldConfig, value: any): string {
  if (value === undefined || value === null || value === "") return "—";

  if (field.type === "dynamic-list") {
    const items = Array.isArray(value) ? value : [];
    if (items.length === 0) return "None added";
    return `${items.length} ${items.length === 1 ? (field.itemLabel ?? "item") : `${field.itemLabel ?? "item"}s`} added`;
  }

  if (field.type === "checkbox-group") {
    const selected = Array.isArray(value) ? value : [];
    const labels = selected.map((v) => field.options?.find((o) => o.value === v)?.label ?? v);
    return labels.length ? labels.join(", ") : "None selected";
  }

  if (field.type === "select" || field.type === "radio-cards") {
    return field.options?.find((o) => o.value === value)?.label ?? String(value);
  }

  if (field.type === "currency") {
    return `${field.currencySymbol ?? "KSh"} ${Number(value).toLocaleString()}`;
  }

  return String(value);
}

export function ReviewScreen({
  onSubmit,
  onEditStep,
}: {
  onSubmit: (consent: boolean) => Promise<void>;
  onEditStep: (index: number) => void;
}) {
  const { config, answers, visibleSteps, packageTier, status, errorMessage } = useQuestionnaire();
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [consent, setConsent] = useState(false);

  // The price comes from the catalog (admin → Services), never from this file.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/services/${config.serviceSlug}/plans`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setPlans(Array.isArray(d.plans) ? d.plans : []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [config.serviceSlug]);

  const plan = plans.find((p) => p.id === packageTier) ?? null;
  const deposit = plan ? (plan.depositPercent >= 100 ? plan.priceAmount : Math.round((plan.priceAmount * plan.depositPercent) / 100)) : 0;
  const balance = plan ? plan.priceAmount - deposit : 0;
  const packageLabel = plan?.name ?? config.packageTiers?.find((t) => t.id === packageTier)?.name ?? packageTier;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-1.5">Review your answers</h2>
        <p className="text-sm text-slate-500">
          Check everything looks right before you submit. You can edit any section below.
        </p>
      </div>

      {packageTier && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Selected package</div>
          <div className="text-sm font-bold text-slate-800">{packageLabel}</div>
          {plan && (
            <div className="mt-3 space-y-1 text-sm text-slate-700">
              <div className="flex justify-between">
                <span>Total</span>
                <span className="font-semibold">{ksh(plan.priceAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>{balance > 0 ? "Pay today (deposit)" : "Pay today"}</span>
                <span className="font-semibold text-emerald-700">{ksh(deposit)}</span>
              </div>
              {balance > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Pay later, when the work is ready</span>
                  <span>{ksh(balance)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {visibleSteps.map((step, index) => {
          const answersWithTier = { ...answers, packageTier };
          const visibleFields = step.fields.filter((f) => !f.visibleIf || f.visibleIf(answersWithTier));
          if (visibleFields.length === 0) return null;

          return (
            <div key={step.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 text-sm">
                  {step.icon} {config.reviewSectionLabels?.[step.id] ?? step.title}
                </h3>
                <button onClick={() => onEditStep(index)} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                  Edit
                </button>
              </div>
              <dl className="space-y-1.5">
                {visibleFields.map((field) => (
                  <div key={field.name} className="flex justify-between gap-4 text-sm">
                    <dt className="text-slate-400">{field.label}</dt>
                    <dd className="text-slate-700 font-medium text-right">{formatValue(field, getDeep(answers, field.name))}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>

      <label className="mt-8 flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed cursor-pointer">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          I agree that Hustlecare may contact me by email, WhatsApp and SMS about this order. See our{" "}
          <a href="/privacy" target="_blank" rel="noopener" className="text-emerald-700 underline">
            privacy policy
          </a>
          .{plan && balance > 0 ? " I understand the deposit starts the work and is not refundable once work begins." : ""}
        </span>
      </label>

      {errorMessage && <p className="mt-4 text-sm text-red-500 text-center" role="alert">{errorMessage}</p>}

      <button
        onClick={() => onSubmit(consent)}
        disabled={status === "submitting" || !consent}
        className="w-full mt-5 py-3.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white transition-colors shadow-md shadow-emerald-100"
      >
        {status === "submitting" ? "Submitting…" : plan ? `Submit and pay ${ksh(deposit)}` : "Submit order"}
      </button>
    </div>
  );
}