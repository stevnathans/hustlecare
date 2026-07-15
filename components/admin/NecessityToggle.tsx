// components/admin/NecessityToggle.tsx
//
// Shared "necessity" control used by both the Requirement Library admin page
// and the Businesses admin page's requirements modal. Previously this was
// two near-identical component definitions copy-pasted into each page —
// extracted here so future necessity/demand changes only need to happen once.
//
// Renders as pill-style toggle buttons for the standard Required/Optional
// scale, or as a dropdown for demand-scale categories (currently just
// "Stock"), since a 3-way scale gets cramped as pill buttons. The category →
// option-list mapping lives in lib/necessity.ts.
//
// Self-contained with inline styles (not dependent on either admin page's
// local <style> block) so it renders identically regardless of which page
// it's used in.

'use client';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { necessityOptions, necessityStyle, isDemandCategory } from '@/lib/necessity';

interface NecessityToggleProps {
  templateId: number;
  businessId: number;
  linkId: number;
  /** The requirement's category — determines which necessity/demand scale applies. */
  category: string;
  /** The template's default necessity value. */
  necessity: string;
  /** This business's override, or null if inheriting from the template. */
  necOverride: string | null;
  /** The template's default necessity — shown in the "inherited · X" label. */
  templateNecessity: string;
  onUpdated: (linkId: number, override: string | null) => void;
}

export default function NecessityToggle({
  templateId,
  businessId,
  linkId,
  category,
  necessity,
  necOverride,
  templateNecessity,
  onUpdated,
}: NecessityToggleProps) {
  const [saving, setSaving] = useState(false);
  const effective = necOverride ?? necessity;
  const options = necessityOptions(category);

  async function setOverride(value: string | null) {
    setSaving(true);
    try {
      const r = await fetch(`/api/requirements/${templateId}/businesses`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, necessityOverride: value }),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error); }
      onUpdated(linkId, value);
      toast.success(
        value === null
          ? `Reverted to template default (${templateNecessity})`
          : `Set to ${value} for this business`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  function handlePillClick(value: string) {
    if (saving) return;
    if (effective === value) {
      if (necOverride !== null) setOverride(null); // reset to inherited
    } else {
      setOverride(value);
    }
  }

  const inheritedLabel = (
    <div
      style={{
        fontSize: '0.63rem',
        color: '#55556e',
        fontFamily: 'Sora,sans-serif',
        display: 'flex',
        alignItems: 'center',
        gap: '0.2rem',
        justifyContent: 'flex-end',
        marginTop: '0.15rem',
      }}
    >
      {necOverride !== null ? (
        <>
          <span style={{ color: '#a78bfa' }}>overridden</span>
          <button
            onClick={() => !saving && setOverride(null)}
            style={{
              color: '#55556e',
              textDecoration: 'underline',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              fontSize: '0.63rem',
              fontFamily: 'Sora,sans-serif',
              padding: 0,
            }}
          >
            reset
          </button>
        </>
      ) : (
        <span>inherited · {templateNecessity}</span>
      )}
    </div>
  );

  // ── Dropdown variant — used for demand-scale categories (e.g. Stock),
  // where a 3+ way scale doesn't fit comfortably as pill buttons.
  if (isDemandCategory(category)) {
    const style = necessityStyle(category, effective);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
        <select
          value={effective}
          disabled={saving}
          onChange={(e) => {
            const value = e.target.value;
            setOverride(value === templateNecessity ? null : value);
          }}
          style={{
            padding: '0.25rem 1.6rem 0.25rem 0.6rem',
            fontSize: '0.72rem',
            fontWeight: 700,
            fontFamily: 'Sora,sans-serif',
            color: style.hexColor,
            background: style.hexBg,
            border: `1px solid ${style.hexColor}33`,
            borderRadius: 7,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.5 : 1,
            outline: 'none',
          }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} style={{ background: '#1a1a24', color: '#f0f0f5' }}>
              {o.label}
            </option>
          ))}
        </select>
        {inheritedLabel}
      </div>
    );
  }

  // ── Pill-button variant — Required/Optional and any other 2-option scale.
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
      <div
        style={{
          display: 'inline-flex',
          borderRadius: 7,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
          opacity: saving ? 0.5 : 1,
          pointerEvents: saving ? 'none' : 'auto',
        }}
      >
        {options.map((o) => {
          const isActive = effective === o.value;
          return (
            <button
              key={o.value}
              onClick={() => handlePillClick(o.value)}
              style={{
                padding: '0.22rem 0.65rem',
                fontSize: '0.68rem',
                fontWeight: 700,
                fontFamily: 'Sora,sans-serif',
                cursor: 'pointer',
                border: 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
                background: isActive ? o.hexBg : 'transparent',
                color: isActive ? o.hexColor : '#55556e',
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {inheritedLabel}
    </div>
  );
}