'use client';
// components/apply-help/TrackingClient.tsx
//
// The document checklist on the customer's tracking page: upload, replace
// and remove documents. Photos are shrunk in the browser before sending so
// a 6 MB phone picture doesn't hit the upload size limit.

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheckCircle, FiAlertCircle, FiClock, FiLoader, FiUploadCloud, FiTrash2 } from 'react-icons/fi';

export interface SpecView {
  id: number;
  label: string;
  description: string | null;
  isRequired: boolean;
}

export interface DocView {
  id: string;
  specId: number | null;
  label: string;
  fileName: string;
  status: 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED';
  rejectReason: string | null;
}

interface Props {
  token: string;
  canChange: boolean;
  specs: SpecView[];
  documents: DocView[];
}

const MAX_BYTES = 3_800_000; // server limit is 4,000,000

async function prepareFile(file: File): Promise<File> {
  if (file.type === 'application/pdf') {
    if (file.size > MAX_BYTES) {
      throw new Error('That PDF is over 4 MB. Try a smaller scan, or send it as photos.');
    }
    return file;
  }
  if (!file.type.startsWith('image/')) throw new Error('Upload a PDF or a photo (JPG or PNG).');

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('We could not read that photo. Try a JPG or PNG, or a PDF.');
  }

  const toBlob = (scale: number, quality: number) =>
    new Promise<Blob | null>((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(resolve, 'image/jpeg', quality);
    });

  let scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
  let quality = 0.82;
  for (let attempt = 0; attempt < 4; attempt++) {
    const blob = await toBlob(scale, quality);
    if (blob && blob.size <= MAX_BYTES) {
      const name = file.name.replace(/\.[^.]*$/, '') || 'photo';
      return new File([blob], `${name}.jpg`, { type: 'image/jpeg' });
    }
    scale *= 0.75;
    quality = Math.max(0.6, quality - 0.08);
  }
  throw new Error('That photo is too large to send. Try taking it again at a lower quality.');
}

function StatusChip({ status }: { status: DocView['status'] }) {
  if (status === 'ACCEPTED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
        <FiCheckCircle size={13} /> Accepted
      </span>
    );
  }
  if (status === 'REJECTED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700">
        <FiAlertCircle size={13} /> Needs replacing
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
      <FiClock size={13} /> Received
    </span>
  );
}

export default function TrackingClient({ token, canChange, specs, documents }: Props) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  async function upload(key: string, specId: number | null, picked: File | undefined) {
    if (!picked) return;
    setError(null);
    setBusyKey(key);
    try {
      const file = await prepareFile(picked);
      const body = new FormData();
      body.append('file', file);
      if (specId) body.append('specId', String(specId));
      const res = await fetch(`/api/apply-assistance/${token}/documents`, { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'The upload failed. Please try again.');
      router.refresh();
    } catch (err) {
      setError({ key, message: err instanceof Error ? err.message : 'The upload failed. Please try again.' });
    } finally {
      setBusyKey(null);
      const el = inputs.current[key];
      if (el) el.value = '';
    }
  }

  async function remove(docId: string) {
    setError(null);
    setBusyKey(`del-${docId}`);
    try {
      const res = await fetch(`/api/apply-assistance/${token}/documents/${docId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not remove that document.');
      router.refresh();
    } catch (err) {
      setError({ key: `del-${docId}`, message: err instanceof Error ? err.message : 'Could not remove that document.' });
    } finally {
      setBusyKey(null);
    }
  }

  function renderGroup({ keyName, title, hint, required, specId, docs }: {
    keyName: string;
    title: string;
    hint?: string | null;
    required?: boolean;
    specId: number | null;
    docs: DocView[];
  }) {
    const active = docs.filter((d) => d.status !== 'REJECTED');
    const satisfied = active.length > 0;
    const uploading = busyKey === keyName;

    return (
      <li key={keyName} className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              {title}
              {required === false && <span className="ml-2 text-xs font-normal text-slate-500">optional</span>}
            </p>
            {hint && <p className="text-sm text-slate-600 mt-0.5">{hint}</p>}
          </div>
          {specId !== null && (
            <span className={`shrink-0 text-xs font-medium ${satisfied ? 'text-emerald-700' : 'text-slate-500'}`}>
              {satisfied ? 'Done' : 'Needed'}
            </span>
          )}
        </div>

        {docs.length > 0 && (
          <ul className="mt-3 space-y-2">
            {docs.map((d) => (
              <li key={d.id} className="rounded-lg bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm text-slate-700">{d.fileName}</span>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusChip status={d.status} />
                    {canChange && d.status !== 'ACCEPTED' && (
                      <button
                        type="button"
                        onClick={() => remove(d.id)}
                        disabled={busyKey === `del-${d.id}`}
                        className="text-slate-400 hover:text-red-600 disabled:opacity-50"
                        aria-label={`Remove ${d.fileName}`}
                      >
                        <FiTrash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
                {d.status === 'REJECTED' && d.rejectReason && (
                  <p className="mt-1 text-sm text-red-700">{d.rejectReason}</p>
                )}
              </li>
            ))}
          </ul>
        )}

        {canChange && (
          <div className="mt-3">
            <input
              ref={(el) => {
                inputs.current[keyName] = el;
              }}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              id={`file-${keyName}`}
              onChange={(e) => upload(keyName, specId, e.target.files?.[0])}
            />
            <label
              htmlFor={`file-${keyName}`}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium ${
                uploading
                  ? 'border-slate-200 text-slate-400'
                  : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {uploading ? <FiLoader className="animate-spin" size={15} /> : <FiUploadCloud size={15} />}
              {uploading ? 'Uploading…' : docs.some((d) => d.status === 'REJECTED') ? 'Upload a replacement' : active.length ? 'Add another' : 'Upload'}
            </label>
          </div>
        )}

        {error && (error.key === keyName || docs.some((d) => error.key === `del-${d.id}`)) && (
          <p className="mt-2 text-sm text-red-700" role="alert">
            {error.message}
          </p>
        )}
      </li>
    );
  }

  const other = documents.filter((d) => d.specId === null);

  return (
    <ul className="space-y-3">
      {specs.map((s) =>
        renderGroup({
          keyName: `spec-${s.id}`,
          title: s.label,
          hint: s.description,
          required: s.isRequired,
          specId: s.id,
          docs: documents.filter((d) => d.specId === s.id),
        }),
      )}
      {(other.length > 0 || (canChange && specs.length === 0)) &&
        renderGroup({ keyName: 'other', title: 'Other documents', specId: null, docs: other })}
    </ul>
  );
}