import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface BusinessHeaderProps {
  businessName: string;
  businessSlug: string;
  unfilteredLowPrice: number;
  unfilteredHighPrice: number;
  requiredCount: number;
  optionalCount: number;
  totalRequirements: number;
}

interface BusinessSchema {
  "@context": string;
  "@type": "Service";
  name: string;
  description: string;
  provider: {
    "@type": "Organization";
    name: string;
    url: string;
  };
  areaServed: {
    "@type": "Country";
    name: string;
    sameAs: string;
  };
  offers?: {
    "@type": "Offer";
    description: string;
    priceRange: string;
    priceCurrency: string;
  };
}

const BusinessHeader: React.FC<BusinessHeaderProps> = ({
  businessName,
  unfilteredLowPrice,
  unfilteredHighPrice,
  requiredCount,
  optionalCount,
  totalRequirements
}) => {
  const [budgetScale, setBudgetScale] = useState<'small' | 'medium' | 'large'>('medium');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const hasPricing = unfilteredLowPrice > 0;
  const priceRange = unfilteredLowPrice === unfilteredHighPrice
    ? formatPrice(unfilteredLowPrice)
    : `${formatPrice(unfilteredLowPrice)} - ${formatPrice(unfilteredHighPrice)}`;

  const budgetScales = {
    small: { multiplier: 0.6, label: "Small Scale" },
    medium: { multiplier: 1, label: "Medium Scale" },
    large: { multiplier: 1.5, label: "Large Scale" }
  };

  const calculateScaledPrice = (price: number) => {
    return Math.round(price * budgetScales[budgetScale].multiplier);
  };

  const generateBusinessSchema = (): BusinessSchema => {
    const schema: BusinessSchema = {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": `${businessName} Business Startup Guide`,
      "description": `Complete guide to starting a ${businessName} business in Kenya with detailed requirements and cost estimates.`,
      "provider": {
        "@type": "Organization",
        "name": "Hustlecare",
        "url": "https://hustlecare.com"
      },
      "areaServed": {
        "@type": "Country",
        "name": "Kenya",
        "sameAs": "https://en.wikipedia.org/wiki/Kenya"
      }
    };

    if (hasPricing) {
      schema.offers = {
        "@type": "Offer",
        "description": `Startup cost estimate for ${businessName} business`,
        "priceRange": priceRange,
        "priceCurrency": "KES"
      };
    }

    return schema;
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBusinessSchema()) }}
      />

      <div>
        <div>
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-3 sm:mb-4 tracking-tight">
              {totalRequirements} Requirements to Start a{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                {businessName}
              </span>
              {' '}Business
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Complete requirements, cost estimates, and essential resources to start a succesful {businessName} business.
            </p>
          </div>

          <div className="mb-5 sm:mb-6">
            <div className="bg-slate-50 rounded-lg p-4 sm:p-5 shadow-sm">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 text-center">
                Adjust Your Budget Scenario
              </h3>
              <div className="grid grid-cols-3 gap-2 mb-3 sm:mb-4">
                {(Object.keys(budgetScales) as Array<keyof typeof budgetScales>).map(scale => (
                  <button
                    key={scale}
                    onClick={() => setBudgetScale(scale)}
                    className={`px-2 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                      budgetScale === scale
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {budgetScales[scale].label}
                  </button>
                ))}
              </div>
              {hasPricing && (
                <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-slate-600 mb-1">
                    Estimated cost for {budgetScales[budgetScale].label.toLowerCase()} {businessName.toLowerCase()} business
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-700">
                    {formatPrice(calculateScaledPrice(unfilteredLowPrice))} - {formatPrice(calculateScaledPrice(unfilteredHighPrice))}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mb-5 sm:mb-6">
            <div className="bg-white rounded-lg p-0 sm:p-6 shadow-sm border border-slate-200">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-lg flex-shrink-0">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 sm:mb-3">
                    Requirements Breakdown
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl font-bold text-blue-600">{totalRequirements}</span>
                      <span className="text-xs sm:text-sm text-slate-500">Total</span>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl font-bold text-emerald-600">{requiredCount}</span>
                      <span className="text-xs sm:text-sm text-slate-500">Essential</span>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl font-bold text-amber-600">{optionalCount}</span>
                      <span className="text-xs sm:text-sm text-slate-500">Optional</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-2 sm:px-3">
            <div className="text-center mb-5 sm:mb-6">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-3 sm:mb-4">
                How Much Do You Need To Start a {businessName} Business?
              </h2>
              <div className="w-16 sm:w-20 h-1 bg-gradient-to-r from-emerald-500 to-blue-500 mx-auto rounded-full" />
            </div>

            <div className="space-y-4 sm:space-y-5 text-slate-700 leading-relaxed">
              <p className="text-sm sm:text-base">
                {hasPricing ? (
                  <>
                    You need around{' '}
                    <span className="font-bold text-emerald-700">{priceRange}</span> to start a sucessful {businessName} business. This cost covers up to {' '}
                  </>
                ) : (
                  "You need up to "
                )}
                <span className="font-bold text-blue-700">{totalRequirements} requirements</span>, including{' '}
                <span className="font-bold text-emerald-700">{requiredCount} essential</span> and{' '}
                <span className="font-bold text-amber-700">{optionalCount} optional ones</span>. The actual cost of starting a {businessName} business may be higher or lower depending on your specific requirements.
              </p>

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BusinessHeader;