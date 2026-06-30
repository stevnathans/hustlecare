'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Plus, Trash2, ChevronDown, ChevronUp, Save,
  Eye, EyeOff, ArrowLeft, GripVertical, Link as LinkIcon, X,
  AlertTriangle, Info, Lightbulb, FileText, Pencil, Check, Hash, BookOpen,
  Upload,
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { RichTextEditor, type ReferenceDraft } from 'components/RichTextEditor';
import { ImportGuideModal } from 'components/ImportGuideModal';
import type { ParsedGuide } from 'lib/importGuideText';

// ── Types ─────────────────────────────────────────────────────────────────────

type SectionType = 'TIPS' | 'WARNING' | 'NOTE' | 'INFO' | 'CONCLUSION';

interface StepDraft {
  _key: string; title: string; description: string; imageUrl: string; expanded: boolean;
}
interface SectionDraft {
  _key: string; type: SectionType; title: string; content: string; imageUrl: string; expanded: boolean;
}
interface FaqDraft {
  _key: string; question: string; answer: string; expanded: boolean;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');
  .adm { font-family:'Sora',sans-serif; color:#f0f0f5; }

  .f-label { display:block; font-size:0.76rem; font-weight:600; color:#9494b0; margin-bottom:0.35rem; }
  .f-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:6px; padding:0.6rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; transition:border-color 0.2s; box-sizing:border-box; }
  .f-input::placeholder { color:#3a3a56; }
  .f-input:focus { border-color:rgba(16,185,129,0.4); box-shadow:0 0 0 3px rgba(16,185,129,0.1); }
  .f-input-title { width:100%; background:transparent; border:none; border-bottom:1px solid rgba(255,255,255,0.09); padding:0.4rem 0.5rem 0.4rem 0; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:1.1rem; font-weight:700; outline:none; transition:border-color 0.2s; box-sizing:border-box; }
  .f-input-title::placeholder { color:#3a3a56; }
  .f-input-title:focus { border-bottom-color:rgba(16,185,129,0.4); }
  .f-textarea { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:6px; padding:0.6rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; resize:vertical; box-sizing:border-box; line-height:1.6; }
  .f-textarea::placeholder { color:#3a3a56; }
  .f-textarea:focus { border-color:rgba(16,185,129,0.4); box-shadow:0 0 0 3px rgba(16,185,129,0.1); }
  .f-select { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:6px; padding:0.6rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; cursor:pointer; box-sizing:border-box; }
  .f-select option { background:#1a1a24; }
  .f-select:focus { border-color:rgba(16,185,129,0.4); }

  .btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.5rem 1rem; border-radius:7px; font-family:'Sora',sans-serif; font-size:0.82rem; font-weight:600; cursor:pointer; border:none; transition:all 0.15s; white-space:nowrap; }
  .btn-primary { background:linear-gradient(135deg,#059669,#047857); color:#fff; box-shadow:0 2px 8px rgba(5,150,105,0.2); }
  .btn-primary:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(5,150,105,0.3); }
  .btn-primary:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
  .btn-ghost { background:rgba(255,255,255,0.06); color:#9494b0; border:1px solid rgba(255,255,255,0.09); }
  .btn-ghost:hover { background:rgba(255,255,255,0.1); color:#f0f0f5; }
  .btn-ghost:disabled { opacity:0.4; cursor:not-allowed; }
  .btn-danger { background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.2); }
  .btn-danger:hover { background:rgba(239,68,68,0.22); }
  .btn-success { background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.22); }
  .btn-success:hover { background:rgba(16,185,129,0.22); }
  .btn-icon { padding:0.4rem; border-radius:6px; }
  .btn-add { background:rgba(16,185,129,0.06); color:#34d399; border:1px dashed rgba(16,185,129,0.28); border-radius:8px; padding:0.7rem 1rem; width:100%; justify-content:center; font-size:0.82rem; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:0.4rem; font-family:'Sora',sans-serif; transition:all 0.15s; }
  .btn-add:hover { background:rgba(16,185,129,0.12); border-color:rgba(16,185,129,0.45); }

  .card { background:#13131a; border:1px solid rgba(255,255,255,0.07); border-radius:10px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.15); }
  .card-header { display:flex; align-items:center; gap:0.75rem; padding:0.95rem 1.5rem; cursor:pointer; user-select:none; transition:background 0.15s; }
  .card-header:hover { background:rgba(255,255,255,0.025); }
  .card-body { padding:1.4rem 1.5rem; border-top:1px solid rgba(255,255,255,0.06); display:flex; flex-direction:column; gap:1rem; }

  .step-num { width:30px; height:30px; border-radius:50%; background:linear-gradient(135deg,#059669,#047857); color:#fff; display:flex; align-items:center; justify-content:center; font-size:0.72rem; font-weight:700; flex-shrink:0; }
  .hint { font-size:0.72rem; color:#55556e; margin-top:0.25rem; }

  .ref-row { display:flex; align-items:flex-start; gap:0.75rem; padding:0.85rem; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:8px; }
  .ref-num-badge { width:26px; height:26px; border-radius:5px; background:rgba(16,185,129,0.12); color:#34d399; font-size:0.75rem; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-family:'DM Mono',monospace; margin-top:1px; }

  .ref-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:9999; display:flex; align-items:center; justify-content:center; padding:1rem; backdrop-filter:blur(4px); }
  .ref-modal { background:#1a1a24; border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:1.5rem; width:100%; max-width:440px; box-shadow:0 8px 40px rgba(0,0,0,0.5); }

  .title-display { font-size:1.1rem; font-weight:700; color:#f0f0f5; flex:1; }
  .title-edit-btn { background:none; border:none; color:#55556e; cursor:pointer; padding:0.25rem; border-radius:5px; display:flex; align-items:center; transition:color 0.15s; }
  .title-edit-btn:hover { color:#34d399; }
  .unsaved-dot { width:7px; height:7px; border-radius:50%; background:#f59e0b; display:inline-block; margin-left:0.4rem; vertical-align:middle; }

  .section-header-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.85rem; }
  .format-hint { font-size:0.7rem; color:#3a3a56; margin-top:0.3rem; line-height:1.5; }
  .format-hint code { background:rgba(16,185,129,0.1); color:#34d399; border-radius:3px; padding:0 3px; font-family:'DM Mono',monospace; font-size:0.68rem; }

  .scroll::-webkit-scrollbar { width:4px; }
  .scroll::-webkit-scrollbar-track { background:transparent; }
  .scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }

  .adm-inner { max-width:1080px; margin:0 auto; padding:1.5rem 2rem 5rem; }
  @media (max-width:768px) { .adm-inner { padding:1.25rem 1rem 5rem; } }
`;

let _keyCounter = 0;
const uid = () => `k${++_keyCounter}`;

const SECTION_TYPE_META: Record<SectionType, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  TIPS:       { label: 'Tips',       color: '#34d399', bg: 'rgba(16,185,129,0.12)',  Icon: Lightbulb     },
  WARNING:    { label: 'Warning',    color: '#f87171', bg: 'rgba(239,68,68,0.12)',   Icon: AlertTriangle },
  NOTE:       { label: 'Note',       color: '#60a5fa', bg: 'rgba(59,130,246,0.12)',  Icon: FileText      },
  INFO:       { label: 'Info',       color: '#fbbf24', bg: 'rgba(245,158,11,0.12)',  Icon: Info          },
  CONCLUSION: { label: 'Conclusion', color: '#c084fc', bg: 'rgba(124,58,237,0.12)', Icon: BookOpen      },
};

function defaultTitle(bizName: string) {
  return bizName ? `How To Start a ${bizName} Business In Kenya` : '';
}

// ── AddReferenceModal ─────────────────────────────────────────────────────────

function AddReferenceModal({ nextNumber, onAdd, onClose }: {
  nextNumber: number; onAdd: (ref: ReferenceDraft) => void; onClose: () => void;
}) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const urlRef = useRef<HTMLInputElement>(null);
  useEffect(() => { urlRef.current?.focus(); }, []);

  function handleUrlBlur() {
    if (url && !title) {
      try { setTitle(new URL(url).hostname.replace(/^www\./, '')); } catch {}
    }
  }
  function handleAdd() {
    if (!url.trim()) { toast.error('URL is required'); return; }
    if (!title.trim()) { toast.error('Title is required'); return; }
    onAdd({ refNumber: nextNumber, title: title.trim(), url: url.trim() });
    onClose();
  }

  return (
    <div className="ref-modal-overlay" onClick={onClose}>
      <div className="ref-modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <div style={{ width: 26, height: 26, borderRadius: 5, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'DM Mono,monospace', fontSize: '0.75rem', fontWeight: 700, color: '#34d399' }}>{nextNumber}</span>
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: 'Sora,sans-serif', color: '#f0f0f5' }}>Add Reference</h3>
            </div>
            <p style={{ fontSize: '0.74rem', color: '#55556e', fontFamily: 'Sora,sans-serif' }}>
              Cited as <code style={{ background: 'rgba(16,185,129,0.12)', borderRadius: 4, padding: '0 4px', color: '#34d399' }}>[{nextNumber}]</code> in your text
            </p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={15} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label className="f-label">Source URL</label>
            <input ref={urlRef} type="url" className="f-input" placeholder="https://example.com/article" value={url} onChange={e => setUrl(e.target.value)} onBlur={handleUrlBlur} />
          </div>
          <div>
            <label className="f-label">Source Title</label>
            <input type="text" className="f-input" placeholder="e.g. Kenya Business Registration Act 2015" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }} />
            <p className="hint">Auto-filled from the URL — edit to be more descriptive.</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', paddingTop: '0.25rem' }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd}><Plus size={14} /> Add Reference [{nextNumber}]</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────

function SectionHeader({ title, count, children }: { title: string; count?: number; children?: React.ReactNode }) {
  return (
    <div className="section-header-row">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{ fontSize: '1rem', fontWeight: 700 }}>{title}</span>
        {count !== undefined && (
          <span style={{ fontSize: '0.72rem', background: 'rgba(16,185,129,0.1)', color: '#34d399', borderRadius: '100px', padding: '0.12rem 0.5rem', fontWeight: 700 }}>{count}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function FormatHint() {
  return (
    <p className="format-hint">
      <code>**bold**</code> · <code>## H2</code> <code>### H3</code> · <code>- bullet</code> · <code>[label](url)</code> · <code>| col |</code> table · Use <strong style={{ color: '#55556e' }}>+ Block</strong> to insert callouts inline
    </p>
  );
}

// ── ReferenceRow ──────────────────────────────────────────────────────────────

function ReferenceRow({ ref_, onUpdate, onRemove }: {
  ref_: ReferenceDraft; index: number;
  onUpdate: (n: number, p: Partial<Pick<ReferenceDraft, 'title' | 'url'>>) => void;
  onRemove: (n: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(ref_.title);
  const [draftUrl, setDraftUrl] = useState(ref_.url);

  function save() {
    if (!draftTitle.trim() || !draftUrl.trim()) return;
    onUpdate(ref_.refNumber, { title: draftTitle.trim(), url: draftUrl.trim() });
    setEditing(false);
  }

  return (
    <div className="ref-row">
      <div className="ref-num-badge">{ref_.refNumber}</div>
      {editing ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          <input autoFocus type="text" className="f-input" style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }} value={draftTitle} onChange={e => setDraftTitle(e.target.value)} placeholder="Source title" />
          <input type="url" className="f-input" style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }} value={draftUrl} onChange={e => setDraftUrl(e.target.value)} placeholder="https://…" onKeyDown={e => { if (e.key === 'Enter') save(); }} />
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className="btn btn-ghost" style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem' }} onClick={save}><Check size={12} color="#34d399" /> Save</button>
            <button className="btn btn-ghost" style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem' }} onClick={() => { setDraftTitle(ref_.title); setDraftUrl(ref_.url); setEditing(false); }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f0f0f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ref_.title}</div>
          <div style={{ fontSize: '0.73rem', color: '#55556e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.1rem' }}>{ref_.url}</div>
        </div>
      )}
      {!editing && (
        <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => setEditing(true)}><Pencil size={12} /></button>
          <button className="btn btn-danger btn-icon" onClick={() => onRemove(ref_.refNumber)}><X size={13} /></button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HowToStartAdminPage() {
  const params = useParams();
  const router = useRouter();
  const bizId  = Number(params.id);

  const [bizName,  setBizName]  = useState('');
  const [bizSlug,  setBizSlug]  = useState('');
  const [guideExists,     setGuideExists]     = useState(false);
  const [title,           setTitle]           = useState('');
  const [editingTitle,    setEditingTitle]    = useState(false);
  const [intro,           setIntro]           = useState('');
  const [isPublished,     setIsPublished]     = useState(false);
  const [metaTitle,       setMetaTitle]       = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords,        setKeywords]        = useState('');
  const [steps,      setSteps]      = useState<StepDraft[]>([]);
  const [sections,   setSections]   = useState<SectionDraft[]>([]);
  const [faqs,       setFaqs]       = useState<FaqDraft[]>([]);
  const [references, setReferences] = useState<ReferenceDraft[]>([]);

  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [isDirty,       setIsDirty]       = useState(false);
  const [showSEO,       setShowSEO]       = useState(false);
  const [showRefModal,  setShowRefModal]  = useState(false);
  const [showRefsPanel, setShowRefsPanel] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);

  // ── FIX: Track when initial load has fully completed so that the
  // isDirty effect and the bizName/guideExists effect don't fire
  // during the load sequence and overwrite freshly-loaded content.
  const initialLoadDone = useRef(false);

  const nextRefNumber = references.length > 0 ? Math.max(...references.map(r => r.refNumber)) + 1 : 1;

  // ── FIX: Only mark dirty after the initial load has finished.
  // Previously this effect fired for every setState call inside load(),
  // which (a) set isDirty=true mid-load and (b) interfered with the
  // bizName effect that resets the title.
  useEffect(() => {
    if (!initialLoadDone.current) return;
    setIsDirty(true);
  }, [title, intro, isPublished, metaTitle, metaDescription, keywords, steps, sections, faqs, references]);

  // ── Build the save payload from current state (shared by handleSave
  // and handleTogglePublished so they always send identical shapes).
  const buildPayload = useCallback((publishedOverride?: boolean) => ({
    title: title || defaultTitle(bizName),
    intro: intro || null,
    isPublished: publishedOverride !== undefined ? publishedOverride : isPublished,
    metaTitle: metaTitle || null,
    metaDescription: metaDescription || null,
    keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
    steps: steps.map(s => ({ title: s.title, description: s.description, imageUrl: s.imageUrl || null })),
    sections: sections.map(s => ({ type: s.type, title: s.title, content: s.content, imageUrl: s.imageUrl || null })),
    faqs: faqs.map(f => ({ question: f.question, answer: f.answer })),
    references,
  }), [title, bizName, intro, isPublished, metaTitle, metaDescription, keywords, steps, sections, faqs, references]);

  const load = useCallback(async () => {
    initialLoadDone.current = false;
    setLoading(true);
    try {
      // Fetch business metadata
      const bRes = await fetch('/api/admin/businesses');
      let loadedBizName = '';
      if (bRes.ok) {
        const all = await bRes.json();
        const biz = all.find((b: { id: number; name: string; slug: string }) => b.id === bizId);
        if (biz) {
          loadedBizName = biz.name;
          setBizName(biz.name);
          setBizSlug(biz.slug);
          // Set a default title immediately so it's available if there's no guide
          setTitle(defaultTitle(biz.name));
        }
      }

      // Fetch guide
      const gRes = await fetch(`/api/admin/businesses/${bizId}/how-to-start`);
      if (!gRes.ok) return;
      const { guide } = await gRes.json();

      if (!guide) {
        // No guide yet — keep the default title we set above
        setIsDirty(false);
        return;
      }

      // ── FIX: Set all guide state in one synchronous sequence, then
      // mark load as done. We also strip DB-only fields (id, createdAt,
      // updatedAt) from references so only the ReferenceDraft shape is
      // stored, preventing stale data from reaching the save payload.
      setGuideExists(true);
      setTitle(guide.title ?? defaultTitle(loadedBizName));
      setIntro(guide.intro ?? '');
      setIsPublished(guide.isPublished ?? false);
      setMetaTitle(guide.metaTitle ?? '');
      setMetaDescription(guide.metaDescription ?? '');
      setKeywords((guide.keywords ?? []).join(', '));
      setSteps((guide.steps ?? []).map((s: { title: string; description: string; imageUrl?: string }) => ({
        _key: uid(), title: s.title, description: s.description, imageUrl: s.imageUrl ?? '', expanded: false,
      })));
      setSections((guide.sections ?? []).map((s: { type: SectionType; title: string; content: string; imageUrl?: string }) => ({
        _key: uid(), type: s.type, title: s.title, content: s.content, imageUrl: s.imageUrl ?? '', expanded: false,
      })));
      setFaqs((guide.faqs ?? []).map((f: { question: string; answer: string }) => ({
        _key: uid(), question: f.question, answer: f.answer, expanded: false,
      })));
      // Strip DB-only fields — only keep the three ReferenceDraft fields
      setReferences((guide.references ?? []).map((r: { refNumber: number; title: string; url: string }) => ({
        refNumber: r.refNumber,
        title: r.title,
        url: r.url,
      })));
      setIsDirty(false);
    } catch (e) {
      toast.error('Failed to load guide');
      console.error(e);
    } finally {
      setLoading(false);
      // ── FIX: Mark load complete *after* all state setters have been
      // called. React batches the state updates above, so by the time
      // any effect re-runs after this render, initialLoadDone is true
      // and the bizName/guideExists effect below will no longer fire.
      initialLoadDone.current = true;
    }
  }, [bizId]);

  useEffect(() => { load(); }, [load]);

  // ── FIX: This effect previously ran immediately after setBizName()
  // inside load(), before setGuideExists(true) had taken effect, so it
  // would see guideExists=false and overwrite all the loaded content
  // with a bare default title. The initialLoadDone guard prevents that.
  useEffect(() => {
    if (initialLoadDone.current && bizName && !guideExists) {
      setTitle(defaultTitle(bizName));
      setIsDirty(false);
    }
  }, [bizName, guideExists]);

  // ── Save (full) ───────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/businesses/${bizId}/how-to-start`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      setGuideExists(true);
      setIsDirty(false);
      toast.success('Guide saved!');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  // ── FIX: Toggle publish and immediately persist so that the Guides
  // list page always reflects the true DB state. Previously the toggle
  // only changed local state, so the two pages would show different
  // values until the user manually clicked Save.
  async function handleTogglePublished() {
    const newValue = !isPublished;
    setIsPublished(newValue);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/businesses/${bizId}/how-to-start`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(newValue)),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      setGuideExists(true);
      setIsDirty(false);
      toast.success(newValue ? 'Guide published!' : 'Guide set to draft');
    } catch (e) {
      // Revert optimistic update on failure
      setIsPublished(!newValue);
      toast.error(e instanceof Error ? e.message : 'Failed to update status');
    } finally {
      setSaving(false);
    }
  }

  // ── Import handler ────────────────────────────────────────────────────────
  // Maps the parsed article (from the paste-in template format) onto the
  // same draft shapes the editor already manages by hand. Title/intro/meta
  // are only overwritten if the import actually included them, so a
  // partial paste (e.g. just new FAQs) won't blank out existing fields —
  // but steps/sections/faqs/references are always fully replaced, since
  // there's no reliable way to "merge" an ordered list import.
  function handleApplyImport(parsed: ParsedGuide) {
    if (parsed.title) setTitle(parsed.title);
    if (parsed.intro) setIntro(parsed.intro);
    if (parsed.metaTitle) setMetaTitle(parsed.metaTitle);
    if (parsed.metaDescription) setMetaDescription(parsed.metaDescription);
    if (parsed.keywords) setKeywords(parsed.keywords);

    if (parsed.steps.length > 0) {
      setSteps(parsed.steps.map(s => ({
        _key: uid(), title: s.title, description: s.description, imageUrl: s.imageUrl, expanded: false,
      })));
    }
    if (parsed.sections.length > 0) {
      setSections(parsed.sections.map(s => ({
        _key: uid(), type: s.type, title: s.title, content: s.content, imageUrl: s.imageUrl, expanded: false,
      })));
    }
    if (parsed.faqs.length > 0) {
      setFaqs(parsed.faqs.map(f => ({
        _key: uid(), question: f.question, answer: f.answer, expanded: false,
      })));
    }
    if (parsed.references.length > 0) {
      setReferences(parsed.references);
    }

    toast.success('Article applied — review the fields below, then Save Guide');
  }

  // ── Reference helpers ─────────────────────────────────────────────────────

  function handleAddReference(ref: ReferenceDraft) { setReferences(p => [...p, ref]); toast.success(`Reference [${ref.refNumber}] added`); }
  function removeReference(n: number) { setReferences(p => p.filter(r => r.refNumber !== n)); }
  function updateReference(n: number, patch: Partial<Pick<ReferenceDraft, 'title' | 'url'>>) { setReferences(p => p.map(r => r.refNumber === n ? { ...r, ...patch } : r)); }

  // ── Step helpers ──────────────────────────────────────────────────────────

  function addStep()  { setSteps(p => [...p, { _key: uid(), title: '', description: '', imageUrl: '', expanded: true }]); }
  function removeStep(k: string) { setSteps(p => p.filter(s => s._key !== k)); }
  function updateStep(k: string, patch: Partial<StepDraft>) { setSteps(p => p.map(s => s._key === k ? { ...s, ...patch } : s)); }
  function toggleStep(k: string) { setSteps(p => p.map(s => s._key === k ? { ...s, expanded: !s.expanded } : s)); }

  // ── Section helpers ───────────────────────────────────────────────────────

  function addSection() { setSections(p => [...p, { _key: uid(), type: 'TIPS', title: '', content: '', imageUrl: '', expanded: true }]); }
  function removeSection(k: string) { setSections(p => p.filter(s => s._key !== k)); }
  function updateSection(k: string, patch: Partial<SectionDraft>) { setSections(p => p.map(s => s._key === k ? { ...s, ...patch } : s)); }
  function toggleSection(k: string) { setSections(p => p.map(s => s._key === k ? { ...s, expanded: !s.expanded } : s)); }

  // ── FAQ helpers ───────────────────────────────────────────────────────────

  function addFaq()  { setFaqs(p => [...p, { _key: uid(), question: '', answer: '', expanded: true }]); }
  function removeFaq(k: string) { setFaqs(p => p.filter(f => f._key !== k)); }
  function updateFaq(k: string, patch: Partial<FaqDraft>) { setFaqs(p => p.map(f => f._key === k ? { ...f, ...patch } : f)); }
  function toggleFaq(k: string) { setFaqs(p => p.map(f => f._key === k ? { ...f, expanded: !f.expanded } : f)); }

  const previewUrl = (guideExists && isPublished && bizSlug) ? `/businesses/${bizSlug}/how-to-start` : null;
  const hasExistingContent = steps.length > 0 || sections.length > 0 || faqs.length > 0 || references.length > 0;

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) return (
    <div className="adm" style={{ padding: '2rem' }}>
      <style>{S}</style>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 1080 }}>
        {[1,2,3].map(i => <div key={i} style={{ height: 80, borderRadius: 10, background: 'linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />)}
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{S}</style>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a24', color: '#f0f0f5', border: '1px solid rgba(255,255,255,0.09)' } }} />
      {showRefModal && <AddReferenceModal nextNumber={nextRefNumber} onAdd={handleAddReference} onClose={() => setShowRefModal(false)} />}
      {showImportModal && (
        <ImportGuideModal
          bizName={bizName}
          hasExistingContent={hasExistingContent}
          onApply={handleApplyImport}
          onClose={() => setShowImportModal(false)}
        />
      )}

      <div className="adm adm-inner">

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <button className="btn btn-ghost" style={{ marginBottom: '0.75rem', fontSize: '0.78rem', padding: '0.35rem 0.75rem' }} onClick={() => router.push('/admin/guides')}>
              <ArrowLeft size={13} /> Back to Guides
            </button>
            <p style={{ fontSize: '0.82rem', color: '#55556e' }}>
              {bizName ? <span style={{ color: '#34d399' }}>{bizName}</span> : `Business #${bizId}`}
              {bizSlug && <><span style={{ color: '#3a3a56', margin: '0 0.35rem' }}>·</span><span style={{ fontFamily: 'DM Mono,monospace', fontSize: '0.76rem' }}>/businesses/{bizSlug}/how-to-start</span></>}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" onClick={() => setShowImportModal(true)}>
              <Upload size={14} /> Import Article
            </button>
            {/* FIX: onClick calls handleTogglePublished (auto-saves) instead of bare setIsPublished */}
            <button
              className={isPublished ? 'btn btn-success' : 'btn btn-ghost'}
              onClick={handleTogglePublished}
              disabled={saving}
            >
              {isPublished ? <Eye size={14} /> : <EyeOff size={14} />}
              {isPublished ? 'Published' : 'Draft'}
            </button>
            {previewUrl ? (
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ textDecoration: 'none' }}><Eye size={14} /> Preview</a>
            ) : (
              <button className="btn btn-ghost" disabled style={{ opacity: 0.4, cursor: 'not-allowed' }}><Eye size={14} /> Preview</button>
            )}
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <Save size={14} />{saving ? 'Saving…' : 'Save Guide'}
              {isDirty && !saving && <span className="unsaved-dot" />}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* References panel */}
          <div className="card">
            <div style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <LinkIcon size={15} color="#9494b0" />
                <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>References</span>
                {references.length > 0 && <span style={{ fontSize: '0.72rem', background: 'rgba(16,185,129,0.1)', color: '#34d399', borderRadius: '100px', padding: '0.12rem 0.5rem', fontWeight: 700 }}>{references.length}</span>}
                <span style={{ fontSize: '0.72rem', color: '#3a3a56' }}>·</span>
                <span style={{ fontSize: '0.72rem', color: '#55556e' }}>Auto-rendered at the end of the public article</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '0.38rem 0.8rem' }} onClick={() => setShowRefModal(true)}><Plus size={13} /> Add Reference</button>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowRefsPanel(v => !v)}>{showRefsPanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
              </div>
            </div>
            {showRefsPanel && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '0.85rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {references.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                    <Hash size={24} style={{ margin: '0 auto 0.5rem', display: 'block', opacity: 0.2 }} />
                    <p style={{ fontSize: '0.82rem', color: '#3a3a56', fontWeight: 600, marginBottom: '0.25rem' }}>No references yet</p>
                    <p style={{ fontSize: '0.74rem', color: '#2a2a3e' }}>Add a reference, then use the <strong style={{ color: '#3a3a5a' }}>Cite</strong> buttons in the editor to insert [1], [2] etc.</p>
                  </div>
                ) : references.map((ref, i) => <ReferenceRow key={ref.refNumber} ref_={ref} index={i} onUpdate={updateReference} onRemove={removeReference} />)}
              </div>
            )}
          </div>

          {/* Guide title */}
          <div className="card">
            <div style={{ padding: '1.4rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label className="f-label">
                Guide Title
                {!editingTitle && <button className="title-edit-btn" style={{ display: 'inline-flex', marginLeft: '0.4rem', verticalAlign: 'middle' }} onClick={() => setEditingTitle(true)}><Pencil size={11} /></button>}
              </label>
              {editingTitle ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input autoFocus type="text" className="f-input-title" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') setEditingTitle(false); }} placeholder={defaultTitle(bizName)} />
                  <button className="btn btn-ghost btn-icon" onClick={() => setEditingTitle(false)}><Check size={14} color="#34d399" /></button>
                  <button className="btn btn-ghost btn-icon" onClick={() => { setTitle(defaultTitle(bizName)); setEditingTitle(false); }} style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', color: '#55556e' }}>Reset</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'text', padding: '0.4rem 0' }} onClick={() => setEditingTitle(true)}>
                  <span className="title-display">{title || defaultTitle(bizName) || 'How To Start a … Business In Kenya'}</span>
                  <Pencil size={13} color="#55556e" style={{ flexShrink: 0 }} />
                </div>
              )}
              <p className="hint">Auto-filled from the business name. Click to customise.</p>
            </div>
          </div>

          {/* Intro */}
          <div className="card">
            <div style={{ padding: '1.4rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '1rem', fontWeight: 700 }}>Introduction</span>
                <p className="hint" style={{ marginTop: '0.2rem' }}>Give readers an overview. Use the toolbar to add formatting, callout blocks, and citation markers.</p>
              </div>
              <RichTextEditor value={intro} onChange={setIntro} rows={8} placeholder="Start with why this business is worth starting, who it's for, and what the reader will learn…" references={references} />
              <FormatHint />
            </div>
          </div>

          {/* Steps */}
          <div>
            <SectionHeader title="Steps" count={steps.length}>
              <button className="btn btn-ghost" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }} onClick={() => setSteps(p => p.map(s => ({ ...s, expanded: false })))}>Collapse all</button>
            </SectionHeader>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {steps.map((step, i) => (
                <div key={step._key} className="card">
                  <div className="card-header" onClick={() => toggleStep(step._key)}>
                    <GripVertical size={14} color="#3a3a56" style={{ flexShrink: 0 }} />
                    <div className="step-num">{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: step.title ? '#f0f0f5' : '#3a3a56' }}>{step.title || 'Untitled step'}</div>
                      {!step.expanded && step.description && <div style={{ fontSize: '0.74rem', color: '#55556e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.1rem' }}>{step.description.replace(/[#*\[\]:]/g, '').slice(0, 90)}</div>}
                    </div>
                    <button className="btn btn-danger btn-icon" onClick={e => { e.stopPropagation(); removeStep(step._key); }}><Trash2 size={13} /></button>
                    {step.expanded ? <ChevronUp size={15} color="#55556e" /> : <ChevronDown size={15} color="#55556e" />}
                  </div>
                  {step.expanded && (
                    <div className="card-body">
                      <div>
                        <label className="f-label">Step Title</label>
                        <input type="text" className="f-input" placeholder="e.g. Register your business name" value={step.title} onChange={e => updateStep(step._key, { title: e.target.value })} />
                      </div>
                      <div>
                        <label className="f-label">Step Image URL <span style={{ color: '#3a3a56', fontWeight: 400 }}>(optional)</span></label>
                        <input
                          type="text"
                          className="f-input"
                          placeholder="https://…"
                          value={step.imageUrl}
                          onChange={e => updateStep(step._key, { imageUrl: e.target.value })}
                        />
                        <p className="hint">A photo or illustration shown alongside this step on the public guide.</p>
                      </div>
                      <div>
                        <label className="f-label">Description</label>
                        <RichTextEditor value={step.description} onChange={v => updateStep(step._key, { description: v })} rows={6} placeholder="Explain what to do in this step, why it matters, any tips or warnings…" references={references} />
                        <FormatHint />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <button className="btn-add" onClick={addStep}><Plus size={15} /> Add Step</button>
            </div>
          </div>

          {/* Additional Sections */}
          <div>
            <SectionHeader title="Additional Sections" count={sections.length}>
              <button className="btn btn-ghost" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }} onClick={() => setSections(p => p.map(s => ({ ...s, expanded: false })))}>Collapse all</button>
            </SectionHeader>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {sections.map((sec) => {
                const meta = SECTION_TYPE_META[sec.type];
                const Icon = meta.Icon;
                return (
                  <div key={sec._key} className="card">
                    <div className="card-header" onClick={() => toggleSection(sec._key)}>
                      <GripVertical size={14} color="#3a3a56" style={{ flexShrink: 0 }} />
                      <div style={{ width: 30, height: 30, borderRadius: 7, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={14} color={meta.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: sec.title ? '#f0f0f5' : '#3a3a56' }}>{sec.title || 'Untitled section'}</div>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: 100, background: meta.bg, color: meta.color, display: 'inline-flex', marginTop: '0.15rem' }}>{meta.label}</span>
                      </div>
                      <button className="btn btn-danger btn-icon" onClick={e => { e.stopPropagation(); removeSection(sec._key); }}><Trash2 size={13} /></button>
                      {sec.expanded ? <ChevronUp size={15} color="#55556e" /> : <ChevronDown size={15} color="#55556e" />}
                    </div>
                    {sec.expanded && (
                      <div className="card-body">
                        <div>
                          <label className="f-label">Section Type</label>
                          <select className="f-select" value={sec.type} onChange={e => updateSection(sec._key, { type: e.target.value as SectionType })}>
                            {(Object.keys(SECTION_TYPE_META) as SectionType[]).map(t => <option key={t} value={t}>{SECTION_TYPE_META[t].label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="f-label">Title</label>
                          <input type="text" className="f-input" placeholder="e.g. Pro Tips, Important Warnings, Final Thoughts…" value={sec.title} onChange={e => updateSection(sec._key, { title: e.target.value })} />
                        </div>
                        <div>
                          <label className="f-label">Content</label>
                          <RichTextEditor value={sec.content} onChange={v => updateSection(sec._key, { content: v })} rows={6} placeholder="Write your tips, warnings, notes, or conclusion here…" references={references} />
                          <FormatHint />
                        </div>
                        <div>
                          <label className="f-label">Image URL <span style={{ color: '#3a3a56', fontWeight: 400 }}>(optional)</span></label>
                          <input type="text" className="f-input" placeholder="https://…" value={sec.imageUrl} onChange={e => updateSection(sec._key, { imageUrl: e.target.value })} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <button className="btn-add" onClick={addSection}><Plus size={15} /> Add Section</button>
            </div>
          </div>

          {/* FAQs */}
          <div>
            <SectionHeader title="FAQs" count={faqs.length} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {faqs.map((faq, i) => (
                <div key={faq._key} className="card">
                  <div className="card-header" onClick={() => toggleFaq(faq._key)}>
                    <div style={{ width: 24, height: 24, borderRadius: 5, background: 'rgba(245,158,11,0.12)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>Q{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: faq.question ? '#f0f0f5' : '#3a3a56' }}>{faq.question || 'Untitled question'}</div>
                    </div>
                    <button className="btn btn-danger btn-icon" onClick={e => { e.stopPropagation(); removeFaq(faq._key); }}><Trash2 size={13} /></button>
                    {faq.expanded ? <ChevronUp size={15} color="#55556e" /> : <ChevronDown size={15} color="#55556e" />}
                  </div>
                  {faq.expanded && (
                    <div className="card-body">
                      <div>
                        <label className="f-label">Question</label>
                        <input type="text" className="f-input" placeholder="e.g. How much capital do I need to start?" value={faq.question} onChange={e => updateFaq(faq._key, { question: e.target.value })} />
                      </div>
                      <div>
                        <label className="f-label">Answer</label>
                        <textarea className="f-textarea" rows={3} placeholder="Provide a clear, helpful answer…" value={faq.answer} onChange={e => updateFaq(faq._key, { answer: e.target.value })} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <button className="btn-add" onClick={addFaq}><Plus size={15} /> Add FAQ</button>
            </div>
          </div>

          {/* SEO */}
          <div className="card">
            <button style={{ background: 'none', border: 'none', width: '100%', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontFamily: 'Sora,sans-serif' }} onClick={() => setShowSEO(v => !v)}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f0f5' }}>SEO Metadata</span>
              {showSEO ? <ChevronUp size={15} color="#55556e" /> : <ChevronDown size={15} color="#55556e" />}
            </button>
            {showSEO && (
              <div style={{ padding: '0 1.5rem 1.4rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label className="f-label">Meta Title <span style={{ color: '#3a3a56', fontWeight: 400 }}>(leave blank to use guide title)</span></label>
                  <input type="text" className="f-input" placeholder={title || defaultTitle(bizName)} value={metaTitle} onChange={e => setMetaTitle(e.target.value)} />
                  <p className="hint">{metaTitle.length}/60 characters</p>
                </div>
                <div>
                  <label className="f-label">Meta Description</label>
                  <textarea className="f-textarea" rows={3} placeholder={`A complete step-by-step guide to starting a ${bizName || 'business'} in Kenya…`} value={metaDescription} onChange={e => setMetaDescription(e.target.value)} />
                  <p className="hint">{metaDescription.length}/160 characters</p>
                </div>
                <div>
                  <label className="f-label">Keywords <span style={{ color: '#3a3a56', fontWeight: 400 }}>(comma-separated)</span></label>
                  <input type="text" className="f-input" placeholder={`how to start a ${bizName || 'business'}, ${bizName || 'business'} guide Kenya`} value={keywords} onChange={e => setKeywords(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Sticky save bar */}
          <div style={{ position: 'sticky', bottom: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: 'rgba(10,10,18,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '0.75rem 1.25rem' }}>
            {/* FIX: Same auto-save toggle here */}
            <button
              className={`btn ${isPublished ? 'btn-success' : 'btn-ghost'}`}
              onClick={handleTogglePublished}
              disabled={saving}
            >
              {isPublished ? <Eye size={14} /> : <EyeOff size={14} />}
              {isPublished ? 'Published' : 'Draft'}
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <Save size={14} />{saving ? 'Saving…' : 'Save Guide'}
              {isDirty && !saving && <span className="unsaved-dot" />}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}