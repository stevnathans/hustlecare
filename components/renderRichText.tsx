/**
 * renderRichText.tsx
 *
 * Parses the lightweight markdown-superset stored by RichTextEditor and
 * returns React elements for the public-facing guide pages.
 *
 * Supported syntax:
 *   **text**          → <strong>
 *   ## heading        → <h2>
 *   ### heading       → <h3>
 *   #### heading      → <h4>
 *   - item            → <ul><li>
 *   [label](url)      → <a>
 *   | col | col |     → <table>
 *   [1]               → superscript reference badge (clickable)
 *   :::type … :::     → inline callout block
 *   blank line        → paragraph break
 */

import React from 'react';
import { AlertTriangle, Info, Lightbulb, FileText, BookOpen, ExternalLink } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RenderReference {
  id:        number;
  refNumber: number;
  title:     string;
  url:       string;
}

interface RenderProps {
  text:       string;
  references: RenderReference[];
  onRefClick: (ref: RenderReference) => void;
  className?: string;
}

// ── Callout config ────────────────────────────────────────────────────────────

const CALLOUT_CFG = {
  tips:       { label: 'Tips',       Icon: Lightbulb,     bg: '#f0fdf4', border: '#86efac', titleColor: '#166534', textColor: '#15803d', iconColor: '#16a34a' },
  warning:    { label: 'Warning',    Icon: AlertTriangle,  bg: '#fef2f2', border: '#fca5a5', titleColor: '#991b1b', textColor: '#b91c1c', iconColor: '#dc2626' },
  note:       { label: 'Note',       Icon: FileText,       bg: '#eff6ff', border: '#93c5fd', titleColor: '#1e3a8a', textColor: '#1d4ed8', iconColor: '#2563eb' },
  info:       { label: 'Info',       Icon: Info,           bg: '#fffbeb', border: '#fcd34d', titleColor: '#92400e', textColor: '#b45309', iconColor: '#d97706' },
  conclusion: { label: 'Conclusion', Icon: BookOpen,       bg: '#faf5ff', border: '#c4b5fd', titleColor: '#4c1d95', textColor: '#6d28d9', iconColor: '#7c3aed' },
} as const;

type CalloutType = keyof typeof CALLOUT_CFG;

// ── Inline span parser: bold + links + refs ───────────────────────────────────

function parseInline(
  raw: string,
  references: RenderReference[],
  onRefClick: (r: RenderReference) => void,
  keyPrefix: string,
): React.ReactNode[] {
  // Tokenise: **bold**, [label](url), [n] ref markers
  const tokens = raw.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|\[\d+\])/g);

  return tokens.map((tok, i) => {
    const key = `${keyPrefix}-${i}`;

    // Bold
    if (/^\*\*[^*]+\*\*$/.test(tok)) {
      return <strong key={key}>{tok.slice(2, -2)}</strong>;
    }

    // Link [label](url)
    const linkMatch = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={key}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#059669', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: 2 }}
        >
          {linkMatch[1]}
          <ExternalLink style={{ width: 11, height: 11, flexShrink: 0 }} />
        </a>
      );
    }

    // Reference [n]
    const refMatch = tok.match(/^\[(\d+)\]$/);
    if (refMatch) {
      const num = parseInt(refMatch[1], 10);
      const ref = references.find(r => r.refNumber === num);
      if (!ref) return <span key={key} style={{ color: '#9ca3af' }}>{tok}</span>;
      return (
        <button
          key={key}
          onClick={() => onRefClick(ref)}
          title={ref.title}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 18, height: 18, borderRadius: 4,
            fontSize: '0.6rem', fontWeight: 700,
            background: 'rgba(5,150,105,0.12)', color: '#059669',
            border: '1px solid rgba(5,150,105,0.25)',
            verticalAlign: 'super', cursor: 'pointer',
            lineHeight: 1, marginLeft: 1, flexShrink: 0,
          }}
        >
          {num}
        </button>
      );
    }

    // Plain text — preserve line-break within a paragraph
    return <span key={key}>{tok}</span>;
  });
}

// ── Table parser ──────────────────────────────────────────────────────────────

function parseTable(lines: string[], references: RenderReference[], onRefClick: (r: RenderReference) => void, key: string) {
  // lines[0] = header row, lines[1] = separator, lines[2..] = data rows
  const parseRow = (line: string) =>
    line.replace(/^\||\|$/g, '').split('|').map(c => c.trim());

  const headers  = parseRow(lines[0]);
  const dataRows = lines.slice(2).map(parseRow);

  return (
    <div key={key} style={{ overflowX: 'auto', margin: '0.75rem 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', background: '#f0fdf4', borderBottom: '2px solid #86efac', color: '#166534', fontWeight: 700, whiteSpace: 'nowrap' }}>
                {parseInline(h, references, onRefClick, `th-${key}-${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#f9fafb' }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: '0.45rem 0.75rem', borderBottom: '1px solid #e5e7eb', color: '#374151' }}>
                  {parseInline(cell, references, onRefClick, `td-${key}-${ri}-${ci}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Callout block ─────────────────────────────────────────────────────────────

function CalloutBlock({ type, content, references, onRefClick, blockKey }: {
  type:       CalloutType;
  content:    string;
  references: RenderReference[];
  onRefClick: (r: RenderReference) => void;
  blockKey:   string;
}) {
  const cfg  = CALLOUT_CFG[type];
  const Icon = cfg.Icon;
  return (
    <div style={{
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: 12,
      padding: '0.85rem 1rem',
      margin: '0.75rem 0',
      display: 'flex',
      gap: '0.75rem',
    }}>
      <div style={{ flexShrink: 0, paddingTop: 2 }}>
        <Icon style={{ width: 16, height: 16, color: cfg.iconColor }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: cfg.titleColor, marginBottom: '0.25rem' }}>{cfg.label}</div>
        <div style={{ fontSize: '0.84rem', color: cfg.textColor, lineHeight: 1.65 }}>
          {/* Recursively parse the inner content (minus callouts) */}
          <RenderRichTextInner text={content} references={references} onRefClick={onRefClick} keyPrefix={blockKey} />
        </div>
      </div>
    </div>
  );
}

// ── Block-level parser (used recursively for callout content) ─────────────────

function RenderRichTextInner({ text, references, onRefClick, keyPrefix }: {
  text:       string;
  references: RenderReference[];
  onRefClick: (r: RenderReference) => void;
  keyPrefix:  string;
}) {
  const lines  = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const k    = `${keyPrefix}-${i}`;

    // Empty line → potential paragraph gap (handled by spacing between nodes)
    if (line.trim() === '') { i++; continue; }

    // Table — starts and ends with |
    if (/^\|.+\|$/.test(line.trim())) {
      const tableLines: string[] = [];
      while (i < lines.length && /^\|.+\|$/.test(lines[i].trim())) {
        tableLines.push(lines[i]);
        i++;
      }
      if (tableLines.length >= 2) {
        nodes.push(parseTable(tableLines, references, onRefClick, k));
      }
      continue;
    }

    // Callout :::type
    const calloutOpen = line.match(/^:::(\w+)\s*$/);
    if (calloutOpen) {
      const type    = calloutOpen[1].toLowerCase() as CalloutType;
      const content: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ':::') {
        content.push(lines[i]);
        i++;
      }
      i++; // skip closing :::
      if (CALLOUT_CFG[type]) {
        nodes.push(
          <CalloutBlock key={k} type={type} content={content.join('\n')} references={references} onRefClick={onRefClick} blockKey={k} />
        );
      }
      continue;
    }

    // Headings
    const h2 = line.match(/^## (.+)$/);
    if (h2) { nodes.push(<h2 key={k} style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: '1rem 0 0.4rem', lineHeight: 1.3 }}>{parseInline(h2[1], references, onRefClick, k)}</h2>); i++; continue; }

    const h3 = line.match(/^### (.+)$/);
    if (h3) { nodes.push(<h3 key={k} style={{ fontSize: '0.97rem', fontWeight: 700, color: '#1f2937', margin: '0.85rem 0 0.35rem', lineHeight: 1.3 }}>{parseInline(h3[1], references, onRefClick, k)}</h3>); i++; continue; }

    const h4 = line.match(/^#### (.+)$/);
    if (h4) { nodes.push(<h4 key={k} style={{ fontSize: '0.88rem', fontWeight: 700, color: '#374151', margin: '0.75rem 0 0.3rem', lineHeight: 1.3 }}>{parseInline(h4[1], references, onRefClick, k)}</h4>); i++; continue; }

    // Bullet list — collect consecutive bullet lines
    if (line.match(/^- /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^- /)) {
        items.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <ul key={k} style={{ paddingLeft: '1.4rem', margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.3rem', listStyleType: 'disc' }}>
          {items.map((item, j) => (
            <li key={j} style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.65, display: 'list-item' }}>
              {parseInline(item, references, onRefClick, `${k}-li-${j}`)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Paragraph — collect non-empty, non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].match(/^#{1,6} /) &&
      !lines[i].match(/^- /) &&
      !lines[i].match(/^:::/) &&
      !/^\|.+\|$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      nodes.push(
        <p key={k} style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: 1.75, margin: '0.4rem 0' }}>
          {parseInline(paraLines.join(' '), references, onRefClick, k)}
        </p>
      );
    }
  }

  return <>{nodes}</>;
}

// ── Public export ─────────────────────────────────────────────────────────────

export function RenderRichText({ text, references, onRefClick, className }: RenderProps) {
  if (!text) return null;
  return (
    <div className={className} style={{ lineHeight: 1.75 }}>
      <RenderRichTextInner text={text} references={references} onRefClick={onRefClick} keyPrefix="root" />
    </div>
  );
}