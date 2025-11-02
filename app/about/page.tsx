import { Metadata } from "next";
import { Rocket, CheckCircle, Users, BarChart2, Search, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About Us - Hustlecare | Your Partner in Starting a Business",
  description: "Learn how Hustlecare helps entrepreneurs launch businesses faster with accurate requirements, cost estimates, and verified resources tailored for the African market.",
  keywords: ["about hustlecare", "business startup help", "entrepreneur tools", "Kenya business guide"],
  openGraph: {
    title: "About Hustlecare - Simplifying Business Launches",
    description: "Discover how we're helping thousands of entrepreneurs start their businesses with confidence.",
    url: "https://hustlecare.com/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Hustlecare - Your Business Launch Partner",
    description: "Learn how we're revolutionizing business startups in Africa",
  },
  alternates: {
    canonical: "https://hustlecare.com/about",
  },
};

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 text-center bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block px-4 py-2 mb-6 text-sm font-medium text-emerald-700 bg-emerald-100/50 rounded-full">
            Entrepreneurial Toolkit
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            About <span className="text-emerald-600">Hustlecare</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your comprehensive guide to smarter business launches
          </p>
          <div className="mt-12 max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-700 leading-relaxed">
              Starting a business should be about innovation, not navigating bureaucracy. 
              Hustlecare demystifies the process by providing clear requirements, 
              accurate cost estimates, and vetted resources—all tailored to your specific 
              business type and African market.
            </p>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose Hustlecare?</h2>
            <p className="text-gray-300 max-w-3xl mx-auto">
              We combine local market knowledge with intuitive tools to give you an unmatched advantage
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-800 p-8 rounded-lg">
              <div className="w-12 h-12 mb-4 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Time Savings</h3>
              <p className="text-gray-300">
                Reduce research time by up to 80% with our centralized requirements database
              </p>
            </div>
            <div className="bg-gray-800 p-8 rounded-lg">
              <div className="w-12 h-12 mb-4 rounded-lg bg-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Accuracy</h3>
              <p className="text-gray-300">
                Country-specific, regularly updated information you can trust
              </p>
            </div>
            <div className="bg-gray-800 p-8 rounded-lg">
              <div className="w-12 h-12 mb-4 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Community</h3>
              <p className="text-gray-300">
                Access to verified vendors and fellow entrepreneurs
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="lg:w-1/2">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              <span className="text-emerald-600">Everything</span> You Need to Start
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Our platform consolidates all the fragmented pieces of business setup into one intuitive interface.
            </p>
            <ul className="space-y-6">
              {[
                "Compliance requirements by business type",
                "Startup cost calculator",
                "Document templates & guides",
                "Vendor marketplace",
                "Progress tracking",
                "Exportable business plans"
              ].map((item, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:w-1/2 bg-gray-50 p-8 rounded-xl border border-gray-200 shadow-sm">
            <div className="space-y-8">
              {[
                { icon: <Search className="w-6 h-6 text-emerald-600" />, title: "Discover", text: "Find requirements for 200+ business types" },
                { icon: <BarChart2 className="w-6 h-6 text-emerald-600" />, title: "Plan", text: "Estimate costs with our interactive tools" },
                { icon: <ShoppingBag className="w-6 h-6 text-emerald-600" />, title: "Acquire", text: "Connect with trusted service providers" }
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-gray-600 mt-1">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-emerald-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
            <Users className="w-8 h-8 text-emerald-600" />
          </div>
          <blockquote className="text-2xl font-medium text-gray-900 mb-6">
            &quot;Hustlecare saved me three months of research and countless headaches. I launched my food business with confidence knowing I hadn&apos;t missed any critical steps.&quot;
          </blockquote>
          <div className="text-gray-600">
            <p className="font-medium">Amina K.</p>
            <p>Nairobi, Kenya</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Launch Your Business?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of entrepreneurs who&apos;ve successfully started with Hustlecare
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
              Get Started Today
            </Button>
            <Button variant="outline" size="lg" className="text-white border-white hover:bg-emerald-700 hover:border-emerald-700">
              Explore Business Ideas
            </Button>
          </div>
          <p className="text-sm text-gray-400 mt-8">
            Have questions? <a href="/contact" className="text-emerald-400 hover:underline">Contact our team</a>
          </p>
        </div>
      </section>
    </div>
  );
}