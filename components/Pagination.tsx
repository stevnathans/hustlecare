import { PAGE_SIZE_OPTIONS } from 'lib/constants';

type Props = {
  total: number;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
  onPageSize: (s: number) => void;
};

export default function Pagination({ total, page, pageSize, onPage, onPageSize }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    const lo = Math.max(2, page - 1);
    const hi = Math.min(totalPages - 1, page + 1);
    for (let i = lo; i <= hi; i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  return (
    <div className="pagination-bar">
      <div className="pagination-info">
        Showing <strong>{start}–{end}</strong> of <strong>{total}</strong> products
      </div>

      <div className="pagination-controls">
        <button className="pg-btn" disabled={page === 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="pg-ellipsis">…</span>
          ) : (
            <button key={p} className={`pg-btn ${page === p ? 'pg-active' : ''}`} onClick={() => onPage(p as number)}>
              {p}
            </button>
          )
        )}
        <button className="pg-btn" disabled={page === totalPages} onClick={() => onPage(page + 1)} aria-label="Next page">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="pagination-size">
        <span style={{ color: '#4a4a66', fontSize: '0.78rem' }}>Rows per page</span>
        <select
          className="filter-select"
          value={pageSize}
          onChange={e => { onPageSize(Number(e.target.value)); onPage(1); }}
          style={{ padding: '0.3rem 1.8rem 0.3rem 0.65rem', fontSize: '0.78rem' }}
        >
          {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );
}