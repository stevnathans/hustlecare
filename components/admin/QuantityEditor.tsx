// components/admin/QuantityEditor.tsx
//
// Per-(business, requirement) quantity editor, styled to match
// DescriptionEditor in app/admin/requirements/page.tsx — same expandable-
// card pattern, reusing that page's global .desc-editor/.desc-toggle-btn/
// .f-input classes (injected via that page's <style>{S}</style>, so
// they're available here without re-declaring anything).
//
// Sets BusinessRequirement.defaultQuantity (used at every size band with
// no explicit override) and, optionally, one BusinessRequirementQuantity
// row per band — the data lib/cost-engine.ts reads as `quantityByBand`.
// A blank band input means "no override, inherit the default" — saving
// with a band blank DELETES any existing override row for that band
// rather than leaving a stale one behind.

"use client";
import { useEffect, useState } from "react";
import type { SizeBand } from "@/lib/cost-engine";

const BANDS: SizeBand[] = ["MICRO", "SMALL", "MEDIUM", "LARGE"];
const BAND_LABELS: Record<SizeBand, string> = {
  MICRO: "Micro",
  SMALL: "Small",
  MEDIUM: "Medium",
  LARGE: "Large",
};

export interface QuantityInfo {
  businessId: number;
  defaultQuantity: number;
  quantities: Partial<Record<SizeBand, number>>;
}

interface QuantityEditorProps {
  templateId: number;
  businessId: number;
  businessName: string;
  defaultQuantity: number;
  quantityByBand: Partial<Record<SizeBand, number>>;
  onUpdated: (businessId: number, info: QuantityInfo) => void;
  showToast: (msg: string, type?: "success" | "error") => void;
}

function bandValsFrom(q: Partial<Record<SizeBand, number>>): Record<SizeBand, string> {
  return {
    MICRO: q.MICRO != null ? String(q.MICRO) : "",
    SMALL: q.SMALL != null ? String(q.SMALL) : "",
    MEDIUM: q.MEDIUM != null ? String(q.MEDIUM) : "",
    LARGE: q.LARGE != null ? String(q.LARGE) : "",
  };
}

export default function QuantityEditor({
  templateId,
  businessId,
  businessName,
  defaultQuantity,
  quantityByBand,
  onUpdated,
  showToast,
}: QuantityEditorProps) {
  const [open, setOpen] = useState(false);
  const [defaultVal, setDefaultVal] = useState(String(defaultQuantity));
  const [bandVals, setBandVals] = useState<Record<SizeBand, string>>(bandValsFrom(quantityByBand));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDefaultVal(String(defaultQuantity));
    setBandVals(bandValsFrom(quantityByBand));
  }, [defaultQuantity, quantityByBand]);

  const hasOverrides = BANDS.some((b) => quantityByBand[b] != null);
  const summary = hasOverrides
    ? `Qty: ${defaultQuantity} default, varies by size`
    : `Qty: ${defaultQuantity} at every size`;

  async function handleSave() {
    const parsedDefault = parseInt(defaultVal, 10);
    if (!Number.isFinite(parsedDefault) || parsedDefault < 1) {
      showToast("Default quantity must be a whole number of at least 1", "error");
      return;
    }

    const quantities: Partial<Record<SizeBand, number | null>> = {};
    for (const band of BANDS) {
      const raw = bandVals[band].trim();
      if (raw === "") {
        quantities[band] = null; // no override — inherit defaultQuantity
        continue;
      }
      const parsed = parseInt(raw, 10);
      if (!Number.isFinite(parsed) || parsed < 1) {
        showToast(`${BAND_LABELS[band]} quantity must be a whole number of at least 1`, "error");
        return;
      }
      quantities[band] = parsed;
    }

    setSaving(true);
    try {
      const r = await fetch(`/api/requirements/${templateId}/quantities`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, defaultQuantity: parsedDefault, quantities }),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || "Failed to save");
      }
      const clean: Partial<Record<SizeBand, number>> = {};
      for (const band of BANDS) {
        if (quantities[band] != null) clean[band] = quantities[band] as number;
      }
      onUpdated(businessId, { businessId, defaultQuantity: parsedDefault, quantities: clean });
      setOpen(false);
      showToast(`Quantities saved for ${businessName}`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to save quantities", "error");
    } finally {
      setSaving(false);
    }
  }

  function handleClearOverrides() {
    setBandVals({ MICRO: "", SMALL: "", MEDIUM: "", LARGE: "" });
  }

  function handleCancel() {
    setOpen(false);
    setDefaultVal(String(defaultQuantity));
    setBandVals(bandValsFrom(quantityByBand));
  }

  return (
    <div>
      <div style={{ padding: "0.3rem 0.85rem 0.5rem", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <button
          className={`desc-toggle-btn${hasOverrides ? " has-override" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
        >
          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="9" width="4" height="11" />
            <rect x="10" y="5" width="4" height="15" />
            <rect x="17" y="12" width="4" height="8" />
          </svg>
          {summary}
          {open ? (
            <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 15l-6-6-6 6" />
            </svg>
          ) : (
            <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 9l6 6 6-6" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div className="desc-editor" onClick={(e) => e.stopPropagation()}>
          <div style={{ marginBottom: "0.6rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.7rem",
                fontWeight: 600,
                color: "#9494b0",
                marginBottom: "0.3rem",
              }}
            >
              Default quantity
            </label>
            <input
              type="number"
              min={1}
              step={1}
              className="f-input"
              value={defaultVal}
              onChange={(e) => setDefaultVal(e.target.value)}
              style={{ maxWidth: 120 }}
            />
            <div style={{ fontSize: "0.68rem", color: "#3a3a56", marginTop: "0.25rem" }}>
              Used at any size band that has no override below.
            </div>
          </div>

          <div style={{ marginBottom: "0.5rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.35rem",
              }}
            >
              <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#9494b0" }}>
                Overrides by business size
              </label>
              {hasOverrides && (
                <button
                  onClick={handleClearOverrides}
                  style={{
                    fontSize: "0.68rem",
                    color: "#f87171",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "Sora,sans-serif",
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
              {BANDS.map((band) => (
                <div key={band}>
                  <div
                    style={{
                      fontSize: "0.65rem",
                      color: "#55556e",
                      marginBottom: "0.2rem",
                      textAlign: "center",
                    }}
                  >
                    {BAND_LABELS[band]}
                  </div>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    placeholder={defaultVal || "1"}
                    className="f-input"
                    value={bandVals[band]}
                    onChange={(e) => setBandVals((v) => ({ ...v, [band]: e.target.value }))}
                    style={{ textAlign: "center", padding: "0.5rem 0.4rem" }}
                  />
                </div>
              ))}
            </div>
            <div style={{ fontSize: "0.68rem", color: "#3a3a56", marginTop: "0.3rem" }}>
              Leave blank to use the default quantity above for that size.
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
            <button
              className="btn btn-ghost"
              style={{ padding: "0.3rem 0.65rem", fontSize: "0.72rem" }}
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              style={{ padding: "0.3rem 0.65rem", fontSize: "0.72rem" }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}