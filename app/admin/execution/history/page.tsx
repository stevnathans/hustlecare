'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');
  .adm { font-family:'Sora',sans-serif; color:#f0f0f5; }
  .adm-mono { font-family:'DM Mono',monospace; }

  .panel { background:#13131a; border:1px solid rgba(255,255,255,0.07); border-radius:14px; padding:1.25rem 1.5rem; }
  .sec-hd { font-size:0.65rem; font-weight:700; color:#55556e; text-transform:uppercase; letter-spacing:0.12em; margin-bottom:0.9rem; }

  .day-cell { width:28px; height:28px; border-radius:7px; cursor:pointer; transition:all 0.15s; border:1px solid transparent; flex-shrink:0; }
  .day-cell:hover { transform:scale(1.12); border-color:rgba(255,255,255,0.25); }
  .day-cell.selected { border-color:#818cf8; box-shadow:0 0 0 2px rgba(99,102,241,0.3); }

  .nav-link { display:inline-flex; align-items:center; gap:0.4rem; font-size:0.82rem; font-weight:600; color:#818cf8; text-decoration:none; margin-bottom:0.5rem; }
  .nav-link:hover { color:#a5b4fc; }

  .detail-row { display:flex; align-items:center; justify-content:space-between; padding:0.55rem 0; border-bottom:1px solid rgba(255,255,255,0.04); font-size:0.83rem; }
  .detail-row:last-child { border-bottom:none; }

  .legend-dot { width:10px; height:10px; border-radius:3px; display:inline-block; }
`;

function cellColor(day: { totalDaily: number; metCount: number; allMet: boolean }) {
  if (day.totalDaily === 0) return 'rgba(255,255,255,0.05)'; // no daily targets applicable that day
  if (day.allMet) return '#34d399';
  if (day.metCount > 0) return '#fbbf24';
  return 'rgba(239,68,68,0.55)';
}

type DayHistory = {
  date: string;
  activities: { id: number; name: string; target: number; completed: number; isMet: boolean; sourceType: string }[];
  metCount: number;
  totalDaily: number;
  allMet: boolean;
};

export default function ExecutionHistoryPage() {
  const [days, setDays] = useState<DayHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/execution/history?days=30')
      .then((res) => res.json())
      .then((json) => {
        setDays(json.days);
        setSelected(json.days[json.days.length - 1]?.date ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedDay = days.find((d) => d.date === selected);
  const streak = (() => {
    let count = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].allMet) count++;
      else break;
    }
    return count;
  })();

  return (
    <>
      <style>{S}</style>
      <div className="adm" style={{ minHeight: '100vh' }}>
        <Link href="/admin/execution" className="nav-link">
          <ArrowLeft size={14} /> Back to Today
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>History</h1>
        <p style={{ fontSize: '0.85rem', color: '#55556e', marginBottom: '1.5rem' }}>
          Last 30 days · daily targets only
        </p>

        {loading ? (
          <div style={{ color: '#55556e' }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {streak > 0 && (
              <div className="panel" style={{ borderColor: 'rgba(52,211,153,0.25)' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34d399' }}>{streak}-day streak</span>
                <span style={{ fontSize: '0.8rem', color: '#55556e', marginLeft: '0.5rem' }}>
                  hitting every daily target
                </span>
              </div>
            )}

            <div className="panel">
              <div className="sec-hd">Last 30 Days</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.9rem' }}>
                {days.map((d) => (
                  <div
                    key={d.date}
                    className={`day-cell${selected === d.date ? ' selected' : ''}`}
                    style={{ background: cellColor(d) }}
                    title={`${d.date} — ${d.metCount}/${d.totalDaily} met`}
                    onClick={() => setSelected(d.date)}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.72rem', color: '#55556e' }}>
                <span><span className="legend-dot" style={{ background: '#34d399' }} /> All met</span>
                <span><span className="legend-dot" style={{ background: '#fbbf24' }} /> Partial</span>
                <span><span className="legend-dot" style={{ background: 'rgba(239,68,68,0.55)' }} /> Missed</span>
                <span><span className="legend-dot" style={{ background: 'rgba(255,255,255,0.05)' }} /> No targets that day</span>
              </div>
            </div>

            {selectedDay && (
              <div className="panel">
                <div className="sec-hd">
                  {new Date(selectedDay.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  {' · '}
                  {selectedDay.metCount}/{selectedDay.totalDaily} met
                </div>
                {selectedDay.activities.length === 0 ? (
                  <p style={{ fontSize: '0.82rem', color: '#3a3a56' }}>No daily activities applicable this day.</p>
                ) : (
                  selectedDay.activities.map((a) => (
                    <div className="detail-row" key={a.id}>
                      <span style={{ color: '#f0f0f5' }}>{a.name}</span>
                      <span className="adm-mono" style={{ color: a.isMet ? '#34d399' : '#f87171', fontWeight: 700 }}>
                        {a.completed}/{a.target}{a.isMet ? ' ✓' : ''}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}