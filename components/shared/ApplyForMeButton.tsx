'use client';
// components/shared/ApplyForMeButton.tsx
//
// A concierge/help link — for people who don't want to apply for a legal
// requirement themselves and want Hustlecare's help doing it. Distinct
// from the "Apply" button on a product/county-fee card, which sends the
// person straight to the official government/vendor portal. Points at the
// existing /contact page with context pre-filled in the query string.

import Link from 'next/link';
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
  const params = new URLSearchParams();
  params.set('service', 'apply-assistance');
  params.set('requirement', requirementName);
  if (countyName) params.set('county', countyName);
  if (businessId) params.set('businessId', String(businessId));

  const isFull = variant === 'full';

  return (
    <Link
      href={`/apply-help?${params.toString()}`}
      className={`inline-flex items-center gap-1.5 font-medium text-emerald-600 hover:text-emerald-700 transition-colors ${
        isFull ? 'text-sm' : 'text-xs sm:text-sm'
      }`}
    >
      <FiHelpCircle size={isFull ? 16 : 14} />
      <span>Apply For Me</span>
    </Link>
  );
}