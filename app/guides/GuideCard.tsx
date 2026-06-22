// app/guides/GuideCard.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, ChevronRight, FileText, HelpCircle } from 'lucide-react';

interface GuideCardProps {
  title:       string;
  businessName: string;
  businessSlug: string;
  businessImage: string | null;
  category:    string | null;
  stepCount:   number;
  faqCount:    number;
  intro:       string | null;
  publishedAt: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Strip markdown syntax for the preview excerpt
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*+]\s/gm, '')
    .replace(/^\s*\d+\.\s/gm, '')
    .replace(/[|]/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
}

export default function GuideCard({
  title,
  businessName,
  businessSlug,
  businessImage,
  category,
  stepCount,
  faqCount,
  intro,
  publishedAt,
}: GuideCardProps) {
  const guideHref = `/businesses/${businessSlug}/how-to-start`;
  const hubHref   = `/businesses/${businessSlug}`;

  // Parse intro — could be JSON string from the editor or plain text
  let introText = '';
  if (intro) {
    try {
      const parsed = JSON.parse(intro);
      introText = typeof parsed === 'object' && parsed.content ? parsed.content : intro;
    } catch {
      introText = intro;
    }
  }
  const excerpt = introText ? stripMarkdown(introText).slice(0, 140) + (introText.length > 140 ? '…' : '') : '';

  return (
    <article className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 flex flex-col">

      {/* ── Image ── */}
      <Link href={guideHref} className="block relative h-44 w-full overflow-hidden flex-shrink-0" tabIndex={-1} aria-hidden="true">
        {businessImage ? (
          <>
            <Image
              src={businessImage}
              alt={businessName}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            {/* Category badge over image */}
            {category && (
              <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-emerald-700 text-xs font-bold rounded-full">
                {category}
              </span>
            )}
            {/* Step count badge over image */}
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full shadow">
              <BookOpen className="w-3 h-3" />
              {stepCount} step{stepCount !== 1 ? 's' : ''}
            </span>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-100 flex flex-col items-center justify-center gap-2">
            <BookOpen className="w-10 h-10 text-emerald-300" />
            {category && (
              <span className="px-2.5 py-1 bg-white text-emerald-700 text-xs font-bold rounded-full">
                {category}
              </span>
            )}
          </div>
        )}
      </Link>

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 p-5 gap-3">

        {/* Title */}
        <div>
          <Link href={guideHref}>
            <h3 className="text-base font-bold text-gray-900 leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2">
              {title || `How to Start a ${businessName} Business in Kenya`}
            </h3>
          </Link>
          <Link href={hubHref} className="inline-flex items-center gap-1 mt-1 text-xs text-gray-400 hover:text-emerald-600 transition-colors">
            {businessName}
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Excerpt */}
        {excerpt && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 flex-1">
            {excerpt}
          </p>
        )}

        {/* Meta chips */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1">
            <FileText className="w-3 h-3 text-emerald-500" />
            {stepCount} step{stepCount !== 1 ? 's' : ''}
          </span>
          {faqCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1">
              <HelpCircle className="w-3 h-3 text-emerald-500" />
              {faqCount} FAQ{faqCount !== 1 ? 's' : ''}
            </span>
          )}
          {publishedAt && (
            <span className="text-xs text-gray-400 ml-auto">
              {formatDate(publishedAt)}
            </span>
          )}
        </div>

        {/* CTA */}
        <Link
          href={guideHref}
          className="relative overflow-hidden flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-bold text-white transition-colors group/btn mt-1"
        >
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 skew-x-12" />
          <BookOpen className="w-4 h-4 relative flex-shrink-0" />
          <span className="relative">Read Guide</span>
          <ChevronRight className="w-4 h-4 relative group-hover/btn:translate-x-0.5 transition-transform flex-shrink-0" />
        </Link>
      </div>

      {/* Hover glow ring */}
      <div className="absolute inset-0 rounded-2xl ring-2 ring-emerald-500/0 group-hover:ring-emerald-500/20 transition-all duration-300 pointer-events-none" />
    </article>
  );
}