/* eslint-disable react/no-unescaped-entities */
// app/services/google-business-profile/GoogleBusinessProfileClient.tsx
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

// ── Google Business Profile Illustration ───────────────────────────────────────
function GoogleProfileIllustration() {
  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl" />
      <div className="relative p-7 rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-100/50">

        {/* Map card */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden mb-4">
          <div className="h-24 bg-gradient-to-br from-emerald-100 to-teal-100 relative flex items-center justify-center">
            <div className="w-9 h-9 rounded-full bg-red-500 border-4 border-white shadow-lg flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-white" />
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-bold text-slate-800">Wanjiru Fresh Foods</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className="text-amber-400 text-xs">★</span>
                  ))}
                  <span className="text-[10px] text-slate-400 ml-1">(24)</span>
                </div>
              </div>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Open</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-1">Grocery Store · Nairobi, Kenya</p>
            <p className="text-[11px] text-slate-400">Open · Closes 6:00 PM</p>
          </div>
        </div>

        {/* Setup checklist */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm mb-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Profile Setup</p>
          <div className="space-y-2">
            {[
              { label: "Business details", done: true },
              { label: "Photos uploaded", done: true },
              { label: "Hours & category", done: true },
              { label: "Posts scheduled", done: false },
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

        {/* Local visibility stat */}
        <div className="bg-emerald-600 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sm">📍</span>
          </div>
          <div>
            <p className="text-white text-xs font-bold">Ready to Show Up Locally</p>
            <p className="text-emerald-200 text-[10px]">Visible on Google Search & Maps</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const heroKeyPoints: string[] = [
  "Complete, accurate profile setup on Google",
  "Category, hours, and location configured correctly",
  "Photos and business description optimised",
  "Ready to be found on Search and Maps",
];

const trustBadges: string[] = ["Local Search Ready", "Google Optimised", "Startup Focused"];

const problemRisks: string[] = [
  "Being invisible when customers search nearby",
  "Losing trust from an empty or incomplete profile",
  "Missing calls and directions from an outdated listing",
  "Competitors outranking you with a better-optimised profile",
];

const features: Feature[] = [
  { emoji: "📍", title: "Business Details Setup", desc: "Accurate name, address, category, and contact details configured correctly from the start." },
  { emoji: "🕒", title: "Hours & Availability", desc: "Opening hours set up so customers always know when you're open." },
  { emoji: "📸", title: "Photo Upload", desc: "Storefront, product, and team photos added to make your listing feel trustworthy." },
  { emoji: "📝", title: "Optimised Description", desc: "A clear, keyword-aware business description that helps you show up in local searches." },
  { emoji: "🗨️", title: "Q&A Seeding", desc: "Common customer questions answered upfront so you're not caught off guard." },
  { emoji: "⭐", title: "Review Response Templates", desc: "Ready-to-use templates for responding to reviews professionally." },
  { emoji: "📣", title: "Starter Posts", desc: "A few initial Google Posts published to show your profile is active." },
  { emoji: "🔍", title: "Local SEO Basics", desc: "Category and description choices made with local search ranking in mind." },
];

const audienceItems: AudienceItem[] = [
  { icon: "🏪", text: "Have a physical location or serve a local area" },
  { icon: "🔍", text: "Want to show up when customers search nearby" },
  { icon: "🧹", text: "Have an existing profile that's incomplete or outdated" },
  { icon: "🗺️", text: "Want to appear on Google Maps correctly" },
  { icon: "⭐", text: "Want a professional first impression for new customers" },
];

const steps: Step[] = [
  { n: "01", title: "Tell Us About Your Business", desc: "Share your business details, category, hours, and location." },
  { n: "02", title: "Profile Setup", desc: "We configure your Google Business Profile with accurate, complete information." },
  { n: "03", title: "Content & Optimisation", desc: "Photos, description, and starter posts are added and optimised for local search." },
  { n: "04", title: "Go Live", desc: "Your profile is ready to be found on Google Search and Maps." },
];

// `id` matches the packageTier id in
// lib/questionnaires/google-business-profile/config.ts.
const plans: Plan[] = [
  {
    id: "basic",
    name: "Basic Listing",
    tag: "Best for simple setup",
    price: "KSh 3,500",
    items: [
      "Google Business Profile setup & verification guidance",
      "Business information & opening hours optimization",
      "Contact details, categories & website linking",
      "WhatsApp link integration",
    ],
    delivery: "2–3 days",
    cta: "Start Basic Listing",
    popular: false,
  },
  {
    id: "optimized",
    name: "Optimized Listing",
    tag: "Most popular",
    price: "KSh 7,500",
    items: [
      "Everything in Basic Listing",
      "SEO-optimized business description & Google Maps optimization",
      "Products/services listing & FAQ setup",
      "10 business photos optimization",
      "Initial keyword optimization & basic competitor analysis",
      "Review request template",
    ],
    delivery: "3–4 days",
    cta: "Start Optimized Listing",
    popular: true,
  },
  {
    id: "local-seo",
    name: "Local SEO Boost",
    tag: "Best for local visibility",
    price: "KSh 15,000",
    items: [
      "Everything in Optimized Listing",
      "30-day profile optimization & weekly profile updates",
      "4 Google Posts",
      "Review response templates",
      "Local SEO recommendations & performance report",
      "One consultation session",
    ],
    delivery: "4–6 days",
    cta: "Start Local SEO Boost",
    popular: false,
  },
];

const stackItems: StackItem[] = [
  { label: "Website Creation", status: "complete", emoji: "🌐" },
  { label: "Google Business Profile", status: "current", emoji: "📍" },
  { label: "Social Media Setup", status: "upcoming", emoji: "📱" },
  { label: "Marketing Setup", status: "upcoming", emoji: "📣" },
];

const platformLinks: string[] = [
  "Website creation",
  "Social media setup",
  "Logo design and branding",
  "Business registration",
];

const relatedServices: RelatedService[] = [
  {
    emoji: "🌐",
    title: "Website Creation",
    desc: "Link your website directly from your Google profile.",
    href: "/services/website-creation",
  },
  {
    emoji: "📱",
    title: "Social Media Setup",
    desc: "Round out your local presence across social platforms too.",
    href: "/services/social-media-setup",
  },
  {
    emoji: "🎨",
    title: "Logo Design",
    desc: "A strong logo makes your profile photos look more professional.",
    href: "/services/logo-design",
  },
  {
    emoji: "⚖️",
    title: "Business Registration",
    desc: "Make sure your business is officially registered under the same name.",
    href: "/services/business-registration",
  },
];

const faqs: FAQItem[] = [
  { q: "Do I need a physical location to have a Google Business Profile?", a: "Not necessarily — service-area businesses without a public storefront can still set one up. We'll configure it correctly for your business type." },
  { q: "Can you fix an existing profile instead of creating a new one?", a: "Yes. We can take over and optimise an existing profile as well as set one up from scratch." },
  { q: "Will I have access to manage the profile myself afterward?", a: "Yes. You keep full ownership and access — we simply set it up and hand it over ready to go." },
  { q: "How long does it take to show up on Google Search?", a: "Once verified, most profiles start appearing in local search results within a few days, though full ranking improvement takes time." },
  { q: "What does the competitor comparison in the Local SEO Boost package include?", a: "A short summary of how nearby competitors' profiles are set up, so you know where you have room to stand out." },
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
              Get Found by Customers{" "}
              <span className="text-emerald-600">Searching Near You</span>
            </h1>

            <p className="text-lg text-slate-500 leading-relaxed mb-8">
              Hustlecare sets up and optimises your Google Business Profile so your business shows up
              correctly — and looks professional — on Search and Maps from day one.
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
                Set Up My Google Listing
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
            <GoogleProfileIllustration />
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
              If You're Not on Google, You're Invisible Locally
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              Most customers check Google before visiting or calling a business. A missing or
              incomplete profile means they find your competitor instead.
            </p>
            <p className="text-slate-400 leading-relaxed">
              A properly set up Google Business Profile is one of the highest-leverage things a local
              business can do — and it's often overlooked.
            </p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
            <p className="text-slate-300 font-semibold mb-5">Without a proper listing, you risk:</p>
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
                <span className="text-2xl">📍</span>
                <p className="text-emerald-300 text-sm font-medium leading-snug">
                  A complete, accurate profile is often the first thing a potential customer ever sees of your business.
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
            What&apos;s Included in Your Setup
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
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Perfect for Locally Discoverable Businesses
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
    router.push(`/services/google-business-profile/questionnaire?package=${planId}`);
  }

  return (
    <section id="pricing" className="bg-slate-50 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Choose Your Setup Package
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
                Part of Your Local Presence
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                A Google Business Profile works best alongside your website and social presence.
                Hustlecare connects all three so customers find a consistent, trustworthy brand.
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
            Round Out Your Digital Presence
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
          Show Up When Customers Are Searching
        </h2>
        <p className="text-emerald-100 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
          A well-set-up Google Business Profile is one of the easiest ways to win local customers. Let
          Hustlecare get it right from the start.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-8 py-4 rounded-xl shadow-lg transition-all active:scale-95"
          >
            Set Up My Google Listing
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
export default function GoogleBusinessProfileClient() {
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