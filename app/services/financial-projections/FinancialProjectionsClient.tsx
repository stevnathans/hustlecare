"use client";

import { useState } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Feature {
  emoji: string;
  title: string;
  desc: string;
}

interface AudienceItem {
  icon: string;
  text: string;
}

interface Step {
  n: string;
  title: string;
  desc: string;
}

interface Plan {
  name: string;
  tag: string;
  price: string;
  items: string[];
  delivery: string;
  cta: string;
  popular: boolean;
}

interface FAQItem {
  q: string;
  a: string;
}

interface RelatedService {
  emoji: string;
  title: string;
  desc: string;
  href: string;
}

interface StackItem {
  label: string;
  status: "complete" | "current" | "upcoming";
  emoji: string;
}

interface ChartBar {
  month: string;
  revenue: number;
  costs: number;
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-5 h-5 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

// ── Financial Dashboard Illustration ──────────────────────────────────────────
const chartBars: ChartBar[] = [
  { month: "M1", revenue: 20, costs: 60 },
  { month: "M2", revenue: 35, costs: 58 },
  { month: "M3", revenue: 50, costs: 55 },
  { month: "M4", revenue: 62, costs: 52 },
  { month: "M5", revenue: 75, costs: 50 },
  { month: "M6", revenue: 90, costs: 48 },
];

function FinancialIllustration() {
  const maxVal = 100;

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl" />
      <div className="relative p-7 rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-100/50">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Financial Projections</p>
            <p className="text-sm font-bold text-slate-700 mt-0.5">12-Month Forecast</p>
          </div>
          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
            Year 1
          </span>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: "Revenue", val: "$142K", trend: "+18%", up: true },
            { label: "Expenses", val: "$89K", trend: "-4%", up: false },
            { label: "Net Profit", val: "$53K", trend: "+31%", up: true },
          ].map(({ label, val, trend, up }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm text-center">
              <p className="text-[10px] text-slate-400 font-medium mb-0.5">{label}</p>
              <p className="text-sm font-extrabold text-slate-800">{val}</p>
              <span className={`text-[10px] font-bold ${up ? "text-emerald-600" : "text-red-400"}`}>
                {trend}
              </span>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Revenue vs Costs
          </p>
          <div className="flex items-end gap-2 h-24">
            {chartBars.map(({ month, revenue, costs }) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex items-end gap-0.5 h-20">
                  <div
                    className="flex-1 bg-emerald-400 rounded-t-sm opacity-90"
                    style={{ height: `${(revenue / maxVal) * 100}%` }}
                  />
                  <div
                    className="flex-1 bg-slate-200 rounded-t-sm"
                    style={{ height: `${(costs / maxVal) * 100}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-400 font-medium">{month}</span>
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />Revenue
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-200" />Costs
            </span>
          </div>
        </div>

        {/* Breakeven callout */}
        <div className="bg-emerald-600 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sm">📈</span>
          </div>
          <div>
            <p className="text-white text-xs font-bold">Breakeven at Month 4</p>
            <p className="text-emerald-200 text-[10px]">Revenue exceeds costs from M4 onward</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const heroKeyPoints: string[] = [
  "Startup cost estimates tailored to your business",
  "12-month and 3-year revenue projections",
  "Breakeven analysis included",
  "Investor and lender ready format",
];

const trustBadges: string[] = ["Investor Ready", "Data Driven", "Startup Focused"];

const problemRisks: string[] = [
  "Underestimating startup costs and running out of cash",
  "Overpricing or underpricing your products and services",
  "Failing to attract investors without financial evidence",
  "Making growth decisions without a financial baseline",
];

const features: Feature[] = [
  { emoji: "💰", title: "Startup Cost Estimate", desc: "A detailed breakdown of everything you need to spend to launch your business." },
  { emoji: "📈", title: "Revenue Projections", desc: "Realistic 12-month and 3-year revenue forecasts based on your business model." },
  { emoji: "📉", title: "Expense Forecasting", desc: "Monthly operating cost projections so you know exactly what to budget for." },
  { emoji: "⚖️", title: "Breakeven Analysis", desc: "Understand exactly when your business will become profitable." },
  { emoji: "💹", title: "Cash Flow Statement", desc: "Monthly cash flow projections to keep your business running smoothly." },
  { emoji: "📊", title: "Profit & Loss Forecast", desc: "A clear view of profitability across your first years in business." },
  { emoji: "🏦", title: "Funding Requirements", desc: "A summary of capital needed to launch and sustain your business." },
  { emoji: "📁", title: "Investor Ready Format", desc: "Professionally structured and formatted for investor presentations and loan applications." },
];

const audienceItems: AudienceItem[] = [
  { icon: "🚀", text: "Starting a business and need to know your costs" },
  { icon: "💼", text: "Seeking investment or a business loan" },
  { icon: "🧮", text: "Want to validate if your business idea is financially viable" },
  { icon: "📋", text: "Need financial projections for your business plan" },
  { icon: "🎯", text: "Want a realistic roadmap for reaching profitability" },
];

const steps: Step[] = [
  { n: "01", title: "Tell Us About Your Business", desc: "Share your business idea, pricing model, and target market with our team." },
  { n: "02", title: "Financial Modelling", desc: "We build a financial model based on your business type, costs, and revenue assumptions." },
  { n: "03", title: "Projections Development", desc: "We produce full projections including revenue, expenses, cash flow, and breakeven analysis." },
  { n: "04", title: "Receive Your Report", desc: "You receive a professionally formatted financial projections document ready for use." },
];

const plans: Plan[] = [
  {
    name: "Essential Projections",
    tag: "Best for early planning",
    price: "$100",
    items: [
      "Startup cost estimate",
      "12-month revenue projection",
      "Basic expense forecast",
      "Breakeven analysis",
    ],
    delivery: "3–5 days",
    cta: "Start Essential Plan",
    popular: false,
  },
  {
    name: "Full Financial Model",
    tag: "Most popular",
    price: "$200",
    items: [
      "Startup cost estimate",
      "12-month revenue projection",
      "Full expense forecast",
      "Cash flow statement",
      "Profit & loss forecast",
      "Breakeven analysis",
    ],
    delivery: "5–7 days",
    cta: "Start Full Model",
    popular: true,
  },
  {
    name: "Investor Package",
    tag: "Best for fundraising",
    price: "$350",
    items: [
      "Everything in Full Financial Model",
      "3-year revenue projections",
      "Funding requirements summary",
      "Sensitivity analysis",
      "Investor-ready presentation format",
    ],
    delivery: "7–10 days",
    cta: "Start Investor Package",
    popular: false,
  },
];

const stackItems: StackItem[] = [
  { label: "Business Plan", status: "complete", emoji: "📋" },
  { label: "Financial Projections", status: "current", emoji: "📊" },
  { label: "Business Registration", status: "upcoming", emoji: "⚖️" },
  { label: "Website Creation", status: "upcoming", emoji: "🌐" },
];

const platformLinks: string[] = [
  "Business plan writing",
  "Pitch deck creation",
  "Business registration",
  "Logo design and branding",
];

const relatedServices: RelatedService[] = [
  {
    emoji: "📋",
    title: "Business Plan Writing",
    desc: "Pair your financial projections with a complete business plan.",
    href: "/services/business-plan-writing",
  },
  {
    emoji: "🚀",
    title: "Pitch Deck Creation",
    desc: "Turn your financial model into a compelling investor pitch.",
    href: "/services/pitch-deck",
  },
  {
    emoji: "⚖️",
    title: "Business Registration",
    desc: "Make your business official once your financials are in order.",
    href: "/services/business-registration",
  },
  {
    emoji: "🎨",
    title: "Logo Design",
    desc: "Build your brand identity alongside your financial foundation.",
    href: "/services/logo-design",
  },
  {
    emoji: "🌐",
    title: "Website Creation",
    desc: "Launch your online presence once your business is ready.",
    href: "/services/website-creation",
  },
];

const faqs: FAQItem[] = [
  {
    q: "What are financial projections and why do I need them?",
    a: "Financial projections are estimates of your business's future revenue, expenses, and profitability. They help you plan your budget, attract investors, and make confident business decisions before and after launch.",
  },
  {
    q: "Do I need to have all my numbers ready?",
    a: "No. We guide you through a short questionnaire and use industry benchmarks to fill gaps where you don't have specific figures yet.",
  },
  {
    q: "Can I use these projections for a bank loan or investor meeting?",
    a: "Yes. Our projections follow professional formats used by investors, lenders, and financial institutions.",
  },
  {
    q: "How accurate are the projections?",
    a: "Projections are forward-looking estimates based on your business model and reasonable assumptions. We clearly document all assumptions so you understand exactly how numbers are calculated.",
  },
  {
    q: "Can financial projections be included in my business plan?",
    a: "Yes. Many clients order both services together. Your projections integrate directly into the financial section of your business plan.",
  },
  {
    q: "What if my business model changes after I receive the projections?",
    a: "Each package includes a revision round. You can request updates to reflect changes in your pricing, costs, or business model.",
  },
];

// ── 1. HERO ───────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white pt-20 pb-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right,#d1fae520 1px,transparent 1px),linear-gradient(to bottom,#d1fae520 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle,#059669 0%,transparent 70%)" }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* LEFT */}
          <div>
            <span className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Financial Projections Service
            </span>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6">
              Know Your Numbers Before{" "}
              <span className="text-emerald-600">You Launch Your Business</span>
            </h1>

            <p className="text-lg text-slate-500 leading-relaxed mb-8">
              Understand your startup costs, revenue potential, and path to profitability before you
              spend a single dollar. Hustlecare builds professional financial projections tailored to
              your specific business.
            </p>

            <ul className="space-y-2 mb-10">
              {heroKeyPoints.map((item) => (
                <li key={item} className="flex items-center gap-3 text-slate-700 font-medium">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckIcon />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-4 mb-10">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all text-white font-semibold px-7 py-3.5 rounded-xl shadow-lg shadow-emerald-200"
              >
                Get My Financial Projections
                <ArrowIcon />
              </a>
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 bg-white border-2 border-slate-200 hover:border-emerald-400 text-slate-700 font-semibold px-7 py-3.5 rounded-xl transition-colors"
              >
                See Pricing
              </a>
            </div>

            <div className="flex flex-wrap gap-3">
              {trustBadges.map((badge) => (
                <span
                  key={badge}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex justify-center lg:justify-end">
            <FinancialIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 2. PROBLEM ────────────────────────────────────────────────────────────────
function ProblemSection() {
  return (
    <section className="bg-slate-900 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block text-emerald-400 text-xs font-bold tracking-widest uppercase mb-4">
              The Risk
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-6">
              Launching Without Financial Clarity Is Dangerous
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              Most new businesses don&apos;t fail because of a bad idea. They fail because founders run
              out of money, underprice their services, or can&apos;t convince investors they have a
              viable path to profit.
            </p>
            <p className="text-slate-400 leading-relaxed">
              A clear financial picture before you launch is the difference between guessing and
              building a business with confidence. Hustlecare gives you the numbers you need to move
              forward smartly.
            </p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
            <p className="text-slate-300 font-semibold mb-5">
              Without financial projections you risk:
            </p>
            <ul className="space-y-3 mb-8">
              {problemRisks.map((item) => (
                <li key={item} className="flex items-start gap-3 text-slate-300">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            {/* Stat callout */}
            <div className="pt-6 border-t border-slate-700 space-y-2.5">
              {[
                { label: "Startups fail due to cash flow issues", pct: 82 },
                { label: "Investors require financial projections", pct: 95 },
                { label: "Founders who plan raise more funding", pct: 71 },
              ].map(({ label, pct }) => (
                <div key={label}>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>{label}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 3. FEATURES ───────────────────────────────────────────────────────────────
function FeaturesGrid() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-emerald-600 text-xs font-bold tracking-widest uppercase mb-3">
            Deliverables
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            What&apos;s Included in Your Financial Projections
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(({ emoji, title, desc }) => (
            <div
              key={title}
              className="group bg-white border border-slate-100 hover:border-emerald-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="w-11 h-11 bg-emerald-50 group-hover:bg-emerald-100 rounded-xl flex items-center justify-center text-xl mb-4 transition-colors">
                {emoji}
              </div>
              <h3 className="font-bold text-slate-800 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 4. AUDIENCE ───────────────────────────────────────────────────────────────
function AudienceSection() {
  return (
    <section className="bg-emerald-50 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-emerald-600 text-xs font-bold tracking-widest uppercase mb-3">
            Who It&apos;s For
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Perfect for Entrepreneurs Who Need Financial Clarity
          </h2>
          <p className="text-slate-500 mt-3">This service is ideal if you:</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {audienceItems.map(({ icon, text }) => (
            <div
              key={text}
              className="flex items-start gap-4 bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm"
            >
              <span className="text-2xl flex-shrink-0">{icon}</span>
              <p className="text-slate-700 font-medium leading-snug">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 5. PROCESS ────────────────────────────────────────────────────────────────
function ProcessSteps() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-emerald-600 text-xs font-bold tracking-widest uppercase mb-3">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Simple 4-Step Process
          </h2>
        </div>
        <div className="relative">
          <div
            className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-emerald-100"
            aria-hidden
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map(({ n, title, desc }) => (
              <div key={n} className="relative text-center">
                <div className="inline-flex w-20 h-20 rounded-2xl bg-emerald-600 text-white text-2xl font-extrabold items-center justify-center mb-5 shadow-lg shadow-emerald-200">
                  {n}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 6. PRICING ────────────────────────────────────────────────────────────────
function PricingCards() {
  return (
    <section id="pricing" className="bg-slate-50 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-emerald-600 text-xs font-bold tracking-widest uppercase mb-3">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Choose Your Financial Projections Package
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map(({ name, tag, price, items, delivery, cta, popular }) => (
            <div
              key={name}
              className={`relative flex flex-col rounded-2xl p-8 border transition-all duration-200 ${
                popular
                  ? "bg-emerald-600 border-emerald-500 shadow-2xl shadow-emerald-200 scale-105"
                  : "bg-white border-slate-200 shadow-sm hover:shadow-md"
              }`}
            >
              {popular && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold tracking-wide uppercase px-4 py-1.5 rounded-full shadow">
                  Most Popular
                </span>
              )}
              <div className="mb-6">
                <h3
                  className={`text-xl font-extrabold mb-1 ${popular ? "text-white" : "text-slate-900"}`}
                >
                  {name}
                </h3>
                <p className={`text-sm ${popular ? "text-emerald-200" : "text-slate-500"}`}>{tag}</p>
              </div>
              <div className="mb-6">
                <span
                  className={`text-5xl font-extrabold ${popular ? "text-white" : "text-slate-900"}`}
                >
                  {price}
                </span>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                {items.map((item) => (
                  <li
                    key={item}
                    className={`flex items-center gap-2.5 text-sm ${
                      popular ? "text-emerald-100" : "text-slate-600"
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                        popular
                          ? "bg-emerald-500 text-white"
                          : "bg-emerald-100 text-emerald-600"
                      }`}
                    >
                      <CheckIcon />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className={`text-xs mb-6 ${popular ? "text-emerald-200" : "text-slate-400"}`}>
                📅 Delivery: <strong>{delivery}</strong>
              </p>
              <button
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                  popular
                    ? "bg-white text-emerald-700 hover:bg-emerald-50"
                    : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-100"
                }`}
              >
                {cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 7. PLATFORM INTEGRATION ───────────────────────────────────────────────────
function PlatformIntegrationSection() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-10 lg:p-14">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block text-emerald-400 text-xs font-bold tracking-widest uppercase mb-4">
                The Hustlecare Ecosystem
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5">
                Part of the Hustlecare Startup System
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                Financial projections don&apos;t exist in isolation. Hustlecare connects your financial
                model with the other startup services you need to launch confidently — all in one place.
              </p>
              <ul className="space-y-2 mb-8">
                {platformLinks.map((link) => (
                  <li key={link} className="flex items-center gap-2.5 text-slate-300 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    {link}
                  </li>
                ))}
              </ul>
              <a
                href="/services"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors shadow-lg shadow-emerald-900/50"
              >
                Explore Startup Requirements
                <ArrowIcon />
              </a>
            </div>

            {/* Startup journey stack */}
            <div className="flex justify-center">
              <div className="space-y-3 w-full max-w-xs">
                {stackItems.map(({ label, status, emoji }) => (
                  <div
                    key={label}
                    className={`flex items-center gap-4 rounded-xl px-4 py-3 border ${
                      status === "complete"
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : status === "current"
                        ? "bg-amber-500/10 border-amber-500/30"
                        : "bg-slate-700/50 border-slate-600/50"
                    }`}
                  >
                    <span className="text-xl">{emoji}</span>
                    <div className="flex-1">
                      <p className="text-white text-sm font-semibold">{label}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        status === "complete"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : status === "current"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-slate-600 text-slate-400"
                      }`}
                    >
                      {status === "complete"
                        ? "Complete"
                        : status === "current"
                        ? "In Progress"
                        : "Upcoming"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── RELATED SERVICES ──────────────────────────────────────────────────────────
function RelatedServicesSection() {
  return (
    <section className="bg-slate-50 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-emerald-600 text-xs font-bold tracking-widest uppercase mb-3">
            Pair With
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Services That Work Best Together
          </h2>
          <p className="text-slate-500 mt-3 max-w-xl mx-auto">
            Financial projections are most powerful when paired with these related services.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {relatedServices.map(({ emoji, title, desc, href }) => (
            <Link
              key={title}
              href={href}
              className="group flex flex-col bg-white border border-slate-100 hover:border-emerald-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="w-11 h-11 bg-emerald-50 group-hover:bg-emerald-100 rounded-xl flex items-center justify-center text-xl mb-4 transition-colors">
                {emoji}
              </div>
              <h3 className="font-bold text-slate-800 mb-1.5 group-hover:text-emerald-700 transition-colors">
                {title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed flex-1">{desc}</p>
              <span className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-semibold mt-4 group-hover:gap-2.5 transition-all">
                Learn more <ArrowIcon />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 8. FAQ ────────────────────────────────────────────────────────────────────
function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="bg-white py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-emerald-600 text-xs font-bold tracking-widest uppercase mb-3">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Frequently Asked Questions
          </h2>
        </div>
        <div className="space-y-3">
          {faqs.map(({ q, a }, i) => (
            <div
              key={q}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
            >
              <button
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-semibold text-slate-800">{q}</span>
                <ChevronIcon open={open === i} />
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-slate-500 leading-relaxed border-t border-slate-100 pt-4">
                  {a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 9. FINAL CTA ──────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="bg-emerald-600 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5">
          Build Your Business on Solid Financial Ground
        </h2>
        <p className="text-emerald-100 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
          Stop guessing. Get clear, professional financial projections that give you the confidence to
          launch, grow, and attract investors. Hustlecare makes it simple.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-8 py-4 rounded-xl shadow-lg transition-all active:scale-95"
          >
            Get My Financial Projections
            <ArrowIcon />
          </a>
          <Link
            href="/services"
            className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-8 py-4 rounded-xl transition-all active:scale-95"
          >
            Explore Startup Services
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── ROOT EXPORT ───────────────────────────────────────────────────────────────
export default function FinancialProjectionsClient() {
  return (
    <main className="font-sans antialiased text-slate-900">
      <HeroSection />
      <ProblemSection />
      <FeaturesGrid />
      <AudienceSection />
      <ProcessSteps />
      <PricingCards />
      <PlatformIntegrationSection />
      <RelatedServicesSection />
      <FAQAccordion />
      <CTASection />
    </main>
  );
}