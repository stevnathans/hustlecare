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

interface StackItem {
  label: string;
  status: "complete" | "next" | "upcoming";
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

// ── Website Mockup Illustration ───────────────────────────────────────────────
function WebsiteMockup() {
  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl" />
      <div className="relative p-6 rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-100/50">

        {/* Browser chrome */}
        <div className="bg-slate-800 rounded-xl overflow-hidden shadow-lg">
          {/* Browser bar */}
          <div className="bg-slate-700 px-4 py-2.5 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 bg-slate-600 rounded-md h-5 flex items-center px-2 gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
              <div className="h-1.5 w-28 bg-slate-500 rounded" />
            </div>
          </div>

          {/* Website content mock */}
          <div className="bg-white">
            {/* Nav */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
              <div className="w-16 h-3 bg-emerald-500 rounded" />
              <div className="flex gap-2">
                {[40, 32, 36].map((w, i) => (
                  <div key={i} className="h-2 bg-slate-200 rounded" style={{ width: w }} />
                ))}
              </div>
              <div className="w-14 h-5 bg-emerald-600 rounded-md" />
            </div>

            {/* Hero area */}
            <div className="px-4 py-5 bg-gradient-to-r from-slate-900 to-slate-700">
              <div className="h-3 w-3/4 bg-white/30 rounded mb-2" />
              <div className="h-2.5 w-1/2 bg-white/20 rounded mb-4" />
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-emerald-500 rounded-lg" />
                <div className="h-6 w-16 bg-white/20 rounded-lg" />
              </div>
            </div>

            {/* Feature cards row */}
            <div className="px-4 py-3 grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-2">
                  <div className="w-4 h-4 bg-emerald-100 rounded mb-1.5" />
                  <div className="h-1.5 w-full bg-slate-200 rounded mb-1" />
                  <div className="h-1.5 w-3/4 bg-slate-100 rounded" />
                </div>
              ))}
            </div>

            {/* Content section */}
            <div className="px-4 pb-3 space-y-1.5">
              {[90, 75, 85, 60].map((w, i) => (
                <div key={i} className="h-1.5 bg-slate-100 rounded" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Stats below mockup */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: "Load Time", val: "< 2s", icon: "⚡" },
            { label: "Mobile Score", val: "98/100", icon: "📱" },
            { label: "SEO Ready", val: "Yes", icon: "🔍" },
          ].map(({ label, val, icon }) => (
            <div key={label} className="bg-white border border-slate-100 rounded-xl p-3 text-center shadow-sm">
              <div className="text-base mb-0.5">{icon}</div>
              <div className="text-sm font-bold text-slate-800">{val}</div>
              <div className="text-[10px] text-slate-400 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const heroKeyPoints: string[] = [
  "Professional website design",
  "Mobile-friendly and responsive",
  "Fast loading and modern layout",
  "Built for startups and small businesses",
];

const trustBadges: string[] = ["Startup Focused", "Mobile Friendly", "Professional Design"];

const problemBenefits: string[] = [
  "Showcase your products or services",
  "Build credibility with customers",
  "Attract customers through search engines",
  "Provide contact information",
  "Grow your brand online",
];

const features: Feature[] = [
  { emoji: "🖥️", title: "Professional Website Design", desc: "Clean modern layout designed specifically for your business." },
  { emoji: "📱", title: "Mobile Friendly", desc: "Your website works perfectly on phones, tablets, and desktops." },
  { emoji: "🔍", title: "SEO-Friendly Structure", desc: "Built with search engine visibility in mind from day one." },
  { emoji: "⚡", title: "Fast Loading Pages", desc: "Optimized pages that load quickly for a better user experience." },
  { emoji: "📬", title: "Contact Forms", desc: "Customers can easily reach you directly through your website." },
  { emoji: "📣", title: "Social Media Integration", desc: "Connect your website with your social media profiles seamlessly." },
  { emoji: "🔒", title: "Basic Security Setup", desc: "Secure configuration to protect your website and visitors." },
];

const audienceItems: AudienceItem[] = [
  { icon: "🚀", text: "Launching a new business" },
  { icon: "🌐", text: "Need a professional online presence" },
  { icon: "🔍", text: "Want customers to find you online" },
  { icon: "🧘", text: "Want a website without technical headaches" },
  { icon: "🏆", text: "Want a modern website that builds trust" },
];

const steps: Step[] = [
  { n: "01", title: "Tell Us About Your Business", desc: "Complete a short questionnaire describing your business and goals." },
  { n: "02", title: "Website Planning", desc: "We design the structure and layout of your website." },
  { n: "03", title: "Design and Development", desc: "Our team builds your website and adds your content." },
  { n: "04", title: "Launch Your Website", desc: "Your website goes live and is ready for customers." },
];

const plans: Plan[] = [
  {
    name: "Starter Website",
    tag: "Best for small businesses",
    price: "$180",
    items: [
      "3 pages",
      "Mobile responsive design",
      "Contact form",
      "Social media links",
    ],
    delivery: "5–7 days",
    cta: "Start Starter Website",
    popular: false,
  },
  {
    name: "Business Website",
    tag: "Most popular",
    price: "$350",
    items: [
      "Up to 6 pages",
      "Modern professional design",
      "Mobile responsive layout",
      "Contact forms",
      "Basic SEO structure",
    ],
    delivery: "7–10 days",
    cta: "Start Business Website",
    popular: true,
  },
  {
    name: "Premium Website",
    tag: "Best for growing startups",
    price: "$600",
    items: [
      "Up to 10 pages",
      "Premium custom design",
      "Blog or content section",
      "Advanced contact forms",
      "SEO optimization",
    ],
    delivery: "10–14 days",
    cta: "Start Premium Website",
    popular: false,
  },
];

const platformLinks: string[] = [
  "Logo design",
  "Business registration",
  "Business planning",
  "Marketing setup",
];

const stackItems: StackItem[] = [
  { label: "Business Plan", status: "complete", emoji: "📋" },
  { label: "Logo Design", status: "complete", emoji: "🎨" },
  { label: "Website Creation", status: "next", emoji: "🌐" },
  { label: "Marketing Setup", status: "upcoming", emoji: "📣" },
];

const faqs: FAQItem[] = [
  { q: "How long does it take to build a website?", a: "Most websites are delivered within 7–10 days depending on the package." },
  { q: "Do I need to provide content for the website?", a: "You can provide your own content, or we can help structure it for you." },
  { q: "Will my website work on mobile devices?", a: "Yes. All websites are fully responsive and optimized for mobile devices." },
  { q: "Can I update the website later?", a: "Yes. You can update content or request future improvements anytime." },
  { q: "Do I need technical knowledge?", a: "No. We handle the design and setup so you can focus on your business." },
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
              Website Creation Service
            </span>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6">
              Launch a Professional Website{" "}
              <span className="text-emerald-600">for Your Business</span>
            </h1>

            <p className="text-lg text-slate-500 leading-relaxed mb-8">
              Your website is your digital storefront. Hustlecare creates modern, fast, and
              mobile-friendly websites that help new businesses attract customers and build credibility
              online.
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
                Build My Website
                <ArrowIcon />
              </a>
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 bg-white border-2 border-slate-200 hover:border-emerald-400 text-slate-700 font-semibold px-7 py-3.5 rounded-xl transition-colors"
              >
                See Website Packages
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
            <WebsiteMockup />
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
              The Reality
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-6">
              Your Business Needs an Online Presence
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              Today, customers search online before choosing a business. Without a professional website,
              your business can look incomplete or untrustworthy.
            </p>
            <p className="text-slate-400 leading-relaxed">
              Hustlecare makes it easy for entrepreneurs to launch professional websites without
              technical complexity.
            </p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
            <p className="text-slate-300 font-semibold mb-5">A website helps you:</p>
            <ul className="space-y-3 mb-8">
              {problemBenefits.map((item) => (
                <li key={item} className="flex items-center gap-3 text-slate-300">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckIcon />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            {/* Online presence stats */}
            <div className="pt-6 border-t border-slate-700 space-y-2.5">
              {[
                { label: "Customers search online first", pct: 97 },
                { label: "Trust businesses with websites", pct: 84 },
                { label: "Mobile traffic share", pct: 63 },
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
            What&apos;s Included in Your Website
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
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
            Perfect for New Businesses
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
            Choose Your Website Package
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
                Part of Your Startup Setup
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                A website is one of the key requirements when launching a business. Hustlecare helps
                entrepreneurs combine website creation with other startup needs so you can manage
                everything in one place.
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
                        : status === "next"
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
                          : status === "next"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-slate-600 text-slate-400"
                      }`}
                    >
                      {status === "complete" ? "Complete" : status === "next" ? "In Progress" : "Upcoming"}
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
          Give Your Business a Professional Online Presence
        </h2>
        <p className="text-emerald-100 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
          A modern website helps customers trust your brand and find your business online. Let
          Hustlecare help you launch a professional website quickly and affordably.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-8 py-4 rounded-xl shadow-lg transition-all active:scale-95"
          >
            Build My Website
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
export default function WebsiteCreationClient() {
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