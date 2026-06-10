const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .products-root {
    font-family: 'Sora', sans-serif;
    min-height: 100vh;
    background: #0f0f14;
    color: #e2e2ef;
    padding: 2rem;
  }

  .mono { font-family: 'DM Mono', monospace; }

  .glass {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    backdrop-filter: blur(12px);
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .page-title {
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -0.04em;
    background: linear-gradient(135deg, #fff 40%, #7c6af7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.1;
  }
  .page-subtitle { color: #6b6b8a; font-size: 0.85rem; margin-top: 0.25rem; }
  .header-actions { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }

  .stats-row { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
  .stat-pill {
    background: rgba(124,106,247,0.12);
    border: 1px solid rgba(124,106,247,0.2);
    border-radius: 100px;
    padding: 0.35rem 1rem;
    font-size: 0.78rem;
    color: #a89cf7;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .stat-pill strong { color: #e2e2ef; font-size: 0.9rem; }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    padding: 1rem 1.25rem;
    margin-bottom: 0.5rem;
  }
  .search-wrap { position: relative; flex: 1; min-width: 200px; }
  .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #6b6b8a; pointer-events: none; }
  .search-input {
    width: 100%;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 0.55rem 0.9rem 0.55rem 2.4rem;
    color: #e2e2ef;
    font-family: 'Sora', sans-serif;
    font-size: 0.85rem;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .search-input::placeholder { color: #4a4a66; }
  .search-input:focus { border-color: rgba(124,106,247,0.5); box-shadow: 0 0 0 3px rgba(124,106,247,0.1); }
  .search-clear {
    position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
    background: none; border: none; color: #4a4a66; cursor: pointer; padding: 2px;
    border-radius: 4px; display: flex; align-items: center; justify-content: center;
    transition: color 0.15s;
  }
  .search-clear:hover { color: #a89cf7; }

  .filter-select {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 0.55rem 2rem 0.55rem 0.85rem;
    color: #e2e2ef;
    font-family: 'Sora', sans-serif;
    font-size: 0.82rem;
    outline: none;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236b6b8a' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.6rem center;
    transition: border-color 0.2s;
  }
  .filter-select:focus { border-color: rgba(124,106,247,0.5); }
  .filter-select option { background: #1a1a26; }

  .btn {
    display: inline-flex; align-items: center; gap: 0.4rem;
    padding: 0.55rem 1.1rem;
    border-radius: 10px;
    font-family: 'Sora', sans-serif;
    font-size: 0.83rem; font-weight: 600;
    cursor: pointer; border: none;
    transition: all 0.18s; white-space: nowrap;
  }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }
  .btn-primary { background: linear-gradient(135deg, #7c6af7, #5a47e0); color: #fff; box-shadow: 0 4px 16px rgba(124,106,247,0.3); }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,106,247,0.45); }
  .btn-ghost { background: rgba(255,255,255,0.06); color: #b0b0cc; border: 1px solid rgba(255,255,255,0.1); }
  .btn-ghost:hover { background: rgba(255,255,255,0.1); color: #e2e2ef; }
  .btn-danger { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.25); }
  .btn-danger:hover { background: rgba(239,68,68,0.25); }
  .btn-icon { padding: 0.5rem; border-radius: 8px; }
  .btn-active { background: rgba(124,106,247,0.2); color: #a89cf7; border-color: rgba(124,106,247,0.4); }

  .filter-tag {
    display: inline-flex; align-items: center; gap: 0.35rem;
    background: rgba(124,106,247,0.1); border: 1px solid rgba(124,106,247,0.2);
    border-radius: 100px; padding: 0.28rem 0.75rem;
    font-size: 0.75rem; color: #a89cf7; cursor: pointer; transition: all 0.15s;
  }
  .filter-tag:hover { background: rgba(124,106,247,0.2); }

  .bulk-bar {
    display: flex; align-items: center; gap: 1rem;
    padding: 0.7rem 1.25rem;
    border-bottom: 1px solid rgba(124,106,247,0.15);
    background: rgba(124,106,247,0.06);
    font-size: 0.83rem; color: #a89cf7;
    animation: slideDown 0.2s ease;
  }

  .products-table { width: 100%; border-collapse: collapse; }
  .products-table th {
    padding: 0.65rem 1rem;
    text-align: left;
    font-size: 0.72rem; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: #4a4a66;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    white-space: nowrap; user-select: none;
  }
  .products-table th.sortable { cursor: pointer; transition: color 0.15s; }
  .products-table th.sortable:hover { color: #a89cf7; }
  .products-table td {
    padding: 0.85rem 1rem;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    vertical-align: middle;
  }
  .products-table tbody tr { transition: background 0.15s; }
  .products-table tbody tr:hover { background: rgba(255,255,255,0.03); }
  .products-table tbody tr.selected { background: rgba(124,106,247,0.06); }
  .products-table tbody tr:last-child td { border-bottom: none; }

  .cb { width: 16px; height: 16px; accent-color: #7c6af7; cursor: pointer; }

  .prod-img { width: 48px; height: 48px; border-radius: 10px; overflow: hidden; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
  .prod-img-placeholder { width: 48px; height: 48px; border-radius: 10px; background: rgba(255,255,255,0.04); border: 1px dashed rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; color: #3a3a56; flex-shrink: 0; }

  .vendor-badge {
    display: inline-flex; align-items: center; gap: 0.4rem;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 100px; padding: 0.2rem 0.6rem 0.2rem 0.3rem;
    font-size: 0.78rem; color: #b0b0cc; transition: all 0.15s;
    text-decoration: none; max-width: 150px; overflow: hidden;
  }
  .vendor-badge:hover { border-color: rgba(124,106,247,0.4); color: #a89cf7; }
  .vendor-logo { width: 18px; height: 18px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(255,255,255,0.1); flex-shrink: 0; }

  .price-tag { font-family: 'DM Mono', monospace; font-size: 0.88rem; color: #a4f4b0; font-weight: 500; }

  .url-link { display: inline-flex; align-items: center; gap: 0.3rem; color: #7c6af7; font-size: 0.8rem; text-decoration: none; transition: color 0.15s; }
  .url-link:hover { color: #a89cf7; }

  .action-btn {
    background: none; border: none; cursor: pointer;
    padding: 0.35rem 0.6rem; border-radius: 7px;
    font-size: 0.78rem; font-family: 'Sora', sans-serif; font-weight: 600; transition: all 0.15s;
  }
  .action-edit { color: #7c6af7; }
  .action-edit:hover { background: rgba(124,106,247,0.15); }
  .action-delete { color: #f87171; }
  .action-delete:hover { background: rgba(239,68,68,0.12); }

  .empty-state { text-align: center; padding: 4rem 2rem; color: #3a3a56; }
  .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
  .empty-state p { font-size: 0.9rem; margin-top: 0.4rem; color: #4a4a66; }

  .grid-view { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; padding: 1.25rem; }
  .product-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; overflow: hidden; transition: all 0.2s; position: relative; cursor: pointer; }
  .product-card:hover { border-color: rgba(124,106,247,0.3); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
  .product-card.selected { border-color: rgba(124,106,247,0.5); background: rgba(124,106,247,0.06); }
  .card-img { width: 100%; aspect-ratio: 16/9; object-fit: cover; background: rgba(255,255,255,0.04); }
  .card-img-placeholder { width: 100%; aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); color: #2a2a3e; font-size: 2rem; }
  .card-body { padding: 1rem; }
  .card-name { font-size: 0.92rem; font-weight: 600; color: #e2e2ef; margin-bottom: 0.35rem; line-height: 1.3; }
  .card-desc { font-size: 0.75rem; color: #5a5a7a; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .card-footer { display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 1rem; border-top: 1px solid rgba(255,255,255,0.05); }
  .card-cb { position: absolute; top: 0.6rem; left: 0.6rem; }
  .card-actions { position: absolute; top: 0.5rem; right: 0.5rem; display: flex; gap: 0.25rem; opacity: 0; transition: opacity 0.15s; }
  .product-card:hover .card-actions { opacity: 1; }
  .card-action-btn { width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; font-size: 0.75rem; transition: all 0.15s; }
  .card-action-edit { background: rgba(124,106,247,0.8); color: #fff; }
  .card-action-edit:hover { background: #7c6af7; }
  .card-action-del { background: rgba(239,68,68,0.8); color: #fff; }
  .card-action-del:hover { background: #ef4444; }
  .card-action-req { background: rgba(16,185,129,0.8); color: #fff; }
  .card-action-req:hover { background: #10b981; }

  .pagination-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; padding: 0.85rem 1.25rem; border-top: 1px solid rgba(255,255,255,0.06); }
  .pagination-info { font-size: 0.79rem; color: #4a4a66; }
  .pagination-info strong { color: #8080a8; }
  .pagination-controls { display: flex; align-items: center; gap: 0.25rem; }
  .pagination-size { display: flex; align-items: center; gap: 0.5rem; }
  .pg-btn { min-width: 32px; height: 32px; padding: 0 0.35rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); color: #8080a8; font-family: 'DM Mono', monospace; font-size: 0.8rem; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; }
  .pg-btn:hover:not(:disabled) { background: rgba(255,255,255,0.09); color: #e2e2ef; border-color: rgba(255,255,255,0.15); }
  .pg-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .pg-btn.pg-active { background: rgba(124,106,247,0.2); color: #a89cf7; border-color: rgba(124,106,247,0.4); }
  .pg-ellipsis { padding: 0 0.3rem; color: #3a3a56; font-size: 0.85rem; }

  .skeleton-row td { padding: 0.85rem 1rem; }
  .skel { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 6px; height: 14px; }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  .skel-avatar { width: 48px; height: 48px; border-radius: 10px; }

  .toast { position: fixed; bottom: 1.5rem; right: 1.5rem; padding: 0.75rem 1.25rem; border-radius: 12px; font-size: 0.84rem; font-family: 'Sora', sans-serif; z-index: 9999; animation: toastIn 0.25s ease; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
  .toast-success { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #6ee7b7; }
  .toast-error { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; }
  @keyframes toastIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

  .confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 9998; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.15s ease; }
  .confirm-box { background: #1a1a26; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 1.75rem; max-width: 380px; width: 90%; box-shadow: 0 24px 80px rgba(0,0,0,0.6); }
  .confirm-title { font-size: 1.05rem; font-weight: 600; margin-bottom: 0.5rem; }
  .confirm-sub { font-size: 0.84rem; color: #6b6b8a; margin-bottom: 1.5rem; }
  .confirm-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }

  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); z-index: 9000; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn 0.18s ease; }
  .modal-box { background: #13131f; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; width: 100%; max-width: 560px; box-shadow: 0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,106,247,0.1) inset; animation: modalIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1); display: flex; flex-direction: column; max-height: 92vh; overflow: hidden; }
  @keyframes modalIn { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: none; } }
  .modal-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 1.5rem 1.75rem 1.25rem; gap: 1rem; }
  .modal-title { font-size: 1.2rem; font-weight: 700; letter-spacing: -0.02em; color: #f0f0ff; }
  .modal-subtitle { font-size: 0.8rem; color: #5a5a7a; margin-top: 0.2rem; }
  .modal-close { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #6b6b8a; cursor: pointer; padding: 0.4rem; display: flex; align-items: center; justify-content: center; transition: all 0.15s; flex-shrink: 0; }
  .modal-close:hover { background: rgba(255,255,255,0.1); color: #e2e2ef; }
  .modal-divider { height: 1px; background: rgba(255,255,255,0.07); margin: 0; }
  .modal-body { padding: 1.5rem 1.75rem; overflow-y: auto; flex: 1; }
  .modal-body::-webkit-scrollbar { width: 4px; }
  .modal-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.1rem; }
  .form-full { grid-column: 1 / -1; }
  .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
  .form-label { font-size: 0.76rem; font-weight: 600; color: #6b6b8a; letter-spacing: 0.06em; text-transform: uppercase; }
  .form-required { color: #f87171; }
  .form-input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 0.65rem 0.9rem; color: #e2e2ef; font-family: 'Sora', sans-serif; font-size: 0.87rem; outline: none; width: 100%; transition: border-color 0.2s, box-shadow 0.2s, background 0.2s; }
  .form-input::placeholder { color: #3a3a58; }
  .form-input:focus { border-color: rgba(124,106,247,0.6); box-shadow: 0 0 0 3px rgba(124,106,247,0.12); background: rgba(255,255,255,0.07); }
  .form-input-error { border-color: rgba(239,68,68,0.5) !important; }
  .form-input-error:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.12) !important; }
  .form-error { font-size: 0.74rem; color: #f87171; margin-top: 0.1rem; }
  .form-textarea { resize: vertical; min-height: 80px; font-family: 'Sora', sans-serif; }
  .form-select { cursor: pointer; }
  .form-select option { background: #1a1a26; }
  .input-prefix-wrap { position: relative; }
  .input-prefix { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #6b6b8a; font-family: 'DM Mono', monospace; font-size: 0.85rem; pointer-events: none; }
  .input-with-prefix { padding-left: 1.75rem !important; font-family: 'DM Mono', monospace !important; }
  .url-input-wrap { position: relative; }
  .url-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #5a5a7a; pointer-events: none; }
  .input-with-icon { padding-left: 2.2rem !important; }
  .img-preview-wrap { margin-top: 0.6rem; border-radius: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); max-height: 100px; }
  .img-preview { width: 100%; height: 100px; object-fit: cover; display: block; }
  .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1.1rem 1.75rem; border-top: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.02); }

  .spin { animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .shortcut-hint { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.72rem; color: #3a3a56; font-family: 'DM Mono', monospace; }
  .kbd { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); border-radius: 4px; padding: 0.1rem 0.35rem; font-size: 0.68rem; color: #5a5a7a; }
  .divider { width: 1px; height: 24px; background: rgba(255,255,255,0.08); flex-shrink: 0; }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
`;

export default styles;