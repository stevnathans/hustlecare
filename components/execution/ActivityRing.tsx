'use client';

function ringColor(pct: number, base: string) {
  if (pct >= 100) return '#34d399'; // emerald once met
  if (pct >= 60) return '#fbbf24';  // amber closing in
  if (pct > 0) return base;         // activity's own accent once started
  return 'rgba(255,255,255,0.14)';  // untouched — visible but muted, not black
}

export default function ActivityRing({
  name,
  completed,
  target,
  color = '#818cf8',
  size = 96,
  stroke = 8,
}: {
  name: string;
  completed: number;
  target: number;
  color?: string;
  size?: number;
  stroke?: number;
}) {
  const pct = Math.min(100, Math.round((completed / Math.max(1, target)) * 100));
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  const strokeColor = ringColor(pct, color);
  const isMet = completed >= target;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span className="adm-mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: isMet ? '#34d399' : '#f0f0f5' }}>
            {completed}/{target}
          </span>
          {isMet && <span style={{ fontSize: '0.6rem', color: '#34d399', fontWeight: 700 }}>DONE</span>}
        </div>
      </div>
      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#9494b0', textAlign: 'center' }}>{name}</span>
    </div>
  );
}