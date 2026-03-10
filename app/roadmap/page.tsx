"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type ReqStatus   = "complete" | "in_progress" | "pending";
type ReqCategory = "Legal" | "Software" | "Equipment" | "Documents" | "Branding";
type FilterType  = "all" | "required" | "optional";

interface VendorProduct { id: string; name: string; vendor: string; price: number; unit: string; href: string; }
interface DIYAction { label: string; href: string; }
interface Requirement {
  id: string; name: string; category: ReqCategory; description: string;
  required: boolean; status: ReqStatus; products: VendorProduct[]; diy?: DIYAction;
}
interface Stage {
  id: string; label: string; emoji: string; tagline: string;
  categories: ReqCategory[]; requirements: Requirement[];
}
interface CalcItem {
  productId: string; name: string; vendor: string; price: number; unit: string;
  category: ReqCategory; stageId: string; requirementId: string;
}
interface Toast {
  id: string; type: "req" | "category" | "stage" | "all";
  title: string; subtitle: string; emoji: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────
const STAGES: Stage[] = [
  {
    id: "plan", label: "Plan", emoji: "📋",
    tagline: "Research your market, define your concept, and map out what you need.",
    categories: ["Documents"],
    requirements: [
      { id: "p1", name: "Business Plan", category: "Documents", required: true, status: "complete",
        description: "A comprehensive plan covering concept, target market, competition, and financial strategy.",
        products: [
          { id: "pp1", name: "Business Plan Writing – Professional", vendor: "Hustlecare", price: 250, unit: "one-time", href: "/services/business-plan-writing" },
          { id: "pp2", name: "Business Plan Writing – Investor", vendor: "Hustlecare", price: 400, unit: "one-time", href: "/services/business-plan-writing" },
          { id: "pp3", name: "LivePlan Software", vendor: "LivePlan", price: 20, unit: "/mo", href: "#" },
        ] },
      { id: "p2", name: "Financial Projections", category: "Documents", required: true, status: "complete",
        description: "12-month revenue forecasts, startup cost estimates, and a breakeven analysis.",
        products: [
          { id: "fp1", name: "Financial Projections – Full Model", vendor: "Hustlecare", price: 200, unit: "one-time", href: "/services/financial-projections" },
          { id: "fp2", name: "Financial Projections – Investor Package", vendor: "Hustlecare", price: 350, unit: "one-time", href: "/services/financial-projections" },
          { id: "fp3", name: "Projection Hub Software", vendor: "Projection Hub", price: 49, unit: "one-time", href: "#" },
        ] },
      { id: "p3", name: "Market Research Report", category: "Documents", required: false, status: "in_progress",
        description: "Analysis of local competitors, customer demographics, and pricing benchmarks.",
        products: [
          { id: "mr1", name: "Market Research – Starter", vendor: "Hustlecare", price: 120, unit: "one-time", href: "#" },
          { id: "mr2", name: "Statista Industry Report", vendor: "Statista", price: 59, unit: "one-time", href: "#" },
        ] },
      { id: "p4", name: "Location Analysis", category: "Documents", required: false, status: "pending",
        description: "Evaluate potential sites based on foot traffic, rental costs, and demographics.",
        products: [], diy: { label: "Use our free Location Checklist", href: "#" } },
    ],
  },
  {
    id: "register", label: "Register", emoji: "⚖️",
    tagline: "Make your coffee shop legally operational with the right registrations and licences.",
    categories: ["Legal", "Documents"],
    requirements: [
      { id: "r1", name: "Business Registration", category: "Legal", required: true, status: "complete",
        description: "Register your coffee shop as a legal business entity.",
        products: [
          { id: "rp1", name: "Business Registration – Standard", vendor: "Hustlecare", price: 150, unit: "one-time", href: "/services/business-registration" },
          { id: "rp2", name: "Business Registration – Complete", vendor: "Hustlecare", price: 250, unit: "one-time", href: "/services/business-registration" },
        ] },
      { id: "r2", name: "Food Service Licence", category: "Legal", required: true, status: "in_progress",
        description: "Permits required to legally serve food and beverages to the public.",
        products: [{ id: "fsl1", name: "Licence Application Assistance", vendor: "Hustlecare", price: 80, unit: "one-time", href: "#" }] },
      { id: "r3", name: "Health & Safety Certificate", category: "Legal", required: true, status: "pending",
        description: "Complete health and safety training required for food businesses.",
        products: [
          { id: "hs1", name: "Level 2 Food Hygiene Certificate", vendor: "HighSpeed Training", price: 25, unit: "one-time", href: "#" },
          { id: "hs2", name: "Level 3 Food Safety Certificate", vendor: "HighSpeed Training", price: 65, unit: "one-time", href: "#" },
        ] },
      { id: "r4", name: "Business Insurance", category: "Legal", required: true, status: "pending",
        description: "Public liability and contents insurance for your coffee shop premises.",
        products: [
          { id: "bi1", name: "Café Public Liability – Basic", vendor: "Simply Business", price: 480, unit: "/yr", href: "#" },
          { id: "bi2", name: "Café Public Liability – Comprehensive", vendor: "Simply Business", price: 720, unit: "/yr", href: "#" },
          { id: "bi3", name: "Contents & Equipment Insurance", vendor: "AXA Business", price: 350, unit: "/yr", href: "#" },
        ] },
      { id: "r5", name: "Employer Liability Insurance", category: "Legal", required: false, status: "pending",
        description: "Required by law if you plan to employ staff.",
        products: [{ id: "eli1", name: "Employer Liability Cover", vendor: "Simply Business", price: 300, unit: "/yr", href: "#" }] },
      { id: "r6", name: "Open a Business Bank Account", category: "Documents", required: true, status: "pending",
        description: "Separate your personal and business finances with a dedicated account.",
        products: [], diy: { label: "Compare business bank accounts", href: "#" } },
      { id: "r7", name: "Premises Lease Review", category: "Documents", required: true, status: "pending",
        description: "Have your commercial lease reviewed by a legal professional before signing.",
        products: [
          { id: "lr1", name: "Commercial Lease Review", vendor: "LegalZoom", price: 199, unit: "one-time", href: "#" },
          { id: "lr2", name: "Lease Review – Rocket Lawyer", vendor: "Rocket Lawyer", price: 149, unit: "one-time", href: "#" },
        ] },
    ],
  },
  {
    id: "brand", label: "Brand", emoji: "🎨",
    tagline: "Build a visual identity your customers will recognise and remember.",
    categories: ["Branding", "Documents"],
    requirements: [
      { id: "b1", name: "Business Name & Domain", category: "Branding", required: true, status: "complete",
        description: "Choose your coffee shop name and register a matching domain.",
        products: [
          { id: "bn1", name: "Business Name & Domain – Starter", vendor: "Hustlecare", price: 30, unit: "one-time", href: "/services/business-name-domain" },
          { id: "bn2", name: ".com Domain Registration", vendor: "Namecheap", price: 12, unit: "/yr", href: "#" },
        ] },
      { id: "b2", name: "Logo Design", category: "Branding", required: true, status: "complete",
        description: "A professional logo that captures your coffee shop's personality.",
        products: [
          { id: "ld1", name: "Logo Design – Professional", vendor: "Hustlecare", price: 120, unit: "one-time", href: "/services/logo-design" },
          { id: "ld2", name: "Logo Design – Complete Brand Kit", vendor: "Hustlecare", price: 220, unit: "one-time", href: "/services/logo-design" },
        ] },
      { id: "b3", name: "Menu Design", category: "Branding", required: true, status: "in_progress",
        description: "Professionally designed physical and digital menus for your coffee shop.",
        products: [
          { id: "md1", name: "Menu Design – Single Format", vendor: "DesignPickle", price: 75, unit: "one-time", href: "#" },
          { id: "md2", name: "Canva Pro Subscription", vendor: "Canva", price: 13, unit: "/mo", href: "#" },
        ] },
      { id: "b4", name: "Branded Packaging", category: "Branding", required: false, status: "pending",
        description: "Custom cups, bags, and sleeves printed with your logo.",
        products: [
          { id: "bp1", name: "Custom Cup Sleeves (500 units)", vendor: "Sticker Mule", price: 185, unit: "one-time", href: "#" },
          { id: "bp2", name: "Custom Takeaway Bags (500 units)", vendor: "Packhelp", price: 220, unit: "one-time", href: "#" },
        ] },
      { id: "b5", name: "Signage & Exterior Display", category: "Branding", required: false, status: "pending",
        description: "Window graphics, exterior signage, and A-board for your shopfront.",
        products: [
          { id: "sg1", name: "Exterior Sign Design + Print", vendor: "Signs Express", price: 450, unit: "one-time", href: "#" },
          { id: "sg2", name: "A-Board / Pavement Sign", vendor: "Displays2Go", price: 89, unit: "one-time", href: "#" },
        ] },
      { id: "b6", name: "Brand Style Guide", category: "Documents", required: false, status: "pending",
        description: "Document your fonts, colours, and logo usage rules for consistent branding.",
        products: [], diy: { label: "Download our free Brand Guide Template", href: "#" } },
    ],
  },
  {
    id: "build", label: "Build", emoji: "🔧",
    tagline: "Purchase equipment, set up your digital tools, and get your space ready for customers.",
    categories: ["Equipment", "Software"],
    requirements: [
      { id: "bu1", name: "Espresso Machine", category: "Equipment", required: true, status: "pending",
        description: "Commercial-grade espresso machine capable of handling high volume.",
        products: [
          { id: "em1", name: "Sage Barista Express", vendor: "Sage Appliances", price: 699, unit: "one-time", href: "#" },
          { id: "em2", name: "La Marzocco Linea Mini", vendor: "La Marzocco", price: 4200, unit: "one-time", href: "#" },
          { id: "em3", name: "Rancilio Classe 7 USB", vendor: "Rancilio", price: 2800, unit: "one-time", href: "#" },
        ] },
      { id: "bu2", name: "Coffee Grinder", category: "Equipment", required: true, status: "pending",
        description: "High-quality commercial burr grinder for consistent espresso extraction.",
        products: [
          { id: "cg1", name: "Baratza Sette 270 Grinder", vendor: "Baratza", price: 380, unit: "one-time", href: "#" },
          { id: "cg2", name: "Mazzer Mini Grinder", vendor: "Mazzer", price: 750, unit: "one-time", href: "#" },
          { id: "cg3", name: "Mahlkönig E65S GbW", vendor: "Mahlkönig", price: 1650, unit: "one-time", href: "#" },
        ] },
      { id: "bu3", name: "Refrigeration Units", category: "Equipment", required: true, status: "pending",
        description: "Display fridge for pastries and back-of-house refrigeration for ingredients.",
        products: [
          { id: "rf1", name: "Display Refrigerator 3-Door", vendor: "Polar Refrigeration", price: 1100, unit: "one-time", href: "#" },
          { id: "rf2", name: "Under Counter Fridge", vendor: "Gram Commercial", price: 650, unit: "one-time", href: "#" },
        ] },
      { id: "bu4", name: "Furniture & Fixtures", category: "Equipment", required: true, status: "pending",
        description: "Tables, chairs, counter stools, and interior fit-out for your café floor.",
        products: [
          { id: "ff1", name: "Café Table & Chair Set (6 tables)", vendor: "Furniture At Work", price: 890, unit: "one-time", href: "#" },
          { id: "ff2", name: "Bar Stool Set (4 stools)", vendor: "IKEA Business", price: 220, unit: "one-time", href: "#" },
          { id: "ff3", name: "Counter & Display Shelving", vendor: "Bespoke Joinery Co.", price: 1800, unit: "one-time", href: "#" },
        ] },
      { id: "bu5", name: "POS System", category: "Software", required: true, status: "pending",
        description: "Point-of-sale system for taking orders, processing payments, and tracking sales.",
        products: [
          { id: "pos1", name: "Square for Restaurants", vendor: "Square", price: 60, unit: "/mo", href: "#" },
          { id: "pos2", name: "Lightspeed Restaurant POS", vendor: "Lightspeed", price: 69, unit: "/mo", href: "#" },
          { id: "pos3", name: "Epos Now Catering Bundle", vendor: "Epos Now", price: 999, unit: "one-time", href: "#" },
        ] },
      { id: "bu6", name: "Website", category: "Software", required: true, status: "pending",
        description: "Professional website with your menu, location, hours, and contact details.",
        products: [
          { id: "ws1", name: "Website Creation – Business", vendor: "Hustlecare", price: 350, unit: "one-time", href: "/services/website-creation" },
          { id: "ws2", name: "Website Creation – Premium", vendor: "Hustlecare", price: 600, unit: "one-time", href: "/services/website-creation" },
          { id: "ws3", name: "Squarespace Commerce", vendor: "Squarespace", price: 23, unit: "/mo", href: "#" },
        ] },
      { id: "bu7", name: "Accounting Software", category: "Software", required: false, status: "pending",
        description: "Cloud accounting software for managing invoices, expenses, and tax.",
        products: [
          { id: "acc1", name: "QuickBooks Simple Start", vendor: "QuickBooks", price: 15, unit: "/mo", href: "#" },
          { id: "acc2", name: "Xero Starter", vendor: "Xero", price: 14, unit: "/mo", href: "#" },
        ] },
      { id: "bu8", name: "Staff Scheduling Software", category: "Software", required: false, status: "pending",
        description: "Tools to manage rotas, shifts, and staff communication.",
        products: [
          { id: "ss1", name: "Deputy – Scheduling", vendor: "Deputy", price: 4.50, unit: "/user/mo", href: "#" },
          { id: "ss2", name: "7shifts Free Plan", vendor: "7shifts", price: 0, unit: "Free", href: "#" },
        ] },
      { id: "bu9", name: "Staff Hiring & Onboarding", category: "Documents", required: true, status: "pending",
        description: "Recruit, interview, and onboard baristas and front-of-house staff.",
        products: [], diy: { label: "Download our Staff Onboarding Template", href: "#" } },
    ],
  },
  {
    id: "launch", label: "Launch", emoji: "🚀",
    tagline: "Get your coffee shop in front of customers and open your doors for business.",
    categories: ["Branding", "Software", "Documents"],
    requirements: [
      { id: "l1", name: "Social Media Setup", category: "Branding", required: true, status: "pending",
        description: "Create and optimise branded profiles on Instagram, Facebook, and other platforms.",
        products: [
          { id: "sm1", name: "Social Media Setup – Full Launch", vendor: "Hustlecare", price: 140, unit: "one-time", href: "/services/social-media-setup" },
          { id: "sm2", name: "Social Media Setup – Complete Presence", vendor: "Hustlecare", price: 220, unit: "one-time", href: "/services/social-media-setup" },
        ] },
      { id: "l2", name: "Google Business Profile", category: "Software", required: true, status: "pending",
        description: "Get listed on Google Maps and Search so local customers can find you.",
        products: [{ id: "gbp1", name: "Google Business Profile Setup", vendor: "Hustlecare", price: 60, unit: "one-time", href: "/services/google-business-profile" }] },
      { id: "l3", name: "Email Marketing Tool", category: "Software", required: false, status: "pending",
        description: "Collect customer emails and send newsletters, promotions, and loyalty offers.",
        products: [
          { id: "eml1", name: "Mailchimp – Essentials", vendor: "Mailchimp", price: 13, unit: "/mo", href: "#" },
          { id: "eml2", name: "Klaviyo – Starter", vendor: "Klaviyo", price: 20, unit: "/mo", href: "#" },
        ] },
      { id: "l4", name: "Loyalty Programme", category: "Software", required: false, status: "pending",
        description: "A digital stamp card or loyalty app to reward and retain repeat customers.",
        products: [
          { id: "lp1", name: "Stamp Me Digital Loyalty", vendor: "Stamp Me", price: 39, unit: "/mo", href: "#" },
          { id: "lp2", name: "Square Loyalty", vendor: "Square", price: 45, unit: "/mo", href: "#" },
        ] },
      { id: "l5", name: "Supplier Agreements", category: "Documents", required: true, status: "pending",
        description: "Set up accounts and agreements with your coffee bean, milk, and food suppliers.",
        products: [], diy: { label: "Download our Supplier Agreement Template", href: "#" } },
      { id: "l6", name: "Opening Launch Plan", category: "Documents", required: false, status: "pending",
        description: "A promotional strategy for your opening week including offers and events.",
        products: [{ id: "ol1", name: "Launch Strategy Consultation (1hr)", vendor: "GrowthConsult", price: 120, unit: "one-time", href: "#" }] },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const CAT_CFG: Record<ReqCategory, { color: string; bg: string; border: string; icon: string; bar: string }> = {
  Legal:     { color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200",    icon: "⚖️", bar: "bg-red-400"    },
  Software:  { color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200",   icon: "💻", bar: "bg-blue-400"   },
  Equipment: { color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", icon: "🔧", bar: "bg-orange-400" },
  Documents: { color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", icon: "📄", bar: "bg-violet-400" },
  Branding:  { color: "text-pink-700",   bg: "bg-pink-50",   border: "border-pink-200",   icon: "🎨", bar: "bg-pink-400"   },
};

const STATUS_CFG: Record<ReqStatus, { label: string; pill: string; ring: string }> = {
  complete:    { label: "Complete",    pill: "bg-emerald-100 text-emerald-700 border-emerald-200", ring: "bg-emerald-500 border-emerald-500 text-white"        },
  in_progress: { label: "In Progress", pill: "bg-amber-100 text-amber-700 border-amber-200",       ring: "border-amber-400 bg-amber-50"                        },
  pending:     { label: "Pending",     pill: "bg-slate-100 text-slate-500 border-slate-200",       ring: "border-slate-300 bg-white hover:border-emerald-400"  },
};

const CAT_ORDER: ReqCategory[] = ["Legal", "Equipment", "Software", "Documents", "Branding"];

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS HELPERS — only required requirements count
// ─────────────────────────────────────────────────────────────────────────────
function reqPct(reqs: Requirement[]) {
  const required = reqs.filter(r => r.required);
  if (!required.length) return 100;
  const done = required.filter(r => r.status === "complete").length;
  return Math.round(done / required.length * 100);
}

function stageCounts(s: Stage) {
  const r = s.requirements;
  return {
    total:       r.length,
    complete:    r.filter(x => x.status === "complete").length,
    in_progress: r.filter(x => x.status === "in_progress").length,
    pending:     r.filter(x => x.status === "pending").length,
    requiredDone: r.filter(x => x.required && x.status === "complete").length,
    requiredTotal: r.filter(x => x.required).length,
  };
}

function isCategoryComplete(reqs: Requirement[]) { return reqPct(reqs) === 100; }
function isStageComplete(s: Stage) { return reqPct(s.requirements) === 100; }

function overallPct(stages: Stage[]) {
  const all = stages.flatMap(s => s.requirements);
  return reqPct(all);
}

function groupByCategory(reqs: Requirement[]): Partial<Record<ReqCategory, Requirement[]>> {
  return reqs.reduce((acc, r) => { acc[r.category] = [...(acc[r.category] ?? []), r]; return acc; }, {} as Partial<Record<ReqCategory, Requirement[]>>);
}

function fmtPrice(n: number, unit?: string) {
  if (n === 0) return "Free";
  const base = n < 10 ? `$${n.toFixed(2)}` : `$${Math.round(n).toLocaleString()}`;
  return unit && unit !== "one-time" ? base + unit : base;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFETTI
// ─────────────────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ["#10b981","#f59e0b","#3b82f6","#ec4899","#8b5cf6","#f97316","#06b6d4"];

function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 40,
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 3,
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 8,
      w: 8 + Math.random() * 8,
      h: 4 + Math.random() * 4,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      alpha: 1,
    }));

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;
      particles.forEach(p => {
        p.x  += p.vx; p.y += p.vy;
        p.rot += p.rotV;
        if (frame > 60) p.alpha = Math.max(0, p.alpha - 0.012);
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (particles.some(p => p.alpha > 0)) animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
const TOAST_STYLES: Record<Toast["type"], { bg: string; border: string; icon: string }> = {
  req:      { bg: "bg-white",         border: "border-emerald-300", icon: "✅" },
  category: { bg: "bg-emerald-50",    border: "border-emerald-400", icon: "🏅" },
  stage:    { bg: "bg-emerald-600",   border: "border-emerald-500", icon: "🏆" },
  all:      { bg: "bg-amber-500",     border: "border-amber-400",   icon: "🚀" },
};

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t, i) => {
        const s = TOAST_STYLES[t.type];
        const isStage = t.type === "stage" || t.type === "all";
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl border-2 shadow-xl max-w-xs ${s.bg} ${s.border}`}
            style={{ animation: "toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards", animationDelay: `${i * 60}ms` }}
          >
            <span className="text-xl flex-shrink-0 mt-0.5">{s.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold leading-snug ${isStage ? "text-white" : "text-slate-800"}`}>{t.title}</p>
              <p className={`text-xs mt-0.5 leading-relaxed ${isStage ? "text-emerald-100" : "text-slate-500"}`}>{t.subtitle}</p>
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className={`flex-shrink-0 mt-0.5 text-xs font-bold opacity-60 hover:opacity-100 transition-opacity ${isStage ? "text-white" : "text-slate-400"}`}
            >✕</button>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────────────────────
function CheckMini() { return <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>; }
function ChevronDown({ open }: { open: boolean }) { return <svg className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>; }
function ArrowRight({ cls = "w-3.5 h-3.5" }: { cls?: string }) { return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>; }
function SearchIco() { return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/></svg>; }
function XCircle() { return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>; }
function CartIco() { return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>; }
function TrashIco() { return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>; }

// ─────────────────────────────────────────────────────────────────────────────
// REQUIREMENT CARD
// ─────────────────────────────────────────────────────────────────────────────
function RequirementCard({ req, calcItems, onCycleStatus, onAddProduct, onRemoveProduct }: {
  req: Requirement; calcItems: CalcItem[];
  onCycleStatus: (id: string) => void;
  onAddProduct: (p: VendorProduct, req: Requirement) => void;
  onRemoveProduct: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const st = STATUS_CFG[req.status];
  const addedIds = new Set(calcItems.map(c => c.productId));
  const addedCount = req.products.filter(p => addedIds.has(p.id)).length;
  const isComplete = req.status === "complete";

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
        isComplete           ? "bg-emerald-50/50 border-emerald-200" :
        req.status === "in_progress" ? "bg-white border-amber-200 shadow-sm" :
                               "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
      }`}
      style={{ animation: "cardIn 0.25s ease-out both" }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Status circle */}
          <button
            onClick={() => onCycleStatus(req.id)}
            title="Click to update status"
            className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 active:scale-90 ${st.ring}`}
          >
            {isComplete                    && <CheckMini />}
            {req.status === "in_progress"  && <div className="w-2 h-2 rounded-full bg-amber-400" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <h3 className={`font-semibold text-sm leading-snug transition-all duration-200 ${isComplete ? "text-slate-400 line-through" : "text-slate-800"}`}>
                {req.name}
              </h3>
              {/* Required / Optional badge */}
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${req.required ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500"}`}>
                {req.required ? "Required" : "Optional"}
              </span>
              {/* Status pill */}
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.pill}`}>
                {st.label}
              </span>
            </div>
            <p className={`text-xs leading-relaxed transition-all duration-200 ${isComplete ? "text-slate-400" : "text-slate-500"}`}>
              {req.description}
            </p>
          </div>
        </div>

        {/* Footer action */}
        <div className="mt-3 ml-9">
          {req.products.length > 0 ? (
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <CartIco />
              {req.products.length} vendor {req.products.length === 1 ? "product" : "products"}
              {addedCount > 0 && (
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {addedCount} added
                </span>
              )}
              <ChevronDown open={expanded} />
            </button>
          ) : req.diy ? (
            <a href={req.diy.href} className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors group">
              <span className="w-5 h-5 rounded-md bg-sky-100 flex items-center justify-center text-[9px] font-black text-sky-600 group-hover:bg-sky-200 transition-colors">DIY</span>
              {req.diy.label}
              <ArrowRight cls="w-3 h-3" />
            </a>
          ) : (
            <span className="text-[11px] text-slate-400 italic">No products yet — research costs manually</span>
          )}
        </div>
      </div>

      {/* Products panel */}
      {expanded && req.products.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 pt-3 pb-4 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
            Select a product to add to your cost calculator
          </p>
          {req.products.map(p => {
            const isAdded = addedIds.has(p.id);
            return (
              <div key={p.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-200 ${isAdded ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 leading-snug">{p.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{p.vendor}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-bold text-slate-700 tabular-nums">{fmtPrice(p.price, p.unit)}</span>
                  {p.href !== "#" && (
                    <a href={p.href} className="text-emerald-600 hover:text-emerald-700" title="View service"><ArrowRight cls="w-3 h-3" /></a>
                  )}
                  <button
                    onClick={() => isAdded ? onRemoveProduct(p.id) : onAddProduct(p, req)}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 ${isAdded ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
                  >
                    {isAdded ? "Remove" : "+ Add"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY GROUP
// ─────────────────────────────────────────────────────────────────────────────
function CategoryGroup({ category, requirements, calcItems, onCycleStatus, onAddProduct, onRemoveProduct }: {
  category: ReqCategory; requirements: Requirement[]; calcItems: CalcItem[];
  onCycleStatus: (id: string) => void;
  onAddProduct: (p: VendorProduct, req: Requirement) => void;
  onRemoveProduct: (id: string) => void;
}) {
  const cat      = CAT_CFG[category];
  const pct      = reqPct(requirements);
  const complete = isCategoryComplete(requirements);
  const requiredDone  = requirements.filter(r => r.required && r.status === "complete").length;
  const requiredTotal = requirements.filter(r => r.required).length;

  return (
    <div className="mb-8">
      {/* Category header */}
      <div className="flex items-center gap-3 mb-3.5">
        <div className={`w-7 h-7 rounded-lg border flex items-center justify-center text-sm flex-shrink-0 transition-all duration-300 ${complete ? "bg-emerald-500 border-emerald-500" : `${cat.bg} ${cat.border}`}`}>
          {complete ? <CheckMini /> : cat.icon}
        </div>
        <h3 className={`font-bold text-sm transition-colors duration-300 ${complete ? "text-emerald-700" : cat.color}`}>
          {category}
          {complete && <span className="ml-2 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Complete!</span>}
        </h3>
        <span className="text-[11px] text-slate-400 font-medium">{requiredDone}/{requiredTotal} required</span>
        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${complete ? "bg-emerald-500" : cat.bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`text-[11px] font-bold tabular-nums ${complete ? "text-emerald-600" : "text-slate-500"}`}>{pct}%</span>
      </div>

      <div className="space-y-3">
        {requirements.map(req => (
          <RequirementCard
            key={req.id} req={req} calcItems={calcItems}
            onCycleStatus={onCycleStatus} onAddProduct={onAddProduct} onRemoveProduct={onRemoveProduct}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NEXT STEP BANNER
// ─────────────────────────────────────────────────────────────────────────────
function NextStepBanner({ stages, activeStage }: { stages: Stage[]; activeStage: Stage }) {
  const next = activeStage.requirements.find(r => r.required && (r.status === "in_progress" || r.status === "pending"));
  const stageIdx = stages.findIndex(s => s.id === activeStage.id);
  const nextStage = stages[stageIdx + 1];

  if (!next) {
    if (nextStage) {
      return (
        <div className="flex items-center gap-3 bg-emerald-600 rounded-2xl px-5 py-4 mb-5 shadow-md shadow-emerald-200/50" style={{ animation: "bannerIn 0.4s ease-out" }}>
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-lg">🎉</div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">Stage Complete!</p>
            <p className="text-emerald-100 text-xs mt-0.5">All required items done — ready for <strong className="text-white">{nextStage.emoji} {nextStage.label}</strong></p>
          </div>
          <span className="text-emerald-200 text-xl">→</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl px-5 py-4 mb-5 shadow-md" style={{ animation: "bannerIn 0.4s ease-out" }}>
        <span className="text-2xl">🏆</span>
        <div>
          <p className="text-white font-bold text-sm">All Stages Complete!</p>
          <p className="text-amber-100 text-xs mt-0.5">Your coffee shop is ready to launch. Congratulations!</p>
        </div>
      </div>
    );
  }

  const cat = CAT_CFG[next.category];
  return (
    <div className="flex items-start gap-3 bg-slate-900 rounded-2xl px-5 py-4 mb-5" style={{ animation: "bannerIn 0.3s ease-out" }}>
      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <ArrowRight />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Next Required Step</p>
        <p className="text-white font-bold text-sm leading-snug">{next.name}</p>
        <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{next.description}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color} ${cat.border}`}>
          {cat.icon} {next.category}
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">Required</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE STATS
// ─────────────────────────────────────────────────────────────────────────────
function StageStats({ stage }: { stage: Stage }) {
  const c   = stageCounts(stage);
  const pct = reqPct(stage.requirements);
  return (
    <div className="mb-5">
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { label: "Total",       value: c.total,       bg: "bg-slate-50 border-slate-200",    text: "text-slate-800"   },
          { label: "Complete",    value: c.complete,    bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
          { label: "In Progress", value: c.in_progress, bg: "bg-amber-50 border-amber-200",    text: "text-amber-700"   },
          { label: "Remaining",   value: c.pending,     bg: "bg-slate-50 border-slate-200",    text: "text-slate-500"   },
        ].map(({ label, value, bg, text }) => (
          <div key={label} className={`rounded-xl border p-3 text-center ${bg}`}>
            <p className={`text-xl font-extrabold ${text}`}>{value}</p>
            <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-bold text-emerald-600 tabular-nums">{pct}%</span>
        <span className="text-[10px] text-slate-400">required</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COST CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────
function CostCalculator({ stages, items, mobileOpen, onMobileToggle, onRemove }: {
  stages: Stage[]; items: CalcItem[]; mobileOpen: boolean;
  onMobileToggle: () => void; onRemove: (id: string) => void;
}) {
  const total     = items.reduce((s, i) => s + i.price, 0);
  const allReqs   = stages.flatMap(s => s.requirements);
  const committed = items.filter(i => allReqs.find(r => r.id === i.requirementId)?.status === "complete").reduce((s, i) => s + i.price, 0);
  const remaining = total - committed;
  const budgetPct = total > 0 ? Math.round(committed / total * 100) : 0;

  const byCategory = items.reduce((acc, item) => {
    acc[item.category] = [...(acc[item.category] ?? []), item];
    return acc;
  }, {} as Partial<Record<ReqCategory, CalcItem[]>>);

  const byStage = stages.map(s => {
    const stagePct_ = reqPct(s.requirements);
    const cost = items.filter(i => i.stageId === s.id).reduce((sum, i) => sum + i.price, 0);
    return { id: s.id, label: s.label, emoji: s.emoji, cost, pct: stagePct_ };
  });

  const Panel = () => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-emerald-600 px-4 py-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-white"><CartIco /><span className="font-bold text-sm">Cost Calculator</span></div>
          <span className="text-emerald-200 text-xs">{items.length} products</span>
        </div>
        <p className="text-2xl font-extrabold text-white">{fmtPrice(total)}</p>
        <p className="text-emerald-200 text-xs mt-0.5">Total estimate</p>
      </div>

      <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border-b border-slate-200">
        {[
          { label: "Committed",   val: fmtPrice(committed), bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
          { label: "Remaining",   val: fmtPrice(remaining), bg: "bg-amber-50 border-amber-200",     text: "text-amber-700"   },
          { label: "Budget Used", val: `${budgetPct}%`,     bg: "bg-sky-50 border-sky-200",         text: "text-sky-700"     },
          { label: "Total Est.",  val: fmtPrice(total),     bg: "bg-slate-50 border-slate-200",     text: "text-slate-700"   },
        ].map(({ label, val, bg, text }) => (
          <div key={label} className={`rounded-xl border p-2.5 ${bg}`}>
            <p className={`text-sm font-extrabold ${text}`}>{val}</p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-b border-slate-200">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Cost by Stage</p>
        <div className="space-y-2.5">
          {byStage.map(s => (
            <div key={s.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-600">{s.emoji} {s.label}</span>
                <span className="text-xs font-bold text-slate-600 tabular-nums">{fmtPrice(s.cost)}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 max-h-64 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-slate-400 text-xs">No products added yet.</p>
            <p className="text-slate-400 text-[11px] mt-1">Expand a requirement and click <strong>+ Add</strong>.</p>
          </div>
        ) : (
          <>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Selected Products</p>
            {CAT_ORDER.filter(cat => byCategory[cat]?.length).map(cat => {
              const cfg = CAT_CFG[cat];
              const catItems = byCategory[cat]!;
              const catTotal = catItems.reduce((s, i) => s + i.price, 0);
              return (
                <div key={cat} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[11px] font-bold ${cfg.color}`}>{cfg.icon} {cat}</span>
                    <span className="text-[11px] font-bold text-slate-500 tabular-nums">{fmtPrice(catTotal)}</span>
                  </div>
                  <div className="space-y-1.5 pl-3">
                    {catItems.map(item => (
                      <div key={item.productId} className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-slate-700 leading-snug">{item.name}</p>
                          <p className="text-[10px] text-slate-400">{item.vendor} · {item.unit}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[11px] font-bold text-slate-600 tabular-nums">{fmtPrice(item.price)}</span>
                          <button onClick={() => onRemove(item.productId)} className="text-slate-300 hover:text-red-400 transition-colors"><TrashIco /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {items.length > 0 && (
        <div className="px-4 pb-4">
          <p className="text-[10px] text-slate-400 italic border-t border-slate-100 pt-3">
            Prices are estimates and may vary based on your location and specific requirements.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="hidden lg:block"><div className="sticky top-4"><Panel /></div></div>
      <div className="lg:hidden">
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-emerald-200 bg-white shadow-2xl">
          <button onClick={onMobileToggle} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2">
              <CartIco />
              <span className="text-sm font-bold text-slate-800">Cost Calculator</span>
              {items.length > 0 && <span className="bg-emerald-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{items.length}</span>}
            </div>
            <div className="flex items-center gap-2">
              {total > 0 && <span className="text-sm font-extrabold text-emerald-700">{fmtPrice(total)}</span>}
              <ChevronDown open={mobileOpen} />
            </div>
          </button>
          {mobileOpen && <div className="border-t border-slate-100 max-h-[75vh] overflow-y-auto"><Panel /></div>}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE TABS
// ─────────────────────────────────────────────────────────────────────────────
function StageTabs({ stages, activeId, onSelect }: { stages: Stage[]; activeId: string; onSelect: (id: string) => void }) {
  return (
    <div className="flex overflow-x-auto border-b border-slate-200 bg-white sticky top-0 z-20">
      {stages.map((stage, i) => {
        const pct = reqPct(stage.requirements);
        const done = pct === 100;
        const active = stage.id === activeId;
        return (
          <button key={stage.id} onClick={() => onSelect(stage.id)}
            className={`relative flex-shrink-0 flex items-center gap-2 px-4 sm:px-5 py-4 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
              active ? "border-emerald-500 text-emerald-700 bg-emerald-50/40" :
              done   ? "border-transparent text-emerald-600 hover:border-emerald-200" :
                       "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
            }`}
          >
            <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
              done   ? "bg-emerald-500 text-white" :
              active ? "bg-emerald-600 text-white" :
                       "bg-slate-200 text-slate-500"
            }`}>
              {done ? <CheckMini /> : i + 1}
            </span>
            <span className="hidden sm:inline">{stage.emoji}</span> {stage.label}
            {!done && pct > 0 && <span className="text-[10px] font-bold text-amber-500">{pct}%</span>}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH + FILTER BAR
// ─────────────────────────────────────────────────────────────────────────────
function SearchFilterBar({ query, setQuery, filter, setFilter }: {
  query: string; setQuery: (q: string) => void; filter: FilterType; setFilter: (f: FilterType) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><SearchIco /></span>
        <input type="text" placeholder="Search requirements..." value={query} onChange={e => setQuery(e.target.value)}
          className="w-full pl-9 pr-9 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white" />
        {query && <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><XCircle /></button>}
      </div>
      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2 py-1.5">
        <span className="text-[11px] text-slate-400 font-medium px-1">Filter:</span>
        {(["all", "required", "optional"] as FilterType[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
              filter === f
                ? f === "required" ? "bg-slate-800 text-white"
                  : f === "optional" ? "bg-amber-400 text-amber-900"
                  : "bg-emerald-600 text-white"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            }`}
          >{f}</button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function StartupRoadmap() {
  const [stages,      setStages]    = useState<Stage[]>(STAGES);
  const [activeId,    setActiveId]  = useState("plan");
  const [calcItems,   setCalcItems] = useState<CalcItem[]>([]);
  const [mobCalcOpen, setMobCalc]   = useState(false);
  const [query,       setQuery]     = useState("");
  const [filter,      setFilter]    = useState<FilterType>("all");
  const [toasts,      setToasts]    = useState<Toast[]>([]);
  const [confetti,    setConfetti]  = useState(false);
  const toastIdRef = useRef(0);

  const activeStage = stages.find(s => s.id === activeId)!;
  const overall     = overallPct(stages);
  const allReqs     = stages.flatMap(s => s.requirements);
  const doneCount   = allReqs.filter(r => r.status === "complete").length;
  const stageIdx    = stages.findIndex(s => s.id === activeId);

  // Filtered + grouped
  const visibleReqs = useMemo(() => {
    const q = query.toLowerCase();
    return activeStage.requirements.filter(r => {
      const matchQ = !q || r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.category.toLowerCase().includes(q);
      const matchF = filter === "all" || (filter === "required" ? r.required : !r.required);
      return matchQ && matchF;
    });
  }, [activeStage, query, filter]);

  const grouped = useMemo(() => groupByCategory(visibleReqs), [visibleReqs]);

  // Toast helpers
  const addToast = useCallback((t: Omit<Toast, "id">) => {
    const id = String(++toastIdRef.current);
    setToasts(prev => [...prev.slice(-3), { ...t, id }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 4500);
  }, []);

  const dismissToast = useCallback((id: string) => setToasts(prev => prev.filter(x => x.id !== id)), []);

  function fireConfetti() {
    setConfetti(true);
    setTimeout(() => setConfetti(false), 3500);
  }

  // Cycle status + trigger toasts
  function cycleStatus(reqId: string) {
    setStages(prev => {
      const next = prev.map(s => ({
        ...s,
        requirements: s.requirements.map(r => {
          if (r.id !== reqId) return r;
          const nextStatus: ReqStatus = r.status === "pending" ? "in_progress" : r.status === "in_progress" ? "complete" : "pending";
          return { ...r, status: nextStatus };
        }),
      }));

      // Evaluate completions on the new state
      const req = next.flatMap(s => s.requirements).find(r => r.id === reqId)!;
      const stage = next.find(s => s.requirements.some(r => r.id === reqId))!;

      if (req.status === "complete") {
        // Requirement completed
        addToast({ type: "req", emoji: "✅", title: `${req.name} done!`, subtitle: req.required ? "Required step completed. Keep going!" : "Optional step marked complete." });

        // Check category completion
        const catReqs = stage.requirements.filter(r => r.category === req.category);
        if (isCategoryComplete(catReqs)) {
          setTimeout(() => addToast({ type: "category", emoji: "🏅", title: `${req.category} complete!`, subtitle: `All required ${req.category.toLowerCase()} tasks done.` }), 600);
        }

        // Check stage completion
        if (isStageComplete(stage)) {
          setTimeout(() => {
            addToast({ type: "stage", emoji: "🏆", title: `${stage.emoji} ${stage.label} stage complete!`, subtitle: "Excellent progress — you're on track!" });
            fireConfetti();
          }, 1200);
        }

        // Check overall completion
        if (overallPct(next) === 100) {
          setTimeout(() => {
            addToast({ type: "all", emoji: "🚀", title: "Roadmap Complete! 🎉", subtitle: "Your coffee shop is ready to launch. Congratulations!" });
            fireConfetti();
          }, 2000);
        }
      }

      return next;
    });
  }

  function addProduct(p: VendorProduct, req: Requirement) {
    if (calcItems.some(c => c.productId === p.id)) return;
    setCalcItems(prev => [...prev, { productId: p.id, name: p.name, vendor: p.vendor, price: p.price, unit: p.unit, category: req.category, stageId: activeId, requirementId: req.id }]);
  }

  function removeProduct(id: string) { setCalcItems(prev => prev.filter(c => c.productId !== id)); }
  function switchStage(id: string) { setActiveId(id); setQuery(""); }

  const prevStage = stages[stageIdx - 1];
  const nextStage = stages[stageIdx + 1];

  return (
    <>
      {/* Global styles */}
      <style>{`
        @keyframes toastIn  { from { opacity:0; transform:translateX(24px) scale(0.94); } to { opacity:1; transform:translateX(0) scale(1); } }
        @keyframes bannerIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes cardIn   { from { opacity:0; transform:translateY(4px);  } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Confetti canvas */}
      <Confetti active={confetti} />

      {/* Toast stack */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <div className="min-h-screen bg-slate-50 font-sans antialiased lg:pb-0 pb-24">

        {/* HEADER */}
        <div className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xl shadow-md shadow-emerald-200/60 flex-shrink-0">☕</div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-base font-extrabold text-slate-900">Coffee Shop</h1>
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Startup Roadmap</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{doneCount} of {allReqs.length} requirements complete</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-40 sm:w-56 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700" style={{ width: `${overall}%` }} />
                  </div>
                  <span className="text-sm font-extrabold text-emerald-600 tabular-nums">{overall}%</span>
                </div>
                <span className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold px-3 py-1.5 rounded-full">
                  {overall === 100 ? "🏆 Launch Ready" : overall < 20 ? "🌱 Getting Started" : overall < 50 ? "⚡ Building Momentum" : "🔥 Almost There"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* STAGE TABS */}
        <div className="max-w-7xl mx-auto px-0 sm:px-6">
          <StageTabs stages={stages} activeId={activeId} onSelect={switchStage} />
        </div>

        {/* MAIN LAYOUT */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-5">
          <div className="flex gap-6 items-start">

            {/* LEFT: content */}
            <div className="flex-1 min-w-0">
              {/* Stage header */}
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-lg font-extrabold text-slate-900">{activeStage.emoji} {activeStage.label}</h2>
                {activeStage.categories.map(cat => (
                  <span key={cat} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${CAT_CFG[cat].bg} ${CAT_CFG[cat].color} ${CAT_CFG[cat].border}`}>
                    {CAT_CFG[cat].icon} {cat}
                  </span>
                ))}
              </div>
              <p className="text-sm text-slate-500 mb-5">{activeStage.tagline}</p>

              <NextStepBanner stages={stages} activeStage={activeStage} />
              <StageStats stage={activeStage} />
              <SearchFilterBar query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} />

              {visibleReqs.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                  <p className="text-3xl mb-3">🔍</p>
                  <p className="text-slate-600 font-semibold text-sm">No requirements match your filters</p>
                  <button onClick={() => { setQuery(""); setFilter("all"); }} className="mt-3 text-xs text-emerald-600 hover:text-emerald-700 font-semibold">Clear filters</button>
                </div>
              )}

              {CAT_ORDER
                .filter(cat => grouped[cat]?.length)
                .map(cat => (
                  <CategoryGroup
                    key={cat} category={cat} requirements={grouped[cat]!} calcItems={calcItems}
                    onCycleStatus={cycleStatus} onAddProduct={addProduct} onRemoveProduct={removeProduct}
                  />
                ))
              }

              {/* Stage nav */}
              <div className="flex items-center justify-between py-5 border-t border-slate-200 mt-2">
                {prevStage ? (
                  <button onClick={() => switchStage(prevStage.id)} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">
                    <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
                    {prevStage.emoji} {prevStage.label}
                  </button>
                ) : <div />}
                {nextStage && (
                  <button onClick={() => switchStage(nextStage.id)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-md shadow-emerald-100">
                    Next: {nextStage.emoji} {nextStage.label}
                    <ArrowRight />
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT: sidebar calculator */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <CostCalculator stages={stages} items={calcItems} mobileOpen={mobCalcOpen} onMobileToggle={() => setMobCalc(o => !o)} onRemove={removeProduct} />
            </div>
          </div>
        </div>

        {/* Mobile calculator */}
        <div className="lg:hidden">
          <CostCalculator stages={stages} items={calcItems} mobileOpen={mobCalcOpen} onMobileToggle={() => setMobCalc(o => !o)} onRemove={removeProduct} />
        </div>
      </div>
    </>
  );
}