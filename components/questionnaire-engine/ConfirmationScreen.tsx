// components/questionnaire-engine/ConfirmationScreen.tsx
"use client";

import Link from "next/link";
import { useQuestionnaire } from "./engine/context";

const WHATSAPP_NUMBER = "254700000000"; // TODO: replace with real Hustlecare WhatsApp number
const SUPPORT_EMAIL = "plan@hustlecare.net"; // TODO: confirm per-service or shared inbox

export function ConfirmationScreen({ orderNumber }: { orderNumber: string }) {
  const { config } = useQuestionnaire();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5 text-2xl">
          ✓
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">You&apos;re all set!</h1>
        <p className="text-slate-500 leading-relaxed mb-6">
          We&apos;ve received your {config.serviceName.toLowerCase()} order. Our team will begin working
          on it shortly.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
          <div className="text-xs text-slate-400 font-medium mb-1">Order Reference</div>
          <div className="text-lg font-bold text-slate-800 tracking-wide">{orderNumber}</div>
        </div>

        <div className="text-left bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-8">
          <p className="text-sm text-slate-700 font-semibold mb-1.5">Have files to share? (logo, documents, photos)</p>
          <p className="text-sm text-slate-600 leading-relaxed">
            Send them via WhatsApp to{" "}
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="text-emerald-600 font-semibold">
              +{WHATSAPP_NUMBER}
            </a>{" "}
            or email{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-emerald-600 font-semibold">
              {SUPPORT_EMAIL}
            </a>
            , and mention your order reference <strong>{orderNumber}</strong>.
          </p>
        </div>

        <Link
          href="/services"
          className="inline-flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Explore More Services
        </Link>
      </div>
    </div>
  );
}