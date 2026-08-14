import { z } from "zod";

export const dataItemSchema = z.object({
  field: z.string().min(1).max(500),
  value: z.string().max(2000),
});

export const scenarioInputSchema = z.object({
  env: z.string().trim().min(1).max(255),
  epic: z.string().trim().min(1).max(255),
  scenario: z.string().trim().min(1).max(255),
  identifier: z.string().trim().min(1).max(255),
  link: z
    .string()
    .trim()
    .max(2048)
    .refine((val) => /^https?:\/\//i.test(val), {
      message: "link must be an http(s) URL",
    })
    .optional(),
  data: z.array(dataItemSchema).optional(),
  note: z.string().max(5000).optional(),
});

export type ScenarioInput = z.infer<typeof scenarioInputSchema>;

export const noteInputSchema = z.object({
  note: z.string().max(5000),
});
