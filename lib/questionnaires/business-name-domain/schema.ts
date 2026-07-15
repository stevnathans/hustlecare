// lib/questionnaires/business-name-domain/schema.ts
import { z } from "zod";

export const contactStepSchema = z.object({
  contact: z.object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Enter a valid email"),
    phone: z.string().min(6, "Enter a valid phone number"),
  }),
});