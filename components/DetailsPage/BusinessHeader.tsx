import React, { useState } from 'react';

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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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

  const smallScaleLow = calculateScaledPrice(unfilteredLowPrice * 0.6);
  const smallScaleHigh = calculateScaledPrice(unfilteredHighPrice * 0.6);
  const largeScaleLow = calculateScaledPrice(unfilteredLowPrice * 1.5);
  const largeScaleHigh = calculateScaledPrice(unfilteredHighPrice * 1.5);

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
        "priceCurrency": "USD"
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

      <header>
        <div>
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-3 sm:mb-4 tracking-tight">
              {totalRequirements} Requirements to Start a{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                {businessName}
              </span>
              {' '}Business in Kenya
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Complete requirements, cost estimates, and essential resources to start a successful {businessName} business in Kenya.
            </p>
          </div>

          <nav className="mb-5 sm:mb-6" aria-label="Budget scenarios">
            <div className="bg-slate-50 rounded-lg p-4 sm:p-5 shadow-sm">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 text-center">
                Adjust Your Budget Scenario
              </h2>
              <div className="grid grid-cols-3 gap-2 mb-3 sm:mb-4">
                {(Object.keys(budgetScales) as Array<keyof typeof budgetScales>).map(scale => (
                  <button
                    key={scale}
                    onClick={() => setBudgetScale(scale)}
                    aria-pressed={budgetScale === scale}
                    aria-label={`Select ${budgetScales[scale].label} budget scenario`}
                    className={`px-2 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                      budgetScale === scale
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-white text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
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
          </nav>

          <section className="mb-5 sm:mb-6" aria-labelledby="requirements-breakdown">
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md border border-slate-200">
              <div className="text-center">
                <h2 id="requirements-breakdown" className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 sm:mb-4">
                  Requirements Breakdown
                </h2>
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">
                      {totalRequirements}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 font-medium">
                      Total
                    </div>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-emerald-600 mb-1">
                      {requiredCount}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 font-medium">
                      Essential
                    </div>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-amber-600 mb-1">
                      {optionalCount}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 font-medium">
                      Optional
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <article className="px-2 sm:px-3">
            <div className="text-center mb-5 sm:mb-6">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-3 sm:mb-4">
                How Much Does It Cost to Start a {businessName} Business in Kenya?
              </h2>
              <div className="w-16 sm:w-20 h-1 bg-gradient-to-r from-emerald-500 to-blue-500 mx-auto rounded-full" />
            </div>

            <div className="space-y-4 sm:space-y-5 text-slate-700 leading-relaxed">
            
              {hasPricing ? (
                <>
                  <p className="text-sm sm:text-base">
                    You will need approximately{' '}
                    <span className="font-bold text-emerald-700">{formatPrice(smallScaleLow)} to {formatPrice(smallScaleHigh)}</span> to start a <strong>small-scale {businessName.toLocaleLowerCase()} business</strong>.{' '}
                    A <strong>medium-scale operation</strong> typically requires between{' '}
                    <span className="font-bold text-emerald-700">{priceRange}</span>, while a{' '}
                    <strong>large-scale {businessName.toLocaleLowerCase()} business</strong> may cost around{' '}
                    <span className="font-bold text-emerald-700">{formatPrice(largeScaleLow)} to {formatPrice(largeScaleHigh)}</span>.
                  </p>

                  <p className="text-sm sm:text-base">
                    These startup costs cover up to{' '}
                    <span className="font-bold text-blue-700">{totalRequirements} requirements</span>, including{' '}
                    <span className="font-bold text-emerald-700">{requiredCount} mandatory items</span> and{' '}
                    <span className="font-bold text-amber-700">{optionalCount} optional ones.</span> The actual cost of starting a {businessName.toLocaleLowerCase()} business may vary depending on your location, business model, target market, and the requirements you need.
                  </p>
                </>
              ) : (
                <p className="text-sm sm:text-base">
                  To successfully start a {businessName.toLocaleLowerCase()} business in Kenya, you need up to{' '}
                  <span className="font-bold text-blue-700">{totalRequirements} key requirements</span>, which include{' '}
                  <span className="font-bold text-emerald-700">{requiredCount} essential items</span> and{' '}
                  <span className="font-bold text-amber-700">{optionalCount} optional ones</span>. The actual startup cost will depend on your chosen business scale, location within Kenya, and specific operational needs.
                </p>
              )}
            </div>
          </article>
        </div>
      </header>
    </>
  );
};

export default BusinessHeader;