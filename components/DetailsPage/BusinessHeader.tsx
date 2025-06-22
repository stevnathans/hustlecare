import React from 'react';

interface BusinessHeaderProps {
  businessName: string;
  businessSlug: string;
  unfilteredLowPrice: number;
  unfilteredHighPrice: number;
  requiredCount: number;
  optionalCount: number;
  totalRequirements: number;
}

const BusinessHeader: React.FC<BusinessHeaderProps> = ({
  businessName,
  unfilteredLowPrice,
  unfilteredHighPrice,
  requiredCount,
  optionalCount,
  totalRequirements
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const generateBusinessSchema = () => {
    const baseSchema: any = {
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

    if (unfilteredLowPrice > 0) {
      baseSchema.offers = {
        "@type": "Offer",
        "description": `Startup cost estimate for ${businessName} business`,
        "priceRange": unfilteredLowPrice === unfilteredHighPrice
          ? formatPrice(unfilteredLowPrice)
          : `${formatPrice(unfilteredLowPrice)}-${formatPrice(unfilteredHighPrice)}`,
        "priceCurrency": "KES"
      };
    }

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(baseSchema) }}
      />
    );
  };

  return (
    <>
      {generateBusinessSchema()}

      <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 border-b border-slate-200">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-blue-50/50"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-l from-emerald-100/30 to-transparent rounded-full transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-r from-blue-100/30 to-transparent rounded-full transform -translate-x-32 translate-y-32"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium mb-6">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Complete Business Guide
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-6">
              Start Your <span className="text-emerald-600">{businessName}</span> Business in Kenya
            </h1>
            
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Comprehensive requirements, cost estimates, and essential resources to launch your {businessName} business successfully in the Kenyan market.
            </p>
          </div>

          

          {/* Description Section */}
          <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-lg border border-slate-200">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4">
                  {businessName} Business Overview
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-emerald-500 to-blue-500 mx-auto rounded-full"></div>
              </div>

              {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Cost Card */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-slate-200">
              <div className="text-center">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Estimated Cost
                </h3>
                <div className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">
                  {unfilteredLowPrice === 0 && unfilteredHighPrice === 0 ? (
                    <span className="text-slate-400">Calculating...</span>
                  ) : (
                    <>
                      {unfilteredLowPrice === unfilteredHighPrice ? (
                        <span itemProp="price" className="text-emerald-600">
                          {formatPrice(unfilteredLowPrice)}
                        </span>
                      ) : (
                        <span itemProp="priceRange" className="text-emerald-600">
                          {formatPrice(unfilteredLowPrice)} - {formatPrice(unfilteredHighPrice)}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <p className="text-slate-500 text-sm">
                  Required capital in Kenya
                </p>
              </div>
            </div>

            {/* Requirements Card */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-slate-200">
              <div className="text-center">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Total Requirements
                </h3>
                <div className="text-2xl lg:text-3xl font-bold text-blue-600 mb-2">
                  {totalRequirements}
                </div>
                <p className="text-slate-500 text-sm">
                  Items to consider
                </p>
              </div>
            </div>

            {/* Breakdown Card */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-slate-200">
              <div className="text-center">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Requirement Breakdown
                </h3>
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">{requiredCount}</div>
                    <div className="text-xs text-slate-500 font-medium">Essential</div>
                  </div>
                  <div className="w-px h-8 bg-slate-200"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">{optionalCount}</div>
                    <div className="text-xs text-slate-500 font-medium">Optional</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
              
              <div className="prose prose-lg prose-slate max-w-none">
                <p className="text-slate-700 leading-relaxed mb-6 text-lg">
                  Launching a successful <strong className="text-slate-900">{businessName}</strong> business in Kenya requires strategic planning and comprehensive market understanding. Our expertly crafted guide provides you with everything needed to navigate the local business landscape confidently.
                </p>

                <div className="bg-slate-50 rounded-xl p-6 mb-6 border-l-4 border-emerald-500">
                  <p className="text-slate-700 leading-relaxed mb-0">
                    {unfilteredLowPrice > 0 ? (
                      <>
                        With a strategic investment of{' '}
                        <strong className="text-emerald-600 font-semibold">
                          {unfilteredLowPrice === unfilteredHighPrice 
                            ? formatPrice(unfilteredLowPrice)
                            : `${formatPrice(unfilteredLowPrice)} to ${formatPrice(unfilteredHighPrice)}`
                          }
                        </strong>, you'll be positioned to address{' '}
                      </>
                    ) : (
                      "You'll need to carefully consider "
                    )}
                    <strong className="text-blue-600 font-semibold">{totalRequirements} critical requirements</strong> — including{' '}
                    <span className="text-emerald-600 font-semibold">{requiredCount} essential components</span> and{' '}
                    <span className="text-amber-600 font-semibold">{optionalCount} strategic enhancements</span> that will set your business apart.
                  </p>
                </div>

                <p className="text-slate-700 leading-relaxed mb-0">
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