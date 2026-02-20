import { Suspense } from "react";
import BusinessesContent from "./BusinessesContent";

interface BusinessesPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BusinessesPage({ params }: BusinessesPageProps) {
  const { slug } = await params;
  
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-lg">Loading businesses...</p>
          </div>
        </div>
      }
    >
      <BusinessesContent slug={slug} />
    </Suspense>
  );
}