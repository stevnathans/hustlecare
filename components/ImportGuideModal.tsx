'use client';

/**
 * ImportGuideModal.tsx
 *
 * Lets the admin paste an LLM-generated article (in the plain-text
 * template format defined by lib/importGuideText.ts) and apply it to
 * the guide editor's state in one shot, instead of copy-pasting each
 * step/section/FAQ/reference by hand.
 */

import { useState } from 'react';
import {
  Upload, X, Copy, Check, AlertTriangle, AlertCircle,
  FileText, Lightbulb, ListChecks, HelpCircle, Link as LinkIcon,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { parseGuideText, GUIDE_IMPORT_PROMPT, type ParsedGuide } from 'lib/importGuideText';

interface Props {
  bizName: string;
  hasExistingContent: boolean;
  onApply: (parsed: ParsedGuide) => void;
  onClose: () => void;
}

const modalStyles = `
  .imp-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:9999; display:flex; align-items:center; justify-content:center; padding:1rem; backdrop-filter:blur(4px); }
  .imp-box { background:#1a1a24; border:1px solid rgba(255,255,255,0.1); border-radius:14px; width:100%; max-width:640px; max-height:88vh; box-shadow:0 24px 80px rgba(0,0,0,0.55); display:flex; flex-direction:column; overflow:hidden; font-family:'Sora',sans-serif; }
  .imp-header { padding:1.25rem 1.5rem; border-bottom:1px solid rgba(255,255,255,0.07); display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-shrink:0; }
  .imp-body { padding:1.25rem 1.5rem; overflow-y:auto; display:flex; flex-direction:column; gap:1rem; }
  .imp-footer { padding:1rem 1.5rem; border-top:1px solid rgba(255,255,255,0.07); display:flex; justify-content:space-between; align-items:center; gap:0.75rem; flex-shrink:0; }
  .imp-ta { width:100%; min-height:220px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.8rem 0.95rem; color:#f0f0f5; font-family:'DM Mono',monospace; font-size:0.78rem; line-height:1.6; outline:none; resize:vertical; box-sizing:border-box; }
  .imp-ta::placeholder { color:#3a3a56; font-family:'Sora',sans-serif; }
  .imp-ta:focus { border-color:rgba(16,185,129,0.4); box-shadow:0 0 0 3px rgba(16,185,129,0.1); }
  .imp-prompt-box { background:rgba(99,102,241,0.06); border:1px solid rgba(99,102,241,0.18); border-radius:9px; padding:0.9rem 1rem; display:flex; gap:0.75rem; align-items:flex-start; }
  .imp-msg-list { display:flex; flex-direction:column; gap:0.4rem; }
  .imp-msg { display:flex; gap:0.5rem; align-items:flex-start; font-size:0.78rem; line-height:1.5; padding:0.55rem 0.75rem; border-radius:7px; }
  .imp-msg-error { background:rgba(239,68,68,0.1); color:#fca5a5; border:1px solid rgba(239,68,68,0.2); }
  .imp-msg-warning { background:rgba(245,158,11,0.08); color:#fcd34d; border:1px solid rgba(245,158,11,0.18); }
  .imp-summary { display:grid; grid-template-columns:repeat(auto-fit,minmax(110px,1fr)); gap:0.6rem; }
  .imp-summary-card { background:rgba(16,185,129,0.07); border:1px solid rgba(16,185,129,0.18); border-radius:9px; padding:0.7rem 0.85rem; display:flex; flex-direction:column; gap:0.2rem; }
  .imp-summary-num { font-family:'DM Mono',monospace; font-size:1.3rem; font-weight:700; color:#34d399; }
  .imp-summary-label { font-size:0.7rem; color:#9494b0; font-weight:600; }
`;

export function ImportGuideModal({ bizName, hasExistingContent, onApply, onClose }: Props) {
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ParsedGuide | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  function handleParse() {
    const { result, errors: e, warnings: w } = parseGuideText(text);
    setErrors(e);
    setWarnings(w);
    setParsed(result);
    if (result && e.length === 0) {
      toast.success('Article parsed — review below and apply');
    }
  }

  async function copyPrompt() {
    const prompt = GUIDE_IMPORT_PROMPT.replace('[BUSINESS TYPE]', bizName || '[BUSINESS TYPE]');
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success('Prompt copied — paste it into Claude or ChatGPT');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy — select and copy the prompt manually');
    }
  }

  function handleApply() {
    if (!parsed) return;
    onApply(parsed);
    onClose();
  }

  return (
    <>
      <style>{modalStyles}</style>
      <div className="imp-overlay" onClick={onClose}>
        <div className="imp-box" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="imp-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.3rem' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload size={15} color="#34d399" />
                </div>
                <h2 style={{ fontSize: '1.02rem', fontWeight: 700, color: '#f0f0f5' }}>Import Article</h2>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#55556e' }}>
                Paste a formatted article to auto-fill the title, intro, steps, sections, FAQs, and references.
              </p>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={15} /></button>
          </div>

          <div className="imp-body">

            {/* Prompt helper */}
            <div className="imp-prompt-box">
              <Lightbulb size={16} color="#a5b4fc" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e0e0f0', marginBottom: '0.25rem' }}>
                  Don&apos;t have a formatted article yet?
                </p>
                <p style={{ fontSize: '0.76rem', color: '#9494b0', marginBottom: '0.6rem', lineHeight: 1.5 }}>
                  Copy this prompt into Claude or ChatGPT — it tells the model exactly how to format the article so it pastes in cleanly below.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" style={{ fontSize: '0.76rem', padding: '0.4rem 0.8rem' }} onClick={copyPrompt}>
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? 'Copied!' : 'Copy Prompt'}
                  </button>
                  <button className="btn btn-ghost" style={{ fontSize: '0.76rem', padding: '0.4rem 0.8rem' }} onClick={() => setShowPrompt(v => !v)}>
                    {showPrompt ? 'Hide prompt' : 'View prompt'}
                  </button>
                </div>
                {showPrompt && (
                  <pre style={{ marginTop: '0.7rem', background: 'rgba(0,0,0,0.3)', borderRadius: 7, padding: '0.75rem', fontSize: '0.7rem', color: '#9494b0', whiteSpace: 'pre-wrap', maxHeight: 220, overflowY: 'auto', fontFamily: "'DM Mono',monospace" }}>
                    {GUIDE_IMPORT_PROMPT.replace('[BUSINESS TYPE]', bizName || '[BUSINESS TYPE]')}
                  </pre>
                )}
              </div>
            </div>

            {/* Paste area */}
            <div>
              <label className="f-label">Paste Formatted Article</label>
              <textarea
                className="imp-ta"
                placeholder={`# TITLE\nHow To Start a ${bizName || '[Business]'} Business In Kenya\n\n# INTRO\n…\n\n# STEP\nStep title\n…\n\n# FAQ\nQuestion?\nAnswer\n\n# REFERENCE 1: Source | https://…`}
                value={text}
                onChange={e => { setText(e.target.value); setParsed(null); setErrors([]); setWarnings([]); }}
              />
            </div>

            <button className="btn btn-success" style={{ alignSelf: 'flex-start' }} onClick={handleParse} disabled={!text.trim()}>
              <FileText size={14} /> Parse Article
            </button>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="imp-msg-list">
                {errors.map((err, i) => (
                  <div key={i} className="imp-msg imp-msg-error">
                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="imp-msg-list">
                {warnings.map((w, i) => (
                  <div key={i} className="imp-msg imp-msg-warning">
                    <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Preview summary */}
            {parsed && errors.length === 0 && (
              <div>
                <label className="f-label" style={{ marginBottom: '0.55rem' }}>Ready to Apply</label>
                <div className="imp-summary">
                  <div className="imp-summary-card">
                    <span className="imp-summary-num">{parsed.steps.length}</span>
                    <span className="imp-summary-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><ListChecks size={11} /> Steps</span>
                  </div>
                  <div className="imp-summary-card">
                    <span className="imp-summary-num">{parsed.sections.length}</span>
                    <span className="imp-summary-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><FileText size={11} /> Sections</span>
                  </div>
                  <div className="imp-summary-card">
                    <span className="imp-summary-num">{parsed.faqs.length}</span>
                    <span className="imp-summary-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><HelpCircle size={11} /> FAQs</span>
                  </div>
                  <div className="imp-summary-card">
                    <span className="imp-summary-num">{parsed.references.length}</span>
                    <span className="imp-summary-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><LinkIcon size={11} /> Refs</span>
                  </div>
                </div>
                {parsed.title && (
                  <p style={{ fontSize: '0.78rem', color: '#9494b0', marginTop: '0.65rem' }}>
                    Title: <span style={{ color: '#f0f0f5', fontWeight: 600 }}>{parsed.title}</span>
                  </p>
                )}
                {hasExistingContent && (
                  <div className="imp-msg imp-msg-warning" style={{ marginTop: '0.65rem' }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>This guide already has content. Applying will <strong>replace</strong> all existing steps, sections, FAQs, and references — the title and intro will only be replaced if the import includes them. This won&apos;t save until you click &quot;Save Guide&quot; afterward.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="imp-footer">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleApply} disabled={!parsed || errors.length > 0}>
              <Upload size={14} /> Apply to Editor
            </button>
          </div>

        </div>
      </div>
    </>
  );
}