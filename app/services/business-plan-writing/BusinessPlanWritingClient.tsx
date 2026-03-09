"use client";

import { useState } from "react";
import Link from 'next/link';

// ── Types ────────────────────────────────────────────────────────────────────
interface Feature {
  title: string;
  desc: string;
  emoji: string;
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

interface StatItem {
  label: string;
  val: string;
  color: string;
}

interface ProgressItem {
  label: string;
  pct: number;
}

interface EcosystemNode {
  label: string;
  angle: number;
  emoji: string;
}

// ── Icons ────────────────────────────────────────────────────────────────────
function CheckIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
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

function ArrowIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

// ── 1. HERO ──────────────────────────────────────────────────────────────────
const heroKeyPoints: string[] = [
  "Custom written for your business",
  "Market research and competitor analysis",
  "Financial projections included",
  "Investor and loan ready format",
];

const trustBadges: string[] = ["Entrepreneur Friendly", "Investor Ready", "Startup Focused"];

const statItems: StatItem[] = [
  { label: "Market Size", val: "$4.2M", color: "emerald" },
  { label: "Year 1 Rev", val: "$180K", color: "teal" },
  { label: "ROI", val: "3.2×", color: "green" },
];

const progressItems: ProgressItem[] = [
  { label: "Market Research", pct: 92 },
  { label: "Financial Model", pct: 78 },
  { label: "Strategy", pct: 85 },
];

const skeletonWidths: number[] = [70, 90, 55, 80, 65];

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
              Business Plan Writing Service
            </span>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6">
              Build Your Business With a{" "}
              <span className="text-emerald-600">Professional Business Plan</span>
            </h1>

            <p className="text-lg text-slate-500 leading-relaxed mb-8">
              Get a clear roadmap for launching and growing your business. Our experts create detailed,
              investor-ready business plans with market research, financial projections, and realistic
              startup cost estimates.
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
                Start Your Business Plan
                <ArrowIcon />
              </a>
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 bg-white border-2 border-slate-200 hover:border-emerald-400 text-slate-700 font-semibold px-7 py-3.5 rounded-xl transition-colors"
              >
                See Pricing
              </a>
            </div>

            <div className="flex flex-wrap gap-4">
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

          {/* RIGHT – illustration */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl" />
              <div className="relative p-8 rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-100/50">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                      BP
                    </div>
                    <div>
                      <div className="h-3 w-32 bg-slate-200 rounded mb-1" />
                      <div className="h-2 w-20 bg-slate-100 rounded" />
                    </div>
                  </div>
                  {skeletonWidths.map((w, i) => (
                    <div key={i} className="h-2 bg-slate-100 rounded mb-2" style={{ width: `${w}%` }} />
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {statItems.map(({ label, val, color }) => (
                    <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-xl p-3 text-center`}>
                      <div className={`text-lg font-bold text-${color}-700`}>{val}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{label}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2">
                  {progressItems.map(({ label, pct }) => (
                    <div key={label}>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-0.5">
                        <span>{label}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 2. PROBLEM ───────────────────────────────────────────────────────────────
const problemBenefits: string[] = [
  "Understand your target customers",
  "Identify competitors",
  "Estimate startup costs",
  "Plan your marketing strategy",
  "Present your idea to investors or lenders",
];

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
              Starting a Business Without a Plan Is Risky
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-4">
              Many new businesses fail because founders launch without a clear strategy.
            </p>
            <p className="text-slate-400 leading-relaxed">
              A business plan helps you understand your market, define your strategy, estimate startup
              costs, and avoid expensive mistakes.
            </p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
            <p className="text-slate-300 font-semibold mb-6">With a strong business plan you can:</p>
            <ul className="space-y-3">
              {problemBenefits.map((item) => (
                <li key={item} className="flex items-start gap-3 text-slate-300">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckIcon />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-8 pt-6 border-t border-slate-700 text-slate-400 text-sm leading-relaxed">
              Hustlecare helps entrepreneurs turn their ideas into structured, practical business plans
              they can actually use.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 3. WHAT YOU GET ──────────────────────────────────────────────────────────
const features: Feature[] = [
  { title: "Executive Summary", desc: "A clear overview of your business idea, value proposition, and growth strategy.", emoji: "📋" },
  { title: "Market Research", desc: "Industry overview, customer insights, and analysis of market opportunities.", emoji: "🔍" },
  { title: "Competitor Analysis", desc: "Identify key competitors and positioning strategy.", emoji: "🎯" },
  { title: "Business Model", desc: "How your business will generate revenue and sustain operations.", emoji: "💡" },
  { title: "Marketing Strategy", desc: "Customer acquisition strategy and growth plan.", emoji: "📣" },
  { title: "Financial Projections", desc: "Startup cost estimates, revenue projections, and financial planning.", emoji: "📊" },
  { title: "Operations Plan", desc: "How your business will operate daily.", emoji: "⚙️" },
  { title: "Investor Ready Format", desc: "Professionally structured document ready for investors or lenders.", emoji: "📁" },
];

function FeaturesGrid() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-emerald-600 text-xs font-bold tracking-widest uppercase mb-3">
            Deliverables
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            What&apos;s Included in Your Business Plan
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(({ title, desc, emoji }) => (
            <div
              key={title}
              className="group bg-white border border-slate-100 hover:border-emerald-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:bg-emerald-100 transition-colors">
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

// ── 4. AUDIENCE ──────────────────────────────────────────────────────────────
const audienceItems: AudienceItem[] = [
  { icon: "🚀", text: "Want to start a new business but need a clear plan" },
  { icon: "💰", text: "Need a business plan for investors or loans" },
  { icon: "🧮", text: "Want realistic startup cost estimates" },
  { icon: "📈", text: "Want to understand your market before launching" },
  { icon: "🗺️", text: "Want a structured roadmap for your business" },
];

function AudienceSection() {
  return (
    <section className="bg-emerald-50 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-emerald-600 text-xs font-bold tracking-widest uppercase mb-3">
            Who It&apos;s For
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Perfect for Entrepreneurs Who Want to Start a Business
          </h2>
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

// ── 5. PROCESS ───────────────────────────────────────────────────────────────
const steps: Step[] = [
  { n: "01", title: "Tell Us About Your Business", desc: "You complete a short questionnaire about your business idea, target market, and goals." },
  { n: "02", title: "Research and Strategy", desc: "Our team performs market research and builds the business framework." },
  { n: "03", title: "Plan Development", desc: "We write your complete business plan including financial projections." },
  { n: "04", title: "Receive Your Plan", desc: "You receive a professionally formatted document ready for use." },
];

function ProcessSteps() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-emerald-600 text-xs font-bold tracking-widest uppercase mb-3">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Simple 4-Step Process</h2>
        </div>
        <div className="relative">
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-emerald-100" aria-hidden />
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

// ── 6. PRICING ───────────────────────────────────────────────────────────────
const plans: Plan[] = [
  {
    name: "Starter",
    tag: "Best for early ideas",
    price: "$120",
    items: ["Basic business plan", "Market overview", "Business model outline", "Startup cost estimate"],
    delivery: "5–7 days",
    cta: "Start Starter Plan",
    popular: false,
  },
  {
    name: "Professional",
    tag: "Most popular",
    price: "$250",
    items: ["Full business plan", "Market research", "Competitor analysis", "Marketing strategy", "Startup cost breakdown", "Financial projections"],
    delivery: "7–10 days",
    cta: "Start Professional Plan",
    popular: true,
  },
  {
    name: "Investor",
    tag: "Best for fundraising",
    price: "$400",
    items: ["Full professional business plan", "Detailed financial projections", "Investor pitch deck", "Market opportunity analysis", "Funding strategy"],
    delivery: "10–14 days",
    cta: "Start Investor Plan",
    popular: false,
  },
];

function PricingCards() {
  return (
    <section id="pricing" className="bg-slate-50 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-emerald-600 text-xs font-bold tracking-widest uppercase mb-3">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Choose Your Business Plan Package
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
                <h3 className={`text-xl font-extrabold mb-1 ${popular ? "text-white" : "text-slate-900"}`}>
                  {name}
                </h3>
                <p className={`text-sm ${popular ? "text-emerald-200" : "text-slate-500"}`}>{tag}</p>
              </div>
              <div className="mb-6">
                <span className={`text-5xl font-extrabold ${popular ? "text-white" : "text-slate-900"}`}>
                  {price}
                </span>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                {items.map((item) => (
                  <li key={item} className={`flex items-center gap-2.5 text-sm ${popular ? "text-emerald-100" : "text-slate-600"}`}>
                    <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${popular ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-600"}`}>
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

// ── 7. PLATFORM INTEGRATION ──────────────────────────────────────────────────
const platformLinks: string[] = [
  "Business registration",
  "Branding and logo design",
  "Website creation",
  "Equipment and software",
  "Marketing setup",
];

const ecosystemNodes: EcosystemNode[] = [
  { label: "Legal", angle: -90, emoji: "⚖️" },
  { label: "Brand", angle: -18, emoji: "🎨" },
  { label: "Website", angle: 54, emoji: "🌐" },
  { label: "Equip.", angle: 126, emoji: "🔧" },
  { label: "Market", angle: 198, emoji: "📣" },
];

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
                Hustlecare helps entrepreneurs identify everything required to start a business. Your
                business plan works together with other startup requirements like:
              </p>
              <ul className="space-y-2 mb-8">
                {platformLinks.map((link) => (
                  <li key={link} className="flex items-center gap-2.5 text-slate-300 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    {link}
                  </li>
                ))}
              </ul>
             

<Link
  href="/services"
  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors shadow-lg shadow-emerald-900/50"
>
  Explore More Services
  <ArrowIcon />
</Link>
            </div>

            <div className="flex justify-center">
              <div className="relative w-64 h-64">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-xs font-bold text-center shadow-xl">
                    Business<br />Plan
                  </div>
                </div>
                {ecosystemNodes.map(({ label, angle, emoji }) => {
                  const r = 100;
                  const rad = (angle * Math.PI) / 180;
                  const x = 128 + r * Math.cos(rad);
                  const y = 128 + r * Math.sin(rad);
                  return (
                    <div
                      key={label}
                      className="absolute w-14 h-14 rounded-xl bg-slate-700 border border-slate-600 flex flex-col items-center justify-center text-center shadow"
                      style={{ left: x - 28, top: y - 28 }}
                    >
                      <span className="text-base">{emoji}</span>
                      <span className="text-[10px] text-slate-300 font-semibold">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 8. FAQ ───────────────────────────────────────────────────────────────────
const faqs: FAQItem[] = [
  { q: "How long does it take to receive my business plan?", a: "Most business plans are delivered within 7–10 days depending on the package." },
  { q: "Do I need to have all the information ready?", a: "No. We guide you through a short questionnaire and help fill any gaps." },
  { q: "Can I request revisions?", a: "Yes. Each package includes revision rounds to refine the plan." },
  { q: "Will the plan work for investors or loans?", a: "Yes. Our plans follow professional structures used for investor presentations and funding proposals." },
  { q: "Can you create a plan for any industry?", a: "Yes. We work with a wide range of industries including retail, restaurants, online businesses, and service companies." },
];

function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="bg-slate-50 py-20">
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
            <div key={q} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
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

// ── 9. FINAL CTA ─────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="bg-emerald-600 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5">
          Turn Your Business Idea Into a Real Plan
        </h2>
        <p className="text-emerald-100 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
          A professional business plan gives you clarity, direction, and confidence when starting a new
          business. Let Hustlecare help you build a roadmap for success.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-8 py-4 rounded-xl shadow-lg transition-all active:scale-95"
          >
            Start Your Business Plan
            <ArrowIcon />
          </a>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-8 py-4 rounded-xl transition-all active:scale-95"
          >
            Contact Support
          </a>
        </div>
      </div>
    </section>
  );
}

// ── ROOT EXPORT ───────────────────────────────────────────────────────────────
export default function BusinessPlanWritingClient() {
  return (
    <main className="font-sans antialiased text-slate-900">
      <HeroSection />
      <ProblemSection />
      <FeaturesGrid />
      <AudienceSection />
      <ProcessSteps />
      <PricingCards />
      <PlatformIntegrationSection />
      <FAQAccordion />
      <CTASection />
    </main>
  );
}