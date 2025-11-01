import React, { useState } from 'react';
import { CheckCircle, Package, Target } from 'lucide-react';

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

  const StatCard = ({ icon: Icon, label, value, valueColor = "text-slate-900" }: {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
   
    valueColor?: string;
  }) => (
    <div className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200/60">
      <div className="flex items-start gap-4">
        <div className="p-2.5 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-lg group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            {label}
          </h3>
          <div className={`text-2xl font-bold ${valueColor} mb-1`}>
            {value}
          </div>
          
        </div>
      </div>
    </div>
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBusinessSchema()) }}
      />

      <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        {/* Background Decorations */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-radial from-emerald-100/40 via-transparent to-transparent rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-radial from-blue-100/40 via-transparent to-transparent rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200/50 text-emerald-700 text-sm font-medium mb-6 shadow-sm">
              <CheckCircle className="w-4 h-4" />
              Complete Business Guide
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6 tracking-tight">
              Start Your{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                {businessName}
              </span>
              {' '}Business
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Comprehensive requirements, cost estimates, and essential resources to launch successfully in the Kenyan market
            </p>
          </div>

          {/* Interactive Cost Calculator */}
          <div className="mb-10">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200/60">
              <div className="max-w-3xl mx-auto">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 text-center">
                  Adjust Your Budget Scenario
                </h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {(Object.keys(budgetScales) as Array<keyof typeof budgetScales>).map(scale => (
                    <button
                      key={scale}
                      onClick={() => setBudgetScale(scale)}
                      className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                        budgetScale === scale
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {budgetScales[scale].label}
                    </button>
                  ))}
                </div>
                {hasPricing && (
                  <div className="text-center p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Estimated Cost for {budgetScales[budgetScale].label}</p>
                    <p className="text-3xl font-bold text-emerald-700">
                      {formatPrice(calculateScaledPrice(unfilteredLowPrice))} - {formatPrice(calculateScaledPrice(unfilteredHighPrice))}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <StatCard
              icon={Package}
              label="Total Requirements"
              value={totalRequirements}
              
              valueColor="text-blue-600"
            />

            <StatCard
              icon={Target}
              label="Breakdown"
              value={
                <div className="flex items-center gap-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-emerald-600">{requiredCount}</span>
                    <span className="text-xs text-slate-500 font-normal">Essential</span>
                  </div>
                  <div className="w-px h-6 bg-slate-200" />
                  <div className="flex items-baseline gap-1">
                    <span className="text-amber-600">{optionalCount}</span>
                    <span className="text-xs text-slate-500 font-normal">Optional</span>
                  </div>
                </div>
              }
              
            />
          </div>

          {/* Content Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 lg:p-10 shadow-lg border border-slate-200/60">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4">
                  {businessName} Business Overview
                </h2>
                <div className="w-20 h-1 bg-gradient-to-r from-emerald-500 to-blue-500 mx-auto rounded-full" />
              </div>

              <div className="space-y-6 text-slate-700 leading-relaxed">
                <p className="text-lg">
                  Launching a successful <span className="font-semibold text-slate-900">{businessName}</span> business in Kenya requires strategic planning and comprehensive market understanding. Our expertly crafted guide provides everything needed to navigate the local business landscape confidently.
                </p>

                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6 border-l-4 border-emerald-500 shadow-sm">
                  <p className="text-base">
                    {hasPricing ? (
                      <>
                        With a strategic investment of{' '}
                        <span className="font-bold text-emerald-700">{priceRange}</span>, you&apos;ll be positioned to address{' '}
                      </>
                    ) : (
                      "You'll need to carefully consider "
                    )}
                    <span className="font-bold text-blue-700">{totalRequirements} critical requirements</span> — including{' '}
                    <span className="font-bold text-emerald-700">{requiredCount} essential components</span> and{' '}
                    <span className="font-bold text-amber-700">{optionalCount} strategic enhancements</span> that will set your business apart.
                  </p>
                </div>

                <p className="text-base">
                  Our interactive checklist below guides you through each category with detailed explanations, vetted product recommendations, and personalized cost calculations. Every requirement is carefully analyzed to help you make informed decisions that align with your {businessName} business goals and budget.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BusinessHeader;