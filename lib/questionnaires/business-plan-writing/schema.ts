// lib/questionnaires/business-plan-writing/schema.ts
import { z } from "zod";

// Each schema validates only the fields that matter for that step. Fields
// not marked `required` in config.ts are left optional here too, per the
// "allow skipping optional questions" requirement.

export const step1ContactSchema = z.object({
  contact: z.object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Enter a valid email"),
    phone: z.string().min(6, "Enter a valid phone number"),
    businessName: z.string().min(1, "Business name is required"),
    businessLocation: z.string().min(1, "Business location is required"),
    preferredCommunication: z.string().optional(),
    country: z.string().min(1, "Country is required"),
  }),
});

export const step2BusinessOverviewSchema = z.object({
  businessOverview: z.object({
    businessStage: z.string().min(1, "Select your business stage"),
    offeringType: z.string().min(1, "Select what your business offers"),
    description: z.string().min(10, "Give a short description (at least a sentence or two)"),
    mission: z.string().optional(),
    vision: z.string().optional(),
    goals: z.string().optional(),
    businessModel: z.string().optional(),
    problemSolved: z.string().optional(),
    usp: z.string().optional(),
  }),
});

export const step9LegalSchema = z.object({
  legal: z.object({
    registrationStatus: z.string().min(1, "Select your registration status"),
  }).passthrough(),
});

export const step12FundingSchema = z.object({
  funding: z.object({
    needsFunding: z.string().min(1, "Let us know if you need funding"),
  }).passthrough(),
});

export const step15FinalNotesSchema = z.object({
  finalNotes: z
    .object({
      deadline: z.string().optional(),
    })
    .optional(),
});

// Steps 3, 4, 5, 6, 7, 8, 10, 11, 13, 14 have no strictly required fields —
// everything on them is optional/skippable per the spec, so no schema is
// attached in config.ts for those (the engine treats a missing
// validationSchema as "always valid, allow Next").