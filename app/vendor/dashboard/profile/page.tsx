'use client';
// app/vendor/dashboard/profile/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  Save, Loader2, CheckCircle2, AlertCircle,
  Globe, MapPin, Phone, Twitter, Instagram,
  Facebook, Linkedin, ExternalLink, Store,
} from 'lucide-react';

const externalImageLoader = ({ src }: { src: string }) => src;

type VendorProfile = {
  id: number;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  website: string | null;
  logo: string | null;
  coverImage: string | null;
  location: string | null;
  phone: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  linkedinUrl: string | null;
  status: string;
  isVerified: boolean;
  _count: { products: number };
};

export default function VendorProfilePage() {
  const [profile, setProfile]   = useState<VendorProfile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [toast,   setToast]     = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    name: '', tagline: '', description: '', website: '',
    logo: '', coverImage: '', location: '', phone: '',
    twitterUrl: '', instagramUrl: '', facebookUrl: '', linkedinUrl: '',
  });

  useEffect(() => { fetchProfile(); }, []);

  async function fetchProfile() {
    try {
      const res = await fetch('/api/vendors/profile');
      if (res.ok) {
        const d = await res.json();
        setProfile(d);
        setForm({
          name: d.name ?? '', tagline: d.tagline ?? '', description: d.description ?? '',
          website: d.website ?? '', logo: d.logo ?? '', coverImage: d.coverImage ?? '',
          location: d.location ?? '', phone: d.phone ?? '',
          twitterUrl: d.twitterUrl ?? '', instagramUrl: d.instagramUrl ?? '',
          facebookUrl: d.facebookUrl ?? '', linkedinUrl: d.linkedinUrl ?? '',
        });
      }
    } finally { setLoading(false); }
  }

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res  = await fetch('/api/vendors/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfile(prev => prev ? { ...prev, ...data } : null);
      showToast('Profile updated successfully');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to save', 'error');
    } finally { setSaving(false); }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220 }}>
      <Loader2 size={24} className="vd-spin" style={{ color: '#f59e0b' }} />
      <style>{CSS}</style>
    </div>
  );

  const F = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div style={P.page}>
      <style>{CSS}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          ...P.toast,
          background:  toast.type === 'success' ? 'rgba(16,185,129,0.12)'  : 'rgba(239,68,68,0.12)',
          borderColor: toast.type === 'success' ? 'rgba(16,185,129,0.28)'  : 'rgba(239,68,68,0.28)',
          color:       toast.type === 'success' ? '#6ee7b7'                 : '#fca5a5',
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={P.header}>
        <div>
          <h1 style={P.h1}>Storefront Profile</h1>
          <p style={P.subtitle}>
            What customers see when they visit your vendor page.
            {profile && (
              <a href={`/vendors/${profile.slug}`} target="_blank" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#818cf8', marginLeft: '0.4rem', fontSize: '0.8rem' }}>
                Preview <ExternalLink size={11} />
              </a>
            )}
          </p>
        </div>
        <button className="vd-save-desktop" style={P.btnSave} onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={14} className="vd-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Slug notice */}
      {profile && (
        <div style={P.slugNotice}>
          <Store size={13} style={{ color: '#818cf8', flexShrink: 0 }} />
          <span>
            Store URL:{' '}
            <strong style={{ color: '#a5b4fc', fontFamily: "'DM Mono', monospace", fontSize: '0.82rem' }}>
              /vendors/{profile.slug}
            </strong>
            {' '}— contact support to change.
          </span>
        </div>
      )}

      <div style={P.layout} className="vd-profile-layout">

        {/* Main col */}
        <div style={P.mainCol}>

          {/* Identity */}
          <section style={P.section}>
            <div style={P.sectionHeader}>
              <h2 style={P.sectionTitle}>Store Identity</h2>
            </div>
            <div style={P.field}>
              <label style={P.label}>Store Name <span style={{ color: '#f87171' }}>*</span></label>
              <input style={P.input} value={form.name} onChange={F('name')} placeholder="Your business name" />
            </div>
            <div style={P.field}>
              <label style={P.label}>Tagline</label>
              <input style={P.input} value={form.tagline} onChange={F('tagline')} maxLength={120}
                placeholder="One-liner that sells your store" />
              <span style={P.hint}>{form.tagline.length}/120 characters</span>
            </div>
            <div style={P.field}>
              <label style={P.label}>About Your Business</label>
              <textarea style={P.textarea} rows={4} value={form.description} onChange={F('description')}
                placeholder="Tell entrepreneurs who you are, what you sell, and why they should choose you…" />
            </div>
          </section>

          {/* Branding */}
          <section style={P.section}>
            <div style={P.sectionHeader}>
              <h2 style={P.sectionTitle}>Branding</h2>
            </div>
            <div style={P.twoCol} className="vd-two-col">
              <div style={P.field}>
                <label style={P.label}>Logo URL</label>
                <input style={P.input} value={form.logo} onChange={F('logo')} placeholder="https://…" />
                {form.logo && (
                  <div style={{ marginTop: '0.6rem' }}>
                    <Image loader={externalImageLoader} src={form.logo} alt="logo" width={48} height={48}
                      style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                )}
              </div>
              <div style={P.field}>
                <label style={P.label}>Cover Image URL</label>
                <input style={P.input} value={form.coverImage} onChange={F('coverImage')} placeholder="https://…" />
                {form.coverImage && (
                  <div style={{ marginTop: '0.6rem' }}>
                    <Image loader={externalImageLoader} src={form.coverImage} alt="cover" width={320} height={68}
                      style={{ width: '100%', height: 68, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Contact */}
          <section style={P.section}>
            <div style={P.sectionHeader}>
              <h2 style={P.sectionTitle}>Contact & Location</h2>
            </div>
            <div style={P.twoCol} className="vd-two-col">
              <div style={P.field}>
                <label style={P.label}><Globe size={11} /> Website</label>
                <input style={P.input} value={form.website} onChange={F('website')} placeholder="https://yourbusiness.com" />
              </div>
              <div style={P.field}>
                <label style={P.label}><MapPin size={11} /> Location</label>
                <input style={P.input} value={form.location} onChange={F('location')} placeholder="Nairobi, Kenya" />
              </div>
            </div>
            <div style={P.field}>
              <label style={P.label}><Phone size={11} /> Phone</label>
              <input value={form.phone} onChange={F('phone')} placeholder="+254 700 000 000" style={{ ...P.input, maxWidth: 280 }} className="vd-phone-input" />
            </div>
          </section>

          {/* Social */}
          <section style={P.section}>
            <div style={P.sectionHeader}>
              <h2 style={P.sectionTitle}>Social Links</h2>
            </div>
            <div style={P.twoCol} className="vd-two-col">
              {([
                { icon: <Twitter size={11} />,   key: 'twitterUrl',   label: 'Twitter / X',  ph: 'https://x.com/…' },
                { icon: <Instagram size={11} />, key: 'instagramUrl', label: 'Instagram',     ph: 'https://instagram.com/…' },
                { icon: <Facebook size={11} />,  key: 'facebookUrl',  label: 'Facebook',      ph: 'https://facebook.com/…' },
                { icon: <Linkedin size={11} />,  key: 'linkedinUrl',  label: 'LinkedIn',      ph: 'https://linkedin.com/…' },
              ] as { icon: React.ReactNode; key: keyof typeof form; label: string; ph: string }[]).map(({ icon, key, label, ph }) => (
                <div key={key} style={P.field}>
                  <label style={P.label}>{icon} {label}</label>
                  <input style={P.input} value={(form as any)[key]} onChange={F(key)} placeholder={ph} />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div style={P.sideCol} className="vd-profile-sidebar">

          {/* Preview card */}
          <div style={P.sideCard}>
            <div style={P.sideCardLabel}>Live Preview</div>
            <div style={P.mockup}>
              <div style={{ ...P.mockupCover, backgroundImage: form.coverImage ? `url(${form.coverImage})` : undefined, background: form.coverImage ? undefined : 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(245,158,11,0.1))' }} />
              <div style={P.mockupBody}>
                {form.logo ? (
                  <Image loader={externalImageLoader} src={form.logo} alt="" width={40} height={40} style={P.mockupLogo as React.CSSProperties} />
                ) : (
                  <div style={{ ...P.mockupLogo, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as React.CSSProperties}>
                    <Store size={18} color="#f59e0b" />
                  </div>
                )}
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f0f0f5', marginBottom: '0.15rem' }}>{form.name || 'Your Store Name'}</div>
                {form.tagline && <div style={{ fontSize: '0.74rem', color: '#9494b0', lineHeight: 1.4, marginBottom: '0.3rem' }}>{form.tagline}</div>}
                {form.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: '#55556e' }}>
                    <MapPin size={9} /> {form.location}
                  </div>
                )}
              </div>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#3a3a56', textAlign: 'center', marginTop: '0.6rem' }}>Updates as you type</div>
          </div>

          {/* Account stats */}
          {profile && (
            <div style={P.sideCard}>
              <div style={P.sideCardLabel}>Account Stats</div>
              {[
                { key: 'Products',  val: profile._count.products.toString() },
                { key: 'Status',    val: profile.status },
                ...(profile.isVerified ? [{ key: 'Verified', val: '✓ Yes' }] : []),
              ].map(row => (
                <div key={row.key} style={P.statRow}>
                  <span style={{ fontSize: '0.78rem', color: '#55556e' }}>{row.key}</span>
                  <span style={{
                    fontSize: '0.82rem', fontWeight: 700, fontFamily: "'DM Mono', monospace",
                    color: row.key === 'Status'
                      ? profile.status === 'ACTIVE' ? '#34d399' : '#fbbf24'
                      : row.key === 'Verified' ? '#34d399' : '#e2e2f0',
                  }}>{row.val}</span>
                </div>
              ))}
            </div>
          )}

          {/* Save button repeated on sidebar for convenience (desktop only) */}
          <button className="vd-save-desktop" style={{ ...P.btnSave, width: '100%', justifyContent: 'center' }} onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={14} className="vd-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Sticky mobile save bar */}
      <div className="vd-sticky-save">
        <button style={{ ...P.btnSave, width: '100%', justifyContent: 'center' }} onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={14} className="vd-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  @keyframes vd-spin { to { transform: rotate(360deg); } }
  .vd-spin { animation: vd-spin 1s linear infinite; }
  a { text-decoration: none; }
  .vd-profile-layout { display: grid; grid-template-columns: 1fr 260px; gap: 1.25rem; align-items: start; }
  .vd-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  .vd-sticky-save { display: none; }

  @media (max-width: 860px) {
    .vd-profile-layout { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 520px) {
    .vd-two-col { grid-template-columns: 1fr !important; }
    .vd-phone-input { max-width: 100% !important; }
  }

  @media (max-width: 768px) {
    .vd-save-desktop { display: none !important; }
    .vd-profile-sidebar { order: -1; }
    .vd-sticky-save {
      display: block;
      position: fixed;
      left: 0; right: 0;
      bottom: calc(var(--vd-bottom-nav-h, 64px) + env(safe-area-inset-bottom, 0px));
      padding: 0.65rem 1rem;
      background: rgba(13,13,18,0.92);
      backdrop-filter: blur(14px);
      border-top: 1px solid rgba(255,255,255,0.07);
      z-index: 25;
    }
  }
`;

const P: Record<string, React.CSSProperties> = {
  page:       { fontFamily: "'DM Sans', sans-serif", color: '#f0f0f5', maxWidth: 1000, paddingBottom: '4.5rem' },
  toast:      { position: 'fixed', top: '1rem', right: '1rem', left: '1rem', zIndex: 9999, padding: '0.7rem 1.1rem', borderRadius: 10, fontSize: '0.82rem', fontWeight: 600, border: '1px solid', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' },
  h1:         { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em', marginBottom: '0.2rem', color: '#f0f0f5' },
  subtitle:   { fontSize: '0.81rem', color: '#55556e', display: 'flex', alignItems: 'center', flexWrap: 'wrap' },
  slugNotice: { display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.65rem 1rem', borderRadius: 9, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.14)', fontSize: '0.79rem', color: '#9494b0', marginBottom: '1.5rem' },
  layout:     {},
  mainCol:    { display: 'flex', flexDirection: 'column', gap: '1rem' },
  sideCol:    { display: 'flex', flexDirection: 'column', gap: '0.85rem', position: 'sticky', top: '1rem' } as React.CSSProperties,
  section:    { background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, padding: '1.25rem' },
  sectionHeader:{ marginBottom: '1rem' },
  sectionTitle: { fontSize: '0.88rem', fontWeight: 700, color: '#e2e2f0' },
  field:      { marginBottom: '0.9rem' },
  label:      { display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', fontWeight: 700, color: '#9494b0', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.07em' },
  input:      { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '0.58rem 0.85rem', color: '#f0f0f5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', outline: 'none' },
  textarea:   { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '0.58rem 0.85rem', color: '#f0f0f5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', outline: 'none', resize: 'vertical', lineHeight: 1.6 },
  hint:       { fontSize: '0.7rem', color: '#55556e', marginTop: '0.2rem', display: 'block' },
  twoCol:     {},
  sideCard:   { background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, padding: '1rem 1.1rem' },
  sideCardLabel: { fontSize: '0.65rem', fontWeight: 700, color: '#55556e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' },
  mockup:     { borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' },
  mockupCover:{ height: 70, backgroundSize: 'cover', backgroundPosition: 'center' },
  mockupBody: { padding: '0.7rem', background: '#1a1a24' },
  mockupLogo: { width: 42, height: 42, borderRadius: 9, objectFit: 'cover', border: '2px solid #0f0f1a', marginTop: -22, marginBottom: '0.45rem' },
  statRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  btnSave:    { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', borderRadius: 9, background: '#f59e0b', color: '#0a0a0f', fontSize: '0.84rem', fontWeight: 700, border: 'none', cursor: 'pointer' },
};