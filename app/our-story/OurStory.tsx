/* eslint-disable react/no-unescaped-entities */
// app/about/OurStory.tsx
'use client';
import { Lightbulb, Compass, Target, Users, Heart, Sparkles, Building, Mail } from 'lucide-react';

export default function OurStory() {
  const sections = [
    {
      icon: Lightbulb,
      title: "1. Why We Created Hustlecare",
      content: (
        <>
          <p className="text-gray-600 mb-4">
            Starting a business is one of the most exciting choices anyone can make. But let’s be honest—it is also incredibly confusing. 
          </p>
          <p className="text-gray-600 mb-4">
            Too many brilliant ideas die before they even get off the ground. Not because the founder didn&apos;t work hard enough, but because the path to opening a simple shop is locked behind a wall of guesswork. 
          </p>
          <p className="text-gray-600">
            We noticed that everyday entrepreneurs spend weeks walking around markets, dealing with unpredictable prices from middlemen, and trying to decipher local council permits. We built Hustlecare to put an end to that frustration. We wanted to build a transparent, friendly map that gives you the exact answers from day one.
          </p>
        </>
      )
    },
    {
      icon: Compass,
      title: "2. The Big Difference: Requirements vs. Products",
      content: (
        <>
          <p className="text-gray-600 mb-4">
            If you search the internet for tips on starting a business, you usually find generic blog posts filled with rough estimates. We realized that estimates don&apos;t help you pay the bills. You need the hard facts.
          </p>
          <p className="text-gray-600 mb-3">
            That is why we split our platform into two powerful layers:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>The Requirements (The "What"):</strong> This is your ultimate safety checklist. It reminds you of the critical things you might forget—like fire extinguishers, specific county business permits, or specialized plumbing.</li>
            <li><strong>The Products (The "How Much"):</strong> We link those needs directly to real items from real local vendors. This allows you to toggle between budget setups and premium equipment to see exactly how your choices shift your launch costs in real time.</li>
          </ul>
          <p className="text-gray-600">
            By shifting from random guesses to actual market pricing, we help you build a solid plan that keeps you from running out of money before your doors even open.
          </p>
        </>
      )
    },
    {
      icon: Target,
      title: "3. What We Are Trying to Achieve",
      content: (
        <>
          <p className="text-gray-600 mb-4">
            Our goal is simple: **We want to lower the barrier to entry for anyone who wants to build a business.** 
          </p>
          <p className="text-gray-600 mb-4">
            We want to see a world where starting a standard executive salon, a local bakery, a cyber cafe, or a neighborhood car wash doesn&apos;t require years of painful trial and error. 
          </p>
          <p className="text-gray-600">
            By organizing the messy world of local setup requirements, supplier tracking, and licensing protocols into one clean web dashboard, we are turning abstract dreams into solid, bank-ready roadmaps.
          </p>
        </>
      )
    },
    {
      icon: Users,
      title: "4. Built Out in the Open",
      content: (
        <>
          <p className="text-gray-600 mb-4">
            Hustlecare wasn&apos;t built by a faceless, distant corporation behind closed doors. It was created right here in the community as a "build in public" project. 
          </p>
          <p className="text-gray-600">
            We share our development milestones, gather feedback directly from local builders on community forums, and continuously adapt the application based on the real-world advice of people running businesses on the ground. We believe that software is at its best when it is co-created with the very people who rely on it to make a living.
          </p>
        </>
      )
    },
    {
      icon: Heart,
      title: "5. Our Core Values",
      content: (
        <>
          <p className="text-gray-600 mb-3">Everything we design on this platform is guided by three principles:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li><strong>Honesty First:</strong> We don&apos;t paint romantic pictures. If a business type requires heavy capital or rigorous regulatory paperwork, our checklists show it upfront.</li>
            <li><strong>Simplicity Rules:</strong> No complex technical phrasing, no confusing accounting code. We keep our layout easy to navigate for everyone.</li>
            <li><strong>Community-Driven:</strong> True business intelligence lives on the street. We rely on your feedback to keep vendor selections accurate and our tips hyper-local.</li>
          </ul>
        </>
      )
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 to-emerald-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Our Story</h1>
          <p className="text-xl text-emerald-700 font-medium mb-4">Democratizing business planning for the modern hustler economy.</p>
          <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Hustlecare is a friendly startup ecosystem built to take you from a basic concept to a fully costed, compliance-ready launch plan. We strip away the confusing guesswork of what it actually takes to start a business locally.
          </p>
        </div>

        {/* Core Proposition Box */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-12">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Our Ultimate Promise</h3>
              <p className="text-gray-600 leading-relaxed">
                We believe that finding business requirements should be as simple as searching for a video online. We are here to bring total transparency, accurate real-market pricing, and clear compliance maps to every determined entrepreneur.
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
            Whether you are a local supplier looking to list products, an experienced business owner wanting to offer community feedback, or a founder with a feature suggestion, we would love to chat.
          </p>
          <a href="mailto:info@hustlecare.net" className="inline-flex items-center gap-2 bg-white text-emerald-600 px-8 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors duration-200">
            <Mail className="w-5 h-5" /> Say Hello
          </a>
        </div>
        
      </div>
    </section>
  );
}