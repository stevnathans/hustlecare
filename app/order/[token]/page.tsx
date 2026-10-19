// app/order/[token]/page.tsx
//
// The customer's private page for one service order. The long random token
// in the address is the only key, so the page is never indexed and never
// leaks its address to other sites.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FiCheckCircle, FiDownload, FiLock } from "react-icons/fi";
import { prisma } from "@/lib/prisma";
import { createSignedDownloadUrl } from "@/lib/storage/privateStorage";
import { getDeep } from "@/lib/questionnaires/get-deep";
import { getQuestionnaireConfig } from "@/lib/questionnaires/registry";
import { getPaymentMode } from "@/lib/applyAssistance/lifecycle";
import { nextPayable } from "@/lib/services/orders/lifecycle";
import { formatPhoneLocal, normalizeKenyanPhone } from "@/lib/phone";
import OrderClient from "./OrderClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Your order | Hustlecare",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const ksh = (n: number) => `KSh ${Math.round(n).toLocaleString("en-US")}`;
const dateFmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

async function linkFor(file: { id: string; label: string; fileName: string; storagePath: string }) {
  try {
    return { id: file.id, label: file.label, fileName: file.fileName, url: await createSignedDownloadUrl(file.storagePath, 3600, file.fileName) };
  } catch {
    return { id: file.id, label: file.label, fileName: file.fileName, url: null as string | null };
  }
}

export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const order = await prisma.questionnaireDraft.findUnique({ where: { publicToken: token }, include: { files: { orderBy: { createdAt: "asc" } } } });
  if (!order || order.stage === "DRAFT") notFound();

  const [service, specs] = await Promise.all([
    prisma.service.findUnique({ where: { slug: order.serviceSlug }, select: { name: true } }),
    prisma.serviceDocumentSpec.findMany({ where: { service: { slug: order.serviceSlug } }, orderBy: { displayOrder: "asc" } }),
  ]);
  const serviceName = service?.name ?? getQuestionnaireConfig(order.serviceSlug)?.serviceName ?? order.serviceSlug;
  const customerName = String(getDeep((order.answers ?? {}) as Record<string, never>, "contact.fullName") ?? "").trim();

  const stage = order.stage;
  const payable = nextPayable(order);
  const hasBalance = (order.balanceAmount ?? 0) > 0;
  const previews = await Promise.all(order.files.filter((f) => f.kind === "PREVIEW").map(linkFor));
  const finalFiles = order.files.filter((f) => f.kind === "FINAL");
  const finals = stage === "COMPLETED" ? await Promise.all(finalFiles.map(linkFor)) : [];
  const customerFiles = order.files.filter((f) => f.kind === "CUSTOMER_FILE");

  const steps = [
    { key: "AWAITING_DEPOSIT", label: order.totalAmount ? "Payment" : "Received" },
    { key: "IN_PROGRESS", label: "In progress" },
    { key: "IN_REVIEW", label: "Review" },
    ...(hasBalance ? [{ key: "AWAITING_BALANCE", label: "Final payment" }] : []),
    { key: "COMPLETED", label: "Done" },
  ];
  const at = stage === "CANCELLED" ? -1 : steps.findIndex((s) => s.key === stage);
  const phoneE164 = normalizeKenyanPhone(order.contactPhone);
  const revisionsLeft = Math.max(0, (order.revisionsAllowed ?? 0) - order.revisionsUsed);

  return (
    <div className="container mx-auto px-4 py-10 max-w-xl">
      <p className="text-sm font-medium text-emerald-700 mb-1">Your order</p>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">{serviceName}</h1>
      <p className="text-sm text-slate-600 mb-6">
        {order.packageName ? `${order.packageName} package · ` : ""}
        {order.orderNumber}
        {customerName ? ` · ${customerName}` : ""}
      </p>

      {stage === "CANCELLED" ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 mb-6">
          <p className="font-semibold text-slate-900">This order was cancelled</p>
          <p className="text-sm text-slate-600 mt-1">
            {order.cancelReason ? `${order.cancelReason} ` : ""}If that is not what you expected, reply to any of our emails and we will sort it out.
          </p>
        </div>
      ) : (
        <ol className="flex gap-2 mb-6" aria-label="Progress">
          {steps.map((s, i) => {
            const done = i < at || stage === "COMPLETED";
            return (
              <li key={s.key} className="flex-1 text-center">
                <div
                  className={`mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                    done ? "bg-emerald-600 text-white" : i === at ? "border-2 border-emerald-600 text-emerald-700" : "border border-slate-300 text-slate-400"
                  }`}
                >
                  {done ? <FiCheckCircle size={16} /> : i + 1}
                </div>
                <p className={`text-xs ${done || i === at ? "font-medium text-slate-900" : "text-slate-500"}`}>{s.label}</p>
              </li>
            );
          })}
        </ol>
      )}

      {stage === "IN_PROGRESS" && (
        <p className="text-sm text-slate-700 mb-5">
          We are working on your order.
          {order.dueDate ? ` We expect to deliver by ${dateFmt(order.dueDate)}.` : ""}
          {order.revisionsUsed > 0 ? " We have your change request and are on it." : ""}
        </p>
      )}
      {stage === "AWAITING_DEPOSIT" && !payable && (
        <p className="text-sm text-slate-700 mb-5">We have your order and will contact you shortly with the price and next steps.</p>
      )}
      {stage === "AWAITING_BALANCE" && (
        <p className="text-sm text-slate-700 mb-5">Your work is ready. Pay the balance below and the final files unlock straight away.</p>
      )}

      {order.totalAmount ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 mb-5 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Total</span><span className="font-semibold text-slate-900">{ksh(order.totalAmount)}</span></div>
          {hasBalance && (
            <>
              <div className="flex justify-between mt-1"><span className="text-slate-500">Deposit</span><span className="text-slate-700">{ksh(order.depositAmount ?? 0)}</span></div>
              <div className="flex justify-between mt-1"><span className="text-slate-500">Balance</span><span className="text-slate-700">{ksh(order.balanceAmount ?? 0)}</span></div>
            </>
          )}
        </div>
      ) : null}

      {previews.length > 0 && stage !== "CANCELLED" && stage !== "AWAITING_DEPOSIT" && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 mb-5">
          <p className="font-semibold text-slate-900 mb-3">{stage === "IN_REVIEW" ? "Your preview" : "Previews"}</p>
          <ul className="space-y-2">
            {previews.map((f) => (
              <li key={f.id}>
                {f.url ? (
                  <a href={f.url} className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline"><FiDownload size={15} /> {f.label} <span className="text-slate-400">({f.fileName})</span></a>
                ) : (
                  <span className="text-sm text-slate-500">{f.label}: link unavailable, please refresh.</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {stage === "AWAITING_BALANCE" && finalFiles.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 mb-5 flex items-start gap-3">
          <FiLock className="mt-0.5 text-slate-400" size={18} />
          <p className="text-sm text-slate-600">{finalFiles.length} final file{finalFiles.length === 1 ? "" : "s"} will unlock when the balance is paid.</p>
        </div>
      )}

      {stage === "COMPLETED" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 mb-5">
          <p className="font-semibold text-slate-900 mb-3">Your final files are ready</p>
          <ul className="space-y-2">
            {finals.map((f) => (
              <li key={f.id}>
                {f.url ? (
                  <a href={f.url} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"><FiDownload size={15} /> {f.label}</a>
                ) : (
                  <span className="text-sm text-slate-600">{f.label}: link unavailable, please refresh.</span>
                )}
              </li>
            ))}
            {finals.length === 0 && <li className="text-sm text-slate-600">We will send your files by email shortly.</li>}
          </ul>
        </div>
      )}

      <OrderClient
        token={token}
        stage={stage}
        payable={payable ? { kind: payable.kind, amount: payable.amount } : null}
        paymentMode={getPaymentMode()}
        defaultPhone={phoneE164 ? formatPhoneLocal(phoneE164) : order.contactPhone ?? ""}
        canUpload={["AWAITING_DEPOSIT", "IN_PROGRESS", "IN_REVIEW"].includes(stage)}
        specs={specs.map((s) => ({ id: s.id, label: s.label, description: s.description, isRequired: s.isRequired }))}
        files={customerFiles.map((f) => ({ id: f.id, specId: f.specId, label: f.label, fileName: f.fileName }))}
        revisionsLeft={revisionsLeft}
        revisionsAllowed={order.revisionsAllowed ?? 0}
        orderRef={order.orderNumber ?? ""}
      />

      <p className="text-xs text-slate-500 mt-8">
        Keep this page&apos;s link private. Anyone with it can see your order. Questions? Reply to any email from us.
      </p>
    </div>
  );
}