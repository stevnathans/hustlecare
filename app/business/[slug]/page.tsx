import { prisma } from "@/lib/prisma";
import BusinessDetailsClient from "./BusinessDetailsClient";
import CostCalculator from "@/components/business/CostCalculator";
import CategoryNavigation from "@/components/business/CategoryNavMenu";
;


interface BusinessDetailsPageProps {
  params: { slug: string };
}

const CATEGORY_ORDER = [
  "Legal",
  "Equipment",
  "Software",
  "Documents",
  "Branding",
  "Operating Expenses",
  "Uncategorized"
];

export default async function BusinessDetailsPage({ params }: BusinessDetailsPageProps) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug },
    include: {
      requirements: {
        orderBy: { category: "asc" }
      },
    },
  });

  if (!business) {
    return <div className="p-4">Business not found</div>;
  }

  const groupedRequirements = business.requirements.reduce((groups: Record<string, typeof business.requirements>, req) => {
    const category = req.category || "Uncategorized";
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(req);
    return groups;
  }, {});

  const sortedCategories = CATEGORY_ORDER.filter((cat) => groupedRequirements[cat]);

  return (
    
      <div className="max-w-7xl mx-auto p-4">
        {/* Sticky Top Bar */}
        <div className="sticky top-0 bg-white z-20 pt-4 pb-2">
          <h1 className="text-3xl font-bold capitalize">
            Complete Requirements for Starting a {params.slug.replaceAll("-", " ")} Business
          </h1>
          
          {/* Client-side interactive navigation */}
          <CategoryNavigation categories={sortedCategories} />
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8 mt-6">
          <div className="flex-1">
            <BusinessDetailsClient
              groupedRequirements={groupedRequirements}
              sortedCategories={sortedCategories}
              businessName={business.name}
            />
          </div>
          <aside className="lg:w-[350px] lg:flex-shrink-0">
            <div className="sticky top-34">
              <CostCalculator
                currentBusiness={params.slug}
                businessName={business.name}
                businessId={business.id}
                isExpanded={false} // Default state
              />
            </div>
          </aside>
        </div>
      </div>
  
  );
}