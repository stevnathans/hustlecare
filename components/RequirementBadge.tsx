import { Product } from 'types/vendor';

type Props = {
  product: Product;
  onAssign: (product: Product) => void;
};

export default function RequirementBadge({ product, onAssign }: Props) {
  if (!product.template) {
    return (
      <button
        onClick={() => onAssign(product)}
        title="Assign to a requirement"
        style={{
          background: 'none',
          border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: 100,
          padding: '0.15rem 0.55rem',
          fontSize: '0.7rem',
          color: '#3a3a56',
          cursor: 'pointer',
          fontFamily: "'Sora', sans-serif",
          transition: 'all 0.15s',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
        }}
        onMouseOver={e => {
          e.currentTarget.style.borderColor = 'rgba(124,106,247,0.4)';
          e.currentTarget.style.color = '#7c6af7';
        }}
        onMouseOut={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.color = '#3a3a56';
        }}
      >
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 4v16m8-8H4" />
        </svg>
        Assign
      </button>
    );
  }

  return (
    <button
      onClick={() => onAssign(product)}
      title={`Assigned to: ${product.template.name} — click to change`}
      style={{
        background: 'rgba(124,106,247,0.1)',
        border: '1px solid rgba(124,106,247,0.22)',
        borderRadius: 100,
        padding: '0.15rem 0.6rem',
        fontSize: '0.72rem',
        fontWeight: 600,
        color: '#a89cf7',
        cursor: 'pointer',
        fontFamily: "'Sora', sans-serif",
        transition: 'all 0.15s',
        maxWidth: 160,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        display: 'inline-block',
      }}
      onMouseOver={e => {
        e.currentTarget.style.background = 'rgba(124,106,247,0.18)';
        e.currentTarget.style.borderColor = 'rgba(124,106,247,0.4)';
      }}
      onMouseOut={e => {
        e.currentTarget.style.background = 'rgba(124,106,247,0.1)';
        e.currentTarget.style.borderColor = 'rgba(124,106,247,0.22)';
      }}
    >
      {product.template.name}
    </button>
  );
}