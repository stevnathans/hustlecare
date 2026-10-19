"use client";

// app/order/[token]/OrderClient.tsx
//
// The interactive parts of the customer's order page: pay what is due, send
// files, and review a preview (ask for changes or approve).

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiUploadCloud, FiLoader, FiTrash2 } from "react-icons/fi";
import PayPanel from "@/components/orders/PayPanel";
import { prepareFile } from "@/components/shared/prepare-file";
import type { ApplyPaymentMode } from "@/lib/applyAssistance/config";

interface SpecView { id: number; label: string; description: string | null; isRequired: boolean }
interface FileView { id: string; specId: number | null; label: string; fileName: string }

interface Props {
  token: string;
  stage: string;
  payable: { kind: "DEPOSIT" | "FULL" | "BALANCE"; amount: number } | null;
  paymentMode: ApplyPaymentMode;
  defaultPhone: string;
  canUpload: boolean;
  specs: SpecView[];
  files: FileView[];
  revisionsLeft: number;
  revisionsAllowed: number;
  orderRef: string;
}

export default function OrderClient({ token, stage, payable, paymentMode, defaultPhone, canUpload, specs, files, revisionsLeft, revisionsAllowed, orderRef }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const [message, setMessage] = useState("");
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  async function upload(key: string, specId: number | null, picked: File | undefined) {
    if (!picked) return;
    setError(null);
    setBusy(key);
    try {
      const file = await prepareFile(picked);
      const body = new FormData();
      body.append("file", file);
      if (specId) body.append("specId", String(specId));
      const res = await fetch(`/api/service-orders/${token}/files`, { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "The upload failed. Please try again.");
      router.refresh();
    } catch (err) {
      setError({ key, message: err instanceof Error ? err.message : "The upload failed. Please try again." });
    } finally {
      setBusy(null);
      const el = inputs.current[key];
      if (el) el.value = "";
    }
  }

  async function remove(fileId: string) {
    setError(null);
    setBusy(`del-${fileId}`);
    try {
      const res = await fetch(`/api/service-orders/${token}/files/${fileId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not remove that file.");
      router.refresh();
    } catch (err) {
      setError({ key: `del-${fileId}`, message: err instanceof Error ? err.message : "Could not remove that file." });
    } finally {
      setBusy(null);
    }
  }

  async function review(action: "revision" | "approve") {
    setError(null);
    setBusy(action);
    try {
      const res = await fetch(`/api/service-orders/${token}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setMessage("");
      router.refresh();
    } catch (err) {
      setError({ key: action, message: err instanceof Error ? err.message : "Something went wrong. Please try again." });
    } finally {
      setBusy(null);
    }
  }

  const group = (key: string, title: string, hint: string | null, specId: number | null, required?: boolean) => {
    const mine = files.filter((f) => f.specId === specId);
    const uploading = busy === key;
    return (
      <li key={key} className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              {title}
              {required === false && <span className="ml-2 text-xs font-normal text-slate-500">optional</span>}
            </p>
            {hint && <p className="text-sm text-slate-600 mt-0.5">{hint}</p>}
          </div>
          {specId !== null && <span className={`shrink-0 text-xs font-medium ${mine.length ? "text-emerald-700" : "text-slate-500"}`}>{mine.length ? "Sent" : "Not sent"}</span>}
        </div>

        {mine.length > 0 && (
          <ul className="mt-3 space-y-2">
            {mine.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                <span className="truncate text-sm text-slate-700">{f.fileName}</span>
                <button type="button" onClick={() => remove(f.id)} disabled={busy === `del-${f.id}`} className="text-slate-400 hover:text-red-600 disabled:opacity-50" aria-label={`Remove ${f.fileName}`}>
                  <FiTrash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3">
          <input
            ref={(el) => { inputs.current[key] = el; }}
            id={`file-${key}`}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={(e) => upload(key, specId, e.target.files?.[0])}
          />
          <label htmlFor={`file-${key}`} className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium ${uploading ? "border-slate-200 text-slate-400" : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"}`}>
            {uploading ? <FiLoader className="animate-spin" size={15} /> : <FiUploadCloud size={15} />}
            {uploading ? "Uploading…" : mine.length ? "Add another" : "Upload"}
          </label>
        </div>

        {error && (error.key === key || mine.some((f) => error.key === `del-${f.id}`)) && (
          <p className="mt-2 text-sm text-red-700" role="alert">{error.message}</p>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-6">
      {payable && (
        <PayPanel
          token={token}
          amount={payable.amount}
          label={payable.kind === "BALANCE" ? "balance" : payable.kind === "DEPOSIT" ? "deposit" : "fee"}
          paymentMode={paymentMode}
          defaultPhone={defaultPhone}
          orderRef={orderRef}
          onPaid={() => setTimeout(() => router.refresh(), 1200)}
        />
      )}

      {stage === "IN_REVIEW" && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <p className="font-semibold text-slate-900">What do you think?</p>
          <p className="text-sm text-slate-600">
            Approve it if you are happy, or tell us what to change.{" "}
            {revisionsAllowed > 0 ? `You have ${revisionsLeft} revision round${revisionsLeft === 1 ? "" : "s"} left.` : ""}
          </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Describe the changes you would like…"
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
          {error && (error.key === "revision" || error.key === "approve") && <p className="text-sm text-red-700" role="alert">{error.message}</p>}
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={() => review("approve")} disabled={!!busy} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 text-sm disabled:opacity-60">
              {busy === "approve" ? "Saving…" : "Approve"}
            </button>
            <button type="button" onClick={() => review("revision")} disabled={!!busy || message.trim().length < 5} className="rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-5 py-2.5 text-sm disabled:opacity-50">
              {busy === "revision" ? "Sending…" : "Request changes"}
            </button>
          </div>
        </div>
      )}

      {canUpload && (
        <div>
          <p className="font-semibold text-slate-900 mb-1">Files for us</p>
          <p className="text-sm text-slate-600 mb-3">Send your logo, photos or documents here. Photos from your phone are fine.</p>
          <ul className="space-y-3">
            {specs.map((s) => group(`spec-${s.id}`, s.label, s.description, s.id, s.isRequired))}
            {group("other", specs.length ? "Anything else" : "Your files", null, null)}
          </ul>
        </div>
      )}
    </div>
  );
}