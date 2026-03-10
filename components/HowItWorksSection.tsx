"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { FiPlus, FiCheck, FiShoppingCart, FiChevronDown, FiTrash2 } from "react-icons/fi";

// ─── Shared animation helper ──────────────────────────────────────────────────
const easing = [0.22, 1, 0.36, 1] as const;
function fadeUpProps(delay = 0, inView = true) {
  return {
    initial: { opacity: 0, y: 36 },
    animate: inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 },
    transition: { duration: 0.7, ease: easing, delay },
  };
}

// ─── Step pill ────────────────────────────────────────────────────────────────
function StepPill({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-600 text-white font-black text-sm shadow-md shadow-emerald-300">
        {number}
      </span>
      <span className="text-xs font-bold tracking-widest uppercase text-emerald-600">
        {label}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCKUP 1 — Requirements list
// ═══════════════════════════════════════════════════════════════════════════════
function RequirementsMockup() {
  const requirements = [
    { name: "Business Registration", necessity: "required", productCount: 3, lowestPrice: 4500 },
    { name: "Business Permit", necessity: "required", productCount: 2, lowestPrice: 2000 },
    { name: "Tax Registration (KRA PIN)", necessity: "required", productCount: 1, lowestPrice: 0 },
    { name: "Logo Design", necessity: "optional", productCount: 5, lowestPrice: 1500 },
    { name: "Office Space Lease", necessity: "optional", productCount: 0, lowestPrice: 0 },
  ];

  return (
    <div className="w-full space-y-2.5 pointer-events-none select-none">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Legal Requirements
        </span>
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-[10px] text-slate-400">5 items</span>
      </div>

      {requirements.map((req, i) => {
        const isRequired = req.necessity === "required";
        return (
          <motion.div
            key={req.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.1, duration: 0.45, ease: "easeOut" }}
            className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 flex items-center gap-3"
          >
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-base">
                📋
              </div>
              <div
                className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                  isRequired ? "bg-emerald-50" : "bg-amber-50"
                }`}
              >
                {isRequired
                  ? <CheckCircleIcon className="h-2.5 w-2.5 text-emerald-600" />
                  : <ExclamationTriangleIcon className="h-2.5 w-2.5 text-amber-500" />}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate mb-1">{req.name}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold border ${
                    isRequired
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${isRequired ? "bg-green-500" : "bg-amber-500"}`} />
                  {req.necessity}
                </span>
                {req.productCount > 0 && (
                  <span className="flex items-center gap-0.5 text-[9px] text-slate-400">
                    <ShoppingBagIcon className="h-2.5 w-2.5 text-blue-400" />
                    {req.productCount} options
                  </span>
                )}
                {req.lowestPrice > 0 && (
                  <span className="flex items-center gap-0.5 text-[9px] font-semibold text-emerald-600">
                    <CurrencyDollarIcon className="h-2.5 w-2.5" />
                    KSh {req.lowestPrice.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <button className="flex-shrink-0 flex items-center gap-0.5 px-2 py-1 rounded-lg bg-slate-50 text-slate-500 text-[9px] font-semibold border border-slate-100">
              View <FiChevronDown size={9} />
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCKUP 2 — Product cards with add-to-cart
// ═══════════════════════════════════════════════════════════════════════════════
function ProductCardMockup() {
  const products = [
    { name: "eCitizen Business Registration", price: 950, vendor: "eCitizen", added: true },
    { name: "Huduma Centre Express", price: 1500, vendor: "Huduma Centre", added: false },
    { name: "KRA PIN + Registration Bundle", price: 2200, vendor: "KRA Portal", added: false },
  ];

  return (
    <div className="w-full pointer-events-none select-none">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-slate-800">Business Registration</h3>
          <p className="text-[9px] text-slate-400">3 products available</p>
        </div>
        <span className="text-[10px] font-bold text-emerald-600">From KSh 950</span>
      </div>

      <div className="space-y-2.5">
        {products.map((product, i) => (
          <motion.div
            key={product.name}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.15, duration: 0.45 }}
            className={`bg-white rounded-xl border p-3 shadow-sm ${
              product.added ? "border-emerald-300 ring-1 ring-emerald-100" : "border-slate-100"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex-shrink-0 flex items-center justify-center text-base">
                🏛️
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-slate-900 leading-tight truncate">{product.name}</p>
                <p className="text-[9px] text-slate-400">by {product.vendor}</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">KSh {product.price.toLocaleString()}</p>
              </div>
              <button
                className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold ${
                  product.added ? "bg-emerald-500 text-white" : "bg-emerald-500 text-white"
                }`}
              >
                {product.added ? <><FiCheck size={10} /> Added</> : <><FiPlus size={10} /> Add</>}
              </button>
            </div>
            {product.added && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "100%", opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.4, ease: "easeOut" }}
                className="mt-2 flex items-center gap-1 text-[9px] text-emerald-600 font-medium"
              >
                <FiCheck size={9} /> 1 item in your list
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.9, duration: 0.35 }}
        className="mt-3.5 flex items-center gap-2 bg-emerald-600 text-white px-3.5 py-2 rounded-xl shadow-md shadow-emerald-200 text-[10px] font-semibold"
      >
        <FiCheck size={11} />
        eCitizen Registration added to your list!
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCKUP 3 — Cost Calculator
// ═══════════════════════════════════════════════════════════════════════════════
function CostCalculatorMockup() {
  const categories = [
    {
      name: "Legal",
      subtotal: 5450,
      items: [
        { name: "eCitizen Business Registration", qty: 1, price: 950 },
        { name: "Single Business Permit", qty: 1, price: 4500 },
      ],
    },
    {
      name: "Branding",
      subtotal: 3500,
      items: [{ name: "Logo Design Package", qty: 1, price: 3500 }],
    },
    {
      name: "Equipment",
      subtotal: 12000,
      items: [
        { name: "POS System", qty: 1, price: 8500 },
        { name: "Receipt Printer", qty: 1, price: 3500 },
      ],
    },
  ];
  const total = categories.reduce((acc, c) => acc + c.subtotal, 0);

  return (
    <div className="w-full pointer-events-none select-none">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <div className="p-1 bg-emerald-100 rounded-md">
            <FiShoppingCart size={12} className="text-emerald-600" />
          </div>
          <span className="text-xs font-bold text-slate-800">Cafe Requirements</span>
        </div>
        <span className="text-[9px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">4 items</span>
      </div>

      <div className="space-y-1.5 mb-3">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.12, duration: 0.4 }}
            className="border border-slate-200 rounded-xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-3 py-2 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <FiChevronDown size={11} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-700">{cat.name}</span>
                <span className="text-[9px] text-slate-400">{cat.items.length} items</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600">KSh {cat.subtotal.toLocaleString()}</span>
            </div>
            <div className="bg-white p-1.5 space-y-1">
              {cat.items.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-semibold text-slate-700 truncate">{item.name}</p>
                    <p className="text-[9px] text-slate-400">KSh {item.price.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button className="w-4 h-4 rounded bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500">−</button>
                    <span className="w-4 text-center text-[9px] font-bold text-slate-700">{item.qty}</span>
                    <button className="w-4 h-4 rounded bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500">+</button>
                  </div>
                  <FiTrash2 size={9} className="text-red-400 ml-0.5" />
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl px-3.5 py-2.5 flex justify-between items-center"
      >
        <div>
          <p className="text-[9px] text-slate-500 mb-0.5">Total Estimated Cost</p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.35 }}
            className="text-lg font-black text-emerald-700"
          >
            KSh {total.toLocaleString()}
          </motion.p>
        </div>
        <div className="bg-emerald-100 text-emerald-700 rounded-full px-2.5 py-1 text-[9px] font-bold flex items-center gap-1">
          <FiShoppingCart size={10} /> 4 items
        </div>
      </motion.div>

      <div className="flex gap-1.5 mt-2.5">
        <button className="flex-1 bg-emerald-600 text-white rounded-lg py-1.5 text-[9px] font-bold">Save List</button>
        <button className="flex-1 bg-blue-600 text-white rounded-lg py-1.5 text-[9px] font-bold">Download PDF</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLANTED MOCKUP FRAME
// Produces a leaning-phone 3D effect via rotateY + rotateX
// tiltLeft=true leans the top toward the viewer on the left side
// ═══════════════════════════════════════════════════════════════════════════════
function MockupFrame({
  children,
  inView,
  tiltLeft,
  accentColor,
}: {
  children: React.ReactNode;
  inView: boolean;
  tiltLeft: boolean;
  accentColor: string;
}) {
  // Final resting tilt: ~16° rotateY to lean the card, 5° rotateX to lean top back
  const targetRotateY = tiltLeft ? 16 : -16;
  const targetRotateX = 5;

  return (
    <div style={{ perspective: "900px" }} className="w-full max-w-sm mx-auto">
      <motion.div
        initial={{ opacity: 0, rotateY: tiltLeft ? 40 : -40, rotateX: 12, scale: 0.88 }}
        animate={
          inView
            ? { opacity: 1, rotateY: targetRotateY, rotateX: targetRotateX, scale: 1 }
            : { opacity: 0, rotateY: tiltLeft ? 40 : -40, rotateX: 12, scale: 0.88 }
        }
        transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformStyle: "preserve-3d", willChange: "transform" }}
        className="relative"
      >
        {/* Main card face */}
        <div
          className="relative rounded-2xl bg-white border border-slate-200 overflow-hidden"
          style={{
            boxShadow: tiltLeft
              ? "-24px 32px 56px -8px rgba(0,0,0,0.16), -4px 8px 20px -4px rgba(0,0,0,0.08)"
              : "24px 32px 56px -8px rgba(0,0,0,0.16), 4px 8px 20px -4px rgba(0,0,0,0.08)",
          }}
        >
          {/* Browser chrome bar */}
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-100 bg-slate-50/80">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <div className="ml-2 flex-1 h-4 bg-slate-200 rounded-full" />
          </div>

          {/* Content */}
          <div className="p-4">{children}</div>

          {/* Fade-out overlay at the bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/75 to-transparent pointer-events-none" />
        </div>

        {/* Thin side-depth panel to reinforce 3D illusion */}
        <div
          className="absolute top-3 bottom-3 w-2.5 rounded-r-lg"
          style={{
            [tiltLeft ? "right" : "left"]: "-9px",
            background: "linear-gradient(to right, rgba(0,0,0,0.12), rgba(0,0,0,0.03))",
            transform: "rotateY(90deg)",
          }}
        />

        {/* Colour-tinted ground shadow */}
        <div
          className={`absolute -bottom-4 blur-2xl opacity-30 rounded-full ${accentColor}`}
          style={{ left: "12%", right: "12%", height: "24px" }}
        />
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP SECTION
// ═══════════════════════════════════════════════════════════════════════════════
interface StepSectionProps {
  stepNumber: string;
  stepLabel: string;
  title: string;
  description: string;
  mockup: React.ReactNode;
  accentColor: string;
  reverse?: boolean;
}

function StepSection({
  stepNumber,
  stepLabel,
  title,
  description,
  mockup,
  accentColor,
  reverse = false,
}: StepSectionProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  // When mockup is on the LEFT (reverse=false), tilt it left so shadow goes right
  // When mockup is on the RIGHT (reverse=true), tilt it right so shadow goes left
  const tiltLeft = !reverse;

  return (
    <div
      ref={ref}
      className={`flex flex-col ${reverse ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-12 lg:gap-0`}
    >
      {/* Mockup column */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 lg:px-10 order-1">
        <MockupFrame inView={inView} tiltLeft={tiltLeft} accentColor={accentColor}>
          {mockup}
        </MockupFrame>
      </div>

      {/* Text column */}
      <div
        className={`w-full lg:w-1/2 px-6 lg:px-16 flex flex-col order-2 ${
          reverse ? "lg:items-end lg:text-right" : ""
        }`}
      >
        <motion.div {...fadeUpProps(0, inView)}>
          <StepPill number={stepNumber} label={stepLabel} />
        </motion.div>

        <motion.h2
          {...fadeUpProps(0.1, inView)}
          className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-slate-900 leading-tight mb-4 tracking-tight"
        >
          {title}
        </motion.h2>

        <motion.p
          {...fadeUpProps(0.2, inView)}
          className="text-slate-500 text-lg leading-relaxed max-w-md"
        >
          {description}
        </motion.p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export function HowItWorksSection() {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-80px" });

  const steps = [
    {
      stepNumber: "01",
      stepLabel: "Discover",
      title: "Find every requirement your business needs",
      description:
        "Explore a structured list of legal, equipment, software, branding, and operational requirements—specific to your business type. Nothing missed, nothing guessed.",
      mockup: <RequirementsMockup />,
      accentColor: "bg-emerald-300",
      reverse: false,
    },
    {
      stepNumber: "02",
      stepLabel: "Customize",
      title: "Pick the exact products that fit your budget",
      description:
        "For each requirement, browse curated product options and add the ones you want. Build your startup list one smart choice at a time.",
      mockup: <ProductCardMockup />,
      accentColor: "bg-emerald-300",
      reverse: true,
    },
    {
      stepNumber: "03",
      stepLabel: "Calculate",
      title: "See your full startup cost in real time",
      description:
        "Instantly see your total estimated startup cost broken down by category. Save, share, or download your list as a PDF—ready for investors or personal planning.",
      mockup: <CostCalculatorMockup />,
      accentColor: "bg-emerald-300",
      reverse: false,
    },
  ];

  return (
    <section
      className="relative overflow-hidden py-24 sm:py-32"
      style={{
        background: "linear-gradient(160deg, #f0fdf4 0%, #ffffff 45%, #f0fdf4 100%)",
      }}
    >
      {/* Subtle dot-grid background texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: "radial-gradient(circle, #bbf7d0 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />

      {/* Soft corner blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full bg-emerald-100 blur-3xl opacity-50"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-40 w-[480px] h-[480px] rounded-full bg-emerald-100 blur-3xl opacity-50"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div ref={headerRef} className="text-center mb-20 lg:mb-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold tracking-widest uppercase mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              How It Works
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight tracking-tight mb-5"
          >
            Idea to launch in{" "}
            <span className="text-emerald-600">three steps</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-slate-500 text-xl max-w-2xl mx-auto leading-relaxed"
          >
            Hustlecare cuts through the noise so you can go from business idea
            to a fully costed launch plan — without the guesswork.
          </motion.p>
        </div>

        {/* Steps */}
        <div className="space-y-28 lg:space-y-40">
          {steps.map((step, i) => (
            <div key={step.stepLabel}>
              <StepSection {...step} />

              {i < steps.length - 1 && (
                <div className="hidden lg:flex justify-center mt-16">
                  <div className="flex flex-col items-center gap-1.5">
                    {[0, 1, 2, 3].map((dot) => (
                      <motion.div
                        key={dot}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: dot * 0.07, duration: 0.25 }}
                        className="w-1 h-1 rounded-full bg-emerald-300"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mt-24 text-center"
        >
          <a
            href="/businesses"
            className="inline-flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-lg px-10 py-4 rounded-2xl shadow-xl shadow-emerald-200 transition-all duration-200"
          >
            Start Building Your Business
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}