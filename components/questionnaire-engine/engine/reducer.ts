/* eslint-disable @typescript-eslint/no-explicit-any */
// components/questionnaire-engine/engine/reducer.ts
//
// Generic reducer — has zero knowledge of any specific service. Field
// updates use dot-paths (e.g. "contact.email") so nested answer shapes
// work without the reducer needing per-service typing.

import type { QuestionnaireState, QuestionnaireAction } from "@/lib/questionnaires/types";

function setDeep(obj: Record<string, any>, path: string, value: any): Record<string, any> {
  const keys = path.split(".");
  const result = { ...obj };
  let cursor: Record<string, any> = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    cursor[key] = { ...(cursor[key] ?? {}) };
    cursor = cursor[key];
  }

  cursor[keys[keys.length - 1]] = value;
  return result;
}

export function questionnaireReducer(
  state: QuestionnaireState,
  action: QuestionnaireAction
): QuestionnaireState {
  switch (action.type) {
    case "HYDRATE_DRAFT":
      return {
        ...state,
        draftId: action.draft.id,
        packageTier: action.draft.packageTier,
        currentStepIndex: action.draft.currentStep,
        answers: action.draft.answers,
        orderNumber: action.draft.orderNumber,
        status: "ready",
      };

    case "SET_PACKAGE_TIER":
      return { ...state, packageTier: action.tier };

    case "UPDATE_FIELD":
      return { ...state, answers: setDeep(state.answers, action.name, action.value) };

    case "UPDATE_FIELDS": {
      let next = state.answers;
      for (const [name, value] of Object.entries(action.values)) {
        next = setDeep(next, name, value);
      }
      return { ...state, answers: next };
    }

    case "GO_NEXT":
      return { ...state, currentStepIndex: state.currentStepIndex + 1 };

    case "GO_BACK":
      return { ...state, currentStepIndex: Math.max(0, state.currentStepIndex - 1) };

    case "GO_TO_STEP":
      return { ...state, currentStepIndex: action.index };

    case "SET_STATUS":
      return { ...state, status: action.status, errorMessage: action.errorMessage ?? null };

    case "SUBMIT_SUCCESS":
      return { ...state, status: "submitted", orderNumber: action.orderNumber };

    default:
      return state;
  }
}

export function createInitialState(serviceSlug: string, packageTier: string | null): QuestionnaireState {
  return {
    draftId: null,
    serviceSlug,
    packageTier,
    currentStepIndex: 0,
    answers: {},
    status: "loading",
    errorMessage: null,
    orderNumber: null,
  };
}