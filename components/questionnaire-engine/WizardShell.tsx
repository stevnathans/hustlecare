// components/questionnaire-engine/WizardShell.tsx
"use client";

import { useQuestionnaire } from "./engine/context";
import { StepContainer } from "./StepContainer";
import { ReviewScreen } from "./ReviewScreen";
import { ConfirmationScreen } from "./ConfirmationScreen";

export function WizardShell() {
  const {
    config,
    status,
    visibleSteps,
    currentStepIndex,
    currentStep,
    isFirstStep,
    isLastStep,
    goNext,
    goBack,
    submit,
    orderNumber,
  } = useQuestionnaire();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-500">
          <span className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          Setting things up…
        </div>
      </div>
    );
  }

  if (status === "submitted") {
    return <ConfirmationScreen orderNumber={orderNumber ?? ""} />;
  }

  // "Review" is a virtual final step, one past the last real step.
  const isReviewStep = currentStepIndex === visibleSteps.length;

  const progressPct = Math.round(
    (Math.min(currentStepIndex, visibleSteps.length) / visibleSteps.length) * 100
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-700">{config.serviceName}</span>
            <span className="text-xs text-slate-400">
              {status === "saving" ? "Saving…" : "Saved"} · ~{config.estimatedMinutes} min total
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {isReviewStep
              ? "Review your answers"
              : `Step ${currentStepIndex + 1} of ${visibleSteps.length}`}
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10">
        {isReviewStep ? (
          <ReviewScreen onSubmit={submit} onEditStep={() => goBack()} />
        ) : currentStep ? (
          <StepContainer step={currentStep} />
        ) : null}
      </main>

      {/* Footer nav */}
      {!isReviewStep && (
        <footer className="sticky bottom-0 bg-white border-t border-slate-200">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <button
              onClick={goBack}
              disabled={isFirstStep}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 disabled:opacity-0 disabled:pointer-events-none hover:bg-slate-100 transition-colors"
            >
              Back
            </button>
            <button
              onClick={goNext}
              className="px-7 py-2.5 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-md shadow-emerald-100"
            >
              {isLastStep ? "Review" : "Next"}
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}