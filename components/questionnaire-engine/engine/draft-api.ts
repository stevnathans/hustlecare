/* eslint-disable @typescript-eslint/no-explicit-any */
// components/questionnaire-engine/engine/draft-api.ts
//
// Thin client-side wrappers around the generic /api/questionnaire-drafts
// routes. No service-specific logic — serviceSlug is just a parameter.

import type { QuestionnaireDraftDTO } from "@/lib/questionnaires/types";

export async function createDraft(
  serviceSlug: string,
  packageTier: string | null
): Promise<QuestionnaireDraftDTO> {
  const res = await fetch("/api/questionnaire-drafts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ serviceSlug, packageTier }),
  });
  if (!res.ok) throw new Error("Failed to create draft");
  const { draft } = await res.json();
  return draft;
}

export async function fetchDraft(draftId: string): Promise<QuestionnaireDraftDTO> {
  const res = await fetch(`/api/questionnaire-drafts/${draftId}`);
  if (!res.ok) throw new Error("Failed to fetch draft");
  const { draft } = await res.json();
  return draft;
}

export async function patchDraft(
  draftId: string,
  updates: {
    packageTier?: string | null;
    currentStep?: number;
    answers?: Record<string, any>;
    contactEmail?: string | null;
    contactPhone?: string | null;
  }
): Promise<QuestionnaireDraftDTO> {
  const res = await fetch(`/api/questionnaire-drafts/${draftId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to save draft");
  const { draft } = await res.json();
  return draft;
}

export async function submitDraft(draftId: string): Promise<QuestionnaireDraftDTO> {
  const res = await fetch(`/api/questionnaire-drafts/${draftId}/submit`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to submit draft");
  const { draft } = await res.json();
  return draft;
}

// ── localStorage helpers ─────────────────────────────────────────────────────
// We key by serviceSlug so a visitor can have an in-progress draft for
// multiple services at once without them colliding.

const storageKey = (serviceSlug: string) => `hustlecare:draft:${serviceSlug}`;

export function getStoredDraftId(serviceSlug: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(storageKey(serviceSlug));
}

export function setStoredDraftId(serviceSlug: string, draftId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(serviceSlug), draftId);
}

export function clearStoredDraftId(serviceSlug: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey(serviceSlug));
}