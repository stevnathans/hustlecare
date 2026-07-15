// lib/questionnaires/business-registration/schema.ts
import { z } from "zod";

export const contactStepSchema = z.object({
  contact: z.object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Enter a valid email"),
    phone: z.string().min(6, "Enter a valid phone number"),
  }),
});

export const entityStepSchema = z.object({
  entity: z.object({
    businessType: z.string().min(1, "Select a business type"),
    proposedBusinessName: z.string().min(1, "Proposed business name is required"),
  }),
});