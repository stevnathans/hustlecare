/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
// app/vendor/dashboard/profile/page.tsx
import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  Save, Loader2, CheckCircle2, AlertCircle,
  Globe, MapPin, Phone, Twitter, Instagram,
  Facebook, Linkedin, ExternalLink, Store,
} from 'lucide-react';

const externalImageLoader = ({ src }: { src: string; width?: number; quality?: number }) => src;

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
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    name: '',
    tagline: '',
    description: '',
    website: '',
    logo: '',
    coverImage: '',
    location: '',
    phone: '',
    twitterUrl: '',
    instagramUrl: '',
    facebookUrl: '',
    linkedinUrl: '',
  });

  useEffect(() => { fetchProfile(); }, []);

  async function fetchProfile() {
    try {
      const res = await fetch('/api/vendors/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setForm({
          name: data.name ?? '',
          tagline: data.tagline ?? '',
          description: data.description ?? '',
          website: data.website ?? '',
          logo: data.logo ?? '',
          coverImage: data.coverImage ?? '',
          location: data.location ?? '',
          phone: data.phone ?? '',
          twitterUrl: data.twitterUrl ?? '',
          instagramUrl: data.instagramUrl ?? '',
          facebookUrl: data.facebookUrl ?? '',
          linkedinUrl: data.linkedinUrl ?? '',
        });
      }
    } finally { setLoading(false); }
  }

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/vendors/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfile(prev => prev ? { ...prev, ...data } : null);
      showToast('Profile updated successfully');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#f59e0b' }} />
        <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      {toast && (
        <div style={{
          ...S.toast,
          background: toast.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
          borderColor: toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
          color: toast.type === 'success' ? '#6ee7b7' : '#fca5a5',
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.h1}>Storefront Profile</h1>
          <p style={S.subtitle}>
            This is what customers see when they visit your vendor page.
            {profile && (
              <>
                {' '}
                <a href={`/vendors/${profile.slug}`} target="_blank" style={S.previewLink}>
                  Preview storefront <ExternalLink size={12} />
                </a>
              </>
            )}
          </p>
        </div>
        <button style={S.btnPrimary} onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Slug notice */}
      {profile && (
        <div style={S.slugNotice}>
          <Store size={14} style={{ color: '#818cf8', flexShrink: 0 }} />
          <span>
            Your store URL is{' '}
            <strong style={{ color: '#a5b4fc', fontFamily: "'DM Mono', monospace", fontSize: '0.84rem' }}>
              /vendors/{profile.slug}
            </strong>
            {' '}— contact support to change it.
          </span>
        </div>
      )}

      <div style={S.layout}>
        <div style={S.mainCol}>

          {/* Identity */}
          <div style={S.card}>
            <h2 style={S.cardTitle}>Store Identity</h2>

            <div style={S.fieldGroup}>
              <label style={S.label}>Store Name <span style={S.req}>*</span></label>
              <input style={S.input} value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Your business name" />
            </div>

            <div style={S.fieldGroup}>
              <label style={S.label}>Tagline</label>
              <input style={S.input} value={form.tagline} maxLength={120}
                onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
                placeholder="One-liner that sells your store" />
              <span style={S.hint}>{form.tagline.length}/120</span>
            </div>

            <div style={S.fieldGroup}>
              <label style={S.label}>About Your Business</label>
              <textarea style={S.textarea} rows={5} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Tell entrepreneurs who you are, what you sell, and why they should choose you…" />
            </div>
          </div>

          {/* Media */}
          <div style={S.card}>
            <h2 style={S.cardTitle}>Branding</h2>

            <div style={S.twoCol}>
              <div style={S.fieldGroup}>
                <label style={S.label}>Logo URL</label>
                <input style={S.input} value={form.logo} placeholder="https://…"
                  onChange={e => setForm(f => ({ ...f, logo: e.target.value }))} />
                {form.logo && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <Image
                      loader={externalImageLoader}
                      src={form.logo}
                      alt="logo preview"
                      width={52}
                      height={52}
                      style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                )}
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}>Cover Image URL</label>
                <input style={S.input} value={form.coverImage} placeholder="https://…"
                  onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))} />
                {form.coverImage && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <Image
                      loader={externalImageLoader}
                      src={form.coverImage}
                      alt="cover preview"
                      width={340}
                      height={72}
                      style={{ width: '100%', height: 72, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact */}
          <div style={S.card}>
            <h2 style={S.cardTitle}>Contact & Location</h2>

            <div style={S.twoCol}>
              <div style={S.fieldGroup}>
                <label style={S.label}><Globe size={12} /> Website</label>
                <input style={S.input} value={form.website} placeholder="https://yourbusiness.com"
                  onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}><MapPin size={12} /> Location</label>
                <input style={S.input} value={form.location} placeholder="Nairobi, Kenya"
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
            </div>

            <div style={S.fieldGroup}>
              <label style={S.label}><Phone size={12} /> Phone</label>
              <input style={S.input} value={form.phone} placeholder="+254 700 000 000"
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>

          {/* Social */}
          <div style={S.card}>
            <h2 style={S.cardTitle}>Social Links</h2>
            <div style={S.twoCol}>
              {[
                { icon: <Twitter size={12} />, key: 'twitterUrl', label: 'Twitter / X', placeholder: 'https://x.com/…' },
                { icon: <Instagram size={12} />, key: 'instagramUrl', label: 'Instagram', placeholder: 'https://instagram.com/…' },
                { icon: <Facebook size={12} />, key: 'facebookUrl', label: 'Facebook', placeholder: 'https://facebook.com/…' },
                { icon: <Linkedin size={12} />, key: 'linkedinUrl', label: 'LinkedIn', placeholder: 'https://linkedin.com/…' },
              ].map(({ icon, key, label, placeholder }) => (
                <div key={key} style={S.fieldGroup}>
                  <label style={S.label}>{icon} {label}</label>
                  <input style={S.input} value={(form as any)[key]} placeholder={placeholder}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar — live preview card */}
        <div style={S.sideCol}>
          <div style={S.previewCard}>
            <div style={S.previewLabel}>Live Preview</div>

            {/* Mini storefront mockup */}
            <div style={S.mockup}>
              {form.coverImage ? (
                <div style={{ ...S.mockupCover, backgroundImage: `url(${form.coverImage})` }} />
              ) : (
                <div style={{ ...S.mockupCover, background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(245,158,11,0.1))' }} />
              )}
              <div style={S.mockupBody}>
                {form.logo ? (
                  <Image src={form.logo} alt="" style={S.mockupLogo} width={40} height={40} loader={externalImageLoader} />
                ) : (
                  <div style={{ ...S.mockupLogo, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Store size={20} color="#f59e0b" />
                  </div>
                )}
                <div style={S.mockupName}>{form.name || 'Your Store Name'}</div>
                {form.tagline && <div style={S.mockupTagline}>{form.tagline}</div>}
                {form.location && (
                  <div style={S.mockupLocation}>
                    <MapPin size={10} /> {form.location}
                  </div>
                )}
              </div>
            </div>

            <div style={{ fontSize: '0.72rem', color: '#3a3a56', textAlign: 'center', marginTop: '0.75rem' }}>
              Preview updates as you type
            </div>
          </div>

          {/* Stats */}
          {profile && (
            <div style={S.statsCard}>
              <div style={S.statsLabel}>Account Stats</div>
              <div style={S.statRow}>
                <span style={S.statKey}>Products</span>
                <span style={S.statVal}>{profile._count.products}</span>
              </div>
              <div style={S.statRow}>
                <span style={S.statKey}>Status</span>
                <span style={{
                  ...S.statusBadge,
                  background: profile.status === 'ACTIVE' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                  color: profile.status === 'ACTIVE' ? '#34d399' : '#fbbf24',
                }}>
                  {profile.status}
                </span>
              </div>
              {profile.isVerified && (
                <div style={S.statRow}>
                  <span style={S.statKey}>Verified</span>
                  <CheckCircle2 size={14} color="#34d399" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  @keyframes spin { to { transform: rotate(360deg); } }
  a { text-decoration: none; }
`;

const S: Record<string, React.CSSProperties> = {
  page: { fontFamily: "'DM Sans', sans-serif", color: '#f0f0f5', maxWidth: 960 },
  toast: { position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999, padding: '0.7rem 1.1rem', borderRadius: 10, fontSize: '0.83rem', fontWeight: 600, border: '1px solid', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' },
  h1: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.2rem' },
  subtitle: { fontSize: '0.82rem', color: '#55556e', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' },
  previewLink: { display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#818cf8', fontSize: '0.8rem' },
  slugNotice: { display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1rem', borderRadius: 9, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', fontSize: '0.8rem', color: '#9494b0', marginBottom: '1.5rem' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 260px', gap: '1.25rem', alignItems: 'start' },
  mainCol: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  sideCol: { display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'sticky', top: '1rem' },
  card: { background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, padding: '1.25rem' },
  cardTitle: { fontSize: '0.88rem', fontWeight: 700, color: '#e2e2f0', marginBottom: '1rem' },
  fieldGroup: { marginBottom: '1rem' },
  label: { display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 700, color: '#9494b0', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' },
  req: { color: '#f87171' },
  input: { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '0.6rem 0.85rem', color: '#f0f0f5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.86rem', outline: 'none' },
  textarea: { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '0.6rem 0.85rem', color: '#f0f0f5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.86rem', outline: 'none', resize: 'vertical', lineHeight: 1.6 },
  hint: { fontSize: '0.72rem', color: '#55556e', marginTop: '0.25rem', display: 'block' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  previewCard: { background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, padding: '1rem' },
  previewLabel: { fontSize: '0.68rem', fontWeight: 700, color: '#55556e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' },
  mockup: { borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' },
  mockupCover: { height: 72, backgroundSize: 'cover', backgroundPosition: 'center' },
  mockupBody: { padding: '0.75rem', background: '#13131a' },
  mockupLogo: { width: 44, height: 44, borderRadius: 10, objectFit: 'cover', border: '2px solid #0f0f1a', marginTop: -24, marginBottom: '0.5rem' } as React.CSSProperties,
  mockupName: { fontSize: '0.88rem', fontWeight: 700, color: '#f0f0f5', marginBottom: '0.15rem' },
  mockupTagline: { fontSize: '0.74rem', color: '#9494b0', marginBottom: '0.35rem', lineHeight: 1.4 },
  mockupLocation: { display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: '#55556e' },
  statsCard: { background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, padding: '1rem' },
  statsLabel: { fontSize: '0.68rem', fontWeight: 700, color: '#55556e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' },
  statRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  statKey: { fontSize: '0.78rem', color: '#55556e' },
  statVal: { fontSize: '0.84rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", color: '#e2e2f0' },
  statusBadge: { display: 'inline-flex', padding: '0.18rem 0.55rem', borderRadius: 100, fontSize: '0.68rem', fontWeight: 700 },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', borderRadius: 9, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0a0a0f', fontSize: '0.84rem', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(245,158,11,0.2)' },
};