"use client";

import { useState } from "react";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────────────────
interface Service {
  emoji: string;
  title: string;
  desc: string;
  href: string;
  cta: string;
  category: ServiceCategory;
}

interface Category {
  id: ServiceCategory;
  label: string;
  emoji: string;
  desc: string;
  services: string[];
}

interface ValueItem {
  emoji: string;
  title: string;
  desc: string;
}

interface FAQItem {
  q: string;
  a: string;
}

type ServiceCategory = "planning" | "legal" | "branding" | "digital";

// ── Data ─────────────────────────────────────────────────────────────────────
const services: Service[] = [
  {
    emoji: "📋",
    title: "Business Plan Writing",
    desc: "Create a professional business plan with market research and financial projections.",
    href: "/services/business-plan-writing",
    cta: "Create Business Plan",
    category: "planning",
  },
  {
    emoji: "🎨",
    title: "Logo Design",
    desc: "Get a professional logo and brand identity for your business.",
    href: "/services/logo-design",
    cta: "Design My Logo",
    category: "branding",
  },
  {
    emoji: "🌐",
    title: "Website Creation",
    desc: "Launch a professional website for your business.",
    href: "/services/website-creation",
    cta: "Build My Website",
    category: "digital",
  },
  {
    emoji: "⚖️",
    title: "Business Registration",
    desc: "Register your business and make it legally operational.",
    href: "/services/business-registration",
    cta: "Register My Business",
    category: "legal",
  },
  {
    emoji: "📊",
    title: "Financial Projections",
    desc: "Understand your startup costs and revenue expectations.",
    href: "/services/financial-projections",
    cta: "Create Financial Plan",
    category: "planning",
  },
  {
    emoji: "🚀",
    title: "Pitch Deck Creation",
    desc: "Prepare a professional pitch deck for investors or lenders.",
    href: "/services/pitch-deck",
    cta: "Create Pitch Deck",
    category: "planning",
  },
  {
    emoji: "💡",
    title: "Business Name + Domain",
    desc: "Find the perfect business name and domain for your brand.",
    href: "/services/business-name-domain",
    cta: "Find My Business Name",
    category: "branding",
  },
  {
    emoji: "📍",
    title: "Google Business Profile Setup",
    desc: "Get your business listed on Google to attract local customers.",
    href: "/services/google-business-profile",
    cta: "Set Up Google Listing",
    category: "digital",
  },
  {
    emoji: "📣",
    title: "Social Media Setup",
    desc: "Launch your business on key social platforms.",
    href: "/services/social-media-setup",
    cta: "Start Social Media",
    category: "digital",
  },
];

const categories: Category[] = [
  {
    id: "planning",
    label: "Business Planning",
    emoji: "📋",
    desc: "Validate and plan your business with confidence.",
    services: ["Business Plan Writing", "Financial Projections", "Pitch Deck Creation"],
  },
  {
    id: "legal",
    label: "Legal Setup",
    emoji: "⚖️",
    desc: "Make your business official and legally compliant.",
    services: ["Business Registration", "Licensing & Permits"],
  },
  {
    id: "branding",
    label: "Branding",
    emoji: "🎨",
    desc: "Create a memorable identity for your brand.",
    services: ["Logo Design", "Business Name + Domain"],
  },
  {
    id: "digital",
    label: "Digital Presence",
    emoji: "🌐",
    desc: "Get your business online and visible to customers.",
    services: ["Website Creation", "Google Business Profile", "Social Media Setup"],
  },
];

const valueItems: ValueItem[] = [
  {
    emoji: "🏗️",
    title: "Built for New Businesses",
    desc: "Our services are designed specifically for entrepreneurs starting businesses from scratch.",
  },
  {
    emoji: "🔗",
    title: "Integrated With Startup Requirements",
    desc: "Each service connects directly with the Hustlecare platform where you manage requirements and costs.",
  },
  {
    emoji: "💰",
    title: "Transparent Pricing",
    desc: "Clear service packages with no hidden fees. Know exactly what you're paying for.",
  },
  {
    emoji: "🤝",
    title: "Expert Support",
    desc: "Our team helps you build the foundation for a successful business launch.",
  },
];

const bundleIncludes: string[] = [
  "Business Plan",
  "Business Registration",
  "Logo Design",
  "Website Creation",
];

const faqs: FAQItem[] = [
  { q: "What services does Hustlecare offer?", a: "We offer startup services including business plans, branding, registration, website creation, and marketing setup." },
  { q: "Do I need all these services to start a business?", a: "Not always. Hustlecare helps identify which requirements are necessary for your specific business." },
  { q: "Can I order multiple services together?", a: "Yes. You can purchase services individually or choose bundled startup packages." },
  { q: "Do these services work with the Hustlecare platform?", a: "Yes. All services connect with Hustlecare tools for planning startup requirements and calculating costs." },
];

const highlights: string[] = [
  "Business planning",
  "Branding and logo design",
  "Business registration",
  "Website creation",
  "Startup strategy support",
];

// ── Icons ────────────────────────────────────────────────────────────────────
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

// ── 1. HERO ──────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white pt-20 pb-24 text-center">
      {/* Grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right,#d1fae520 1px,transparent 1px),linear-gradient(to bottom,#d1fae520 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Emerald blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-10"
        style={{ background: "radial-gradient(ellipse,#059669 0%,transparent 70%)" }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Hustlecare Services
        </span>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6">
          Startup Services to Help You{" "}
          <span className="text-emerald-600">Launch Your Business</span>
        </h1>

        <p className="text-xl text-slate-500 leading-relaxed mb-10 max-w-2xl mx-auto">
          Hustlecare helps entrepreneurs start businesses faster with professional services for
          planning, branding, registration, and digital setup.
        </p>

        {/* Highlight pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {highlights.map((h) => (
            <span
              key={h}
              className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2 rounded-full shadow-sm"
            >
              <span className="text-emerald-500">
                <CheckIcon />
              </span>
              {h}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="#services"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all text-white font-semibold px-7 py-3.5 rounded-xl shadow-lg shadow-emerald-200"
          >
            Explore Services
            <ArrowIcon />
          </a>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-white border-2 border-slate-200 hover:border-emerald-400 text-slate-700 font-semibold px-7 py-3.5 rounded-xl transition-colors"
          >
            Find Business Requirements
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── 2. HOW HUSTLECARE HELPS ───────────────────────────────────────────────────
const helperPoints: string[] = [
  "Identify business requirements",
  "Estimate startup costs",
  "Purchase necessary products",
  "Access professional services",
];

function HowWeHelpSection() {
  return (
    <section className="bg-slate-900 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block text-emerald-400 text-xs font-bold tracking-widest uppercase mb-4">
              The Platform
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-6">
              Everything You Need to Start a Business
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              Starting a business requires many steps. You may need a business plan, registration
              documents, branding, a website, and marketing tools.
            </p>
            <p className="text-slate-400 leading-relaxed">
              Hustlecare simplifies this process by helping entrepreneurs move from{" "}
              <span className="text-white font-semibold">idea to launch faster and with fewer mistakes.</span>
            </p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
            <p className="text-slate-300 font-semibold mb-6">Hustlecare helps you:</p>
            <ul className="space-y-3 mb-8">
              {helperPoints.map((item) => (
                <li key={item} className="flex items-center gap-3 text-slate-300">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckIcon />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-700">
              {[
                { val: "9+", label: "Services" },
                { val: "4", label: "Categories" },
                { val: "1", label: "Platform" },
              ].map(({ val, label }) => (
                <div key={label} className="text-center">
                  <div className="text-2xl font-extrabold text-emerald-400">{val}</div>
                  <div className="text-xs text-slate-500 font-medium">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 3. SERVICES GRID ─────────────────────────────────────────────────────────
function ServicesGrid() {
  return (
    <section id="services" className="bg-white py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-emerald-600 text-xs font-bold tracking-widest uppercase mb-3">
            What We Offer
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Our Startup Services
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(({ emoji, title, desc, href, cta }) => (
            <div
              key={title}
              className="group flex flex-col bg-white border border-slate-100 hover:border-emerald-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-emerald-50 group-hover:bg-emerald-100 rounded-xl flex items-center justify-center text-2xl mb-4 transition-colors">
                {emoji}
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed flex-1 mb-6">{desc}</p>
              <Link
                href={href}
                className="inline-flex items-center justify-center gap-2 w-full bg-slate-50 hover:bg-emerald-600 border border-slate-200 hover:border-emerald-600 text-slate-700 hover:text-white font-semibold text-sm py-2.5 rounded-xl transition-all duration-200"
              >
                {cta}
                <ArrowIcon />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 4. CATEGORIES SECTION ────────────────────────────────────────────────────
function CategoriesSection() {
  return (
    <section className="bg-slate-50 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-emerald-600 text-xs font-bold tracking-widest uppercase mb-3">
            By Stage
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Services for Every Stage of Starting a Business
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map(({ label, emoji, desc, services: catServices }) => (
            <div
              key={label}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
            >
              <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-xl mb-4">
                {emoji}
              </div>
              <h3 className="font-bold text-slate-900 mb-1">{label}</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-4">{desc}</p>
              <ul className="space-y-1.5">
                {catServices.map((s) => (
                  <li key={s} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 5. VALUE SECTION ─────────────────────────────────────────────────────────
function ValueSection() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-emerald-600 text-xs font-bold tracking-widest uppercase mb-3">
            Why Hustlecare
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Why Founders Choose Hustlecare
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {valueItems.map(({ emoji, title, desc }) => (
            <div
              key={title}
              className="text-center p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-100 transition-colors duration-200"
            >
              <div className="text-4xl mb-4">{emoji}</div>
              <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 6. BUNDLE SECTION ────────────────────────────────────────────────────────
function BundleSection() {
  return (
    <section className="bg-emerald-50 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-10 lg:p-14">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block text-emerald-400 text-xs font-bold tracking-widest uppercase mb-4">
                Startup Bundle
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5">
                Launch Your Business Faster
              </h2>
              <p className="text-slate-400 leading-relaxed mb-8">
                Many entrepreneurs need several services when starting a business. Instead of ordering
                them separately, you can bundle them together and save time.
              </p>
              <a
                href="#"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors shadow-lg shadow-emerald-900/50"
              >
                View Startup Packages
                <ArrowIcon />
              </a>
            </div>

            {/* Bundle card */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-white font-extrabold text-xl">Startup Launch Package</h3>
                  <p className="text-slate-400 text-sm mt-1">Everything to get you started</p>
                </div>
                <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-full">
                  Bundle
                </span>
              </div>
              <ul className="space-y-3 mb-6">
                {bundleIncludes.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-slate-300">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <CheckIcon />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="pt-4 border-t border-slate-700 flex items-center gap-2 text-slate-500 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Save time by bundling services together
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 7. FAQ ───────────────────────────────────────────────────────────────────
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

// ── 8. FINAL CTA ─────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="bg-emerald-600 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5">
          Start Building Your Business Today
        </h2>
        <p className="text-emerald-100 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
          Hustlecare provides the tools and services entrepreneurs need to turn business ideas into
          real companies. Explore our services and take the next step toward launching your business.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="#services"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-8 py-4 rounded-xl shadow-lg transition-all active:scale-95"
          >
            Explore Services
            <ArrowIcon />
          </a>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-8 py-4 rounded-xl transition-all active:scale-95"
          >
            Find Business Requirements
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── PAGE EXPORT ───────────────────────────────────────────────────────────────
export default function ServicesClient() {
  return (
    <main className="font-sans antialiased text-slate-900">
      <HeroSection />
      <HowWeHelpSection />
      <ServicesGrid />
      <CategoriesSection />
      <ValueSection />
      <BundleSection />
      <FAQAccordion />
      <CTASection />
    </main>
  );
}