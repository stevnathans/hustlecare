import HomeSearch from "@/components/ui/homeSearch";
import BusinessCards from "@/components/ui/BusinessCards";
import { Search, ClipboardCheck, Wallet } from "lucide-react"; // Icons
import Menu from "@/components/shared/header/menu";
import Footer from "@/components/shared/footer";

// Sample business data (replace with real Firebase data later)
const businesses = [
  {
    id: "1",
    name: "Gym Business",
    imageUrl: "/images/gym.jpg",
  },
  {
    id: "2",
    name: "Car Wash",
    imageUrl: "/images/wash.png",
  },
  {
    id: "3",
    name: "Salon",
    imageUrl: "/images/salon.jpg",
  },
];

export default function Home() {

  return (
  
<>
      <Menu/>
      <main className="p-4">
      <section className="flex flex-col items-center justify-center mb-8">
        <h1 className="text-2xl font-bold mb-4">Find a Business</h1>
        <HomeSearch />
      </section>

      <section className="mt-12">
        <div className="bg-white shadow-md rounded-2xl p-6 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-100 p-4 rounded-full mb-3">
                <Search className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Search a Business</h3>
              <p className="text-sm text-gray-600">
                Start by searching any business idea you’re interested in.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-100 p-4 rounded-full mb-3">
                <ClipboardCheck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Add Requirements</h3>
              <p className="text-sm text-gray-600">
                View and customize all requirements for starting that business.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-100 p-4 rounded-full mb-3">
                <Wallet className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Cost Estimated</h3>
              <p className="text-sm text-gray-600">
                We automatically calculate estimated startup costs for you.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-center">Popular Businesses</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {businesses.map((biz) => (
            <BusinessCards key={biz.id} business={biz} />
          ))}
        </div>
      </section>
      
      </main>
      <Footer />
    </> 
  );
}
