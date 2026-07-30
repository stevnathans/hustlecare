// app/services/pitch-deck/PitchDeckClient.tsx
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

// ── Pitch Deck Illustration ────────────────────────────────────────────────────
function PitchDeckIllustration() {
  const slideThumbs = [
    { label: "Cover", bg: "from-emerald-500 to-teal-600" },
    { label: "Problem", bg: "from-slate-700 to-slate-800" },
    { label: "Solution", bg: "from-emerald-400 to-emerald-600" },
    { label: "Market", bg: "from-teal-500 to-cyan-600" },
    { label: "Traction", bg: "from-slate-700 to-slate-800" },
    { label: "The Ask", bg: "from-emerald-600 to-emerald-700" },
  ];

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl" />
      <div className="relative p-7 rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-100/50">

        {/* Active slide preview */}
        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg mb-4">
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Slide 6 of 15</span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">The Ask</span>
          </div>
          <div className="p-5">
            <div className="h-3 w-2/3 bg-white/80 rounded mb-2" />
            <div className="h-2 w-1/2 bg-white/30 rounded mb-4" />
            <div className="grid grid-cols-3 gap-2">
              {["$500K", "18mo", "5x"].map((v) => (
                <div key={v} className="bg-white/10 rounded-lg p-2 text-center">
                  <div className="text-emerald-400 font-extrabold text-sm">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slide filmstrip */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {slideThumbs.map(({ label, bg }) => (
            <div key={label} className={`h-14 rounded-lg bg-gradient-to-br ${bg} flex items-end p-1.5 shadow-sm`}>
              <span className="text-[8px] text-white/90 font-bold">{label}</span>
            </div>
          ))}
        </div>

        {/* Deck readiness */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Investor Readiness</p>
            <span className="text-xs font-extrabold text-emerald-600">92%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: "92%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const heroKeyPoints: string[] = [
  "Professionally designed slides, not templates",
  "Clear investor narrative from problem to ask",
  "Financial visuals that make numbers land",
  "Delivered ready to present or send",
];

const trustBadges: string[] = ["Investor Ready", "Design-Led", "Startup Focused"];

const problemRisks: string[] = [
  "Losing investor attention in the first 30 seconds",
  "Burying the ask in a wall of text",
  "Numbers that don't build a compelling story",
  "A deck that looks like it was made in a rush",
];

const features: Feature[] = [
  { emoji: "🎯", title: "Investor Narrative", desc: "A clear story arc from problem to solution to ask, structured the way investors actually read decks." },
  { emoji: "🎨", title: "Custom Slide Design", desc: "Professionally designed slides matched to your brand, not a generic template." },
  { emoji: "📊", title: "Data Visualization", desc: "Market size, traction, and financials turned into visuals that are easy to scan." },
  { emoji: "💰", title: "The Ask, Framed Right", desc: "Funding amount, use of funds, and terms presented clearly and confidently." },
  { emoji: "📝", title: "Speaker Notes", desc: "Optional notes under each slide so you know exactly what to say when presenting live." },
  { emoji: "📁", title: "Every Format You Need", desc: "PDF for sending, PPTX or Keynote for editing and presenting." },
];

const audienceItems: AudienceItem[] = [
  { icon: "🚀", text: "Raising a pre-seed or seed round" },
  { icon: "🏦", text: "Preparing for accelerator or investor meetings" },
  { icon: "📈", text: "Want your traction and numbers to actually land" },
  { icon: "🎤", text: "Pitching at a demo day or competition" },
  { icon: "🧩", text: "Have the story but need it designed properly" },
];

const steps: Step[] = [
  { n: "01", title: "Choose Your Package", desc: "Pick the deck size and turnaround that fits your fundraising timeline." },
  { n: "02", title: "Tell Us Your Story", desc: "A short questionnaire covers your problem, solution, market, traction, and ask." },
  { n: "03", title: "Design and Narrative", desc: "Our team structures your story and designs each slide to match." },
  { n: "04", title: "Receive Your Deck", desc: "You get a polished, presentation-ready deck in every format you need." },
];

// `id` matches the packageTier id in lib/questionnaires/pitch-deck/config.ts.
const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter Deck",
    tag: "Best for early pitches",
    price: "$90",
    items: ["Up to 10 slides", "1 revision round", "PDF + PowerPoint files"],
    delivery: "4–5 days",
    cta: "Start Starter Deck",
    popular: false,
  },
  {
    id: "investor",
    name: "Investor Deck",
    tag: "Most popular",
    price: "$180",
    items: [
      "Up to 15 slides",
      "3 revision rounds",
      "PDF, PowerPoint & Keynote files",
      "Speaker notes included",
      "Custom data visualizations",
    ],
    delivery: "5–7 days",
    cta: "Start Investor Deck",
    popular: true,
  },
  {
    id: "fundraising",
    name: "Fundraising Deck",
    tag: "Best for serious fundraising",
    price: "$320",
    items: [
      "Up to 20 slides",
      "Unlimited revisions",
      "All file formats",
      "Advanced financial visualizations",
      "30-minute pitch coaching call",
    ],
    delivery: "7–10 days",
    cta: "Start Fundraising Deck",
    popular: false,
  },
];

const stackItems: StackItem[] = [
  { label: "Business Plan", status: "complete", emoji: "📋" },
  { label: "Financial Projections", status: "complete", emoji: "📊" },
  { label: "Pitch Deck", status: "current", emoji: "🚀" },
  { label: "Business Registration", status: "upcoming", emoji: "⚖️" },
];

const platformLinks: string[] = [
  "Business plan writing",
  "Financial projections",
  "Business registration",
  "Logo design and branding",
];

const relatedServices: RelatedService[] = [
  {
    emoji: "📋",
    title: "Business Plan Writing",
    desc: "Your pitch deck is stronger when it's backed by a full business plan.",
    href: "/services/business-plan-writing",
  },
  {
    emoji: "📊",
    title: "Financial Projections",
    desc: "Turn your financial model into the numbers investors will ask about.",
    href: "/services/financial-projections",
  },
  {
    emoji: "⚖️",
    title: "Business Registration",
    desc: "Make your business official before you close a funding round.",
    href: "/services/business-registration",
  },
  {
    emoji: "🎨",
    title: "Logo Design",
    desc: "A strong brand identity makes your deck feel more credible.",
    href: "/services/logo-design",
  },
];

const faqs: FAQItem[] = [
  { q: "Do I need a business plan first?", a: "It helps but isn't required. We can build your pitch deck from the questionnaire alone, though pairing it with a business plan makes both stronger." },
  { q: "Can you help with the story, not just the design?", a: "Yes. We help structure your narrative — what to lead with, what to cut, and how to frame your ask — not just make it look good." },
  { q: "What if I don't have final numbers yet?", a: "That's normal at this stage. We'll work with your best estimates and clearly label assumptions where needed." },
  { q: "Can I present the deck myself?", a: "Yes. Every package includes speaker notes on request, and the Investor and Fundraising packages include them by default." },
  { q: "Can I request changes after delivery?", a: "Yes. Each package includes a set number of revision rounds, with unlimited revisions on the Fundraising Deck package." },
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
              A Pitch Deck That Gets{" "}
              <span className="text-emerald-600">Investors to Say Yes</span>
            </h1>

            <p className="text-lg text-slate-500 leading-relaxed mb-8">
              Hustlecare turns your business idea into a polished, professionally designed pitch deck —
              built around the story investors actually want to hear.
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
                Create My Pitch Deck
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
            <PitchDeckIllustration />
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
              Most Pitch Decks Lose Investors in the First Slide
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              Investors see hundreds of decks. A great idea buried in a cluttered, poorly structured
              deck often never gets a second look.
            </p>
            <p className="text-slate-400 leading-relaxed">
              A well-designed deck with a clear narrative gives your idea the fair shot it deserves.
              Hustlecare helps you build that deck from the ground up.
            </p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
            <p className="text-slate-300 font-semibold mb-5">Without a strong deck, you risk:</p>
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
                <span className="text-2xl">🎯</span>
                <p className="text-emerald-300 text-sm font-medium leading-snug">
                  Investors decide whether to keep listening within the first few slides — make them count.
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
            What&apos;s Included in Your Pitch Deck
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
            Perfect for Founders Ready to Raise
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
    router.push(`/services/pitch-deck/questionnaire?package=${planId}`);
  }

  return (
    <section id="pricing" className="bg-slate-50 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Choose Your Pitch Deck Package
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
                Part of the Hustlecare Startup System
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                A pitch deck is strongest when it&apos;s backed by real planning and numbers. Hustlecare
                connects your deck with the other startup services that support it.
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
            Services That Strengthen Your Pitch
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
          Give Your Fundraise the Deck It Deserves
        </h2>
        <p className="text-emerald-100 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
          A great pitch deck can be the difference between a second meeting and a polite no. Let
          Hustlecare help you tell your story the right way.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-8 py-4 rounded-xl shadow-lg transition-all active:scale-95"
          >
            Create My Pitch Deck
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
export default function PitchDeckClient() {
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