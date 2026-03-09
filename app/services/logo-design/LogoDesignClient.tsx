"use client";

import { useState } from "react";

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

interface PlatformLink {
  emoji: string;
  label: string;
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

// ── Logo Illustration ─────────────────────────────────────────────────────────
// A purely CSS/SVG mock showing logo concept cards
function LogoIllustration() {
  const mockLogos = [
    { letter: "A", bg: "from-violet-500 to-purple-600", shape: "rounded-2xl" },
    { letter: "B", bg: "from-emerald-500 to-teal-600", shape: "rounded-full" },
    { letter: "C", bg: "from-amber-400 to-orange-500", shape: "rounded-xl rotate-12" },
    { letter: "D", bg: "from-sky-500 to-blue-600", shape: "rounded-2xl" },
  ];

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl" />
      <div className="relative p-8 rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-100/50">

        {/* Header label */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Logo Concepts</span>
          <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">4 Concepts</span>
        </div>

        {/* Logo concept grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {mockLogos.map(({ letter, bg, shape }) => (
            <div
              key={letter}
              className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col items-center gap-2 shadow-sm"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${bg} ${shape} flex items-center justify-center text-white font-extrabold text-xl shadow-md`}>
                {letter}
              </div>
              <div className="h-2 w-16 bg-slate-100 rounded" />
              <div className="h-1.5 w-10 bg-slate-50 rounded" />
            </div>
          ))}
        </div>

        {/* File formats row */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">File Formats Included</p>
          <div className="flex gap-2 flex-wrap">
            {["PNG", "JPG", "SVG", "PDF"].map((fmt) => (
              <span key={fmt} className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                {fmt}
              </span>
            ))}
          </div>
        </div>

        {/* Color palette strip */}
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Brand Colors</p>
          <div className="flex gap-2">
            {["#059669", "#0f172a", "#f59e0b", "#6366f1", "#e2e8f0"].map((color) => (
              <div
                key={color}
                className="w-7 h-7 rounded-full shadow-sm border border-white"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const heroKeyPoints: string[] = [
  "Custom logo concepts",
  "Designed for startups and small businesses",
  "Professional and modern design",
  "Delivered in all formats you need",
];

const trustBadges: string[] = ["Startup Friendly", "Custom Designs", "Commercial Use"];

const logoAppearsOn: string[] = [
  "Your website",
  "Social media pages",
  "Business cards",
  "Packaging",
  "Advertisements",
];

const features: Feature[] = [
  { emoji: "🎨", title: "Custom Logo Concepts", desc: "Multiple original logo ideas created specifically for your brand." },
  { emoji: "✨", title: "Professional Design", desc: "Clean, modern designs that work across digital and print media." },
  { emoji: "🖼️", title: "High Resolution Files", desc: "High-quality logo files ready for any use case." },
  { emoji: "📁", title: "Multiple Formats", desc: "Files for websites, social media, printing, and branding." },
  { emoji: "🎨", title: "Brand Color Suggestions", desc: "Recommended colors that match your brand personality." },
  { emoji: "✅", title: "Commercial Rights", desc: "Full rights to use your logo for your business, forever." },
];

const audienceItems: AudienceItem[] = [
  { icon: "🚀", text: "Launching a new business" },
  { icon: "💼", text: "Want a professional brand identity" },
  { icon: "🌐", text: "Need a logo for your website or social media" },
  { icon: "📢", text: "Want a logo that works across all marketing materials" },
  { icon: "🏆", text: "Want to stand out from competitors" },
];

const steps: Step[] = [
  { n: "01", title: "Tell Us About Your Brand", desc: "Complete a short questionnaire about your business, industry, and design preferences." },
  { n: "02", title: "Concept Creation", desc: "Our designers create several custom logo concepts based on your brand." },
  { n: "03", title: "Feedback and Revisions", desc: "Choose your favorite design and request revisions if needed." },
  { n: "04", title: "Receive Your Final Logo", desc: "Get your final logo files ready for websites, social media, and marketing materials." },
];

const plans: Plan[] = [
  {
    name: "Starter Logo",
    tag: "Best for simple brands",
    price: "$60",
    items: ["2 logo concepts", "1 revision round", "PNG + JPG files"],
    delivery: "3–4 days",
    cta: "Start Starter Logo",
    popular: false,
  },
  {
    name: "Professional Logo",
    tag: "Most popular",
    price: "$120",
    items: [
      "4 logo concepts",
      "3 revision rounds",
      "PNG, JPG, SVG & transparent files",
      "Brand color suggestions",
    ],
    delivery: "4–6 days",
    cta: "Start Professional Logo",
    popular: true,
  },
  {
    name: "Complete Brand Kit",
    tag: "Best for serious startups",
    price: "$220",
    items: [
      "5 logo concepts",
      "Unlimited revisions",
      "Full logo file formats",
      "Brand color palette",
      "Typography recommendations",
      "Social media logo versions",
    ],
    delivery: "5–7 days",
    cta: "Start Brand Kit",
    popular: false,
  },
];

const platformLinks: PlatformLink[] = [
  { emoji: "💡", label: "Business name selection" },
  { emoji: "🌐", label: "Website creation" },
  { emoji: "📣", label: "Marketing setup" },
  { emoji: "📱", label: "Social media branding" },
];

const faqs: FAQItem[] = [
  { q: "How long does logo design take?", a: "Most logo designs are delivered within 3–6 days depending on the package." },
  { q: "Can I request changes?", a: "Yes. All packages include revision rounds to refine your design." },
  { q: "Will I own the logo?", a: "Yes. Once completed, the logo belongs fully to your business." },
  { q: "What file formats will I receive?", a: "You receive multiple formats including PNG, JPG, and scalable files for printing and digital use." },
  { q: "Can I use the logo on my website and social media?", a: "Yes. The logo will work across all digital and marketing platforms." },
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
              Logo Design Service
            </span>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6">
              Professional Logo Design{" "}
              <span className="text-emerald-600">for Your Business</span>
            </h1>

            <p className="text-lg text-slate-500 leading-relaxed mb-8">
              Your logo is the face of your business. Hustlecare creates professional, memorable logos
              designed to help your brand stand out and build trust with customers.
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
                Start My Logo Design
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
            <LogoIllustration />
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
              First Impressions
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-6">
              Your Logo Is the First Thing Customers Notice
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              A strong logo helps customers remember your brand and trust your business. A poorly
              designed logo can make even a great business look unprofessional.
            </p>
            <p className="text-slate-400 leading-relaxed font-medium text-sm">
              That&apos;s why your brand needs a professional identity from the start. Hustlecare helps
              entrepreneurs create logos that represent their business and communicate their brand clearly.
            </p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
            <p className="text-slate-300 font-semibold mb-5">Your logo appears everywhere:</p>
            <ul className="space-y-3 mb-8">
              {logoAppearsOn.map((item) => (
                <li key={item} className="flex items-center gap-3 text-slate-300">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckIcon />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            {/* Visual bar showing brand recognition */}
            <div className="pt-6 border-t border-slate-700 space-y-2.5">
              {[
                { label: "Brand Recognition", pct: 88 },
                { label: "Customer Trust", pct: 76 },
                { label: "Competitive Edge", pct: 92 },
              ].map(({ label, pct }) => (
                <div key={label}>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>{label}</span><span>{pct}%</span>
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
            What&apos;s Included in Your Logo Design
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
            Perfect for New Businesses and Startups
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
            Choose Your Logo Design Package
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
                    className={`flex items-center gap-2.5 text-sm ${popular ? "text-emerald-100" : "text-slate-600"}`}
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
                Part of Your Startup Branding
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                Logo design is one of the key requirements when starting a business. Hustlecare connects
                branding services with other startup needs so you can build everything in one place.
              </p>
              <ul className="space-y-3 mb-8">
                {platformLinks.map(({ emoji, label }) => (
                  <li key={label} className="flex items-center gap-3 text-slate-300 text-sm">
                    <span className="text-base">{emoji}</span>
                    {label}
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

            {/* Branding stack visual */}
            <div className="flex justify-center">
              <div className="space-y-3 w-full max-w-xs">
                {[
                  { label: "Logo Design", status: "Complete", color: "emerald", emoji: "🎨" },
                  { label: "Business Name", status: "Next Step", color: "amber", emoji: "💡" },
                  { label: "Website Creation", status: "Upcoming", color: "slate", emoji: "🌐" },
                  { label: "Social Media Setup", status: "Upcoming", color: "slate", emoji: "📱" },
                ].map(({ label, status, color, emoji }) => (
                  <div
                    key={label}
                    className={`flex items-center gap-4 rounded-xl px-4 py-3 border ${
                      color === "emerald"
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : color === "amber"
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
                        color === "emerald"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : color === "amber"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-slate-600 text-slate-400"
                      }`}
                    >
                      {status}
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

// ── 8. FAQ ────────────────────────────────────────────────────────────────────
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
          Build a Brand Customers Remember
        </h2>
        <p className="text-emerald-100 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
          A professional logo is one of the most important steps when launching a new business. Let
          Hustlecare help you create a brand identity that stands out.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-8 py-4 rounded-xl shadow-lg transition-all active:scale-95"
          >
            Start My Logo Design
            <ArrowIcon />
          </a>
          <a
            href="/services"
            className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-8 py-4 rounded-xl transition-all active:scale-95"
          >
            Explore Startup Services
          </a>
        </div>
      </div>
    </section>
  );
}

// ── ROOT EXPORT ───────────────────────────────────────────────────────────────
export default function LogoDesignClient() {
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