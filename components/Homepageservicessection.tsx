"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface FeaturedService {
  emoji: string;
  title: string;
  desc: string;
  href: string;
  cta: string;
  badge?: string;
}

// ── Data ─────────────────────────────────────────────────────────────────────
const featuredServices: FeaturedService[] = [
  {
    emoji: "📋",
    title: "Business Plan Writing",
    desc: "Create a professional business plan with market research and financial projections tailored to your idea.",
    href: "/services/business-plan-writing",
    cta: "Create Business Plan",
    badge: "Most Popular",
  },
  {
    emoji: "⚖️",
    title: "Business Registration",
    desc: "Register your business and make it legally operational with the right structure from day one.",
    href: "/services/business-registration",
    cta: "Register My Business",
  },
  {
    emoji: "🌐",
    title: "Website Creation",
    desc: "Launch a professional website that represents your brand and attracts your first customers.",
    href: "/services/website-creation",
    cta: "Build My Website",
  },
];

// ── Icon ─────────────────────────────────────────────────────────────────────
function ArrowIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function HomepageServicesSection() {
  return (
    <section className="bg-slate-50 py-20" aria-label="Featured Services">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-emerald-600">
               Startup Services
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Link
              href="/services"
              className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-semibold text-lg group transition-colors duration-300"
            >
              All Services
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </motion.div>
        </div>

        {/* Service Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredServices.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group flex flex-col bg-white border border-slate-100 hover:border-emerald-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              {/* Badge */}
              {service.badge && (
                <div className="mb-3">
                  <span className="inline-block bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">
                    {service.badge}
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className="w-12 h-12 bg-emerald-50 group-hover:bg-emerald-100 rounded-xl flex items-center justify-center text-2xl mb-4 transition-colors">
                {service.emoji}
              </div>

              {/* Content */}
              <h3 className="font-bold text-slate-900 text-lg mb-2">{service.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed flex-1 mb-6">{service.desc}</p>

              {/* CTA */}
              <Link
                href={service.href}
                className="inline-flex items-center justify-center gap-2 w-full bg-slate-50 hover:bg-emerald-600 border border-slate-200 hover:border-emerald-600 text-slate-700 hover:text-white font-semibold text-sm py-2.5 rounded-xl transition-all duration-200"
              >
                {service.cta}
                <ArrowIcon />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}