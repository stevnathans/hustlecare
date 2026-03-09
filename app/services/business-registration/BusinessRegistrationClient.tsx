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

// ── Registration Illustration ─────────────────────────────────────────────────
function RegistrationIllustration() {
  const docLines = [85, 70, 90, 60, 75];

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl" />
      <div className="relative p-8 rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-100/50">

        {/* Official document card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4">
          {/* Document header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700">Certificate of Registration</div>
                <div className="text-[10px] text-slate-400">Official Business Document</div>
              </div>
            </div>
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Official
            </span>
          </div>

          {/* Doc body lines */}
          <div className="space-y-2 mb-4">
            {docLines.map((w, i) => (
              <div key={i} className="h-2 bg-slate-100 rounded" style={{ width: `${w}%` }} />
            ))}
          </div>

          {/* Signature row */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div>
              <div className="h-1.5 w-20 bg-slate-300 rounded mb-1" style={{ fontFamily: "cursive" }} />
              <div className="h-1.5 w-14 bg-slate-100 rounded" />
            </div>
            {/* Official seal */}
            <div className="w-10 h-10 rounded-full border-2 border-emerald-200 bg-emerald-50 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border border-emerald-300 flex items-center justify-center">
                <span className="text-emerald-600 text-[8px] font-black">✓</span>
              </div>
            </div>
          </div>
        </div>

        {/* Checklist items */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Registration Checklist
          </p>
          <div className="space-y-2">
            {[
              { label: "Business Name Reserved", done: true },
              { label: "Structure Selected", done: true },
              { label: "Documents Prepared", done: true },
              { label: "Registration Submitted", done: false },
            ].map(({ label, done }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${done ? "bg-emerald-500" : "border-2 border-slate-200"}`}>
                  {done && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>
                <span className={`text-xs font-medium ${done ? "text-slate-700" : "text-slate-400"}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status badge */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm">⏳</span>
          </div>
          <div>
            <p className="text-xs font-bold text-amber-800">In Progress</p>
            <p className="text-[10px] text-amber-600">Awaiting final submission</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const heroKeyPoints: string[] = [
  "Simple registration process",
  "Guidance through required documents",
  "Support for entrepreneurs and startups",
  "Faster and stress-free setup",
];

const trustBadges: string[] = ["Startup Friendly", "Compliance Support", "Fast Setup"];

const problemRisks: string[] = [
  "Legal restrictions on operations",
  "Difficulty opening business bank accounts",
  "Inability to sign contracts",
  "Challenges building credibility with customers",
];

const features: Feature[] = [
  { emoji: "🗺️", title: "Registration Guidance", desc: "Step-by-step support through the entire registration process." },
  { emoji: "🏗️", title: "Business Structure Advice", desc: "Help choosing the right legal structure for your business." },
  { emoji: "📄", title: "Document Preparation", desc: "Assistance preparing all required registration documents." },
  { emoji: "📬", title: "Application Submission Support", desc: "Help completing and submitting your registration forms correctly." },
  { emoji: "⚖️", title: "Startup Compliance Overview", desc: "Guidance on key legal requirements for newly registered businesses." },
  { emoji: "🚀", title: "Post-Registration Guidance", desc: "Next steps after registration including branding, websites, and marketing." },
];

const audienceItems: AudienceItem[] = [
  { icon: "⚖️", text: "Want to start a new business legally" },
  { icon: "📖", text: "Need help understanding registration requirements" },
  { icon: "🛡️", text: "Want to avoid mistakes in the process" },
  { icon: "🤝", text: "Want professional guidance for compliance" },
  { icon: "🏢", text: "Want to start operating your business officially" },
];

const steps: Step[] = [
  { n: "01", title: "Tell Us About Your Business", desc: "You provide details about your business idea and industry." },
  { n: "02", title: "Registration Guidance", desc: "We help determine the best structure and registration requirements." },
  { n: "03", title: "Document Preparation", desc: "We assist in preparing the necessary registration documentation." },
  { n: "04", title: "Submit Registration", desc: "Your registration is submitted and your business becomes officially registered." },
];

const plans: Plan[] = [
  {
    name: "Basic Registration",
    tag: "Best for simple businesses",
    price: "$80",
    items: [
      "Registration guidance",
      "Document preparation support",
      "Registration checklist",
    ],
    delivery: "3–5 days",
    cta: "Start Basic Registration",
    popular: false,
  },
  {
    name: "Standard Registration",
    tag: "Most popular",
    price: "$150",
    items: [
      "Full registration guidance",
      "Document preparation",
      "Submission assistance",
      "Compliance checklist",
    ],
    delivery: "5–7 days",
    cta: "Start Standard Registration",
    popular: true,
  },
  {
    name: "Complete Startup Registration",
    tag: "Best for new entrepreneurs",
    price: "$250",
    items: [
      "Full registration assistance",
      "Document preparation",
      "Submission guidance",
      "Startup compliance overview",
      "Next-step business setup guidance",
    ],
    delivery: "7–10 days",
    cta: "Start Complete Registration",
    popular: false,
  },
];

const stackItems: StackItem[] = [
  { label: "Business Plan", status: "complete", emoji: "📋" },
  { label: "Business Registration", status: "current", emoji: "⚖️" },
  { label: "Logo Design", status: "upcoming", emoji: "🎨" },
  { label: "Website Creation", status: "upcoming", emoji: "🌐" },
];

const platformLinks: string[] = [
  "Business planning",
  "Logo design and branding",
  "Website creation",
  "Marketing setup",
];

const relatedServices: RelatedService[] = [
  {
    emoji: "📋",
    title: "Business Plan Writing",
    desc: "Create a professional business plan before you register.",
    href: "/services/business-plan-writing",
  },
  {
    emoji: "🎨",
    title: "Logo Design",
    desc: "Build your brand identity after registration.",
    href: "/services/logo-design",
  },
  {
    emoji: "🌐",
    title: "Website Creation",
    desc: "Launch your business online once you're registered.",
    href: "/services/website-creation",
  },
  {
    emoji: "📊",
    title: "Financial Projections",
    desc: "Understand startup costs and revenue expectations.",
    href: "/services/financial-projections",
  },
  {
    emoji: "🚀",
    title: "Pitch Deck Creation",
    desc: "Prepare an investor-ready pitch for your registered business.",
    href: "/services/pitch-deck",
  },
];

const faqs: FAQItem[] = [
  { q: "Why do I need to register my business?", a: "Business registration allows you to legally operate and build credibility with customers and partners." },
  { q: "How long does business registration take?", a: "The process usually takes several days depending on the registration requirements in your area." },
  { q: "What information do I need to register a business?", a: "You typically need a business name, ownership details, and basic information about your business activities." },
  { q: "Can Hustlecare help me choose the right business structure?", a: "Yes. We guide entrepreneurs through the process and help them understand the available options." },
  { q: "What should I do after registering my business?", a: "Most businesses proceed with branding, website creation, and marketing setup after registration." },
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
              Business Registration Service
            </span>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6">
              Register Your Business and{" "}
              <span className="text-emerald-600">Make It Official</span>
            </h1>

            <p className="text-lg text-slate-500 leading-relaxed mb-8">
              Starting a business requires proper registration and compliance. Hustlecare helps
              entrepreneurs register their businesses quickly and correctly so they can start operating
              legally.
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
                Register My Business
                <ArrowIcon />
              </a>
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 bg-white border-2 border-slate-200 hover:border-emerald-400 text-slate-700 font-semibold px-7 py-3.5 rounded-xl transition-colors"
              >
                See Registration Packages
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
            <RegistrationIllustration />
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
              The Problem
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-6">
              Starting a Business Requires Legal Registration
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              Many entrepreneurs delay launching their businesses because the registration process feels
              confusing or complicated.
            </p>
            <p className="text-slate-400 leading-relaxed">
              Registering your business gives you the legal foundation to operate, grow, and protect
              your brand. Hustlecare simplifies the process and helps you register with confidence.
            </p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
            <p className="text-slate-300 font-semibold mb-5">Without proper registration you may face:</p>
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
            {/* Legal foundation callout */}
            <div className="pt-6 border-t border-slate-700 bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚖️</span>
                <p className="text-emerald-300 text-sm font-medium leading-snug">
                  A registered business is the legal foundation for everything that comes next.
                </p>
              </div>
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
            What&apos;s Included in Our Business Registration Service
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
            Perfect for New Entrepreneurs
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
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Simple 4-Step Process</h2>
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
            Choose Your Registration Package
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
                  <li
                    key={item}
                    className={`flex items-center gap-2.5 text-sm ${
                      popular ? "text-emerald-100" : "text-slate-600"
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                        popular ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-600"
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
                Business registration is one of the key requirements when starting a business.
                Hustlecare connects registration with other important startup steps so you can manage
                your entire startup journey in one place.
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
                      {status === "complete" ? "Complete" : status === "current" ? "In Progress" : "Upcoming"}
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

// ── RELATED SERVICES (Cross-links) ────────────────────────────────────────────
function RelatedServicesSection() {
  return (
    <section className="bg-slate-50 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-emerald-600 text-xs font-bold tracking-widest uppercase mb-3">
            What Comes Next
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Continue Building Your Business
          </h2>
          <p className="text-slate-500 mt-3 max-w-xl mx-auto">
            After registering your business, these services help you take the next steps toward a
            successful launch.
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
          Turn Your Business Idea Into a Registered Company
        </h2>
        <p className="text-emerald-100 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
          Registering your business is one of the most important steps in launching a successful
          startup. Let Hustlecare help you complete the process quickly and confidently.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-8 py-4 rounded-xl shadow-lg transition-all active:scale-95"
          >
            Register My Business
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
export default function BusinessRegistrationClient() {
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