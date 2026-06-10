import { SortField, SortDir } from 'types/vendor';

type Props = {
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
};

export default function SortIcon({ field, sortField, sortDir }: Props) {
  const active = sortField === field;
  return (
    <span className={`inline-flex flex-col ml-1 ${active ? 'text-indigo-500' : 'text-slate-400'}`}>
      <svg width="8" height="5" viewBox="0 0 8 5" className={`mb-0.5 transition-opacity ${active && sortDir === 'asc' ? 'opacity-100' : 'opacity-30'}`}>
        <path d="M4 0L8 5H0L4 0Z" fill="currentColor" />
      </svg>
      <svg width="8" height="5" viewBox="0 0 8 5" className={`transition-opacity ${active && sortDir === 'desc' ? 'opacity-100' : 'opacity-30'}`}>
        <path d="M4 5L0 0H8L4 5Z" fill="currentColor" />
      </svg>
    </span>
  );
}