'use client';

/**
 * RichTextEditor.tsx
 * Lightweight rich-text editor for the admin guide builder.
 *
 * Storage format: a simple superset of markdown
 *   **text**           → bold
 *   ## / ### / ####   → headings
 *   - item             → bullet list
 *   [label](url)       → link
 *   | col | col |      → table (GFM-style)
 *   :::tips            → inline callout block open
 *   content
 *   :::                → inline callout block close
 *   [1]                → reference citation marker
 *
 * The front-end renderer (renderRichText) understands all of the above.
 */

import { useRef, useState, useCallback } from 'react';
import {
  Bold, Heading2, Heading3, Heading4, List, Link as LinkIcon,
  Table, Plus, X, ChevronDown,
  AlertTriangle, Info, Lightbulb, FileText, BookOpen,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type CalloutType = 'tips' | 'warning' | 'note' | 'info' | 'conclusion';

export interface ReferenceDraft {
  refNumber: number;
  title:     string;
  url:       string;
}

interface Props {
  value:       string;
  onChange:    (v: string) => void;
  rows?:       number;
  placeholder?: string;
  references?: ReferenceDraft[];
}

// ── Callout meta ──────────────────────────────────────────────────────────────

const CALLOUT_META: Record<CalloutType, { label: string; color: string; bg: string; border: string; Icon: React.ElementType }> = {
  tips:       { label: 'Tips',       color: '#059669', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)',  Icon: Lightbulb     },
  warning:    { label: 'Warning',    color: '#dc2626', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   Icon: AlertTriangle },
  note:       { label: 'Note',       color: '#2563eb', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.3)',  Icon: FileText      },
  info:       { label: 'Info',       color: '#d97706', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  Icon: Info          },
  conclusion: { label: 'Conclusion', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)', border: 'rgba(124,58,237,0.3)', Icon: BookOpen      },
};

// ── Styles ────────────────────────────────────────────────────────────────────

const editorStyles = `
  .rte-wrap { display:flex; flex-direction:column; gap:0; border:1px solid rgba(255,255,255,0.09); border-radius:10px; overflow:hidden; transition:box-shadow 0.2s; }
  .rte-wrap:focus-within { border-color:rgba(16,185,129,0.4); box-shadow:0 0 0 3px rgba(16,185,129,0.1); }
  .rte-toolbar { display:flex; flex-wrap:wrap; align-items:center; gap:0.25rem; padding:0.5rem 0.6rem; background:rgba(255,255,255,0.03); border-bottom:1px solid rgba(255,255,255,0.07); }
  .rte-btn { display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:6px; background:none; border:none; color:#6b6b8a; cursor:pointer; transition:all 0.15s; font-family:'Sora',sans-serif; font-size:0.72rem; font-weight:700; flex-shrink:0; }
  .rte-btn:hover { background:rgba(16,185,129,0.12); color:#34d399; }
  .rte-btn.active { background:rgba(16,185,129,0.15); color:#34d399; }
  .rte-sep { width:1px; height:18px; background:rgba(255,255,255,0.08); margin:0 0.2rem; flex-shrink:0; }
  .rte-ta { width:100%; background:rgba(255,255,255,0.03); border:none; padding:0.75rem 0.9rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; resize:vertical; box-sizing:border-box; line-height:1.7; min-height:120px; }
  .rte-ta::placeholder { color:#3a3a56; }
  .rte-cite-row { display:flex; align-items:center; gap:0.35rem; padding:0.4rem 0.7rem; background:rgba(255,255,255,0.02); border-bottom:1px solid rgba(255,255,255,0.05); flex-wrap:wrap; }
  .rte-ref-btn { display:inline-flex; align-items:center; gap:0.2rem; padding:0.15rem 0.45rem; border-radius:5px; background:rgba(16,185,129,0.08); color:#34d399; font-size:0.67rem; font-weight:700; font-family:'DM Mono',monospace; border:1px solid rgba(16,185,129,0.2); cursor:pointer; transition:all 0.15s; white-space:nowrap; }
  .rte-ref-btn:hover { background:rgba(16,185,129,0.18); }
  .rte-callout-dropdown { position:relative; }
  .rte-callout-menu { position:absolute; top:calc(100% + 4px); left:0; background:#1a1a26; border:1px solid rgba(255,255,255,0.1); border-radius:9px; padding:0.35rem; z-index:999; min-width:160px; box-shadow:0 8px 32px rgba(0,0,0,0.5); }
  .rte-callout-item { display:flex; align-items:center; gap:0.5rem; padding:0.45rem 0.6rem; border-radius:6px; cursor:pointer; font-size:0.78rem; font-weight:600; font-family:'Sora',sans-serif; transition:background 0.12s; }
  .rte-callout-item:hover { background:rgba(255,255,255,0.06); }
  .rte-link-modal { position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:9998; display:flex; align-items:center; justify-content:center; padding:1rem; backdrop-filter:blur(4px); }
  .rte-link-box { background:#1a1a24; border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:1.25rem; width:100%; max-width:380px; display:flex; flex-direction:column; gap:0.75rem; }
  .rte-link-inp { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:7px; padding:0.5rem 0.75rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.82rem; outline:none; box-sizing:border-box; }
  .rte-link-inp:focus { border-color:rgba(16,185,129,0.4); }
  .rte-link-actions { display:flex; justify-content:flex-end; gap:0.5rem; }
  .rte-preview-section { padding:0.75rem 0.9rem; border-top:1px solid rgba(255,255,255,0.06); display:flex; flex-direction:column; gap:0.5rem; }
  .rte-callout-preview { border-radius:8px; padding:0.6rem 0.85rem; display:flex; align-items:flex-start; gap:0.6rem; font-size:0.8rem; border:1px solid; }
`;

// ── Link Modal ────────────────────────────────────────────────────────────────

function LinkModal({ selectedText, onInsert, onClose }: {
  selectedText: string;
  onInsert:     (label: string, url: string) => void;
  onClose:      () => void;
}) {
  const [label, setLabel] = useState(selectedText || '');
  const [url,   setUrl]   = useState('https://');

  return (
    <div className="rte-link-modal" onClick={onClose}>
      <div className="rte-link-box" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f0f0f5', fontFamily: 'Sora,sans-serif' }}>Insert Link</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b6b8a', cursor: 'pointer', padding: '0.25rem' }}><X size={15} /></button>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#9494b0', marginBottom: '0.3rem', fontFamily: 'Sora,sans-serif' }}>Link Label</label>
          <input autoFocus className="rte-link-inp" value={label} onChange={e => setLabel(e.target.value)} placeholder="Link text" />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#9494b0', marginBottom: '0.3rem', fontFamily: 'Sora,sans-serif' }}>URL</label>
          <input className="rte-link-inp" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com"
            onKeyDown={e => { if (e.key === 'Enter') onInsert(label, url); }} />
        </div>
        <div className="rte-link-actions">
          <button onClick={onClose} style={{ padding: '0.4rem 0.8rem', borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: '#9494b0', fontFamily: 'Sora,sans-serif', fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onInsert(label || url, url)} style={{ padding: '0.4rem 0.9rem', borderRadius: 7, background: 'linear-gradient(135deg,#059669,#047857)', border: 'none', color: '#fff', fontFamily: 'Sora,sans-serif', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Insert</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Editor ───────────────────────────────────────────────────────────────

export function RichTextEditor({ value, onChange, rows = 6, placeholder, references = [] }: Props) {
  const taRef             = useRef<HTMLTextAreaElement>(null);
  const [showLinkModal,   setShowLinkModal]   = useState(false);
  const [showCalloutMenu, setShowCalloutMenu] = useState(false);
  const [selectedText,    setSelectedText]    = useState('');

  // ── Insert helper — inserts text at cursor, or wraps selection ──────────
  const insert = useCallback((before: string, after = '', newline = false) => {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const sel   = value.slice(start, end);
    const nl    = newline ? '\n' : '';
    const next  = value.slice(0, start) + nl + before + sel + after + nl + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const cur = start + nl.length + before.length + sel.length + after.length;
      ta.setSelectionRange(cur, cur);
    });
  }, [value, onChange]);

  // ── Toolbar actions ──────────────────────────────────────────────────────
  function wrapBold() {
    const ta = taRef.current;
    if (!ta) return;
    const sel = value.slice(ta.selectionStart, ta.selectionEnd);
    insert('**', '**');
    if (!sel) {
      // Place cursor inside the markers
      requestAnimationFrame(() => {
        const pos = ta.selectionStart - 2;
        ta.setSelectionRange(pos, pos);
      });
    }
  }

  function insertHeading(level: 2 | 3 | 4) {
    const ta = taRef.current;
    if (!ta) return;
    const lineStart = value.lastIndexOf('\n', ta.selectionStart - 1) + 1;
    const prefix = '#'.repeat(level) + ' ';
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = lineStart + prefix.length + (ta.selectionStart - lineStart);
      ta.setSelectionRange(pos, pos);
    });
  }

  function insertBullet() {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    if (start === end) {
      // Single line — prepend bullet
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const next = value.slice(0, lineStart) + '- ' + value.slice(lineStart);
      onChange(next);
      requestAnimationFrame(() => { ta.focus(); const p = start + 2; ta.setSelectionRange(p, p); });
    } else {
      // Multi-line — prepend bullet to each line in selection
      const lines = value.slice(start, end).split('\n').map(l => '- ' + l).join('\n');
      onChange(value.slice(0, start) + lines + value.slice(end));
    }
  }

  function insertTable() {
    const table = '\n| Heading 1 | Heading 2 | Heading 3 |\n| --- | --- | --- |\n| Cell | Cell | Cell |\n| Cell | Cell | Cell |\n';
    insert(table, '', false);
  }

  function insertLink(label: string, url: string) {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const markup = `[${label}](${url})`;
    const next = value.slice(0, start) + markup + value.slice(end);
    onChange(next);
    setShowLinkModal(false);
    requestAnimationFrame(() => { ta.focus(); const pos = start + markup.length; ta.setSelectionRange(pos, pos); });
  }

  function insertCallout(type: CalloutType) {
    setShowCalloutMenu(false);
    const snippet = `\n:::${type}\n${type === 'conclusion' ? 'Write your conclusion here…' : `Write your ${type} here…`}\n:::\n`;
    insert(snippet, '', false);
  }

  function insertRef(refNumber: number) {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? value.length;
    const end   = ta.selectionEnd   ?? value.length;
    const marker = `[${refNumber}]`;
    onChange(value.slice(0, start) + marker + value.slice(end));
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + marker.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  function handleLinkClick() {
    const ta = taRef.current;
    if (ta) setSelectedText(value.slice(ta.selectionStart, ta.selectionEnd));
    setShowLinkModal(true);
  }

  // ── Keyboard shortcut: Tab → indent or bullet ────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Tab') {
      e.preventDefault();
      insert('  ', '');
    }
  }

  return (
    <>
      <style>{editorStyles}</style>
      {showLinkModal && <LinkModal selectedText={selectedText} onInsert={insertLink} onClose={() => setShowLinkModal(false)} />}

      <div className="rte-wrap">
        {/* ── Toolbar ── */}
        <div className="rte-toolbar">
          <button type="button" className="rte-btn" onClick={wrapBold} title="Bold (Ctrl+B)"><Bold size={13} /></button>

          <div className="rte-sep" />

          <button type="button" className="rte-btn" onClick={() => insertHeading(2)} title="Heading 2"><Heading2 size={14} /></button>
          <button type="button" className="rte-btn" onClick={() => insertHeading(3)} title="Heading 3"><Heading3 size={14} /></button>
          <button type="button" className="rte-btn" onClick={() => insertHeading(4)} title="Heading 4"><Heading4 size={14} /></button>

          <div className="rte-sep" />

          <button type="button" className="rte-btn" onClick={insertBullet} title="Bullet list"><List size={14} /></button>
          <button type="button" className="rte-btn" onClick={insertTable}  title="Insert table"><Table size={14} /></button>
          <button type="button" className="rte-btn" onClick={handleLinkClick} title="Insert link"><LinkIcon size={13} /></button>

          <div className="rte-sep" />

          {/* Callout block dropdown */}
          <div className="rte-callout-dropdown">
            <button
              type="button"
              className={`rte-btn ${showCalloutMenu ? 'active' : ''}`}
              style={{ width: 'auto', padding: '0 0.5rem', gap: '0.25rem' }}
              onClick={() => setShowCalloutMenu(v => !v)}
              title="Insert callout block"
            >
              <Plus size={12} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Block</span>
              <ChevronDown size={10} />
            </button>
            {showCalloutMenu && (
              <div className="rte-callout-menu">
                {(Object.entries(CALLOUT_META) as [CalloutType, typeof CALLOUT_META[CalloutType]][]).map(([type, meta]) => {
                  const Icon = meta.Icon;
                  return (
                    <div key={type} className="rte-callout-item" onClick={() => insertCallout(type)}>
                      <Icon size={13} color={meta.color} />
                      <span style={{ color: meta.color }}>{meta.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Reference cite row ── */}
        {references.length > 0 && (
          <div className="rte-cite-row">
            <span style={{ fontSize: '0.67rem', color: '#55556e', fontWeight: 600 }}>Cite:</span>
            {references.map(ref => (
              <button key={ref.refNumber} type="button" className="rte-ref-btn" onClick={() => insertRef(ref.refNumber)} title={`Insert [${ref.refNumber}] — ${ref.title}`}>
                [{ref.refNumber}]
                <span style={{ color: '#55556e', fontWeight: 400, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Sora,sans-serif' }}>{ref.title}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Textarea ── */}
        <textarea
          ref={taRef}
          className="rte-ta"
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ minHeight: `${Math.max(rows, 4) * 1.7 * 14}px` }}
        />
      </div>
    </>
  );
}