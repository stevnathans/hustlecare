import { Suspense } from "react";
import BusinessesContent from "./BusinessesContent";

// This is a static route (/businesses) — it has no dynamic [slug] segment,
// so there are no params to read. Removing params entirely fixes the error.
export default function BusinessesPage() {
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
      {/* No slug prop — BusinessesContent fetches all businesses on its own */}
      <BusinessesContent />
    </Suspense>
  );
}