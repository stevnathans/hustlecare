import { Search, BarChart2, ShoppingBag, Download, ShoppingCart, Rocket } from "lucide-react";

export function WhatWeDoSection() {
  return (
    <section className="py-20 bg-emerald-50"> {/* Subtle light emerald tint */}
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-16">
      <span className="inline-block px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-100/50 rounded-full mb-4">
        Our Services
      </span>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        What <span className="text-emerald-600">We Do</span>
      </h2>
      <p className="text-gray-600 max-w-3xl mx-auto text-lg">
        Comprehensive tools to transform your business idea into reality
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[
        { 
          icon: <Search className="w-6 h-6 text-emerald-600" />, 
          title: "Requirements Discovery", 
          description: "Detailed breakdown of legal and operational needs for your specific business type." 
        },
        { 
          icon: <BarChart2 className="w-6 h-6 text-emerald-600" />, 
          title: "Cost Analysis", 
          description: "Accurate startup and operational cost estimates with regional pricing." 
        },
        { 
          icon: <ShoppingBag className="w-6 h-6 text-emerald-600" />, 
          title: "Vendor Network", 
          description: "Access to verified suppliers and service providers in your area." 
        },
        { 
          icon: <Download className="w-6 h-6 text-emerald-600" />, 
          title: "Document Toolkit", 
          description: "Customizable templates for business plans and compliance docs." 
        },
        { 
          icon: <ShoppingCart className="w-6 h-6 text-emerald-600" />, 
          title: "Procurement Hub", 
          description: "Streamlined purchasing with exclusive partner discounts." 
        },
        { 
          icon: <Rocket className="w-6 h-6 text-emerald-600" />, 
          title: "Launch Support", 
          description: "Step-by-step guidance through your first 90 days." 
        },
      ].map((feature, index) => (
        <div 
          key={index} 
          className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4 mb-5">
            <div className="p-3 rounded-lg bg-emerald-50">
              {feature.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
          </div>
          <p className="text-gray-600 pl-[60px]">{feature.description}</p>
        </div>
      ))}
    </div>

    {/* Stats with improved contrast */}
    <div className="mt-16 bg-white/80 backdrop-blur-sm rounded-xl p-8 grid grid-cols-2 md:grid-cols-4 gap-8 border border-gray-200">
      {[
        { value: "200+", label: "Business Types" },
        { value: "15", label: "African Markets" },
        { value: "5K+", label: "Verified Vendors" },
        { value: "85%", label: "Time Saved" }
      ].map((stat, index) => (
        <div key={index} className="text-center">
          <p className="text-3xl font-bold text-emerald-600 mb-2">{stat.value}</p>
          <p className="text-gray-600 text-sm">{stat.label}</p>
        </div>
      ))}
    </div>
  </div>
</section>
  );
}