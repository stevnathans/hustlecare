import React from 'react';

interface BusinessHeaderProps {
  businessName: string;
  unfilteredLowPrice: number;
  unfilteredHighPrice: number;
  requiredCount: number;
  optionalCount: number;
}

const BusinessHeader: React.FC<BusinessHeaderProps> = ({
  businessName,
  unfilteredLowPrice,
  unfilteredHighPrice,
  requiredCount,
  optionalCount
}) => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">
        Complete Requirements for Starting a {businessName} Business
      </h1>
      
      {/* Business Summary Paragraph */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <p className="text-lg text-gray-700 leading-relaxed">
          The estimated cost of starting a <span className="font-semibold text-gray-900">{businessName}</span> business in Kenya, is around{' '}
          {unfilteredLowPrice === 0 && unfilteredHighPrice === 0 ? (
            <span className="font-semibold text-purple-600">not yet available</span>
          ) : (
            <>
              {unfilteredLowPrice === unfilteredHighPrice ? (
                <span className="font-semibold text-purple-600">${unfilteredLowPrice.toLocaleString()}</span>
              ) : (
                <span className="font-semibold text-purple-600">${unfilteredLowPrice.toLocaleString()} to ${unfilteredHighPrice.toLocaleString()}</span>
              )}
            </>
          )}
          . You will need up to <span className="font-semibold text-blue-600">{requiredCount + optionalCount} requirements</span> with{' '}
          <span className="font-semibold text-green-600">{requiredCount} recommended</span> and{' '}
          <span className="font-semibold text-yellow-600">{optionalCount} optional</span> ones.
        </p>
      </div>
    </div>
  );
};

export default BusinessHeader;