// app/about/OurStory.tsx
'use client';
import { Lightbulb, Target, Users, Heart, Building, Mail } from 'lucide-react';

export default function OurStory() {
  const sections = [
    {
      icon: Lightbulb,
      title: "Why We Created Hustlecare",
      content: (
        <>
          <p className="text-gray-600 mb-4">
            Hustlecare started with a simple observation: starting a business is often harder than it needs to be.
          </p>
          <p className="text-gray-600 mb-4">
            A lot of people have ideas they want to pursue, but turning those ideas into actual plans can be confusing. Before spending any money, there are many things to figure out — what equipment you need, which documents are required, what software can help, how much the setup might cost, and where to even begin.
          </p>
          <p className="text-gray-600">
            The challenge is not that information does not exist. It is that it is scattered across different places, often written in ways that are difficult to apply. If you are looking to start a business, you may find yourself spending hours searching, comparing, and trying to connect the pieces yourself.
          </p>
        </>
      )
    },
    {
      icon: Target,
      title: "Bringing Everything Together",
      content: (
        <>
          <p className="text-gray-600 mb-4">
            We built Hustlecare to bring those pieces together.
          </p>
          <p className="text-gray-600 mb-4">
            The idea was to create a practical starting point where you can understand what you need before taking the next step. A place where business requirements, estimated costs, and useful resources are organized in a way that makes sense.
          </p>
          <p className="text-gray-600">
            Whether you are exploring an idea, preparing a budget, or getting ready to launch, Hustlecare is designed to help you make better decisions before you invest your time and money.
          </p>
        </>
      )
    },
    {
      icon: Users,
      title: "Built Around Real Business Needs",
      content: (
        <>
          <p className="text-gray-600 mb-4">
            Hustlecare is built around the practical questions people ask when they are preparing to start a business.
          </p>
          <p className="text-gray-600">
            We focus on organizing the information that matters most during the early stages, helping people understand what they need and how different parts of starting a business fit together.
          </p>
        </>
      )
    },
    {
      icon: Heart,
      title: "Our Mission and Vision",
      content: (
        <>
          <p className="text-gray-600 mb-4">
            We believe that good businesses are built on good preparation. Having the right information at the right time can make it easier to move from an idea to action.
          </p>
          <p className="text-gray-600 mb-3">
            <strong>Our Mission:</strong> To make starting a business simpler by helping people find the information, resources, and guidance they need to plan with confidence.
          </p>
          <p className="text-gray-600">
            <strong>Our Vision:</strong> To become a trusted starting point for people building businesses by making the early stages of entrepreneurship clearer and more manageable.
          </p>
        </>
      )
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 to-emerald-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Header */}
        <div className="text-center mb-16">
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Our Story</h1>
          <p className="text-xl text-emerald-700 font-medium mb-4">
            Making the process of starting a business clearer.
          </p>
          <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Hustlecare was created to help people understand what it takes to start a business by bringing requirements, costs, and useful resources into one place.
          </p>
        </div>

        {/* Core Proposition Box */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-12">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Why Hustlecare Exists</h3>
              <p className="text-gray-600 leading-relaxed">
                Starting a business involves many decisions. We created Hustlecare to make those decisions easier by helping people find the information they need before they invest their time and money.
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Accordion-Style Content Cards */}
        <div className="space-y-8">
          {sections.map((section, index) => {
            const IconComponent = section.icon;
            return (
              <div key={index} className="bg-white rounded-2xl shadow-xl p-6 md:p-8 transform hover:scale-[1.01] transition-transform duration-300">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 pt-2">{section.title}</h2>
                </div>
                <div className="pl-0 md:pl-16 leading-relaxed text-base">{section.content}</div>
              </div>
            );
          })}
        </div>

        {/* Footer Call-to-Action Card */}
        <div className="mt-12 bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl shadow-xl p-8 md:p-10 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Want to connect with us?</h3>
          <p className="text-emerald-50 mb-6 max-w-2xl mx-auto">
            Whether you have feedback, questions, or ideas on how we can improve Hustlecare, we would love to hear from you.
          </p>
          <a href="mailto:info@hustlecare.net" className="inline-flex items-center gap-2 bg-white text-emerald-600 px-8 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors duration-200">
            <Mail className="w-5 h-5" /> Say Hello
          </a>
        </div>
        
      </div>
    </section>
  );
}