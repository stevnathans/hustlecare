// components/admin/AssignRequirementModal.tsx
// A searchable modal that lets an admin assign a product to a requirement template.
// Drop this into the admin product catalog (ProductsPage / products-admin.tsx).
//
// Usage:
//   <AssignRequirementModal
//     productId={product.id}
//     productName={product.name}
//     currentTemplateId={product.templateId ?? null}
//     currentTemplateName={product.template?.name ?? null}
//     isOpen={isOpen}
//     onClose={() => setIsOpen(false)}
//     onAssigned={() => fetchProducts()}   // refresh list
//   />

"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Requirement = {
  id: number;
  name: string;
  category: string;
  necessity: string;
  productCount: number;
};

interface AssignRequirementModalProps {
  productId: number;
  productName: string;
  currentTemplateId: number | null;
  currentTemplateName: string | null;
  isOpen: boolean;
  onClose: () => void;
  onAssigned: () => void;
}

export default function AssignRequirementModal({
  productId,
  productName,
  currentTemplateId,
  currentTemplateName,
  isOpen,
  onClose,
  onAssigned,
}: AssignRequirementModalProps) {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(currentTemplateId);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Fetch requirements list once when modal opens
  const fetchRequirements = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const res = await fetch("/api/requirements");
      if (!res.ok) throw new Error("Failed to load requirements");
      const data = await res.json();
      setRequirements(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedId(currentTemplateId);
      setError(null);
      setSuccess(null);
      fetchRequirements();
      setTimeout(() => searchRef.current?.focus(), 80);
    }
  }, [isOpen, currentTemplateId, fetchRequirements]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const filtered = requirements.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)
    );
  });

  // Group filtered results by category for readability
  const grouped = filtered.reduce<Record<string, Requirement[]>>((acc, req) => {
    const key = req.category || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(req);
    return acc;
  }, {});

  const handleAssign = async () => {
    if (selectedId === currentTemplateId) {
      onClose();
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (selectedId === null) {
        // Unassign
        const res = await fetch(
          `/api/products/${productId}/assign-requirement`,
          { method: "DELETE" }
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to unassign");
        }
        setSuccess("Product unassigned from requirement");
      } else {
        // Assign
        const res = await fetch(
          `/api/products/${productId}/assign-requirement`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ templateId: selectedId }),
          }
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to assign");
        }
        const data = await res.json();
        setSuccess(data.message ?? "Product assigned successfully");
      }

      onAssigned();
      setTimeout(onClose, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const categoryColors: Record<string, string> = {
    Equipment: "rgba(59,130,246,0.15)",
    Software: "rgba(139,92,246,0.15)",
    Legal: "rgba(239,68,68,0.15)",
    Documents: "rgba(245,158,11,0.15)",
    Marketing: "rgba(16,185,129,0.15)",
    Branding: "rgba(236,72,153,0.15)",
    "Operating Expenses": "rgba(107,114,128,0.15)",
  };

  const categoryTextColors: Record<string, string> = {
    Equipment: "#93c5fd",
    Software: "#c4b5fd",
    Legal: "#fca5a5",
    Documents: "#fcd34d",
    Marketing: "#6ee7b7",
    Branding: "#f9a8d4",
    "Operating Expenses": "#d1d5db",
  };

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(6px)",
          zIndex: 9100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          animation: "arm-fadeIn 0.18s ease",
        }}
        onClick={onClose}
      >
        {/* Modal box */}
        <div
          style={{
            background: "#13131f",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 20,
            width: "100%",
            maxWidth: 560,
            maxHeight: "88vh",
            display: "flex",
            flexDirection: "column",
            boxShadow:
              "0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,106,247,0.1) inset",
            animation: "arm-slideUp 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
            overflow: "hidden",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ──────────────────────────────────── */}
          <div
            style={{
              padding: "1.4rem 1.75rem 1.1rem",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "1rem",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  color: "#f0f0ff",
                  letterSpacing: "-0.02em",
                  fontFamily: "'Sora', sans-serif",
                }}
              >
                Assign to Requirement
              </div>
              <div
                style={{
                  fontSize: "0.78rem",
                  color: "#5a5a7a",
                  marginTop: "0.2rem",
                  fontFamily: "'Sora', sans-serif",
                }}
              >
                Product:{" "}
                <span style={{ color: "#a89cf7", fontWeight: 600 }}>
                  {productName}
                </span>
              </div>
              {currentTemplateName && (
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "#4a4a66",
                    marginTop: "0.15rem",
                    fontFamily: "'Sora', sans-serif",
                  }}
                >
                  Currently:{" "}
                  <span style={{ color: "#6ee7b7" }}>{currentTemplateName}</span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: "#6b6b8a",
                cursor: "pointer",
                padding: "0.4rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
                flexShrink: 0,
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.color = "#e2e2ef";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                e.currentTarget.style.color = "#6b6b8a";
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ── Search ──────────────────────────────────── */}
          <div
            style={{ padding: "1rem 1.75rem 0.75rem", flexShrink: 0 }}
          >
            <div style={{ position: "relative" }}>
              <svg
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#6b6b8a",
                  pointerEvents: "none",
                }}
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                placeholder="Search requirements by name or category…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  padding: "0.6rem 0.9rem 0.6rem 2.4rem",
                  color: "#e2e2ef",
                  fontFamily: "'Sora', sans-serif",
                  fontSize: "0.85rem",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(124,106,247,0.5)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(124,106,247,0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#4a4a66",
                    cursor: "pointer",
                    padding: 2,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* ── Requirement list ─────────────────────────── */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "0 1.75rem 0.5rem",
            }}
          >
            {fetching ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  paddingTop: "0.5rem",
                }}
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: 52,
                      borderRadius: 10,
                      background:
                        "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
                      backgroundSize: "200% 100%",
                      animation: "arm-shimmer 1.4s infinite",
                    }}
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "3rem 1rem",
                  color: "#3a3a56",
                }}
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  style={{ margin: "0 auto 0.75rem", display: "block" }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#4a4a66",
                    fontFamily: "'Sora', sans-serif",
                  }}
                >
                  No requirements match &ldquo;{search}&rdquo;
                </div>
              </div>
            ) : (
              <div style={{ paddingBottom: "0.5rem" }}>
                {/* "None" option — to unassign */}
                {currentTemplateId !== null && (
                  <div style={{ marginBottom: "0.75rem", paddingTop: "0.25rem" }}>
                    <button
                      onClick={() => setSelectedId(null)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.65rem 0.9rem",
                        borderRadius: 10,
                        border: `1px solid ${
                          selectedId === null
                            ? "rgba(239,68,68,0.4)"
                            : "rgba(255,255,255,0.07)"
                        }`,
                        background:
                          selectedId === null
                            ? "rgba(239,68,68,0.08)"
                            : "rgba(255,255,255,0.03)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        textAlign: "left",
                      }}
                      onMouseOver={(e) => {
                        if (selectedId !== null) {
                          e.currentTarget.style.background =
                            "rgba(255,255,255,0.05)";
                          e.currentTarget.style.borderColor =
                            "rgba(255,255,255,0.12)";
                        }
                      }}
                      onMouseOut={(e) => {
                        if (selectedId !== null) {
                          e.currentTarget.style.background =
                            "rgba(255,255,255,0.03)";
                          e.currentTarget.style.borderColor =
                            "rgba(255,255,255,0.07)";
                        }
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          border: `2px solid ${
                            selectedId === null ? "#f87171" : "#3a3a56"
                          }`,
                          background:
                            selectedId === null ? "#f87171" : "transparent",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.15s",
                        }}
                      >
                        {selectedId === null && (
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                          >
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: "0.82rem",
                          color: selectedId === null ? "#fca5a5" : "#5a5a7a",
                          fontFamily: "'Sora', sans-serif",
                          fontWeight: 500,
                          fontStyle: "italic",
                        }}
                      >
                        Remove assignment (unlink from requirement)
                      </span>
                    </button>
                  </div>
                )}

                {/* Grouped requirements */}
                {Object.entries(grouped).map(([cat, reqs]) => (
                  <div key={cat} style={{ marginBottom: "0.75rem" }}>
                    {/* Category header */}
                    <div
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color:
                          categoryTextColors[cat] ?? "#6b6b8a",
                        marginBottom: "0.35rem",
                        paddingLeft: "0.1rem",
                        fontFamily: "'Sora', sans-serif",
                      }}
                    >
                      {cat}
                    </div>

                    <div
                      style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}
                    >
                      {reqs.map((req) => {
                        const isSelected = selectedId === req.id;
                        const isCurrent = currentTemplateId === req.id;

                        return (
                          <button
                            key={req.id}
                            onClick={() =>
                              setSelectedId(isSelected ? null : req.id)
                            }
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                              padding: "0.65rem 0.9rem",
                              borderRadius: 10,
                              border: `1px solid ${
                                isSelected
                                  ? "rgba(124,106,247,0.5)"
                                  : "rgba(255,255,255,0.06)"
                              }`,
                              background: isSelected
                                ? "rgba(124,106,247,0.1)"
                                : "rgba(255,255,255,0.02)",
                              cursor: "pointer",
                              transition: "all 0.15s",
                              textAlign: "left",
                            }}
                            onMouseOver={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background =
                                  "rgba(255,255,255,0.05)";
                                e.currentTarget.style.borderColor =
                                  "rgba(255,255,255,0.12)";
                              }
                            }}
                            onMouseOut={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background =
                                  "rgba(255,255,255,0.02)";
                                e.currentTarget.style.borderColor =
                                  "rgba(255,255,255,0.06)";
                              }
                            }}
                          >
                            {/* Radio circle */}
                            <div
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                border: `2px solid ${
                                  isSelected ? "#7c6af7" : "#3a3a56"
                                }`,
                                background: isSelected
                                  ? "#7c6af7"
                                  : "transparent",
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s",
                              }}
                            >
                              {isSelected && (
                                <svg
                                  width="9"
                                  height="9"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="white"
                                  strokeWidth="3.5"
                                  strokeLinecap="round"
                                >
                                  <path d="M20 6L9 17l-5-5" />
                                </svg>
                              )}
                            </div>

                            {/* Text */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: "0.85rem",
                                  fontWeight: isSelected ? 600 : 500,
                                  color: isSelected ? "#e2e2ef" : "#b0b0cc",
                                  fontFamily: "'Sora', sans-serif",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {req.name}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.7rem",
                                  color: "#4a4a66",
                                  fontFamily: "'Sora', sans-serif",
                                  marginTop: "0.1rem",
                                }}
                              >
                                {req.productCount}{" "}
                                {req.productCount === 1 ? "product" : "products"}{" "}
                                ·{" "}
                                <span
                                  style={{
                                    color:
                                      req.necessity.toLowerCase() === "required"
                                        ? "#6ee7b7"
                                        : "#fcd34d",
                                  }}
                                >
                                  {req.necessity}
                                </span>
                              </div>
                            </div>

                            {/* "Current" badge */}
                            {isCurrent && (
                              <span
                                style={{
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  color: "#a89cf7",
                                  background: "rgba(124,106,247,0.15)",
                                  border: "1px solid rgba(124,106,247,0.25)",
                                  borderRadius: 100,
                                  padding: "0.1rem 0.5rem",
                                  fontFamily: "'Sora', sans-serif",
                                  flexShrink: 0,
                                }}
                              >
                                Current
                              </span>
                            )}

                            {/* Category pill */}
                            <span
                              style={{
                                fontSize: "0.63rem",
                                fontWeight: 700,
                                color: categoryTextColors[cat] ?? "#6b6b8a",
                                background:
                                  categoryColors[cat] ??
                                  "rgba(255,255,255,0.06)",
                                borderRadius: 100,
                                padding: "0.1rem 0.5rem",
                                fontFamily: "'Sora', sans-serif",
                                flexShrink: 0,
                              }}
                            >
                              {cat}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Feedback banners ─────────────────────────── */}
          {(error || success) && (
            <div style={{ padding: "0 1.75rem 0.75rem" }}>
              {error && (
                <div
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: 10,
                    padding: "0.65rem 1rem",
                    fontSize: "0.8rem",
                    color: "#f87171",
                    fontFamily: "'Sora', sans-serif",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{ flexShrink: 0 }}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}
              {success && (
                <div
                  style={{
                    background: "rgba(16,185,129,0.08)",
                    border: "1px solid rgba(16,185,129,0.2)",
                    borderRadius: 10,
                    padding: "0.65rem 1rem",
                    fontSize: "0.8rem",
                    color: "#6ee7b7",
                    fontFamily: "'Sora', sans-serif",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{ flexShrink: 0 }}
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {success}
                </div>
              )}
            </div>
          )}

          {/* ── Footer ──────────────────────────────────── */}
          <div
            style={{
              padding: "1rem 1.75rem",
              borderTop: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.02)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            {/* Selection hint */}
            <div
              style={{
                fontSize: "0.75rem",
                color: "#4a4a66",
                fontFamily: "'Sora', sans-serif",
              }}
            >
              {selectedId !== null ? (
                <span style={{ color: "#a89cf7" }}>
                  ✓{" "}
                  {requirements.find((r) => r.id === selectedId)?.name ??
                    "Selected"}
                </span>
              ) : currentTemplateId !== null ? (
                <span style={{ color: "#f87171" }}>Will unassign</span>
              ) : (
                "No requirement selected"
              )}
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={onClose}
                disabled={loading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.55rem 1.1rem",
                  borderRadius: 10,
                  fontFamily: "'Sora', sans-serif",
                  fontSize: "0.83rem",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#b0b0cc",
                  opacity: loading ? 0.5 : 1,
                  transition: "all 0.18s",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={
                  loading ||
                  fetching ||
                  (selectedId === currentTemplateId && selectedId !== null)
                }
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.55rem 1.25rem",
                  borderRadius: 10,
                  fontFamily: "'Sora', sans-serif",
                  fontSize: "0.83rem",
                  fontWeight: 600,
                  cursor:
                    loading ||
                    fetching ||
                    (selectedId === currentTemplateId && selectedId !== null)
                      ? "not-allowed"
                      : "pointer",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #7c6af7, #5a47e0)",
                  color: "#fff",
                  boxShadow: "0 4px 16px rgba(124,106,247,0.3)",
                  opacity:
                    loading ||
                    fetching ||
                    (selectedId === currentTemplateId && selectedId !== null)
                      ? 0.5
                      : 1,
                  transition: "all 0.18s",
                }}
              >
                {loading ? (
                  <>
                    <svg
                      style={{
                        animation: "arm-spin 0.7s linear infinite",
                      }}
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        d="M21 12a9 9 0 11-6.219-8.56"
                        strokeLinecap="round"
                      />
                    </svg>
                    Saving…
                  </>
                ) : selectedId === null && currentTemplateId !== null ? (
                  "Unassign"
                ) : (
                  "Assign Requirement"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes arm-fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes arm-slideUp { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: none; } }
        @keyframes arm-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes arm-spin    { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}