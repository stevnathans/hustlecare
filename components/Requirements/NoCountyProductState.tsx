// components/Requirements/NoCountyProductState.tsx
//
// Shown for a Legal requirement when products exist for OTHER counties but
// none for the currently selected one (e.g. Business Permit is priced for
// Nairobi and Mombasa, but the person has Kisumu selected). Distinct from
// the generic "no products at all" case, which stays as-is.

import { FiMapPin } from 'react-icons/fi';

export default function NoCountyProductState({
  requirementName,
  countyName,
}: {
  requirementName: string;
  countyName: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
      <FiMapPin className="text-amber-500 flex-shrink-0 mt-0.5" size={16} />
      <div>
        <p className="text-sm font-medium text-amber-800">
          Not yet listed for {countyName}
        </p>
        <p className="text-xs text-amber-700 mt-0.5">
          {requirementName} pricing for this county isn&apos;t in our database yet.{' '}
          <a href="/contact" className="underline hover:text-amber-900">
            Let us know
          </a>{' '}
          and we&apos;ll add it.
        </p>
      </div>
    </div>
  );
}