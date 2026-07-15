/* eslint-disable @typescript-eslint/no-explicit-any */
// components/questionnaire-engine/engine/context.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import type { QuestionnaireConfig, StepConfig } from "@/lib/questionnaires/types";
import { questionnaireReducer, createInitialState } from "./reducer";
import {
  createDraft,
  fetchDraft,
  patchDraft,
  submitDraft,
  getStoredDraftId,
  setStoredDraftId,
  clearStoredDraftId,
} from "./draft-api";

interface QuestionnaireContextValue {
  config: QuestionnaireConfig;
  answers: Record<string, any>;
  packageTier: string | null;
  status: "loading" | "ready" | "saving" | "submitting" | "submitted" | "error";
  errorMessage: string | null;
  orderNumber: string | null;
  visibleSteps: StepConfig[];
  currentStepIndex: number;
  currentStep: StepConfig | null;
  isFirstStep: boolean;
  isLastStep: boolean;
  stepValidationErrors: Record<string, string>;
  updateField: (name: string, value: any) => void;
  updateFields: (values: Record<string, any>) => void;
  goNext: () => Promise<void>;
  goBack: () => void;
  goToStep: (index: number) => void;
  setPackageTier: (tier: string) => void;
  submit: () => Promise<void>;
}

const QuestionnaireContext = createContext<QuestionnaireContextValue | null>(null);

export function useQuestionnaire(): QuestionnaireContextValue {
  const ctx = useContext(QuestionnaireContext);
  if (!ctx) throw new Error("useQuestionnaire must be used within a QuestionnaireProvider");
  return ctx;
}

export function QuestionnaireProvider({
  config,
  initialPackageTier,
  children,
}: {
  config: QuestionnaireConfig;
  initialPackageTier: string | null;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(
    questionnaireReducer,
    createInitialState(config.serviceSlug, initialPackageTier)
  );
  const [stepValidationErrors, setStepValidationErrors] = useState<Record<string, string>>({});

  // ── Init: resume existing draft, or create a new one ───────────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const storedId = getStoredDraftId(config.serviceSlug);
      try {
        if (storedId) {
          const draft = await fetchDraft(storedId);
          if (cancelled) return;
          if (draft.status === "submitted") {
            // Previous draft already completed — start fresh.
            clearStoredDraftId(config.serviceSlug);
          } else {
            dispatch({ type: "HYDRATE_DRAFT", draft });
            return;
          }
        }
        const draft = await createDraft(config.serviceSlug, initialPackageTier);
        if (cancelled) return;
        setStoredDraftId(config.serviceSlug, draft.id);
        dispatch({ type: "HYDRATE_DRAFT", draft });
      } catch {
        if (!cancelled) {
          dispatch({ type: "SET_STATUS", status: "error", errorMessage: "Could not start your questionnaire. Please refresh." });
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.serviceSlug]);

  // ── Derived: visible steps recompute whenever answers change ───────────────
  const visibleSteps = useMemo(
    () => config.steps.filter((step) => !step.visibleIf || step.visibleIf({ ...state.answers, packageTier: state.packageTier })),
    [config.steps, state.answers, state.packageTier]
  );

  const currentStep = visibleSteps[state.currentStepIndex] ?? null;
  const isFirstStep = state.currentStepIndex === 0;
  const isLastStep = state.currentStepIndex === visibleSteps.length - 1;

  function updateField(name: string, value: any) {
    dispatch({ type: "UPDATE_FIELD", name, value });
  }

  function updateFields(values: Record<string, any>) {
    dispatch({ type: "UPDATE_FIELDS", values });
  }

  function setPackageTier(tier: string) {
    dispatch({ type: "SET_PACKAGE_TIER", tier });
  }

  function validateCurrentStep(): boolean {
    if (!currentStep?.validationSchema) {
      setStepValidationErrors({});
      return true;
    }
    const result = currentStep.validationSchema.safeParse(state.answers);
    if (result.success) {
      setStepValidationErrors({});
      return true;
    }
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      errors[issue.path.join(".")] = issue.message;
    }
    setStepValidationErrors(errors);
    return false;
  }

  async function persist(nextStepIndex: number) {
    if (!state.draftId) return;
    dispatch({ type: "SET_STATUS", status: "saving" });
    try {
      await patchDraft(state.draftId, {
        currentStep: nextStepIndex,
        answers: state.answers,
        packageTier: state.packageTier,
        contactEmail: state.answers?.contact?.email ?? undefined,
        contactPhone: state.answers?.contact?.phone ?? undefined,
      });
      dispatch({ type: "SET_STATUS", status: "ready" });
    } catch {
      dispatch({ type: "SET_STATUS", status: "error", errorMessage: "Could not save your progress. Check your connection." });
    }
  }

  async function goNext() {
    if (!validateCurrentStep()) return;
    const nextIndex = state.currentStepIndex + 1;
    dispatch({ type: "GO_NEXT" });
    await persist(nextIndex);
  }

  function goBack() {
    dispatch({ type: "GO_BACK" });
  }

  function goToStep(index: number) {
    dispatch({ type: "GO_TO_STEP", index });
  }

  async function submit() {
    if (!state.draftId) return;
    dispatch({ type: "SET_STATUS", status: "submitting" });
    try {
      await patchDraft(state.draftId, { answers: state.answers, packageTier: state.packageTier });
      const draft = await submitDraft(state.draftId);
      clearStoredDraftId(config.serviceSlug);
      dispatch({ type: "SUBMIT_SUCCESS", orderNumber: draft.orderNumber ?? "" });
    } catch {
      dispatch({ type: "SET_STATUS", status: "error", errorMessage: "Could not submit your order. Please try again." });
    }
  }

  const value: QuestionnaireContextValue = {
    config,
    answers: state.answers,
    packageTier: state.packageTier,
    status: state.status,
    errorMessage: state.errorMessage,
    orderNumber: state.orderNumber,
    visibleSteps,
    currentStepIndex: state.currentStepIndex,
    currentStep,
    isFirstStep,
    isLastStep,
    stepValidationErrors,
    updateField,
    updateFields,
    goNext,
    goBack,
    goToStep,
    setPackageTier,
    submit,
  };

  return <QuestionnaireContext.Provider value={value}>{children}</QuestionnaireContext.Provider>;
}