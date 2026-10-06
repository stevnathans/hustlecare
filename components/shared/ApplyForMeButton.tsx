'use client';
// components/shared/ApplyForMeButton.tsx
//
// A concierge/help link — for people who don't want to apply for a legal
// requirement themselves and want Hustlecare's help doing it. Distinct
// from the "Apply" button on a product/county-fee card, which sends the
// person straight to the official government/vendor portal. Points at
// /apply-help with context pre-filled in the query string.
//
// The link is nofollow + non-prefetching on purpose: every business ×
// requirement × county combination produces a different URL, and none of
// them should be crawled or indexed (the page itself is also noindex).
// `from` records which page the customer clicked from, so the request
// shows its origin in admin.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHelpCircle } from 'react-icons/fi';

interface ApplyForMeButtonProps {
  requirementName: string;
  countyName?: string;
  businessId?: number;
  variant?: 'compact' | 'full';
}

export default function ApplyForMeButton({
  requirementName,
  countyName,
  businessId,
  variant = 'compact',
}: ApplyForMeButtonProps) {
  const pathname = usePathname();

  const params = new URLSearchParams();
  params.set('service', 'apply-assistance');
  params.set('requirement', requirementName);
  if (countyName) params.set('county', countyName);
  if (businessId) params.set('businessId', String(businessId));
  if (pathname) params.set('from', pathname);

  const isFull = variant === 'full';

  return (
    <Link
      href={`/apply-help?${params.toString()}`}
      rel="nofollow"
      prefetch={false}
      className={`inline-flex items-center gap-1.5 font-medium text-emerald-600 hover:text-emerald-700 transition-colors ${
        isFull ? 'text-sm' : 'text-xs sm:text-sm'
      }`}
    >
      <FiHelpCircle size={isFull ? 16 : 14} />
      <span>Apply For Me</span>
    </Link>
  );
}