// scripts/apply-phase2-edits.mjs
//
// Small single-line edits to YOUR existing files for Phase 2:
//   - the questionnaire engine (carry the consent tick and the order's
//     tracking token through submit, and stop a stale saved package from
//     overriding the one just chosen),
//   - the admin dashboard (new alerts and money cards for Apply For Me and
//     service orders),
//   - the admin menu (Services, Service Orders, Apply Prices, and a count
//     badge on the items that need you).
//
//   Run from the project root:   node scripts/apply-phase2-edits.mjs
//
// - Each file is backed up first (file.bak) the first time it is changed.
// - Safe to run twice: anything already applied is skipped.
// - If a line can't be found (your file differs from what was expected) it is
//   reported and nothing is guessed.

import fs from 'node:fs';
import path from 'node:path';

const EDITS = [
  {
    file: 'lib/questionnaires/types.ts',
    changes: [
      ['  errorMessage: string | null;', '  errorMessage: string | null;\n  publicToken: string | null;'],
      [
        '  | { type: "SUBMIT_SUCCESS"; orderNumber: string };',
        '  | { type: "SUBMIT_SUCCESS"; orderNumber: string; publicToken: string | null };',
      ],
    ],
  },
  {
    file: 'components/questionnaire-engine/engine/reducer.ts',
    changes: [
      // A package chosen now wins over the one saved on an old draft.
      ['        packageTier: action.draft.packageTier,', '        packageTier: state.packageTier ?? action.draft.packageTier,'],
      [
        '      return { ...state, status: "submitted", orderNumber: action.orderNumber };',
        '      return { ...state, status: "submitted", orderNumber: action.orderNumber, publicToken: action.publicToken };',
      ],
      ['    orderNumber: null,', '    orderNumber: null,\n    publicToken: null,'],
    ],
  },
  {
    file: 'components/questionnaire-engine/engine/context.tsx',
    changes: [
      ['  submitDraft,', '  submitDraft,\n  getLastSubmitError,'],
      ['  orderNumber: string | null;', '  orderNumber: string | null;\n  publicToken: string | null;'],
      ['  submit: () => Promise<void>;', '  submit: (consent: boolean) => Promise<void>;'],
      ['  async function submit() {', '  async function submit(consent: boolean) {'],
      ['      const draft = await submitDraft(state.draftId);', '      const { draft, publicToken } = await submitDraft(state.draftId, consent);'],
      [
        '      dispatch({ type: "SUBMIT_SUCCESS", orderNumber: draft.orderNumber ?? "" });',
        '      dispatch({ type: "SUBMIT_SUCCESS", orderNumber: draft.orderNumber ?? "", publicToken });',
      ],
      [
        '      dispatch({ type: "SET_STATUS", status: "error", errorMessage: "Could not submit your order. Please try again." });',
        '      dispatch({ type: "SET_STATUS", status: "error", errorMessage: getLastSubmitError() ?? "Could not submit your order. Please try again." });',
      ],
      ['    orderNumber: state.orderNumber,', '    orderNumber: state.orderNumber,\n    publicToken: state.publicToken,'],
    ],
  },
  {
    file: 'app/admin/page.tsx',
    changes: [
      ['  Store, FileText, BarChart3, ExternalLink, Search', '  Store, FileText, BarChart3, ExternalLink, Search, Briefcase, Wallet, ClipboardCheck'],
      [
        '  const [refreshing, setRefreshing] = useState(false);',
        "  const [refreshing, setRefreshing] = useState(false);\n  const [attention, setAttention] = useState<Record<string, number> | null>(null);",
      ],
      ['const [sRes, aRes] = await Promise.all([', 'const [sRes, aRes, tRes] = await Promise.all(['],
      ["fetch('/api/admin/stats'), fetch('/api/admin/activity')", "fetch('/api/admin/stats'), fetch('/api/admin/activity'), fetch('/api/admin/attention')"],
      [
        'if (aRes.ok) setRecentActivity(await aRes.json());',
        'if (aRes.ok) setRecentActivity(await aRes.json());\n      if (tRes.ok) setAttention(await tRes.json());',
      ],
      [
        '    (stats?.vendors?.pendingProducts||0)>0;',
        '    (stats?.vendors?.pendingProducts||0)>0 ||\n    (attention?.applyReady||0)>0 ||\n    (attention?.ordersToWork||0)>0;',
      ],
      [
        `<AlertItem title="Vendor Products Awaiting Review" count={stats?.vendors?.pendingProducts||0} color="#fbbf24" onClick={()=>router.push('/admin/products')} />`,
        `<AlertItem title="Vendor Products Awaiting Review" count={stats?.vendors?.pendingProducts||0} color="#fbbf24" onClick={()=>router.push('/admin/products')} />
                  <AlertItem title="Apply requests ready to apply" count={attention?.applyReady||0} color="#818cf8" onClick={()=>router.push('/admin/apply-requests')} />
                  <AlertItem title="Service orders to work on" count={attention?.ordersToWork||0} color="#34d399" onClick={()=>router.push('/admin/orders')} />`,
      ],
      [
        `<div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'1.25rem', alignItems:'start' }}>`,
        `{attention && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'1rem' }}>
                <StatCard title="Revenue collected" value={\`KES \${Math.round(attention.revenueTotal||0).toLocaleString()}\`} icon={Wallet} subtitle={\`KES \${Math.round(attention.revenueThisMonth||0).toLocaleString()} this month\`} color="green" onClick={()=>router.push('/admin/orders')} />
                <StatCard title="Still to collect" value={\`KES \${Math.round(attention.outstandingBalances||0).toLocaleString()}\`} icon={DollarSign} subtitle="Balances on orders in progress" color="orange" onClick={()=>router.push('/admin/orders')} />
                <StatCard title="Service orders" value={(attention.ordersToWork||0)+(attention.ordersInReview||0)+(attention.ordersAwaitingBalance||0)} icon={Briefcase} subtitle={\`\${attention.ordersToWork||0} to work on · \${attention.ordersInReview||0} in review · \${attention.ordersAwaitingBalance||0} awaiting balance\`} color="purple" onClick={()=>router.push('/admin/orders')} />
                <StatCard title="Apply For Me" value={(attention.applyReady||0)+(attention.applyWaiting||0)} icon={ClipboardCheck} subtitle={\`\${attention.applyReady||0} ready to apply · \${attention.applyLeads||0} unpaid leads\`} color="blue" onClick={()=>router.push('/admin/apply-requests')} />
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'1.25rem', alignItems:'start' }}>`,
      ],
      [
        'icon:Store },',
        "icon:Store },\n                    { label:'Services', href:'/admin/services', icon:Briefcase },\n                    { label:'Service Orders', href:'/admin/orders', icon:Briefcase },\n                    { label:'Apply Requests', href:'/admin/apply-requests', icon:ClipboardCheck },",
      ],
    ],
  },
  {
    file: 'app/admin/layout.tsx',
    changes: [
      ['} from "lucide-react";', '  Briefcase,\n  Tags,\n} from "lucide-react";'],
      [
        'name: "Orders",',
        'name: "Services",\n    href: "/admin/services",\n    icon: Briefcase,\n    requiredRoles: ["editor", "admin"],\n  },\n  {\n    name: "Service Orders",',
      ],
      [
        'name: "Legal Fees",',
        'name: "Apply Prices",\n    href: "/admin/apply-services",\n    icon: Tags,\n    requiredRoles: ["editor", "admin"],\n  },\n  {\n    name: "Legal Fees",',
      ],
      [
        '  const userRole = session?.user?.role || "user";',
        `  const userRole = session?.user?.role || "user";

  // Small count badges on the menu items that need you right now.
  const [badges, setBadges] = useState<Record<string, number>>({});
  useEffect(() => {
    if (userRole !== "admin") return;
    let cancelled = false;
    const load = () =>
      fetch("/api/admin/attention")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d && !cancelled) setBadges({ "/admin/apply-requests": d.applyReady || 0, "/admin/orders": d.ordersToWork || 0 });
        })
        .catch(() => {});
    load();
    const t = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [userRole]);`,
      ],
      [
        '<span>{item.name}</span>',
        '<span>{item.name}</span>\n                {(badges[item.href] || 0) > 0 && (\n                  <span className="ml-auto inline-flex min-w-[20px] items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-bold text-white">\n                    {badges[item.href]}\n                  </span>\n                )}',
      ],
    ],
  },
];

const count = (text, find) => text.split(find).length - 1;
let problems = 0;

for (const { file, changes } of EDITS) {
  const full = path.resolve(process.cwd(), file);
  if (!fs.existsSync(full)) {
    console.log(`✗ ${file}: file not found (run this from the project root)`);
    problems += 1;
    continue;
  }

  let text = fs.readFileSync(full, 'utf8');
  const original = text;
  console.log(`\n${file}`);

  for (const [find, replace] of changes) {
    const shown = find.trim().slice(0, 70);
    if (replace && text.includes(replace)) {
      console.log(`  – already applied:  ${shown}`);
      continue;
    }
    const n = count(text, find);
    if (n === 1) {
      text = text.replace(find, () => replace);
      console.log(`  ✓ changed:  ${shown}`);
    } else if (n === 0) {
      console.log(`  ✗ not found, left alone:  ${shown}`);
      problems += 1;
    } else {
      console.log(`  ✗ found ${n} times, left alone:  ${shown}`);
      problems += 1;
    }
  }

  if (text !== original) {
    if (!fs.existsSync(`${full}.bak`)) fs.writeFileSync(`${full}.bak`, original);
    fs.writeFileSync(full, text);
  }
}

console.log(problems === 0 ? '\nDone.' : `\nDone, with ${problems} problem(s) above.`);
process.exit(problems === 0 ? 0 : 1);
