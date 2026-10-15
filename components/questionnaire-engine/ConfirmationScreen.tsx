// components/questionnaire-engine/ConfirmationScreen.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuestionnaire } from "./engine/context";
import PayPanel from "@/components/orders/PayPanel";
import type { ApplyPaymentMode } from "@/lib/applyAssistance/config";

const WHATSAPP_NUMBER = "254713140158";
const SUPPORT_EMAIL = "services@hustlecare.net";

interface Summary {
  stage: string;
  packageName: string | null;
  totalAmount: number | null;
  depositAmount: number | null;
  balanceAmount: number | null;
  paymentMode: ApplyPaymentMode;
  payable: { kind: "DEPOSIT" | "FULL" | "BALANCE"; amount: number } | null;
  contactPhone: string;
}

const ksh = (n: number) => `KSh ${Math.round(n).toLocaleString("en-US")}`;

export function ConfirmationScreen({ orderNumber }: { orderNumber: string }) {
  const { config, publicToken } = useQuestionnaire();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!publicToken) return;
    fetch(`/api/service-orders/${publicToken}`)
      .then((r) => r.json())
      .then((d) => setSummary(d))
      .catch(() => {});
  }, [publicToken]);

  const orderHref = publicToken ? `/order/${publicToken}` : null;
  const mustPay = !!summary?.payable && !paid;
  const hasBalance = (summary?.balanceAmount ?? 0) > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5 text-2xl">✓</div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
            {mustPay ? "One last step: pay the deposit" : "You're all set!"}
          </h1>
          <p className="text-slate-500 leading-relaxed mb-6">
            {mustPay
              ? `We have received your ${config.serviceName.toLowerCase()} order. Pay the ${hasBalance ? "deposit" : "fee"} and we start work straight away.`
              : paid
                ? `Payment received. Our team has started on your ${config.serviceName.toLowerCase()}.`
                : `We've received your ${config.serviceName.toLowerCase()} order. Our team will contact you shortly.`}
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-center">
          <div className="text-xs text-slate-400 font-medium mb-1">Order reference</div>
          <div className="text-lg font-bold text-slate-800 tracking-wide">{orderNumber}</div>
          {summary?.packageName && <div className="text-xs text-slate-500 mt-1">{summary.packageName} package</div>}
        </div>

        {mustPay && summary?.payable && publicToken && (
          <div className="mb-6">
            <PayPanel
              token={publicToken}
              amount={summary.payable.amount}
              label={summary.payable.kind === "DEPOSIT" ? "deposit" : "fee"}
              paymentMode={summary.paymentMode}
              defaultPhone={summary.contactPhone}
              onPaid={() => setPaid(true)}
            />
            {hasBalance && summary.balanceAmount !== null && (
              <p className="text-xs text-slate-500 mt-3 text-center">
                The remaining {ksh(summary.balanceAmount)} is only due when your work is ready.
              </p>
            )}
          </div>
        )}

        <div className="text-left bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6">
          <p className="text-sm text-slate-700 font-semibold mb-1.5">Have files to share? (logo, documents, photos)</p>
          <p className="text-sm text-slate-600 leading-relaxed">
            {orderHref ? (
              <>
                Upload them on your{" "}
                <Link href={orderHref} className="text-emerald-700 font-semibold underline">
                  order page
                </Link>
                , where you can also follow progress. We emailed you the link.
              </>
            ) : (
              <>
                Send them via WhatsApp to{" "}
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="text-emerald-600 font-semibold">+{WHATSAPP_NUMBER}</a> or email{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-emerald-600 font-semibold">{SUPPORT_EMAIL}</a>, quoting <strong>{orderNumber}</strong>.
              </>
            )}
          </p>
        </div>

        {orderHref && (
          <Link
            href={orderHref}
            className="inline-flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors mb-3"
          >
            Go to my order
          </Link>
        )}
        <Link href="/services" className="inline-flex items-center justify-center w-full text-sm font-semibold text-slate-600 hover:text-slate-900 py-2">
          Explore more services
        </Link>
      </div>
    </div>
  );
}