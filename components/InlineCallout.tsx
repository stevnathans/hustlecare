'use client';

import { useState } from 'react';
import { AlertTriangle, Info, Lightbulb, FileText, BookOpen, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import MiniEditor from './MiniEditor';

export type CalloutType = 'NOTE' | 'INFO' | 'WARNING' | 'TIPS' | 'CONCLUSION';

export interface CalloutDraft {
  _key:    string;
  type:    CalloutType;
  content: string;
}

export const CALLOUT_META: Record<CalloutType, {
  label:  string;
  color:  string;
  bg:     string;
  border: string;
  Icon:   React.ElementType;
}> = {
  NOTE:       { label: 'Note',       color: '#60a5fa', bg: 'rgba(59,130,246,0.08)',   border: 'rgba(59,130,246,0.2)',   Icon: FileText      },
  INFO:       { label: 'Info',       color: '#fbbf24', bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.2)',   Icon: Info          },
  WARNING:    { label: 'Warning',    color: '#f87171', bg: 'rgba(239,68,68,0.08)',    border: 'rgba(239,68,68,0.2)',    Icon: AlertTriangle },
  TIPS:       { label: 'Tip',        color: '#34d399', bg: 'rgba(16,185,129,0.08)',   border: 'rgba(16,185,129,0.2)',   Icon: Lightbulb     },
  CONCLUSION: { label: 'Conclusion', color: '#a78bfa', bg: 'rgba(139,92,246,0.08)',   border: 'rgba(139,92,246,0.2)',   Icon: BookOpen      },
};

interface ReferenceDraft {
  refNumber: number;
  title:     string;
  url:       string;
}

// ── Single callout block ──────────────────────────────────────────────────────

function CalloutBlock({
  callout, references, onChange, onRemove,
}: {
  callout:    CalloutDraft;
  references: ReferenceDraft[];
  onChange:   (patch: Partial<CalloutDraft>) => void;
  onRemove:   () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const meta = CALLOUT_META[callout.type];
  const Icon = meta.Icon;

  return (
    <div style={{
      border:       `1px solid ${meta.border}`,
      borderRadius: 9,
      overflow:     'hidden',
      background:   meta.bg,
      marginTop:    '0.5rem',
    }}>
      {/* Header */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.55rem 0.75rem', cursor: 'pointer' }}
        onClick={() => setExpanded(v => !v)}
      >
        <Icon size={13} color={meta.color} style={{ flexShrink: 0 }} />
        {/* Type selector */}
        <select
          value={callout.type}
          onClick={e => e.stopPropagation()}
          onChange={e => onChange({ type: e.target.value as CalloutType })}
          style={{
            background:  'transparent',
            border:      'none',
            color:       meta.color,
            fontFamily:  'Sora,sans-serif',
            fontSize:    '0.72rem',
            fontWeight:  700,
            cursor:      'pointer',
            outline:     'none',
            padding:     0,
          }}
        >
          {(Object.keys(CALLOUT_META) as CalloutType[]).map(t => (
            <option key={t} value={t} style={{ background: '#1a1a24', color: '#f0f0f5' }}>
              {CALLOUT_META[t].label}
            </option>
          ))}
        </select>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onRemove(); }}
          style={{ background: 'none', border: 'none', color: '#55556e', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
        >
          <Trash2 size={12} />
        </button>
        {expanded
          ? <ChevronUp   size={13} color="#55556e" style={{ flexShrink: 0 }} />
          : <ChevronDown size={13} color="#55556e" style={{ flexShrink: 0 }} />
        }
      </div>

      {/* Editor */}
      {expanded && (
        <div style={{ padding: '0 0.75rem 0.75rem' }}>
          <MiniEditor
            value={callout.content}
            onChange={v => onChange({ content: v })}
            rows={3}
            placeholder={`Write your ${meta.label.toLowerCase()} here…`}
            references={references}
          />
        </div>
      )}
    </div>
  );
}

// ── Callout list (used inside step / intro / section) ─────────────────────────

interface CalloutListProps {
  callouts:   CalloutDraft[];
  onChange:   (callouts: CalloutDraft[]) => void;
  references: ReferenceDraft[];
}

let _ck = 0;
const cuid = () => `c${++_ck}`;

export default function CalloutList({ callouts, onChange, references }: CalloutListProps) {
  const [open, setOpen] = useState(false);

  function add(type: CalloutType) {
    onChange([...callouts, { _key: cuid(), type, content: '' }]);
    setOpen(false);
  }

  function update(key: string, patch: Partial<CalloutDraft>) {
    onChange(callouts.map(c => c._key === key ? { ...c, ...patch } : c));
  }

  function remove(key: string) {
    onChange(callouts.filter(c => c._key !== key));
  }

  return (
    <div>
      {callouts.map(c => (
        <CalloutBlock
          key={c._key}
          callout={c}
          references={references}
          onChange={patch => update(c._key, patch)}
          onRemove={() => remove(c._key)}
        />
      ))}

      {/* Add callout dropdown */}
      <div style={{ position: 'relative', display: 'inline-block', marginTop: callouts.length > 0 ? '0.4rem' : '0.25rem' }}>
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          style={{
            display:     'inline-flex',
            alignItems:  'center',
            gap:         '0.3rem',
            padding:     '0.25rem 0.65rem',
            borderRadius: 6,
            border:      '1px dashed rgba(16,185,129,0.3)',
            background:  'rgba(16,185,129,0.05)',
            color:       '#34d399',
            fontFamily:  'Sora,sans-serif',
            fontSize:    '0.72rem',
            fontWeight:  600,
            cursor:      'pointer',
          }}
        >
          <Plus size={11} /> Add callout
        </button>

        {open && (
          <div style={{
            position:   'absolute',
            top:        '110%',
            left:       0,
            zIndex:     100,
            background: '#1a1a24',
            border:     '1px solid rgba(255,255,255,0.1)',
            borderRadius: 9,
            padding:    '0.35rem',
            boxShadow:  '0 8px 32px rgba(0,0,0,0.4)',
            display:    'flex',
            flexDirection: 'column',
            gap:        '0.15rem',
            minWidth:   140,
          }}>
            {(Object.entries(CALLOUT_META) as [CalloutType, typeof CALLOUT_META[CalloutType]][]).map(([type, meta]) => {
              const Icon = meta.Icon;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => add(type)}
                  style={{
                    display:     'flex',
                    alignItems:  'center',
                    gap:         '0.5rem',
                    padding:     '0.45rem 0.65rem',
                    borderRadius: 6,
                    border:      'none',
                    background:  'transparent',
                    color:       meta.color,
                    fontFamily:  'Sora,sans-serif',
                    fontSize:    '0.78rem',
                    fontWeight:  600,
                    cursor:      'pointer',
                    textAlign:   'left',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Icon size={13} /> {meta.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}