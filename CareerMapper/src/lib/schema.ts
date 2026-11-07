import { z } from "zod";

export const ConfidenceSchema = z.enum(["high", "medium", "low"]);

export const ArchetypeSchema = z.enum([
  "Student",
  "Builder",
  "Hustler",
  "Founder",
  "Investor",
  "Operator",
  "Other",
]);

export const EducationSchema = z.object({
  school: z.string(),
  degree: z.string().nullable(),
  startYear: z.number().nullable(),
  endYear: z.number().nullable(),
  notes: z.string().nullable(),
});

export const CareerStepSchema = z.object({
  role: z.string(),
  company: z.string(),
  archetype: ArchetypeSchema,
  startYear: z.number().nullable(),
  endYear: z.number().nullable(),
  estAgeStart: z.number().nullable(),
  estAgeEnd: z.number().nullable(),
  estCompUsd: z.union([
    z.number(),
    z.tuple([z.number(), z.number()]),
    z.null(),
  ]),
  estCompConfidence: ConfidenceSchema,
  keyDecisions: z.array(z.string()),
  lessons: z.array(z.string()),
  notes: z.string().nullable(),
});

export const ExitEventSchema = z.object({
  type: z.string(),
  year: z.number().nullable(),
  valueUsd: z.number().nullable(),
  notes: z.string().nullable(),
});

export const OutcomesSchema = z.object({
  estNetWorthUsd: z.union([z.string(), z.number(), z.null()]),
  exitEvents: z.array(ExitEventSchema),
  currentStatus: z.string(),
});

export const LessonSchema = z.object({
  lesson: z.string(),
  source: z.string().nullable(),
});

export const SourceSchema = z.object({
  title: z.string(),
  url: z.string().nullable(),
  type: z.enum([
    "article",
    "book",
    "interview",
    "podcast",
    "biography",
    "other",
  ]),
});

export const PersonSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "id must be kebab-case"),
  name: z.string(),
  birthYear: z.number().nullable(),
  countryOfOrigin: z.string(),
  currentCountry: z.string().nullable(),
  imageUrl: z.string().nullable().optional().transform((v) => v ?? null),
  archetypeArc: z.array(ArchetypeSchema),
  confidence: ConfidenceSchema,
  education: z.array(EducationSchema),
  careerSteps: z.array(CareerStepSchema),
  outcomes: OutcomesSchema,
  lessons: z.array(LessonSchema),
  sources: z.array(SourceSchema).min(1, "at least one source is required"),
  notes: z.string().nullable(),
  researchLinks: z
    .object({
      linkedin: z.string().nullable(),
      company: z.string().nullable(),
      others: z.array(z.string()),
      cluster: z.string(),
      hint: z.string(),
    })
    .optional(),
  studentEndYear: z.number().nullable().optional(),
  firstCompany: z
    .object({
      name: z.string(),
      year: z.number(),
      ageAtFounding: z.number().nullable(),
      era: z.enum(["pre-pc", "pc", "web", "mobile-cloud", "ai-revolution"]),
      country: z.string(),
      oneLiner: z.string(),
      preFounderRoles: z.array(
        z.object({
          type: z.enum([
            "Study",
            "VC",
            "Tech",
            "Consulting",
            "Sales-BD",
            "Side-business",
            "Operator",
            "Other",
          ]),
          org: z.string(),
          role: z.string(),
          startYear: z.number().nullable(),
          endYear: z.number().nullable(),
          notes: z.string().nullable(),
        }),
      ),
    })
    .nullable()
    .optional(),
  nowSummary: z.string().optional(),
});

export const ResearchLinksSchema = z.object({
  linkedin: z.string().nullable(),
  company: z.string().nullable(),
  others: z.array(z.string()),
  cluster: z.string(),
  hint: z.string(),
});

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
