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

interface Platform {
  name: string;
  handle: string;
  color: string;
  bg: string;
  followers: string;
  icon: string;
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

// ── Social Media Illustration ─────────────────────────────────────────────────
const mockPlatforms: Platform[] = [
  { name: "Instagram", handle: "@yourbusiness", color: "text-pink-600", bg: "bg-pink-50 border-pink-100", followers: "0 → Ready", icon: "📸" },
  { name: "Facebook", handle: "Your Business Page", color: "text-blue-600", bg: "bg-blue-50 border-blue-100", followers: "0 → Ready", icon: "👥" },
  { name: "X / Twitter", handle: "@yourbusiness", color: "text-slate-700", bg: "bg-slate-50 border-slate-200", followers: "0 → Ready", icon: "🐦" },
  { name: "LinkedIn", handle: "Your Business", color: "text-sky-700", bg: "bg-sky-50 border-sky-100", followers: "0 → Ready", icon: "💼" },
];

function SocialMediaIllustration() {
  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl" />
      <div className="relative p-7 rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-100/50">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Social Profiles</p>
            <p className="text-sm font-bold text-slate-700 mt-0.5">Your Business Online</p>
          </div>
          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
            4 Platforms
          </span>
        </div>

        {/* Platform cards */}
        <div className="space-y-2.5 mb-5">
          {mockPlatforms.map(({ name, handle, color, bg, followers, icon }) => (
            <div
              key={name}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${bg}`}
            >
              <span className="text-xl flex-shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold ${color}`}>{name}</p>
                <p className="text-[10px] text-slate-400 truncate">{handle}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {followers}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Profile completeness */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-3 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Profile Completeness
            </p>
            <span className="text-xs font-extrabold text-emerald-600">100%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full w-full" />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {["Bio ✓", "Logo ✓", "Links ✓"].map((item) => (
              <span
                key={item}
                className="text-[10px] text-center font-semibold text-emerald-700 bg-emerald-50 rounded-lg py-1"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Launch status */}
        <div className="bg-emerald-600 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sm">🚀</span>
          </div>
          <div>
            <p className="text-white text-xs font-bold">Ready to Go Live</p>
            <p className="text-emerald-200 text-[10px]">All profiles set up and optimised</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const heroKeyPoints: string[] = [
  "Profiles set up on the right platforms for your business",
  "Branded consistently with your logo and colours",
  "Optimised bios, links, and contact details",
  "Ready to post and grow from day one",
];

const trustBadges: string[] = ["Multi-Platform", "Brand Consistent", "Launch Ready"];

const problemRisks: string[] = [
  "Missing customers who discover businesses through social media",
  "Looking unprofessional with incomplete or mismatched profiles",
  "Wasting time on the wrong platforms for your industry",
  "Losing credibility when prospects can't find you online",
];

const features: Feature[] = [
  { emoji: "📱", title: "Platform Selection", desc: "We identify which social platforms are best suited to your business type and target audience." },
  { emoji: "🎨", title: "Branded Profile Setup", desc: "Profiles created with your logo, brand colours, and consistent visual identity across all platforms." },
  { emoji: "✍️", title: "Optimised Bio Writing", desc: "Compelling, keyword-rich bios that clearly communicate what your business does and who it serves." },
  { emoji: "🔗", title: "Links & Contact Setup", desc: "Website links, contact buttons, and booking or shop integrations configured correctly." },
  { emoji: "📸", title: "Cover & Profile Images", desc: "Properly sized and formatted images across every platform for a polished first impression." },
  { emoji: "📍", title: "Location & Category Setup", desc: "Business category, location, and hours configured so customers can find and contact you easily." },
  { emoji: "📋", title: "Content Strategy Starter", desc: "A simple content guide with post ideas and a posting schedule to help you get started." },
  { emoji: "🔍", title: "SEO-Friendly Usernames", desc: "Consistent, searchable usernames chosen to help customers find your business across platforms." },
];

const audienceItems: AudienceItem[] = [
  { icon: "🚀", text: "Launching a new business and need a social presence" },
  { icon: "🎯", text: "Want to reach customers where they spend their time online" },
  { icon: "🧹", text: "Have existing profiles that look incomplete or unprofessional" },
  { icon: "⏱️", text: "Don't have time to set up and optimise profiles yourself" },
  { icon: "🏆", text: "Want a consistent brand across every platform from day one" },
];

const steps: Step[] = [
  { n: "01", title: "Tell Us About Your Business", desc: "Share your business name, logo, industry, and target audience through a short questionnaire." },
  { n: "02", title: "Platform Strategy", desc: "We determine the best platforms for your specific business type and customer base." },
  { n: "03", title: "Profile Creation & Optimisation", desc: "We create and fully optimise all profiles with your branding, bios, links, and images." },
  { n: "04", title: "Handover & Content Guide", desc: "Your profiles go live and you receive a starter content guide so you can hit the ground running." },
];

const plans: Plan[] = [
  {
    name: "Starter Setup",
    tag: "Best for new businesses",
    price: "$70",
    items: [
      "2 social media platforms",
      "Branded profile setup",
      "Optimised bio writing",
      "Profile and cover images",
      "Links and contact setup",
    ],
    delivery: "2–3 days",
    cta: "Start Starter Setup",
    popular: false,
  },
  {
    name: "Full Social Launch",
    tag: "Most popular",
    price: "$140",
    items: [
      "4 social media platforms",
      "Branded profile setup",
      "Optimised bio writing",
      "Profile and cover images",
      "Links, contact & category setup",
      "SEO-friendly username selection",
      "Starter content strategy guide",
    ],
    delivery: "3–5 days",
    cta: "Start Full Launch",
    popular: true,
  },
  {
    name: "Complete Brand Presence",
    tag: "Best for serious startups",
    price: "$220",
    items: [
      "Up to 6 social media platforms",
      "Full branded profile setup",
      "Optimised bios and descriptions",
      "Custom-sized images for each platform",
      "Links, integrations & booking setup",
      "30-day content calendar",
      "Hashtag strategy guide",
      "Platform-specific growth tips",
    ],
    delivery: "5–7 days",
    cta: "Start Complete Presence",
    popular: false,
  },
];

const stackItems: StackItem[] = [
  { label: "Logo Design", status: "complete", emoji: "🎨" },
  { label: "Website Creation", status: "complete", emoji: "🌐" },
  { label: "Social Media Setup", status: "current", emoji: "📱" },
  { label: "Marketing Setup", status: "upcoming", emoji: "📣" },
];

const platformLinks: string[] = [
  "Logo design and brand identity",
  "Website creation",
  "Business name and domain",
  "Google Business Profile setup",
];

const relatedServices: RelatedService[] = [
  {
    emoji: "🎨",
    title: "Logo Design",
    desc: "Create a logo before setting up your social profiles for a consistent brand.",
    href: "/services/logo-design",
  },
  {
    emoji: "🌐",
    title: "Website Creation",
    desc: "Launch a website to link from all your social media profiles.",
    href: "/services/website-creation",
  },
  {
    emoji: "📍",
    title: "Google Business Profile",
    desc: "Get found on Google Maps and Search alongside your social presence.",
    href: "/services/google-business-profile",
  },
  {
    emoji: "💡",
    title: "Business Name & Domain",
    desc: "Secure the right name and matching domain before you claim your usernames.",
    href: "/services/business-name-domain",
  },
];

const faqs: FAQItem[] = [
  {
    q: "Which social media platforms will you set up for my business?",
    a: "We recommend platforms based on your industry and target audience. Common platforms include Instagram, Facebook, LinkedIn, X (Twitter), and TikTok — but we tailor the selection to what makes sense for your specific business.",
  },
  {
    q: "Do I need a logo before setting up social media profiles?",
    a: "Having a logo is strongly recommended so your profiles look professional and consistent. If you don't have one yet, we can pair this service with our Logo Design service.",
  },
  {
    q: "Will I have full access to the profiles after setup?",
    a: "Yes. You receive full admin access to every profile we create. The accounts belong entirely to your business.",
  },
  {
    q: "Can you set up profiles for a business that already has some accounts?",
    a: "Yes. We can optimise and rebrand existing profiles as well as create new ones on platforms where you don't yet have a presence.",
  },
  {
    q: "What is included in the content strategy guide?",
    a: "The content guide includes post ideas tailored to your business, a suggested posting schedule, platform-specific tips, and a list of relevant hashtags to help you grow your audience from day one.",
  },
  {
    q: "Do you manage social media on an ongoing basis?",
    a: "This service covers setup and launch. Ongoing content creation and community management are separate services. However, the starter content guide gives you everything you need to manage it yourself confidently.",
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
              Social Media Setup Service
            </span>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6">
              Launch Your Business on{" "}
              <span className="text-emerald-600">Social Media the Right Way</span>
            </h1>

            <p className="text-lg text-slate-500 leading-relaxed mb-8">
              Your customers are on social media every day. Hustlecare sets up professional, branded
              social media profiles on the right platforms so your business makes a strong first
              impression from the moment it launches.
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
                Set Up My Social Media
                <ArrowIcon />
              </a>
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 bg-white border-2 border-slate-200 hover:border-emerald-400 text-slate-700 font-semibold px-7 py-3.5 rounded-xl transition-colors"
              >
                See Packages
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
            <SocialMediaIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 2. PROBLEM ────────────────────────────────────────────────────────────────
function ProblemSection() {
  const platformStats = [
    { label: "People use social media to discover businesses", pct: 74 },
    { label: "Consumers expect businesses to have social profiles", pct: 88 },
    { label: "Purchase decisions influenced by social presence", pct: 67 },
  ];

  return (
    <section className="bg-slate-900 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block text-emerald-400 text-xs font-bold tracking-widest uppercase mb-4">
              The Problem
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-6">
              Your Customers Are Already on Social Media
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              For most businesses, social media is where customers discover, evaluate, and decide
              whether to trust you. Launching without a professional presence means leaving that first
              impression to chance.
            </p>
            <p className="text-slate-400 leading-relaxed">
              Setting up profiles correctly from the start — with the right branding, bios, and
              platform selection — gives your business a credible presence that attracts customers
              immediately.
            </p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
            <p className="text-slate-300 font-semibold mb-5">
              Skipping social media setup means:
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
            <div className="pt-6 border-t border-slate-700 space-y-2.5">
              {platformStats.map(({ label, pct }) => (
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
            What&apos;s Included in Your Social Media Setup
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

// ── 4. PLATFORMS SECTION ──────────────────────────────────────────────────────
function PlatformsSection() {
  const platforms = [
    { name: "Instagram", desc: "Visual brands, retail, food, lifestyle, and B2C businesses.", emoji: "📸", color: "border-pink-200 bg-pink-50", badge: "bg-pink-100 text-pink-700" },
    { name: "Facebook", desc: "Local businesses, service providers, and community-focused brands.", emoji: "👥", color: "border-blue-200 bg-blue-50", badge: "bg-blue-100 text-blue-700" },
    { name: "LinkedIn", desc: "B2B companies, consultants, and professional service businesses.", emoji: "💼", color: "border-sky-200 bg-sky-50", badge: "bg-sky-100 text-sky-700" },
    { name: "X / Twitter", desc: "Tech startups, news-adjacent brands, and thought leadership.", emoji: "🐦", color: "border-slate-200 bg-slate-50", badge: "bg-slate-100 text-slate-700" },
    { name: "TikTok", desc: "Youth-focused brands, entertainment, food, and viral-ready products.", emoji: "🎵", color: "border-rose-200 bg-rose-50", badge: "bg-rose-100 text-rose-700" },
    { name: "Google Business", desc: "Any local business that wants to show up on Google Maps and Search.", emoji: "📍", color: "border-amber-200 bg-amber-50", badge: "bg-amber-100 text-amber-700" },
  ];

  return (
    <section className="bg-slate-50 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-emerald-600 text-xs font-bold tracking-widest uppercase mb-3">
            Platforms
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            We Set You Up on the Right Platforms
          </h2>
          <p className="text-slate-500 mt-3 max-w-xl mx-auto">
            Not every business needs every platform. We match your business type to the platforms where
            your customers actually are.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {platforms.map(({ name, desc, emoji, color, badge }) => (
            <div
              key={name}
              className={`rounded-2xl border p-6 ${color} transition-all duration-200 hover:shadow-md`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{emoji}</span>
                <h3 className="font-bold text-slate-800">{name}</h3>
                <span className={`ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full ${badge}`}>
                  Supported
                </span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 5. AUDIENCE ───────────────────────────────────────────────────────────────
function AudienceSection() {
  return (
    <section className="bg-emerald-50 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-emerald-600 text-xs font-bold tracking-widest uppercase mb-3">
            Who It&apos;s For
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Perfect for Businesses Ready to Go Social
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

// ── 6. PROCESS ────────────────────────────────────────────────────────────────
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

// ── 7. PRICING ────────────────────────────────────────────────────────────────
function PricingCards() {
  return (
    <section id="pricing" className="bg-slate-50 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-emerald-600 text-xs font-bold tracking-widest uppercase mb-3">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Choose Your Social Media Package
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

// ── 8. PLATFORM INTEGRATION ───────────────────────────────────────────────────
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
                Part of Your Complete Digital Presence
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                Social media setup works best when it&apos;s connected to your wider brand. Hustlecare
                ensures your social profiles are consistent with your logo, website, and business
                identity — everything managed in one place.
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
            Complete Your Brand
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Services That Work Best Together
          </h2>
          <p className="text-slate-500 mt-3 max-w-xl mx-auto">
            A strong social presence starts with great branding. These services pair naturally with
            your social media setup.
          </p>
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

// ── FINAL CTA ─────────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="bg-emerald-600 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5">
          Get Your Business in Front of Customers Today
        </h2>
        <p className="text-emerald-100 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
          A professional social media presence helps customers discover, trust, and choose your
          business. Let Hustlecare set it up correctly from the start so you can focus on running your
          business.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-8 py-4 rounded-xl shadow-lg transition-all active:scale-95"
          >
            Set Up My Social Media
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
export default function SocialMediaSetupClient() {
  return (
    <main className="font-sans antialiased text-slate-900">
      <HeroSection />
      <ProblemSection />
      <FeaturesGrid />
      <PlatformsSection />
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