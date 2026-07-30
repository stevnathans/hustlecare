// app/services/business-name-domain/BusinessNameDomainClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  id: string;
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

// ── Name + Domain Illustration ─────────────────────────────────────────────────
function NameDomainIllustration() {
  const nameOptions = [
    { name: "Hustlebase", domain: "hustlebase.com", available: true },
    { name: "Vertexly", domain: "vertexly.co", available: true },
    { name: "Founderloop", domain: "founderloop.com", available: false },
  ];

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl" />
      <div className="relative p-7 rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-100/50">

        {/* Search bar mock */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 mb-4 flex items-center gap-2.5">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          <span className="text-sm text-slate-400">fresh produce delivery startup…</span>
        </div>

        {/* Name option cards */}
        <div className="space-y-2.5 mb-4">
          {nameOptions.map(({ name, domain, available }) => (
            <div
              key={name}
              className={`rounded-xl border px-4 py-3 flex items-center justify-between ${
                available ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div>
                <p className="text-sm font-bold text-slate-800">{name}</p>
                <p className="text-[11px] text-slate-400">{domain}</p>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                  available ? "bg-emerald-500 text-white" : "bg-slate-300 text-slate-600"
                }`}
              >
                {available ? "Available" : "Taken"}
              </span>
            </div>
          ))}
        </div>

        {/* Coverage checklist */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Checked For You</p>
          <div className="grid grid-cols-3 gap-2">
            {["Domain", "Social", "Trademark"].map((item) => (
              <span key={item} className="text-[10px] text-center font-semibold text-emerald-700 bg-emerald-50 rounded-lg py-1.5">
                {item} ✓
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const heroKeyPoints: string[] = [
  "Multiple curated name options, not a random generator",
  "Domain and social handle availability checked",
  "Quick trademark conflict screening",
  "Delivered with a short rationale for each name",
];

const trustBadges: string[] = ["Fast Turnaround", "Domain Checked", "Startup Focused"];

const problemRisks: string[] = [
  "Picking a name that's already trademarked elsewhere",
  "Discovering the domain is taken after you've told everyone",
  "A name that's forgettable or hard to spell",
  "Losing weeks brainstorming without a clear direction",
];

const features: Feature[] = [
  { emoji: "💡", title: "Curated Name Options", desc: "Multiple name ideas generated around your business, industry, and tone — not random word mashups." },
  { emoji: "🌐", title: "Domain Availability", desc: "Every suggested name is checked for domain availability across common extensions." },
  { emoji: "📱", title: "Social Handle Check", desc: "We check whether matching usernames are available on major social platforms." },
  { emoji: "⚖️", title: "Trademark Quick-Check", desc: "A fast screening for obvious trademark conflicts, so you don't build a brand you'll have to abandon." },
  { emoji: "📝", title: "Naming Rationale", desc: "A short explanation of why each name works, so you can decide with confidence." },
  { emoji: "🔁", title: "Refinement Rounds", desc: "Not quite right? We refine the direction based on your feedback." },
];

const audienceItems: AudienceItem[] = [
  { icon: "🚀", text: "Starting a business and need a name" },
  { icon: "🔄", text: "Rebranding an existing business" },
  { icon: "🌐", text: "Want to confirm a domain is available before committing" },
  { icon: "🧠", text: "Have ideas but can't land on the right one" },
  { icon: "⚡", text: "Need a name fast, without weeks of brainstorming" },
];

const steps: Step[] = [
  { n: "01", title: "Tell Us About Your Business", desc: "Share what your business does, your audience, and any style preferences." },
  { n: "02", title: "Name Generation", desc: "We generate name options aligned with your brand direction." },
  { n: "03", title: "Availability Checks", desc: "We check domain, social handle, and trademark availability for each option." },
  { n: "04", title: "Receive Your Shortlist", desc: "You get a curated shortlist with availability status and reasoning for each." },
];

// `id` matches the packageTier id in
// lib/questionnaires/business-name-domain/config.ts.
const plans: Plan[] = [
  {
    id: "quick",
    name: "Quick Names",
    tag: "Best for quick decisions",
    price: "KSh 2,500",
    items: [
      "Business name brainstorming",
      "20 suggested names",
      "Domain availability check (.co.ke & .com)",
      "Basic name report",
    ],
    delivery: "1–2 days",
    cta: "Start Quick Names",
    popular: false,
  },
  {
    id: "complete",
    name: "Complete Naming",
    tag: "Most popular",
    price: "KSh 5,500",
    items: [
      "Everything in Quick Names",
      "40 curated business names",
      "Trademark conflict screening (basic)",
      "Social media username check",
      "Brand positioning suggestions & slogan ideas",
    ],
    delivery: "2–3 days",
    cta: "Start Complete Naming",
    popular: true,
  },
  {
    id: "brand-ready",
    name: "Brand Ready",
    tag: "Best for serious brands",
    price: "KSh 10,000",
    items: [
      "Everything in Complete Naming",
      "Premium naming consultation",
      "Business tagline & brand story",
      "Domain registration assistance & email setup",
      "Logo style recommendations",
    ],
    delivery: "3–5 days",
    cta: "Start Brand Ready",
    popular: false,
  },
];

const stackItems: StackItem[] = [
  { label: "Business Name & Domain", status: "current", emoji: "💡" },
  { label: "Logo Design", status: "upcoming", emoji: "🎨" },
  { label: "Website Creation", status: "upcoming", emoji: "🌐" },
  { label: "Social Media Setup", status: "upcoming", emoji: "📱" },
];

const platformLinks: string[] = [
  "Logo design and branding",
  "Website creation",
  "Social media setup",
  "Business registration",
];

const relatedServices: RelatedService[] = [
  {
    emoji: "🎨",
    title: "Logo Design",
    desc: "Once your name is locked in, build a visual identity to match.",
    href: "/services/logo-design",
  },
  {
    emoji: "🌐",
    title: "Website Creation",
    desc: "Launch a website on your new domain right away.",
    href: "/services/website-creation",
  },
  {
    emoji: "📱",
    title: "Social Media Setup",
    desc: "Claim your matching handles across social platforms.",
    href: "/services/social-media-setup",
  },
  {
    emoji: "⚖️",
    title: "Business Registration",
    desc: "Register your business under your new name.",
    href: "/services/business-registration",
  },
];

const faqs: FAQItem[] = [
  { q: "Do you register the domain for me?", a: "We check availability and tell you exactly where to register it. Domain registration itself is a quick step you complete yourself, so you keep full ownership." },
  { q: "What if none of the names feel right?", a: "Each package includes refinement rounds — tell us what's off and we'll generate a new direction." },
  { q: "Is the trademark check a full legal search?", a: "No — it's a quick screening for obvious conflicts, not a substitute for a formal trademark search. We'll flag if you should pursue one." },
  { q: "Can you check names I've already thought of?", a: "Yes. Share your own ideas in the questionnaire and we'll check availability alongside our suggestions." },
  { q: "How fast can I get results?", a: "Quick Names typically delivers in 1–2 days. More thorough packages take a bit longer to properly check everything." },
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

            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6">
              Find the Right Name{" "}
              <span className="text-emerald-600">Before You Build Anything Else</span>
            </h1>

            <p className="text-lg text-slate-500 leading-relaxed mb-8">
              Hustlecare helps you land on a business name that&apos;s memorable, available, and ready to
              build a brand around — domain and social handles included.
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
                Find My Business Name
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
            <NameDomainIllustration />
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
            
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-6">
              Picking a Name Is Harder Than It Looks
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              A great name that&apos;s already trademarked, or a perfect fit with no available domain,
              can cost you weeks of wasted branding work down the line.
            </p>
            <p className="text-slate-400 leading-relaxed">
              Getting the name and domain checked properly from the start means everything you build
              after — logo, website, social profiles — has a solid foundation.
            </p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
            <p className="text-slate-300 font-semibold mb-5">Without checking properly, you risk:</p>
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
            <div className="pt-6 border-t border-slate-700 bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💡</span>
                <p className="text-emerald-300 text-sm font-medium leading-snug">
                  A name you have to change later costs far more than getting it right the first time.
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
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            What&apos;s Included in Your Naming Package
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
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Perfect for Founders Naming a Business
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

// ── 6. PRICING ────────────────────────────────────────────────────────────────
function PricingCards() {
  const router = useRouter();

  function handleSelectPlan(planId: string) {
    router.push(`/services/business-name-domain/questionnaire?package=${planId}`);
  }

  return (
    <section id="pricing" className="bg-slate-50 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Choose Your Naming Package
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map(({ id, name, tag, price, items, delivery, cta, popular }) => (
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
                onClick={() => handleSelectPlan(id)}
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
            
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5">
                Where Your Brand Starts
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                Your name is the foundation everything else builds on. Hustlecare connects your naming
                decision with the branding and setup steps that come next.
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

// ── RELATED SERVICES ──────────────────────────────────────────────────────────
function RelatedServicesSection() {
  return (
    <section className="bg-slate-50 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Build on Your New Name
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
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

// ── FAQ ───────────────────────────────────────────────────────────────────────
function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="bg-white py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          
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

// ── FINAL CTA ─────────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="bg-emerald-600 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5">
          Get a Name You Can Build a Business On
        </h2>
        <p className="text-emerald-100 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
          Stop guessing whether a name is available. Let Hustlecare check it properly and hand you a
          shortlist you can commit to.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-8 py-4 rounded-xl shadow-lg transition-all active:scale-95"
          >
            Find My Business Name
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
export default function BusinessNameDomainClient() {
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