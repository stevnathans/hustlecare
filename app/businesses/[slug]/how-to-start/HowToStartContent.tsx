// app/businesses/[slug]/how-to-start/HowToStartContent.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  List,
  X,
} from "lucide-react";
import {
  RenderRichText,
  type RenderReference,
} from "components/renderRichText";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Step {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  displayOrder: number;
}
interface Section {
  id: number;
  type: "TIPS" | "WARNING" | "NOTE" | "INFO" | "CONCLUSION";
  title: string;
  content: string;
  imageUrl: string | null;
  displayOrder: number;
}
interface Faq {
  id: number;
  question: string;
  answer: string;
  displayOrder: number;
}
interface Reference {
  id: number;
  refNumber: number;
  title: string;
  url: string;
}
interface Guide {
  intro: string | null;
  steps: Step[];
  sections: Section[];
  faqs: Faq[];
  references: Reference[];
}
interface Props {
  slug: string;
  name: string;
  category: string | undefined;
  image: string | null | undefined;
  guide: Guide;
}

// ── Section type config ───────────────────────────────────────────────────────

const SECTION_META = {
  TIPS: {
    label: "Tip",
    icon: "💡",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconCls: "text-emerald-600",
    title: "text-emerald-800",
  },
  WARNING: {
    label: "Warning",
    icon: "⚠️",
    bg: "bg-red-50",
    border: "border-red-200",
    iconCls: "text-red-600",
    title: "text-red-800",
  },
  NOTE: {
    label: "Note",
    icon: "📄",
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconCls: "text-blue-600",
    title: "text-blue-800",
  },
  INFO: {
    label: "Info",
    icon: "ℹ️",
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconCls: "text-amber-600",
    title: "text-amber-800",
  },
  CONCLUSION: {
    label: "Conclusion",
    icon: "📖",
    bg: "bg-violet-50",
    border: "border-violet-200",
    iconCls: "text-violet-600",
    title: "text-violet-800",
  },
} as const;

// ── Reference popover ─────────────────────────────────────────────────────────

function RefPopover({
  ref: activeRef,
  onClose,
}: {
  ref: Reference;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 font-bold text-emerald-700 text-base border border-emerald-200">
            {activeRef.refNumber}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-base mb-1">
              {activeRef.title}
            </p>
            <a
              href={activeRef.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base text-emerald-600 hover:text-emerald-700 flex items-center gap-1 break-all"
            >
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
              {activeRef.url}
            </a>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-base font-medium text-gray-600 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ── FAQ Accordion ─────────────────────────────────────────────────────────────

function FaqItem({ faq }: { faq: Faq }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-800 text-base leading-snug">
          {faq.question}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <p className="text-base text-gray-600 leading-relaxed">{faq.answer}</p>
        </div>
      )}
    </div>
  );
}

// ── Mobile sticky Table of Contents ───────────────────────────────────────────

function MobileToc({
  slug,
  guide,
}: {
  slug: string;
  guide: Guide;
}) {
  const [open, setOpen] = useState(false);

  if (guide.steps.length === 0) return null;

  const handleJump = (href: string) => {
    setOpen(false);
    if (href === "#") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // Let the anchor handle the scroll after the sheet closes.
    requestAnimationFrame(() => {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    });
  };

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40">
      {/* Backdrop when expanded */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 -z-10"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] rounded-t-2xl overflow-hidden">
        {/* Expanded content */}
        {open && (
          <div className="max-h-[60vh] overflow-y-auto px-5 pt-5 pb-2">
            <h3 className="text-base font-bold text-gray-500 uppercase tracking-widest mb-3">
              Contents
            </h3>
            <ol className="space-y-1 mb-4">
              {guide.intro && (
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleJump("#");
                    }}
                    className="text-base text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2.5 py-1.5"
                  >
                    <span className="w-5 h-5 rounded bg-gray-100 text-gray-400 flex items-center justify-center text-base font-bold flex-shrink-0">
                      ·
                    </span>
                    Overview
                  </a>
                </li>
              )}
              {guide.steps.map((step, i) => (
                <li key={step.id}>
                  <a
                    href={`#step-${i + 1}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleJump(`#step-${i + 1}`);
                    }}
                    className="text-base text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2.5 py-1.5"
                  >
                    <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center text-base font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="leading-snug line-clamp-2">
                      {step.title}
                    </span>
                  </a>
                </li>
              ))}
              {guide.faqs.length > 0 && (
                <li>
                  <a
                    href="#faq-heading"
                    onClick={(e) => {
                      e.preventDefault();
                      handleJump("#faq-heading");
                    }}
                    className="text-base text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2.5 py-1.5"
                  >
                    <span className="w-5 h-5 rounded bg-amber-100 text-amber-600 flex items-center justify-center text-base font-bold flex-shrink-0">
                      ?
                    </span>
                    FAQs
                  </a>
                </li>
              )}
            </ol>

            <Link
              href={`/businesses/${slug}/requirements`}
              className="flex items-center justify-center gap-2 w-full py-3 mb-4 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold rounded-xl transition-colors"
            >
              See Full Requirements
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Toggle bar — always visible */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="w-full flex items-center justify-between gap-3 px-5 py-3.5 bg-white"
        >
          <span className="flex items-center gap-2.5 font-bold text-gray-800 text-base">
            {open ? (
              <X className="w-4 h-4 text-gray-500" />
            ) : (
              <List className="w-4 h-4 text-emerald-600" />
            )}
            {open ? "Close" : "Table of Contents"}
          </span>
          {!open && (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function HowToStartContent({ slug, name, image, guide }: Props) {
  const [activeRef, setActiveRef] = useState<Reference | null>(null);
  const refs = guide.references as RenderReference[];

  return (
    <>
      {activeRef && (
        <RefPopover ref={activeRef} onClose={() => setActiveRef(null)} />
      )}

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="relative min-h-[340px] md:min-h-[400px] flex flex-col justify-end overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt={`How to start a ${name} business`}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 to-teal-500" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

          <div className="relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-10 pt-20">
            {/* Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-1.5 text-base text-white/70 mb-5"
            >
              <Link
                href="/businesses"
                className="inline-flex items-center gap-1 hover:text-white transition-colors group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                Businesses
              </Link>

              <ChevronRight className="w-3.5 h-3.5 text-white/40" />

              <Link
                href={`/businesses/${slug}`}
                className="hover:text-white transition-colors text-white/70"
              >
                {name}
              </Link>

              <ChevronRight className="w-3.5 h-3.5 text-white/40" />

              <span className="text-white/90 font-medium">How to Start</span>
            </nav>

            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight mb-4 max-w-3xl">
              How to Start a {name} Business in Kenya
            </h1>

            <div className="flex flex-wrap gap-3">
              {guide.steps.length > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl text-base text-white">
                  <span className="font-semibold">{guide.steps.length}</span>
                  <span className="text-white/70">steps</span>
                </div>
              )}

              {guide.faqs.length > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl text-base text-white">
                  <span className="font-semibold">{guide.faqs.length}</span>
                  <span className="text-white/70">FAQs</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="max-w-5xl mx-auto px-0 sm:px-6 lg:px-8 sm:px-6 lg:px-8 py-10 pb-28 lg:pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
            {/* Main content */}
            <main className="space-y-8 text-base min-w-0">
              {/* Intro */}
              {guide.intro && (
                <div className="bg-white text-base rounded-lg border border-gray-50 p-5 sm:p-10">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Overview
                  </h2>
                  <RenderRichText
                    text={guide.intro}
                    references={refs}
                    onRefClick={(r) => setActiveRef(r as Reference)}
                    className="text-gray-900"
                  />
                </div>
              )}

              {/* Steps */}
              {guide.steps.length > 0 && (
                <section aria-labelledby="steps-heading">
                  <h2
                    id="steps-heading"
                    className="text-2xl font-bold text-gray-900 mb-6 px-4 sm:px-0"
                  >
                    Step-by-Step Guide to Starting a {name} Business in Kenya
                  </h2>
                  <ol className="space-y-5" role="list">
                    {guide.steps.map((step, i) => (
                      <li
                        key={step.id}
                        id={`step-${i + 1}`}
                        className="bg-white rounded-lg border border-gray-50 relative overflow-visible pt-8 scroll-mt-6"
                      >
                        {/* Step number circle – centered and protruding above card */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 -top-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-base shadow-lg border-2 border-white">
                            {i + 1}
                          </div>
                        </div>

                        {/* Card body – title, image, description */}
                        <div className="p-5 pt-2 sm:p-10">
                          <h3 className="text-center text-xl font-bold text-gray-900 mb-3 leading-snug">
                            {step.title}
                          </h3>

                          {step.imageUrl && (
                            <div className="mb-4">
                              <Image
                                src={step.imageUrl}
                                alt={step.title}
                                width={700}
                                height={400}
                                className="rounded-xl w-full object-cover border border-gray-100"
                              />
                            </div>
                          )}

                          <RenderRichText
                            text={step.description}
                            references={refs}
                            onRefClick={(r) => setActiveRef(r as Reference)}
                            className="text-gray-800 text-base"
                          />
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {/* Additional Sections */}
              {guide.sections.length > 0 && (
                <section
                  aria-label="Additional information"
                  className="space-y-5"
                >
                  {guide.sections.map((sec) => {
                    const meta = SECTION_META[sec.type];
                    return (
                      <div
                        key={sec.id}
                        className={`rounded-lg border ${meta.bg} ${meta.border} p-10`}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0 text-lg">
                            {meta.icon}
                          </div>
                          <div>
                            <div
                              className={`text-base font-bold uppercase tracking-wide ${meta.iconCls} mb-0.5`}
                            >
                              {meta.label}
                            </div>
                            <h3 className={`font-bold text-base ${meta.title}`}>
                              {sec.title}
                            </h3>
                          </div>
                        </div>
                        <RenderRichText
                          text={sec.content}
                          references={refs}
                          onRefClick={(r) => setActiveRef(r as Reference)}
                          className="text-gray-700"
                        />
                        {sec.imageUrl && (
                          <Image
                            src={sec.imageUrl}
                            alt={sec.title}
                            width={640}
                            height={340}
                            className="rounded-xl mt-5 w-full object-cover border border-white/60"
                          />
                        )}
                      </div>
                    );
                  })}
                </section>
              )}

              {/* FAQs */}
              {guide.faqs.length > 0 && (
                <section aria-labelledby="faq-heading" className="scroll-mt-6">
                  <h2
                    id="faq-heading"
                    className="text-2xl font-bold text-gray-900 mb-6 px-4 sm:px-0"
                  >
                    Frequently Asked Questions
                  </h2>
                  <div className="space-y-2">
                    {guide.faqs.map((faq) => (
                      <FaqItem key={faq.id} faq={faq} />
                    ))}
                  </div>
                </section>
              )}

              {/* References */}
              {guide.references.length > 0 && (
                <section
                  aria-labelledby="refs-heading"
                  className="border-t border-gray-200 pt-8 px-4 sm:px-0"
                >
                  <h2
                    id="refs-heading"
                    className="text-base font-bold text-gray-700 mb-4"
                  >
                    References
                  </h2>
                  <ol className="space-y-2.5">
                    {guide.references.map((ref) => (
                      <li
                        key={ref.id}
                        className="flex items-baseline gap-3 text-base"
                      >
                        <span className="flex-shrink-0 w-6 h-6 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold flex items-center justify-center text-base">
                          {ref.refNumber}
                        </span>
                        <span className="text-gray-600">
                          {ref.title}
                          {" — "}
                          <a
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 break-all"
                          >
                            {ref.url}
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </main>

            {/* Sidebar — desktop only */}
            <aside className="hidden lg:block">
              <div className="sticky top-6 space-y-4">
                {guide.steps.length > 0 && (
                  <nav
                    aria-label="Table of contents"
                    className="bg-white rounded-lg border border-gray-50 p-5"
                  >
                    <h3 className="text-base font-bold text-gray-500 uppercase tracking-widest mb-3">
                      Contents
                    </h3>
                    <ol className="space-y-1">
                      {guide.intro && (
                        <li>
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="text-base text-gray-500 hover:text-emerald-600 transition-colors flex items-center gap-2 py-1"
                          >
                            <span className="w-5 h-5 rounded bg-gray-100 text-gray-400 flex items-center justify-center text-base font-bold flex-shrink-0">
                              ·
                            </span>
                            Overview
                          </a>
                        </li>
                      )}
                      {guide.steps.map((step, i) => (
                        <li key={step.id}>
                          <a
                            href={`#step-${i + 1}`}
                            className="text-base text-gray-500 hover:text-emerald-600 transition-colors flex items-center gap-2 py-1"
                          >
                            <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center text-base font-bold flex-shrink-0">
                              {i + 1}
                            </span>
                            <span className="leading-snug line-clamp-2">
                              {step.title}
                            </span>
                          </a>
                        </li>
                      ))}
                      {guide.faqs.length > 0 && (
                        <li>
                          <a
                            href="#faq-heading"
                            className="text-base text-gray-500 hover:text-emerald-600 transition-colors flex items-center gap-2 py-1"
                          >
                            <span className="w-5 h-5 rounded bg-amber-100 text-amber-600 flex items-center justify-center text-base font-bold flex-shrink-0">
                              ?
                            </span>
                            FAQs
                          </a>
                        </li>
                      )}
                    </ol>
                  </nav>
                )}

                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-100 p-5">
                  <p className="text-base font-semibold text-emerald-700 mb-1">
                    Full Business Guide
                  </p>
                  <p className="text-base text-gray-500 mb-3 leading-snug">
                    Requirements, costs, and everything you need to launch.
                  </p>
                  <Link
                    href={`/businesses/${slug}`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold rounded-xl transition-colors"
                  >
                    View Full Guide
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <Link
                  href={`/businesses/${slug}/requirements`}
                  className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-50 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-gray-800 group-hover:text-emerald-700 transition-colors">
                      Requirements
                    </p>
                    <p className="text-base text-gray-400">
                      What you need to start
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Mobile sticky table of contents */}
      <MobileToc slug={slug} guide={guide} />
    </>
  );
}