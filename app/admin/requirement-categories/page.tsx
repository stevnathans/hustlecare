// app/admin/requirement-categories/page.tsx
//
// The missing piece from step 3: RequirementCategory.defaultCostRecurrence
// existed in the schema and the cost engine already reads it, but nothing
// in the admin UI could ever set it away from its ONE_TIME default — which
// is exactly why "Operating Expenses" (or any category) always showed
// KES 0 for monthly running costs regardless of what products existed in
// it. This page is the fix: pick a category, pick ONE_TIME / MONTHLY /
// ANNUAL, save. Takes effect immediately everywhere the cost engine runs —
// no other change needed.
//
// Deliberately minimal — one field, one save action per row — rather than
// a full category editor (name/slug/color/etc.), since those aren't
// missing anything today and touching them risks fields this page can't
// see the full shape of.

'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type CostRecurrence = 'ONE_TIME' | 'MONTHLY' | 'ANNUAL';

type CategoryRow = {
  id: number;
  name: string;
  defaultCostRecurrence?: CostRecurrence;
};

const RECURRENCE_OPTIONS: { value: CostRecurrence; label: string; hint: string }[] = [
  { value: 'ONE_TIME', label: 'One-time', hint: 'Counted once, in the setup total (most categories)' },
  { value: 'MONTHLY', label: 'Monthly', hint: 'Counted as a running cost — e.g. Operating Expenses, rent' },
  { value: 'ANNUAL', label: 'Annual', hint: 'Counted as a running cost, divided across 12 months' },
];

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');
  .adm { font-family:'Sora',sans-serif; color:#f0f0f5; }
  .adm-mono { font-family:'DM Mono',monospace; }
  .u-select { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.55rem 2rem 0.55rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; cursor:pointer; appearance:none; background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2355556e' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 0.7rem center; min-width:160px; }
  .u-select:focus { border-color:rgba(99,102,241,0.5); }
  .u-select option { background:#1a1a24; }
  .btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.5rem 1rem; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.82rem; font-weight:600; cursor:pointer; border:none; transition:all 0.15s; white-space:nowrap; }
  .btn-primary { background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; box-shadow:0 4px 14px rgba(99,102,241,0.3); }
  .btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
  .row { display:flex; align-items:center; gap:1rem; padding:0.9rem 1.25rem; border-bottom:1px solid rgba(255,255,255,0.04); }
  .row:last-child { border-bottom:none; }
  .row:hover { background:rgba(255,255,255,0.02); }
  .panel { background:#13131a; border:1px solid rgba(255,255,255,0.07); border-radius:14px; overflow:hidden; }
  .warn-note { margin-top:0.6rem; font-size:0.78rem; color:#fbbf24; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2); border-radius:8px; padding:0.6rem 0.8rem; line-height:1.5; }
  .dirty-dot { width:7px; height:7px; border-radius:50%; background:#fbbf24; flex-shrink:0; }
`;

export default function RequirementCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Record<number, CostRecurrence>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetch('/api/admin/requirement-categories')
      .then((r) => r.json())
      .then((data: CategoryRow[]) => {
        setCategories(Array.isArray(data) ? data : []);
        const initial: Record<number, CostRecurrence> = {};
        (Array.isArray(data) ? data : []).forEach((c) => {
          initial[c.id] = c.defaultCostRecurrence ?? 'ONE_TIME';
        });
        setDraft(initial);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function isDirty(cat: CategoryRow): boolean {
    return draft[cat.id] !== undefined && draft[cat.id] !== (cat.defaultCostRecurrence ?? 'ONE_TIME');
  }

  async function handleSave(cat: CategoryRow) {
    const value = draft[cat.id];
    if (!value) return;
    setSavingId(cat.id);
    try {
      const r = await fetch(`/api/admin/requirement-categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultCostRecurrence: value }),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || 'Failed to save');
      }
      // Optimistic update — the cost engine reads this immediately on the
      // next request regardless, but keep local state in sync so the
      // "dirty" dot clears without a re-fetch.
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, defaultCostRecurrence: value } : c)),
      );
      showToast(`${cat.name} set to ${RECURRENCE_OPTIONAL_LABEL(value)}.`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to save', 'error');
    } finally {
      setSavingId(null);
    }
  }

  function RECURRENCE_OPTIONAL_LABEL(v: CostRecurrence) {
    return RECURRENCE_OPTIONS.find((o) => o.value === v)?.label ?? v;
  }

  return (
    <div className="adm" style={{ minHeight: '100vh' }}>
      <style>{S}</style>

      {toast && (
        <div
          style={{
            position: 'fixed', top: '1rem', right: '1rem', zIndex: 99999,
            padding: '0.75rem 1.25rem', borderRadius: 11, fontSize: '0.84rem',
            fontFamily: 'Sora,sans-serif', fontWeight: 600,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: toast.type === 'success' ? '#6ee7b7' : '#fca5a5', maxWidth: 420,
          }}
        >
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.35rem' }}>
          Requirement Category Cost Behaviour
        </h1>
        <p style={{ fontSize: '0.84rem', color: '#55556e', maxWidth: 640, lineHeight: 1.5 }}>
          Controls how each category is treated by the cost engine: <strong style={{ color: '#9494b0' }}>one-time</strong>{' '}
          items count toward the setup total shown on{' '}
          <Link href="#" style={{ color: '#a78bfa' }}>
            /cost
          </Link>{' '}
          and the requirements page; <strong style={{ color: '#9494b0' }}>monthly</strong> and{' '}
          <strong style={{ color: '#9494b0' }}>annual</strong> items count as running costs instead, folded into
          &ldquo;working capital&rdquo;. This applies to every business at once — there is no per-business
          override for this setting.
        </p>
        <div className="warn-note">
          Most categories should stay <strong>One-time</strong>. Set <strong>Operating Expenses</strong> (and any
          other genuinely recurring category, e.g. Software subscriptions if not already priced with a billing
          period) to <strong>Monthly</strong> — that&apos;s the one category this behaves incorrectly for by
          default today.
        </div>
      </div>

      <div className="panel">
        {loading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#55556e', fontSize: '0.85rem' }}>
            Loading categories…
          </div>
        ) : categories.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#3a3a56', fontSize: '0.85rem' }}>
            No categories found.
          </div>
        ) : (
          categories.map((cat) => {
            const dirty = isDirty(cat);
            return (
              <div key={cat.id} className="row">
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                  {dirty && <span className="dirty-dot" title="Unsaved change" />}
                  <span style={{ fontWeight: 600, fontSize: '0.87rem', color: '#f0f0f5' }}>{cat.name}</span>
                </div>

                <select
                  className="u-select"
                  value={draft[cat.id] ?? 'ONE_TIME'}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, [cat.id]: e.target.value as CostRecurrence }))
                  }
                >
                  {RECURRENCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>

                <button
                  className="btn btn-primary"
                  onClick={() => handleSave(cat)}
                  disabled={!dirty || savingId === cat.id}
                  style={{ minWidth: 90, justifyContent: 'center' }}
                >
                  {savingId === cat.id ? 'Saving…' : 'Save'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}