'use client';
// components/shared/RequirementPicker.tsx
//
// Shared "select a requirement" control used by both:
//   - app/vendor/dashboard/products/new/page.tsx (vendor product form)
//   - components/ProductFormModal.tsx (admin product modal)
//
// It renders a trigger button (styled to match whichever form it's dropped
// into via the `variant` prop) plus a modern searchable modal for picking
// the requirement, grouped by category.

import { useEffect, useState } from 'react';
import { Search, X, ChevronRight, CheckCircle2 } from 'lucide-react';

export type RequirementOption = {
  id: number;
  name: string;
  category: string;
  /** Optional — vendor's `/api/requirements` includes this, admin's may not */
  necessity?: string;
};

type Variant = 'light' | 'dark';

type RequirementPickerProps = {
  requirements: RequirementOption[];
  loading?: boolean;
  /** templateId as a string, '' when nothing selected */
  value: string;
  onChange: (id: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
  /** 'light' matches the vendor product form (white cards / tailwind).
   *  'dark' matches the admin modal (form-input / form-select classes). */
  variant?: Variant;
  /** Optional helper copy shown under the trigger when something is selected (light variant only) */
  showSelectedDetail?: boolean;
};

export default function RequirementPicker({
  requirements,
  loading = false,
  value,
  onChange,
  error,
  label = 'Requirement',
  required = true,
  variant = 'light',
  showSelectedDetail = true,
}: RequirementPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = requirements.find(r => r.id.toString() === value);

  return (
    <div>
      <label className={variant === 'light' ? lightLabelCls : 'form-label'}>
        {label}{' '}
        {required && (
          <span className={variant === 'light' ? 'text-red-500' : 'form-required'}>*</span>
        )}
      </label>

      {loading ? (
        <div className="h-14 animate-pulse rounded-xl bg-gray-100" />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={
            variant === 'light'
              ? `flex w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-left text-sm transition-all duration-150 hover:border-emerald-400 hover:bg-emerald-50/40 focus:outline-none focus:ring-4 focus:ring-emerald-100 ${
                  error ? 'border-red-400' : 'border-gray-300'
                }`
              : `form-input form-select ${error ? 'form-input-error' : ''}`
          }
          style={variant === 'dark' ? { display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' } : undefined}
        >
          {selected ? (
            <span className="flex min-w-0 items-center gap-2">
              <span className={variant === 'light' ? 'truncate font-semibold text-gray-900' : 'truncate'} style={variant === 'dark' ? { fontWeight: 600 } : undefined}>
                {selected.name}
              </span>
              <span
                className={
                  variant === 'light'
                    ? 'flex-shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[0.68rem] font-semibold text-indigo-600'
                    : ''
                }
                style={
                  variant === 'dark'
                    ? {
                        flexShrink: 0,
                        borderRadius: 100,
                        padding: '0.1rem 0.5rem',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        background: 'rgba(124,106,247,0.12)',
                        color: '#a89cf7',
                      }
                    : undefined
                }
              >
                {selected.category}
              </span>
            </span>
          ) : (
            <span className={variant === 'light' ? 'text-gray-400' : ''} style={variant === 'dark' ? { color: '#8a8aa8' } : undefined}>
              Select a requirement…
            </span>
          )}
          <ChevronRight size={16} className="flex-shrink-0 text-gray-400" />
        </button>
      )}

      {error && (
        <div className={variant === 'light' ? 'mt-1.5 text-xs text-red-500' : 'form-error'}>
          {error}
        </div>
      )}

      {selected && showSelectedDetail && variant === 'light' && (
        <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            <span className="inline-flex rounded-full bg-indigo-100 px-2.5 py-0.5 text-[0.68rem] font-bold text-indigo-600">
              {selected.category}
            </span>
            {selected.necessity && (
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold ${
                  selected.necessity === 'Required'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {selected.necessity}
              </span>
            )}
          </div>
          <p className="m-0 text-xs leading-relaxed text-gray-500">
            Your product will appear to any entrepreneur whose business includes this requirement.
          </p>
        </div>
      )}

      <RequirementPickerModal
        isOpen={open}
        requirements={requirements}
        loading={loading}
        selectedId={value}
        onClose={() => setOpen(false)}
        onSelect={(id) => {
          onChange(id);
          setOpen(false);
        }}
      />
    </div>
  );
}

const lightLabelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500';

/* ── The modal itself — same modern look regardless of which form opened it ── */

function RequirementPickerModal({
  isOpen,
  requirements,
  loading,
  selectedId,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  requirements: RequirementOption[];
  loading: boolean;
  selectedId: string;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) setSearch('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = search.toLowerCase();
  const filtered = requirements.filter(
    r => r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)
  );
  const grouped = filtered.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {} as Record<string, RequirementOption[]>);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      style={{ animation: 'rq-fadeIn 0.18s ease' }}
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{ maxHeight: '85vh', animation: 'rq-slideUp 0.2s ease' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-5">
          <div>
            <h3 className="text-base font-bold text-gray-900">Select Requirement</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Choose which business requirement this product fulfils.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>

      {/* Search Bar Container inside RequirementPickerModal */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search requirements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              <Search className="mx-auto mb-2 h-10 w-10 text-gray-300" strokeWidth={1.5} />
              <p className="text-sm">No requirements found</p>
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="mb-4 last:mb-0">
                <div className="mb-1.5 px-1 text-[0.68rem] font-bold uppercase tracking-wider text-gray-400">
                  {category}
                </div>
                <div className="space-y-1.5">
                  {items.map(r => {
                    const isSelected = r.id.toString() === selectedId;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => onSelect(r.id.toString())}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                          isSelected
                            ? 'border-emerald-300 bg-emerald-50'
                            : 'border-gray-100 bg-gray-50 hover:border-emerald-200 hover:bg-emerald-50/50'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">{r.name}</p>
                          {r.necessity && (
                            <span
                              className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[0.66rem] font-bold ${
                                r.necessity === 'Required'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {r.necessity}
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <CheckCircle2 size={16} className="flex-shrink-0 text-emerald-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-100 bg-gray-50 px-4 py-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes rq-fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes rq-slideUp { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}