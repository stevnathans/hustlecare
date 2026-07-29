// app/tools/permit-costs/page.tsx
import { Metadata } from 'next';
import PermitCostsCalculator from '@/components/tools/PermitCostsCalculator';


export const metadata: Metadata = {
  title: 'Business Permit & Licence Cost Calculator Kenya | HustleCare',
  description:
    'Estimate the cost of a Single Business Permit, health certificate, and other county-issued licences in any Kenyan county — by business type and size.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net'}/tools/permit-costs`,
  },
};

export default function PermitCostsPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
          County Permit & Licence Cost Calculator
        </h1>
        <p className="text-slate-600 leading-relaxed max-w-xl mx-auto">
          Select your county and business details to estimate the cost of a Single Business Permit,
          health certificate, and other county-issued requirements.
        </p>
      </div>
      <PermitCostsCalculator />
    </div>
  );
}