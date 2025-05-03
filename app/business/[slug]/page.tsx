import { getBusinessRequirements, getBusinessBySlug } from '@/lib/api';
import RequirementCard from '@/components/Requirements/RequirementCard';
import CostCalculator from '@/components/business/CostCalculator';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function BusinessDetailsPage({ params }: PageProps) {
  const business = await getBusinessBySlug(params.slug);
  if (!business) return notFound();

  const requirements = await getBusinessRequirements(business.id);

  // Fixed transformation
  const transformedRequirements = requirements.map(req => ({
    id: req.id,
    name: req.name,
    description: req.description,
    status: req.isEssential ? 'required' as const : 'optional' as const,
    productCount: req.products.length,
    lowestPrice: Math.min(...req.products.map(p => p.price)),
    imageUrl: req.imageUrl,
    products: req.products,
    category: req.category
  }));

  // Fixed calculation
  const initialTotal = requirements.reduce(
    (sum, req) => sum + Math.min(...req.products.map(p => p.price)),
    0
  );

  const requirementsByCategory = transformedRequirements.reduce((acc, req) => {
    const category = req.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(req);
    return acc;
  }, {} as Record<string, typeof transformedRequirements>);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          {business.image && (
            <img 
              src={business.image} 
              alt={business.name}
              className="w-16 h-16 rounded-full object-cover"
              width={64}
              height={64}
            />
          )}
          <h1 className="text-3xl font-bold">Starting a {business.name}</h1>
        </div>
        <button className="text-gray-500 hover:text-gray-700" aria-label="Info">
          <InfoIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {Object.entries(requirementsByCategory).map(([category, reqs]) => (
            <section key={category} className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">
                {category.charAt(0).toUpperCase() + category.slice(1)} Requirements
              </h2>
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {reqs.map(requirement => (
                  <RequirementCard key={requirement.id} requirement={requirement} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <CostCalculator 
              initialTotal={initialTotal}
              requirements={transformedRequirements}
              businessType={business.name}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}