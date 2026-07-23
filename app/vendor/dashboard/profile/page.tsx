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
const BOTTOM_NAV_H = 64;

type County = { id: number; name: string; slug: string };

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

  // County coverage
  servesAllCounties: boolean;
  counties: { countyId: number }[];
};

export default function VendorProfilePage() {
  const [profile, setProfile]   = useState<VendorProfile | null>(null);
  const [counties, setCounties] = useState<County[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [toast,   setToast]     = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [countySearch, setCountySearch] = useState('');

  const [form, setForm] = useState({
    name: '', tagline: '', description: '', website: '',
    logo: '', coverImage: '', location: '', phone: '',
    twitterUrl: '', instagramUrl: '', facebookUrl: '', linkedinUrl: '',
    servesAllCounties: true,
    countyIds: [] as number[],
  });

  useEffect(() => {
    fetchProfile();
    fetch('/api/counties')
      .then((r) => r.json())
      .then((d) => setCounties(Array.isArray(d) ? d : []))
      .catch(() => setCounties([]));
  }, []);

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
          servesAllCounties: d.servesAllCounties ?? true,
          countyIds: Array.isArray(d.counties) ? d.counties.map((c: { countyId: number }) => c.countyId) : [],
        });
      }
    } finally { setLoading(false); }
  }

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }

  function toggleCounty(id: number) {
    setForm((f) => ({
      ...f,
      countyIds: f.countyIds.includes(id)
        ? f.countyIds.filter((c) => c !== id)
        : [...f.countyIds, id],
    }));
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

  if (loading) {
    return (
      <div className="flex h-56 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-emerald-600" />
      </div>
    );
  }

  const F = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const filteredCounties = counties.filter((c) =>
    c.name.toLowerCase().includes(countySearch.toLowerCase())
  );

  return (
    <div className="max-w-[1000px] pb-24 text-gray-900 lg:pb-4">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed inset-x-4 top-4 z-[9999] flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-center text-sm font-semibold ${
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-600'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-0.5 text-2xl font-bold tracking-tight text-gray-900">Storefront Profile</h1>
          <p className="flex flex-wrap items-center text-sm text-gray-500">
            What customers see when they visit your vendor page.
            {profile && (
              <a
                href={`/vendors/${profile.slug}`}
                target="_blank"
                rel="noreferrer"
                className="ml-1.5 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"
              >
                Preview <ExternalLink size={11} />
              </a>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="hidden items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-60 lg:inline-flex"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Slug notice */}
      {profile && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-2.5 text-sm text-gray-600">
          <Store size={13} className="flex-shrink-0 text-indigo-500" />
          <span>
            Store URL:{' '}
            <strong className="font-mono text-sm text-indigo-600">/vendors/{profile.slug}</strong>
            {' '}— contact support to change.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_260px]">
        {/* Main column */}
        <div className="flex flex-col gap-4">
          {/* Identity */}
          <section className={sectionCls}>
            <h2 className={sectionTitleCls}>Store Identity</h2>
            <div className="mb-4">
              <label className={labelCls}>
                Store Name <span className="text-red-500">*</span>
              </label>
              <input className={inputCls} value={form.name} onChange={F('name')} placeholder="Your business name" />
            </div>
            <div className="mb-4">
              <label className={labelCls}>Tagline</label>
              <input
                className={inputCls}
                value={form.tagline}
                onChange={F('tagline')}
                maxLength={120}
                placeholder="One-liner that sells your store"
              />
              <span className="mt-1 block text-xs text-gray-400">{form.tagline.length}/120 characters</span>
            </div>
            <div>
              <label className={labelCls}>About Your Business</label>
              <textarea
                className={`${inputCls} resize-y leading-relaxed`}
                rows={4}
                value={form.description}
                onChange={F('description')}
                placeholder="Tell entrepreneurs who you are, what you sell, and why they should choose you…"
              />
            </div>
          </section>

          {/* Branding */}
          <section className={sectionCls}>
            <h2 className={sectionTitleCls}>Branding</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Logo URL</label>
                <input className={inputCls} value={form.logo} onChange={F('logo')} placeholder="https://…" />
                {form.logo && (
                  <div className="mt-2.5">
                    <Image
                      loader={externalImageLoader}
                      src={form.logo}
                      alt="logo"
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-xl border border-gray-200 object-cover"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}>Cover Image URL</label>
                <input className={inputCls} value={form.coverImage} onChange={F('coverImage')} placeholder="https://…" />
                {form.coverImage && (
                  <div className="mt-2.5">
                    <Image
                      loader={externalImageLoader}
                      src={form.coverImage}
                      alt="cover"
                      width={320}
                      height={68}
                      className="h-17 w-full rounded-lg border border-gray-200 object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className={sectionCls}>
            <h2 className={sectionTitleCls}>Contact & Location</h2>
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}><Globe size={11} /> Website</label>
                <input className={inputCls} value={form.website} onChange={F('website')} placeholder="https://yourbusiness.com" />
              </div>
              <div>
                <label className={labelCls}><MapPin size={11} /> Location</label>
                <input className={inputCls} value={form.location} onChange={F('location')} placeholder="Nairobi, Kenya" />
              </div>
            </div>
            <div>
              <label className={labelCls}><Phone size={11} /> Phone</label>
              <input
                className={`${inputCls} sm:max-w-[280px]`}
                value={form.phone}
                onChange={F('phone')}
                placeholder="+254 700 000 000"
              />
            </div>
          </section>

          {/* County coverage — NEW */}
          <section className={sectionCls}>
            <h2 className={sectionTitleCls}>Where You Operate</h2>
            <p className="mb-4 text-xs leading-relaxed text-gray-500">
              This determines how your products appear across the site. For most vendors — software,
              national bodies, or anyone shipping/serving customers everywhere — leave this on. Only turn
              it off if your products or services are limited to specific counties (e.g. a local county
              government office, or a supplier that only delivers within certain areas).
            </p>

            <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5">
              <input
                type="checkbox"
                checked={form.servesAllCounties}
                onChange={(e) => setForm((f) => ({ ...f, servesAllCounties: e.target.checked }))}
                className="mt-0.5 accent-emerald-600"
              />
              <span>
                <span className="block text-sm font-semibold text-gray-800">
                  I serve all counties in Kenya
                </span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  {form.servesAllCounties
                    ? 'Your products will show as available everywhere, regardless of which county a customer selects.'
                    : 'Turned off — pick the specific counties you serve below.'}
                </span>
              </span>
            </label>

            {!form.servesAllCounties && (
              <div>
                <label className={labelCls}>
                  Counties You Serve{' '}
                  {form.countyIds.length > 0 && (
                    <span className="normal-case font-normal text-gray-400">({form.countyIds.length} selected)</span>
                  )}
                </label>
                <input
                  className={`${inputCls} mb-2`}
                  placeholder="Search counties…"
                  value={countySearch}
                  onChange={(e) => setCountySearch(e.target.value)}
                />
                <div className="grid max-h-56 grid-cols-2 gap-1.5 overflow-y-auto rounded-lg border border-gray-200 p-2 sm:grid-cols-3">
                  {filteredCounties.length === 0 ? (
                    <div className="col-span-full py-4 text-center text-xs text-gray-400">No counties match &ldquo;{countySearch}&rdquo;</div>
                  ) : (
                    filteredCounties.map((c) => {
                      const active = form.countyIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleCounty(c.id)}
                          className={`rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                            active
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {c.name}
                        </button>
                      );
                    })
                  )}
                </div>
                {form.countyIds.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    Select at least one county, or your products won&apos;t appear for any Legal requirement search.
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Social */}
          <section className={sectionCls}>
            <h2 className={sectionTitleCls}>Social Links</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  { icon: <Twitter size={11} />, key: 'twitterUrl', label: 'Twitter / X', ph: 'https://x.com/…' },
                  { icon: <Instagram size={11} />, key: 'instagramUrl', label: 'Instagram', ph: 'https://instagram.com/…' },
                  { icon: <Facebook size={11} />, key: 'facebookUrl', label: 'Facebook', ph: 'https://facebook.com/…' },
                  { icon: <Linkedin size={11} />, key: 'linkedinUrl', label: 'LinkedIn', ph: 'https://linkedin.com/…' },
                ] as { icon: React.ReactNode; key: string; label: string; ph: string }[]
              ).map(({ icon, key, label, ph }) => (
                <div key={key}>
                  <label className={labelCls}>{icon} {label}</label>
                  <input className={inputCls} value={(form as any)[key]} onChange={F(key as keyof typeof form)} placeholder={ph} />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar — sticky only from lg breakpoint up, never on mobile */}
        <div className="flex flex-col gap-3.5 lg:sticky lg:top-4">
          {/* Preview card */}
          <div className={sideCardCls}>
            <div className={sideCardLabelCls}>Live Preview</div>
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <div
                className="h-17 bg-cover bg-center"
                style={{
                  backgroundImage: form.coverImage ? `url(${form.coverImage})` : undefined,
                  background: form.coverImage ? undefined : 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(16,185,129,0.1))',
                }}
              />
              <div className="bg-white p-3">
                {form.logo ? (
                  <Image
                    loader={externalImageLoader}
                    src={form.logo}
                    alt=""
                    width={42}
                    height={42}
                    className="-mt-5 mb-2 h-10.5 w-10.5 rounded-lg border-2 border-white object-cover shadow-sm"
                  />
                ) : (
                  <div className="-mt-5 mb-2 flex h-10.5 w-10.5 items-center justify-center rounded-lg border-2 border-white bg-emerald-50 shadow-sm">
                    <Store size={18} className="text-emerald-600" />
                  </div>
                )}
                <div className="mb-0.5 text-sm font-bold text-gray-900">{form.name || 'Your Store Name'}</div>
                {form.tagline && <div className="mb-1 text-xs leading-snug text-gray-500">{form.tagline}</div>}
                {form.location && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin size={9} /> {form.location}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-2 text-center text-[0.68rem] text-gray-300">Updates as you type</div>
          </div>

          {/* Account stats */}
          {profile && (
            <div className={sideCardCls}>
              <div className={sideCardLabelCls}>Account Stats</div>
              {[
                { key: 'Products', val: profile._count.products.toString() },
                { key: 'Status', val: profile.status },
                { key: 'Coverage', val: form.servesAllCounties ? 'All counties' : `${form.countyIds.length} ${form.countyIds.length === 1 ? 'county' : 'counties'}` },
                ...(profile.isVerified ? [{ key: 'Verified', val: '✓ Yes' }] : []),
              ].map(row => (
                <div key={row.key} className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0">
                  <span className="text-sm text-gray-500">{row.key}</span>
                  <span
                    className={`font-mono text-sm font-bold ${
                      row.key === 'Status'
                        ? profile.status === 'ACTIVE' ? 'text-emerald-600' : 'text-amber-600'
                        : row.key === 'Verified' ? 'text-emerald-600' : 'text-gray-800'
                    }`}
                  >
                    {row.val}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Desktop-only sidebar save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="hidden w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-60 lg:inline-flex"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Sticky mobile save bar */}
      <div
        className="fixed inset-x-0 z-20 border-t border-gray-200 bg-white/95 px-4 py-2.5 backdrop-blur-lg lg:hidden"
        style={{ bottom: `calc(${BOTTOM_NAV_H}px + env(safe-area-inset-bottom, 0px))` }}
      >
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

const sectionCls = 'rounded-2xl border border-gray-200 bg-white p-5';
const sectionTitleCls = 'mb-4 text-sm font-bold text-gray-900';
const labelCls = 'mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500';
const inputCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all duration-150 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100';
const sideCardCls = 'rounded-2xl border border-gray-200 bg-white p-4';
const sideCardLabelCls = 'mb-3 text-[0.65rem] font-bold uppercase tracking-wider text-gray-400';