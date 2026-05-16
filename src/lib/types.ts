// Mirrors /data/SCHEMA.md. Keep in sync.

export type Archetype =
  | "Student"
  | "Builder"
  | "Hustler"
  | "Founder"
  | "Investor"
  | "Operator"
  | "Other";

// Visualization lane order, top → bottom on screen
export const ARCHETYPE_LANES: Archetype[] = [
  "Investor",
  "Operator",
  "Founder",
  "Hustler",
  "Builder",
  "Student",
];

export type Era = "pre-pc" | "pc" | "web" | "mobile-cloud" | "ai-revolution";

export const ERAS: {
  id: Era;
  label: string;
  startYear: number;
  endYear: number | null;
}[] = [
  { id: "pre-pc", label: "Pre-PC", startYear: 1900, endYear: 1979 },
  { id: "pc", label: "PC era", startYear: 1980, endYear: 1994 },
  { id: "web", label: "Web", startYear: 1995, endYear: 2006 },
  { id: "mobile-cloud", label: "Mobile/Cloud", startYear: 2007, endYear: 2018 },
  { id: "ai-revolution", label: "AI revolution", startYear: 2019, endYear: null },
];

export type Confidence = "high" | "medium" | "low";

export type Education = {
  school: string;
  degree: string | null;
  startYear: number | null;
  endYear: number | null;
  notes: string | null;
};

export type CareerStep = {
  role: string;
  company: string;
  archetype: Archetype;
  startYear: number | null;
  endYear: number | null;
  estAgeStart: number | null;
  estAgeEnd: number | null;
  estCompUsd: number | [number, number] | null;
  estCompConfidence: Confidence;
  keyDecisions: string[];
  lessons: string[];
  notes: string | null;
};

export type ExitEvent = {
  type: string;
  year: number | null;
  valueUsd: number | null;
  notes: string | null;
};

export type Outcomes = {
  estNetWorthUsd: string | number | null;
  exitEvents: ExitEvent[];
  currentStatus: string;
};

export type Lesson = {
  lesson: string;
  source: string | null;
};

export type Source = {
  title: string;
  url: string | null;
  type: "article" | "book" | "interview" | "podcast" | "biography" | "other";
};

export type Person = {
  id: string;
  name: string;
  birthYear: number | null;
  countryOfOrigin: string;
  currentCountry: string | null;
  imageUrl: string | null;
  archetypeArc: Archetype[];
  confidence: Confidence;
  education: Education[];
  careerSteps: CareerStep[];
  outcomes: Outcomes;
  lessons: Lesson[];
  sources: Source[];
  notes: string | null;
};

export type ConsideredPath = {
  archetype: Archetype;
  description: string;
  weight: number;
};

export type MyProfile = {
  id: string;
  name: string;
  birthYear: number;
  currentAge: number;
  asOfDate: string;
  countryOfOrigin: string;
  currentCountry: string;
  education: Education[];
  currentSituation: {
    primary: string;
    treatment: string;
    constraints: string[];
    strengths: string[];
  };
  northStar: string;
  currentQuestion: string;
  consideringPaths: ConsideredPath[];
  operatingPrinciples: string[];
  currentHypothesis: Record<string, string>;
  openQuestions: string[];
  emotionalAnchor: string;
};

export function eraOfYear(year: number): Era {
  for (const era of ERAS) {
    if (year >= era.startYear && (era.endYear === null || year <= era.endYear)) {
      return era.id;
    }
  }
  return "pre-pc";
}

export function ageOfStep(step: CareerStep, birthYear: number | null): {
  ageStart: number | null;
  ageEnd: number | null;
} {
  if (step.estAgeStart !== null) {
    return { ageStart: step.estAgeStart, ageEnd: step.estAgeEnd };
  }
  if (birthYear !== null && step.startYear !== null) {
    return {
      ageStart: step.startYear - birthYear,
      ageEnd: step.endYear !== null ? step.endYear - birthYear : null,
    };
  }
  return { ageStart: null, ageEnd: null };
}
