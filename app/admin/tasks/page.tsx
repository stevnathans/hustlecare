/* eslint-disable react/no-unescaped-entities */
'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Plus, CheckCircle2, Circle, Flag, ExternalLink, FileEdit, History, TrendingDown } from 'lucide-react';
import ActivityRing from '@/components/execution/ActivityRing';

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');
  .adm { font-family:'Sora',sans-serif; color:#f0f0f5; }
  .adm-mono { font-family:'DM Mono',monospace; }

  .panel { background:#13131a; border:1px solid rgba(255,255,255,0.07); border-radius:14px; padding:1.25rem 1.5rem; }
  .sec-hd { font-size:0.65rem; font-weight:700; color:#55556e; text-transform:uppercase; letter-spacing:0.12em; margin-bottom:0.9rem; display:flex; align-items:center; gap:0.4rem; }

  .task-row { display:flex; align-items:center; gap:0.7rem; padding:0.6rem 0.25rem; border-bottom:1px solid rgba(255,255,255,0.04); }
  .task-row:last-child { border-bottom:none; }
  .prio-badge { font-size:0.62rem; font-weight:700; padding:0.1rem 0.45rem; border-radius:100px; text-transform:uppercase; }

  .alert-item { background:#1a1a24; border-radius:10px; padding:0.8rem 1rem; border:1px solid rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:space-between; cursor:pointer; transition:all 0.15s; width:100%; margin-bottom:0.5rem; }
  .alert-item:hover { border-color:rgba(255,255,255,0.12); background:#1f1f2e; }
  .alert-item:last-child { margin-bottom:0; }

  .behind-banner { background:rgba(239,68,68,0.07); border:1px solid rgba(239,68,68,0.2); border-radius:14px; padding:1.1rem 1.4rem; }
  .behind-row { display:flex; align-items:center; justify-content:space-between; padding:0.4rem 0; font-size:0.83rem; }

  .btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.5rem 0.9rem; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.8rem; font-weight:600; cursor:pointer; border:1px solid rgba(255,255,255,0.09); background:rgba(255,255,255,0.05); color:#9494b0; transition:all 0.15s; }
  .btn:hover { background:rgba(255,255,255,0.1); color:#f0f0f5; }
  .btn-plus { background:rgba(99,102,241,0.15); border-color:rgba(99,102,241,0.25); color:#a5b4fc; }
  .btn-plus:hover { background:rgba(99,102,241,0.25); }

  .empty-state { text-align:center; padding:2.5rem 1rem; color:#3a3a56; }

  .task-input { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.55rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; flex:1; }
  .task-input::placeholder { color:#3a3a56; }
  .task-input:focus { border-color:rgba(99,102,241,0.5); }
  .prio-select { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.55rem 0.6rem; color:#9494b0; font-family:'Sora',sans-serif; font-size:0.8rem; outline:none; cursor:pointer; }
  .prio-select option { background:#1a1a24; }

  .nav-link { display:inline-flex; align-items:center; gap:0.4rem; font-size:0.82rem; font-weight:600; color:#818cf8; text-decoration:none; }
  .nav-link:hover { color:#a5b4fc; }
`;

const PRIO_COLOR: Record<string, { bg: string; fg: string }> = {
  HIGH: { bg: 'rgba(239,68,68,0.15)', fg: '#f87171' },
  MEDIUM: { bg: 'rgba(245,158,11,0.15)', fg: '#fbbf24' },
  LOW: { bg: 'rgba(148,148,176,0.15)', fg: '#9494b0' },
};

type Activity = {
  id: number;
  name: string;
  sourceType: string;
  cadence: string;
  target: number;
  completed: number;
  isMet: boolean;
  color?: string | null;
  carriedOver: number;
};
type Task = {
  id: number;
  title: string;
  priority: string;
  status: string;
  dueDate: string | null;
  assignedTo?: { name: string } | null;
};
type AttentionItem = { label: string; count: number; href: string; color: string };
type TodayData = {
  activities: Activity[];
  summary: { totalDaily: number; metDaily: number };
  needsAttention: AttentionItem[];
  draftItems: AttentionItem[];
  tasks: Task[];
};

export default function ExecutionTrackerPage() {
  const router = useRouter();
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
  const [addingTask, setAddingTask] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/admin/execution/today');
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function logCompletion(activityId: number) {
    await fetch('/api/admin/execution/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activityId, count: 1 }),
    });
    fetchData();
  }

  async function toggleTask(task: Task) {
    const nextStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    await fetch(`/api/admin/execution/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    fetchData();
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setAddingTask(true);
    await fetch('/api/admin/execution/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTaskTitle.trim(), priority: newTaskPriority }),
    });
    setNewTaskTitle('');
    setNewTaskPriority('MEDIUM');
    setAddingTask(false);
    fetchData();
  }

  if (loading || !data) {
    return (
      <>
        <style>{S}</style>
        <div className="adm" style={{ padding: '2rem 0', color: '#55556e' }}>
          Loading today's tasks…
        </div>
      </>
    );
  }

  const behind = data.activities.filter((a) => a.carriedOver > 0);
  const overdueIds = new Set(
    data.tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date(new Date().toDateString())).map((t) => t.id)
  );
  const nextAction = data.tasks.find((t) => t.priority === 'HIGH') || data.tasks[0];

  return (
    <>
      <style>{S}</style>
      <div className="adm" style={{ minHeight: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
              Today
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#55556e' }}>
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} ·{' '}
              {data.summary.metDaily}/{data.summary.totalDaily} daily targets met
            </p>
          </div>
          <Link href="/admin/tasks/history" className="nav-link">
            <History size={14} /> View History
          </Link>
        </div>

        {/* Behind banner — only renders when something actually carried over */}
        {behind.length > 0 && (
          <div className="behind-banner" style={{ marginBottom: '1.25rem' }}>
            <div className="sec-hd" style={{ color: '#f87171', marginBottom: '0.6rem' }}>
              <TrendingDown size={12} /> Behind From Yesterday
            </div>
            {behind.map((a) => (
              <div className="behind-row" key={a.id}>
                <span style={{ color: '#f0f0f5' }}>{a.name}</span>
                <span className="adm-mono" style={{ color: '#f87171', fontWeight: 700 }}>+{a.carriedOver} carried over</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Progress rings */}
            <div className="panel">
              <div className="sec-hd">Today's Progress</div>
              {data.activities.length === 0 ? (
                <div className="empty-state">No activities set up yet — seed some in `Activity`.</div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                    gap: '1.25rem 0.5rem',
                  }}
                >
                  {data.activities.map((a) => (
                    <div key={a.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <ActivityRing name={a.name} completed={a.completed} target={a.target} color={a.color ?? '#818cf8'} />
                      {a.carriedOver > 0 && (
                        <span style={{ fontSize: '0.65rem', color: '#f87171', fontWeight: 700 }}>+{a.carriedOver} behind</span>
                      )}
                      {a.sourceType === 'MANUAL' && (
                        <button className="btn btn-plus" style={{ padding: '0.3rem 0.7rem' }} onClick={() => logCompletion(a.id)}>
                          <Plus size={13} /> Log one
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Today's tasks */}
            <div className="panel">
              <div className="sec-hd">Today's Tasks</div>

              <form onSubmit={addTask} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  className="task-input"
                  placeholder="Add a task…"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
                <select className="prio-select" value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
                <button className="btn btn-plus" type="submit" disabled={addingTask}>
                  <Plus size={14} /> Add
                </button>
              </form>

              {data.tasks.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: '#3a3a56' }}>Nothing pending — nice.</p>
              ) : (
                data.tasks.map((t) => {
                  const badge = PRIO_COLOR[t.priority];
                  const isOverdue = overdueIds.has(t.id);
                  return (
                    <div className="task-row" key={t.id}>
                      <button
                        onClick={() => toggleTask(t)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: t.status === 'DONE' ? '#34d399' : '#55556e',
                        }}
                      >
                        {t.status === 'DONE' ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                      </button>
                      <span
                        style={{
                          flex: 1,
                          fontSize: '0.85rem',
                          textDecoration: t.status === 'DONE' ? 'line-through' : 'none',
                          color: t.status === 'DONE' ? '#55556e' : '#f0f0f5',
                        }}
                      >
                        {t.title}
                      </span>
                      {isOverdue && <span style={{ fontSize: '0.68rem', color: '#f87171', fontWeight: 700 }}>OVERDUE</span>}
                      <span className="prio-badge" style={{ background: badge.bg, color: badge.fg }}>
                        {t.priority}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {nextAction && (
              <div className="panel" style={{ borderColor: 'rgba(99,102,241,0.25)' }}>
                <div className="sec-hd">
                  <Flag size={12} /> Next Action
                </div>
                <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{nextAction.title}</p>
                <p style={{ fontSize: '0.75rem', color: '#55556e', marginTop: '0.3rem' }}>{nextAction.priority} priority</p>
              </div>
            )}

            {data.needsAttention.length > 0 && (
              <div className="panel">
                <div className="sec-hd">
                  <AlertCircle size={12} /> Needs Attention
                </div>
                {data.needsAttention.map((n) => (
                  <button key={n.label} className="alert-item" onClick={() => router.push(n.href)}>
                    <span style={{ fontSize: '0.82rem', color: '#f0f0f5' }}>{n.label}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="adm-mono" style={{ fontWeight: 700, color: n.color }}>
                        {n.count}
                      </span>
                      <ExternalLink size={12} color="#55556e" />
                    </span>
                  </button>
                ))}
              </div>
            )}

            {data.draftItems.length > 0 && (
              <div className="panel">
                <div className="sec-hd">
                  <FileEdit size={12} /> In Draft
                </div>
                {data.draftItems.map((d) => (
                  <button key={d.label} className="alert-item" onClick={() => router.push(d.href)}>
                    <span style={{ fontSize: '0.82rem', color: '#f0f0f5' }}>{d.label}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="adm-mono" style={{ fontWeight: 700, color: d.color }}>
                        {d.count}
                      </span>
                      <ExternalLink size={12} color="#55556e" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}