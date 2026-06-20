'use client';
import { useEffect, useState, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, ArrowRight, ExternalLink, X, Link as LinkIcon, Copy, Check } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

type Redirect = {
  id: number;
  source: string;
  destination: string;
  permanent: boolean;
  createdAt: string;
};

// FIX: CodeToken renders syntax-highlighted spans without dangerouslySetInnerHTML.
// Previously generateCode() output was injected via dangerouslySetInnerHTML after
// regex-replacing keywords with <span> tags. Because generateCode() embeds
// r.source and r.destination directly from DB values, a redirect with a source
// like </pre><script>alert(1)</script> would execute in the admin's browser.
// This replaces the entire approach with React elements — no raw HTML, no XSS risk.
type Token = { type: 'kw' | 'str' | 'bool-t' | 'bool-f' | 'plain'; text: string };

function tokenizeLine(line: string): Token[] {
  const keywords = ['module', 'exports', 'async', 'return', 'const'];
  const tokens: Token[] = [];
  let remaining = line;

  while (remaining.length > 0) {
    // Boolean true
    const trueMatch = remaining.match(/^(true)/);
    if (trueMatch) { tokens.push({ type: 'bool-t', text: trueMatch[1] }); remaining = remaining.slice(trueMatch[1].length); continue; }
    // Boolean false
    const falseMatch = remaining.match(/^(false)/);
    if (falseMatch) { tokens.push({ type: 'bool-f', text: falseMatch[1] }); remaining = remaining.slice(falseMatch[1].length); continue; }
    // String literals
    const strMatch = remaining.match(/^('(?:[^'\\]|\\.)*')/);
    if (strMatch) { tokens.push({ type: 'str', text: strMatch[1] }); remaining = remaining.slice(strMatch[1].length); continue; }
    // Keywords
    const kwMatch = remaining.match(new RegExp(`^(${keywords.join('|')})(?=\\b)`));
    if (kwMatch) { tokens.push({ type: 'kw', text: kwMatch[1] }); remaining = remaining.slice(kwMatch[1].length); continue; }
    // Plain text (one char at a time to avoid infinite loop)
    const last = tokens[tokens.length - 1];
    if (last?.type === 'plain') { last.text += remaining[0]; } else { tokens.push({ type: 'plain', text: remaining[0] }); }
    remaining = remaining.slice(1);
  }
  return tokens;
}

const TOKEN_COLORS: Record<Token['type'], string> = {
  kw: '#818cf8',
  str: '#34d399',
  'bool-t': '#fbbf24',
  'bool-f': '#f87171',
  plain: '#9494b0',
};

function HighlightedCode({ code }: { code: string }) {
  return (
    <pre style={{ padding: '1rem', margin: 0, fontFamily: "'DM Mono',monospace", fontSize: '0.75rem', color: '#9494b0', overflowX: 'auto', lineHeight: 1.7 }}>
      {code.split('\n').map((line, i) => (
        <span key={i}>
          {tokenizeLine(line).map((tok, j) => (
            <span key={j} style={{ color: TOKEN_COLORS[tok.type] }}>{tok.text}</span>
          ))}
          {'\n'}
        </span>
      ))}
    </pre>
  );
}

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');
  .adm { font-family:'Sora',sans-serif; color:#f0f0f5; }
  .adm-mono { font-family:'DM Mono',monospace; }
  .c-table { width:100%; border-collapse:collapse; }
  .c-table th { padding:0.65rem 1rem; text-align:left; font-size:0.7rem; font-weight:700; color:#55556e; text-transform:uppercase; letter-spacing:0.08em; border-bottom:1px solid rgba(255,255,255,0.06); white-space:nowrap; background:#13131a; }
  .c-table td { padding:0.85rem 1rem; border-bottom:1px solid rgba(255,255,255,0.04); vertical-align:middle; }
  .c-table tbody tr { transition:background 0.15s; }
  .c-table tbody tr:hover { background:rgba(255,255,255,0.025); }
  .u-input { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.55rem 0.9rem 0.55rem 2.4rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; transition:border-color 0.2s,box-shadow 0.2s; width:100%; box-sizing:border-box; }
  .u-input::placeholder { color:#3a3a56; }
  .u-input:focus { border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.08); }
  .btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.5rem 1rem; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.82rem; font-weight:600; cursor:pointer; border:none; transition:all 0.15s; white-space:nowrap; }
  .btn-primary { background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; box-shadow:0 4px 14px rgba(99,102,241,0.25); }
  .btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(99,102,241,0.35); }
  .btn-danger { background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.2); }
  .btn-danger:hover { background:rgba(239,68,68,0.22); }
  .btn-ghost { background:rgba(255,255,255,0.06); color:#9494b0; border:1px solid rgba(255,255,255,0.09); }
  .btn-ghost:hover { background:rgba(255,255,255,0.1); color:#f0f0f5; }
  .btn-icon { padding:0.45rem; border-radius:8px; }
  .btn-secondary { background:rgba(255,255,255,0.06); color:#9494b0; border:1px solid rgba(255,255,255,0.09); }
  .btn-secondary:hover { background:rgba(255,255,255,0.1); color:#f0f0f5; }
  .code-slug { display:inline-flex; align-items:center; gap:0.4rem; background:rgba(255,255,255,0.05); border-radius:6px; padding:0.22rem 0.55rem; font-family:'DM Mono',monospace; font-size:0.74rem; color:#9494b0; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:9999; display:flex; align-items:center; justify-content:center; padding:1rem; backdrop-filter:blur(4px); }
  .modal-box { background:#1a1a24; border:1px solid rgba(255,255,255,0.09); border-radius:16px; padding:1.75rem; width:100%; max-width:480px; box-shadow:0 24px 80px rgba(0,0,0,0.6); }
  .f-label { display:block; font-size:0.76rem; font-weight:600; color:#9494b0; margin-bottom:0.35rem; }
  .f-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:0.6rem 0.85rem; color:#f0f0f5; font-family:'DM Mono',monospace; font-size:0.84rem; outline:none; transition:border-color 0.2s; box-sizing:border-box; }
  .f-input::placeholder { color:#3a3a56; font-family:'Sora',sans-serif; }
  .f-input:focus { border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.08); }
  .toggle-track { position:relative; width:40px; height:22px; background:rgba(255,255,255,0.1); border-radius:11px; cursor:pointer; transition:background 0.2s; flex-shrink:0; border:none; padding:0; }
  .toggle-track.on { background:rgba(99,102,241,0.8); }
  .toggle-thumb { position:absolute; top:3px; left:3px; width:16px; height:16px; background:#fff; border-radius:50%; transition:transform 0.2s; pointer-events:none; }
  .toggle-track.on .toggle-thumb { transform:translateX(18px); }
  .code-panel { background:#0d0d12; border:1px solid rgba(255,255,255,0.07); border-radius:12px; overflow:hidden; margin-top:1.5rem; }
  .code-panel-header { display:flex; align-items:center; justify-content:space-between; padding:0.75rem 1rem; border-bottom:1px solid rgba(255,255,255,0.06); }
  .scroll::-webkit-scrollbar { width:4px; }
  .scroll::-webkit-scrollbar-track { background:transparent; }
  .scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
  .badge { display:inline-flex; align-items:center; padding:0.2rem 0.6rem; border-radius:100px; font-size:0.7rem; font-weight:700; }
  .badge-perm { background:rgba(99,102,241,0.12); color:#818cf8; border:1px solid rgba(99,102,241,0.2); }
  .badge-temp { background:rgba(245,158,11,0.1); color:#fbbf24; border:1px solid rgba(245,158,11,0.15); }
  .preview-row { display:flex; align-items:center; gap:0.75rem; padding:0.85rem 1rem; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:10px; font-family:'DM Mono',monospace; font-size:0.8rem; }
  .preview-row .arrow { color:#55556e; flex-shrink:0; }
  .preview-row .src { color:#818cf8; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .preview-row .dst { color:#34d399; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
`;

export default function AdminRedirectsPage() {
  const [redirects, setRedirects]     = useState<Redirect[]>([]);
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing]         = useState<Redirect | null>(null);
  const [showCode, setShowCode]       = useState(false);
  const [copied, setCopied]           = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [formData, setFormData]       = useState({ source: '', destination: '', permanent: true });

  useEffect(() => { fetchRedirects(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return redirects;
    const q = search.toLowerCase();
    return redirects.filter(r =>
      r.source.toLowerCase().includes(q) || r.destination.toLowerCase().includes(q)
    );
  }, [redirects, search]);

  async function fetchRedirects() {
    try {
      const r = await fetch('/api/admin/redirects');
      if (r.ok) setRedirects(await r.json());
    } catch { toast.error('Failed to load redirects'); }
  }

  function openCreate() {
    setFormData({ source: '', destination: '', permanent: true });
    setEditing(null);
    setIsModalOpen(true);
  }

  function openEdit(r: Redirect) {
    setFormData({ source: r.source, destination: r.destination, permanent: r.permanent });
    setEditing(r);
    setIsModalOpen(true);
  }

  function closeModal() { setIsModalOpen(false); setEditing(null); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.source.trim()) { toast.error('Source path is required'); return; }
    if (!formData.destination.trim()) { toast.error('Destination is required'); return; }
    if (!formData.source.startsWith('/')) { toast.error('Source must start with /'); return; }
    if (!formData.destination.startsWith('/') && !formData.destination.startsWith('http')) {
      toast.error('Destination must start with / or http'); return;
    }
    setLoading(true);
    try {
      const method = editing ? 'PATCH' : 'POST';
      const body   = editing ? { id: editing.id, ...formData } : formData;
      const res    = await fetch('/api/admin/redirects', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      toast.success(editing ? 'Redirect updated!' : 'Redirect created!');
      closeModal();
      fetchRedirects();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally { setLoading(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this redirect?')) return;
    try {
      const res = await fetch('/api/admin/redirects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Redirect deleted');
      fetchRedirects();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selectedIds.length} redirects?`)) return;
    try {
      await Promise.all(
        selectedIds.map(id =>
          fetch('/api/admin/redirects', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          })
        )
      );
      toast.success(`${selectedIds.length} redirects deleted`);
      setSelectedIds([]);
      fetchRedirects();
    } catch { toast.error('Bulk delete failed'); }
  }

  function toggleSelectAll() {
    setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map(r => r.id));
  }
  function toggleSelect(id: number) {
    setSelectedIds(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
  }

  function generateCode() {
    const lines = redirects.map(r =>
      `      {\n        source: '${r.source}',\n        destination: '${r.destination}',\n        permanent: ${r.permanent},\n      }`
    ).join(',\n');
    return `module.exports = {\n  async redirects() {\n    return [\n${lines}\n    ]\n  },\n}`;
  }

  function copyCode() {
    navigator.clipboard.writeText(generateCode()).then(() => {
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const permCount = redirects.filter(r => r.permanent).length;
  const tempCount = redirects.length - permCount;

  return (
    <>
      <style>{S}</style>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1a1a24', color: '#f0f0f5', border: '1px solid rgba(255,255,255,0.09)' },
        }}
      />
      <div className="adm" style={{ minHeight: '100vh' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>Redirects</h1>
            <p style={{ fontSize: '0.84rem', color: '#55556e' }}>Manage URL redirects — {redirects.length} total</p>
          </div>
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            {selectedIds.length > 0 && (
              <button className="btn btn-danger" onClick={handleBulkDelete}>
                <Trash2 size={14} /> Delete {selectedIds.length}
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => setShowCode(p => !p)}>
              {showCode ? <X size={14} /> : <ExternalLink size={14} />}
              {showCode ? 'Hide code' : 'Export code'}
            </button>
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={14} /> Add Redirect
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Total',     val: redirects.length, bg: 'rgba(99,102,241,0.12)',  color: '#818cf8' },
            { label: 'Permanent', val: permCount,         bg: 'rgba(99,102,241,0.08)',  color: '#818cf8' },
            { label: 'Temporary', val: tempCount,         bg: 'rgba(245,158,11,0.1)',   color: '#fbbf24' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}22`, borderRadius: 10, padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 700, color: s.color, fontFamily: 'DM Mono,monospace' }}>{s.val}</span>
              <span style={{ fontSize: '0.75rem', color: s.color, opacity: 0.75 }}>{s.label}</span>
            </div>
          ))}
        </div>

        <div style={{ position: 'relative', marginBottom: '1rem', maxWidth: 480 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#55556e', pointerEvents: 'none' }} />
          <input type="text" placeholder="Search by source or destination…" value={search} onChange={e => setSearch(e.target.value)} className="u-input" />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#55556e', cursor: 'pointer', padding: 0 }}>
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
          {selectedIds.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem', background: 'rgba(239,68,68,0.06)', borderBottom: '1px solid rgba(239,68,68,0.12)', fontSize: '0.82rem', color: '#f87171' }}>
              <span>{selectedIds.length} selected</span>
              <button className="btn btn-ghost" style={{ padding: '0.28rem 0.65rem', fontSize: '0.75rem' }} onClick={() => setSelectedIds([])}>Clear</button>
            </div>
          )}
          <div className="scroll" style={{ overflowX: 'auto' }}>
            <table className="c-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '1.25rem', width: 40 }}>
                    <input type="checkbox" checked={selectedIds.length === filtered.length && filtered.length > 0} onChange={toggleSelectAll} style={{ accentColor: '#6366f1', cursor: 'pointer' }} />
                  </th>
                  <th>Source</th><th></th><th>Destination</th><th>Type</th><th>Created</th>
                  <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem', color: '#3a3a56' }}>
                      <LinkIcon size={32} style={{ margin: '0 auto 0.75rem', display: 'block' }} />
                      <div style={{ color: '#55556e', fontWeight: 600 }}>{search ? `No redirects match "${search}"` : 'No redirects yet'}</div>
                      {!search && (
                        <button onClick={openCreate} style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'Sora,sans-serif' }}>
                          Add your first redirect
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map(r => (
                    <tr key={r.id} style={{ background: selectedIds.includes(r.id) ? 'rgba(99,102,241,0.05)' : undefined }}>
                      <td style={{ paddingLeft: '1.25rem' }}>
                        <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleSelect(r.id)} style={{ accentColor: '#6366f1', cursor: 'pointer' }} />
                      </td>
                      <td><span className="code-slug">{r.source}</span></td>
                      <td style={{ padding: '0.85rem 0.25rem' }}><ArrowRight size={13} color="#3a3a56" /></td>
                      <td><span className="code-slug" style={{ color: '#34d399' }}>{r.destination}</span></td>
                      <td>
                        <span className={`badge ${r.permanent ? 'badge-perm' : 'badge-temp'}`}>
                          {r.permanent ? '308 Permanent' : '307 Temporary'}
                        </span>
                      </td>
                      <td><span style={{ fontSize: '0.78rem', color: '#55556e' }}>{new Date(r.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span></td>
                      <td style={{ paddingRight: '1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                          <button className="btn btn-ghost btn-icon" onClick={() => openEdit(r)} title="Edit"><Edit2 size={14} /></button>
                          <button className="btn btn-icon" onClick={() => handleDelete(r.id)} title="Delete" style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '0.65rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '0.75rem', color: '#55556e' }}>
            Showing <span style={{ color: '#9494b0', fontWeight: 600 }}>{filtered.length}</span> of{' '}
            <span style={{ color: '#9494b0', fontWeight: 600 }}>{redirects.length}</span> redirects
          </div>
        </div>

        {showCode && redirects.length > 0 && (
          <div className="code-panel">
            <div className="code-panel-header">
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#55556e', fontFamily: 'DM Mono,monospace' }}>next.config.js</span>
              <button className="btn btn-ghost" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', gap: '0.35rem' }} onClick={copyCode}>
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            {/* FIX: Replaced dangerouslySetInnerHTML with <HighlightedCode> component.
                The old approach injected r.source/r.destination from the DB directly
                into innerHTML after regex substitution — a stored XSS vector. */}
            <HighlightedCode code={generateCode()} />
          </div>
        )}
        {showCode && redirects.length === 0 && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 10, fontSize: '0.8rem', color: '#55556e', textAlign: 'center' }}>
            Add some redirects to generate the config code.
          </div>
        )}

        {isModalOpen && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{editing ? 'Edit Redirect' : 'New Redirect'}</h2>
                <button onClick={closeModal} className="btn btn-ghost btn-icon"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="f-label">Source path <span style={{ color: '#f87171' }}>*</span></label>
                  <input type="text" value={formData.source} onChange={e => setFormData(p => ({ ...p, source: e.target.value }))} placeholder="/old-page  or  /blog/:slug" className="f-input" autoFocus />
                  <p style={{ fontSize: '0.72rem', color: '#55556e', marginTop: '0.35rem' }}>Use <span style={{ color: '#9494b0' }}>:param</span> for dynamic segments, e.g. <span style={{ color: '#9494b0' }}>/blog/:slug</span></p>
                </div>
                <div>
                  <label className="f-label">Destination <span style={{ color: '#f87171' }}>*</span></label>
                  <input type="text" value={formData.destination} onChange={e => setFormData(p => ({ ...p, destination: e.target.value }))} placeholder="/new-page  or  https://example.com" className="f-input" />
                </div>
                {(formData.source || formData.destination) && (
                  <div className="preview-row">
                    <span className="src">{formData.source || '…'}</span>
                    <ArrowRight size={14} className="arrow" />
                    <span className="dst">{formData.destination || '…'}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
                  <button type="button" className={`toggle-track ${formData.permanent ? 'on' : ''}`} onClick={() => setFormData(p => ({ ...p, permanent: !p.permanent }))} style={{ marginTop: '0.1rem' }}>
                    <div className="toggle-thumb" />
                  </button>
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f0f0f5', marginBottom: '0.2rem' }}>{formData.permanent ? '308 Permanent redirect' : '307 Temporary redirect'}</div>
                    <div style={{ fontSize: '0.74rem', color: '#55556e' }}>{formData.permanent ? 'Browser caches forever. Best for SEO — tells search engines to update their index.' : 'Browser re-checks each time. Use if this redirect might change.'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={closeModal} className="btn btn-ghost">Cancel</button>
                  <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Saving…' : editing ? 'Save Changes' : 'Create Redirect'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}