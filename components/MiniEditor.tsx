'use client';

import { useRef, useState } from 'react';
import {
  Bold, Italic, Heading2, Heading3, Heading4,
  List, ListOrdered, Link as LinkIcon, Table,
  Minus, Quote,
} from 'lucide-react';

interface ReferenceDraft {
  refNumber: number;
  title: string;
  url: string;
}

interface MiniEditorProps {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  references?: ReferenceDraft[];
}

// ── Toolbar button ────────────────────────────────────────────────────────────

function TB({
  icon: Icon, label, onClick, active,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      style={{
        display:         'inline-flex',
        alignItems:      'center',
        justifyContent:  'center',
        width:           28,
        height:          28,
        borderRadius:    6,
        border:          'none',
        cursor:          'pointer',
        background:      active ? 'rgba(16,185,129,0.18)' : 'transparent',
        color:           active ? '#34d399' : '#9494b0',
        transition:      'all 0.12s',
        flexShrink:      0,
      }}
      onMouseEnter={e => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)';
        (e.currentTarget as HTMLButtonElement).style.color = '#f0f0f5';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = active ? 'rgba(16,185,129,0.18)' : 'transparent';
        (e.currentTarget as HTMLButtonElement).style.color = active ? '#34d399' : '#9494b0';
      }}
    >
      <Icon size={14} />
    </button>
  );
}

function TBSep() {
  return <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)', margin: '0 2px', flexShrink: 0 }} />;
}

// ── Link insertion modal ──────────────────────────────────────────────────────

function LinkModal({ onInsert, onClose }: { onInsert: (text: string, url: string) => void; onClose: () => void }) {
  const [text, setText] = useState('');
  const [url,  setUrl]  = useState('');
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '1.25rem', width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}
      >
        <p style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#f0f0f5', marginBottom: '0.85rem' }}>Insert Link</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <input
            autoFocus
            type="text"
            placeholder="Link text"
            value={text}
            onChange={e => setText(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 7, padding: '0.5rem 0.75rem', color: '#f0f0f5', fontFamily: 'Sora,sans-serif', fontSize: '0.83rem', outline: 'none', boxSizing: 'border-box' }}
          />
          <input
            type="url"
            placeholder="https://…"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && text && url) onInsert(text, url); }}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 7, padding: '0.5rem 0.75rem', color: '#f0f0f5', fontFamily: 'Sora,sans-serif', fontSize: '0.83rem', outline: 'none', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
            <button onClick={onClose} style={{ padding: '0.4rem 0.8rem', borderRadius: 7, border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.05)', color: '#9494b0', fontFamily: 'Sora,sans-serif', fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
            <button
              onClick={() => { if (text && url) onInsert(text, url); }}
              style={{ padding: '0.4rem 0.8rem', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', fontFamily: 'Sora,sans-serif', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Insert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Table insertion modal ─────────────────────────────────────────────────────

function TableModal({ onInsert, onClose }: { onInsert: (rows: number, cols: number) => void; onClose: () => void }) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '1.25rem', width: '100%', maxWidth: 300, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}
      >
        <p style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#f0f0f5', marginBottom: '0.85rem' }}>Insert Table</p>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.85rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.72rem', color: '#9494b0', fontFamily: 'Sora,sans-serif', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Rows</label>
            <input type="number" min={1} max={20} value={rows} onChange={e => setRows(Number(e.target.value))}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 7, padding: '0.45rem 0.65rem', color: '#f0f0f5', fontFamily: 'Sora,sans-serif', fontSize: '0.83rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.72rem', color: '#9494b0', fontFamily: 'Sora,sans-serif', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Columns</label>
            <input type="number" min={1} max={10} value={cols} onChange={e => setCols(Number(e.target.value))}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 7, padding: '0.45rem 0.65rem', color: '#f0f0f5', fontFamily: 'Sora,sans-serif', fontSize: '0.83rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button onClick={onClose} style={{ padding: '0.4rem 0.8rem', borderRadius: 7, border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.05)', color: '#9494b0', fontFamily: 'Sora,sans-serif', fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onInsert(rows, cols)} style={{ padding: '0.4rem 0.8rem', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', fontFamily: 'Sora,sans-serif', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Insert</button>
        </div>
      </div>
    </div>
  );
}

// ── Main MiniEditor ───────────────────────────────────────────────────────────

export default function MiniEditor({ value, onChange, rows = 6, placeholder, references = [] }: MiniEditorProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [showLinkModal,  setShowLinkModal]  = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);

  // Insert text at cursor, replacing selection
  function insert(before: string, after = '', defaultText = '') {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const sel   = value.slice(start, end) || defaultText;
    const next  = value.slice(0, start) + before + sel + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + before.length + sel.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  // Insert a block at the start of current line
  function insertLinePrefix(prefix: string) {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + prefix.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  function insertRef(refNumber: number) {
    insert(`[${refNumber}]`);
  }

  function insertLink(text: string, url: string) {
    insert(`[${text}](${url})`);
    setShowLinkModal(false);
  }

  function insertTable(rows: number, cols: number) {
    const header = '| ' + Array(cols).fill('Header').map((h, i) => `${h} ${i + 1}`).join(' | ') + ' |';
    const sep    = '| ' + Array(cols).fill('---').join(' | ') + ' |';
    const row    = '| ' + Array(cols).fill('Cell').join(' | ') + ' |';
    const rows_  = Array(rows - 1).fill(row).join('\n');
    const table  = `\n${header}\n${sep}\n${rows_}\n`;
    insert(table);
    setShowTableModal(false);
  }

  return (
    <>
      {showLinkModal  && <LinkModal  onInsert={insertLink}  onClose={() => setShowLinkModal(false)}  />}
      {showTableModal && <TableModal onInsert={insertTable} onClose={() => setShowTableModal(false)} />}

      <div style={{ border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.03)' }}>

        {/* ── Toolbar ── */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          gap:            2,
          padding:        '0.4rem 0.6rem',
          background:     'rgba(255,255,255,0.02)',
          borderBottom:   '1px solid rgba(255,255,255,0.06)',
          flexWrap:       'wrap',
        }}>
          <TB icon={Bold}         label="Bold (**text**)"          onClick={() => insert('**', '**', 'bold text')} />
          <TB icon={Italic}       label="Italic (*text*)"          onClick={() => insert('*', '*', 'italic text')} />
          <TBSep />
          <TB icon={Heading2}     label="Heading 2 (## text)"      onClick={() => insertLinePrefix('## ')} />
          <TB icon={Heading3}     label="Heading 3 (### text)"     onClick={() => insertLinePrefix('### ')} />
          <TB icon={Heading4}     label="Heading 4 (#### text)"    onClick={() => insertLinePrefix('#### ')} />
          <TBSep />
          <TB icon={List}         label="Bullet list (- item)"     onClick={() => insertLinePrefix('- ')} />
          <TB icon={ListOrdered}  label="Numbered list (1. item)"  onClick={() => insertLinePrefix('1. ')} />
          <TB icon={Quote}        label="Blockquote (> text)"      onClick={() => insertLinePrefix('> ')} />
          <TBSep />
          <TB icon={LinkIcon}     label="Insert link"              onClick={() => setShowLinkModal(true)} />
          <TB icon={Table}        label="Insert table"             onClick={() => setShowTableModal(true)} />
          <TB icon={Minus}        label="Horizontal rule (---)"    onClick={() => insert('\n---\n')} />
          <TBSep />
          {/* Reference cite buttons */}
          {references.length > 0 && (
            <>
              <span style={{ fontSize: '0.65rem', color: '#3a3a56', fontWeight: 600, fontFamily: 'Sora,sans-serif', marginLeft: 2 }}>Cite:</span>
              {references.map(ref => (
                <button
                  key={ref.refNumber}
                  type="button"
                  onClick={() => insertRef(ref.refNumber)}
                  title={`Insert [${ref.refNumber}] — ${ref.title}`}
                  style={{
                    display:        'inline-flex',
                    alignItems:     'center',
                    gap:            3,
                    padding:        '0.15rem 0.45rem',
                    borderRadius:   5,
                    background:     'rgba(16,185,129,0.1)',
                    border:         '1px solid rgba(16,185,129,0.2)',
                    color:          '#34d399',
                    fontFamily:     'DM Mono,monospace',
                    fontSize:       '0.67rem',
                    fontWeight:     700,
                    cursor:         'pointer',
                    whiteSpace:     'nowrap',
                  }}
                >
                  [{ref.refNumber}]
                  <span style={{ color: '#55556e', fontWeight: 400, fontFamily: 'Sora,sans-serif', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ref.title}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>

        {/* ── Textarea ── */}
        <textarea
          ref={taRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          style={{
            width:       '100%',
            background:  'transparent',
            border:      'none',
            outline:     'none',
            resize:      'vertical',
            padding:     '0.75rem 1rem',
            color:       '#f0f0f5',
            fontFamily:  'DM Mono,monospace',
            fontSize:    '0.83rem',
            lineHeight:  1.7,
            boxSizing:   'border-box',
            minHeight:   rows * 24,
          }}
        />

        {/* ── Syntax hint ── */}
        <div style={{ padding: '0.3rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '0.65rem', color: '#2a2a3e', fontFamily: 'DM Mono,monospace', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span>**bold**</span>
          <span>*italic*</span>
          <span>## h2</span>
          <span>- list</span>
          <span>[text](url)</span>
          <span>{'| col |'}</span>
        </div>
      </div>
    </>
  );
}