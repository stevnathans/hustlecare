import Image from 'next/image';
import { Product } from 'types/vendor';

type Props = {
  product: Product;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAssign: (product: Product) => void;
};

export default function ProductCard({ product, selected, onSelect, onEdit, onDelete, onAssign }: Props) {
  return (
    <div className={`product-card ${selected ? 'selected' : ''}`}>
      <div className="card-cb">
        <input type="checkbox" className="cb" checked={selected} onChange={onSelect} />
      </div>
      <div className="card-actions">
        <button className="card-action-btn card-action-edit" onClick={onEdit} title="Edit">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          className="card-action-btn card-action-req"
          onClick={() => onAssign(product)}
          title={product.template ? `Assigned: ${product.template.name} — click to change` : 'Assign to requirement'}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
          </svg>
        </button>
        <button className="card-action-btn card-action-del" onClick={onDelete} title="Delete">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
          </svg>
        </button>
      </div>

      {product.image ? (
        <Image
          src={product.image}
          alt={product.name}
          width={300}
          height={160}
          className="card-img"
          style={{ display: 'block', width: '100%', height: 130, objectFit: 'cover' }}
        />
      ) : (
        <div className="card-img-placeholder">📦</div>
      )}

      <div className="card-body">
        <div className="card-name">{product.name}</div>
        <div className="card-desc">{product.description || <span style={{ color: '#3a3a56' }}>No description</span>}</div>
      </div>

      <div className="card-footer">
        <span className="price-tag">${product.price?.toLocaleString() ?? '—'}</span>
        {product.template ? (
          <span style={{
            fontSize: '0.68rem', fontWeight: 600, color: '#a89cf7',
            background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.2)',
            borderRadius: 100, padding: '0.1rem 0.5rem',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110,
          }}>
            {product.template.name}
          </span>
        ) : product.vendor ? (
          <span style={{ fontSize: '0.73rem', color: '#5a5a7a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>
            {product.vendor.name}
          </span>
        ) : null}
      </div>
    </div>
  );
}