// Curation tooling types. Kept in sync with src/types/{item,branch}.ts on the JSON shape.

export type FactValue = string | number | boolean;
export type Facts = Record<string, FactValue>;
export type CurationConfidence = 'high' | 'medium' | 'low';

export interface ImageLicense {
  license: string; // e.g. "CC-BY-SA-4.0", "CC0", "PD", "unknown"
  attribution: string; // human-readable credit line
  sourceUrl: string; // page the image came from
  author?: string;
  licenseUrl?: string;
}

export interface Curation {
  confidence: CurationConfidence;
  flagged: boolean;
  flagReason?: string;
  model: string;
  judgedAt: string; // ISO timestamp
  candidatesConsidered: number;
  score?: number; // 0-100 self-rated pick quality
  reviewedBy?: 'human';
  reviewedAt?: string;
}

export interface Item {
  id: string;
  branch: string;
  name: string;
  maker: string;
  year: number;
  imageUrl: string; // local: /branches/<branch>/images/<id>.jpg
  thumbUrl: string; // local: /branches/<branch>/thumbs/<id>.webp
  license: ImageLicense;
  tags: string[];
  facts: Facts;
  curation: Curation;
}

// ---- Curation brief (curator-owned spec) ----

export interface CurationRubric {
  requiredView: string; // e.g. "clean 3/4 front angle, full car in frame"
  minLongEdgePx: number;
  reject: string[];
  prefer: string[];
}

export interface BriefItem {
  id: string;
  name: string;
  maker: string;
  year: number;
  facts: Facts;
  tags: string[];
  searchHints?: string[];
}

export interface CurationBrief {
  branch: string;
  rubric: CurationRubric;
  searchTemplates: string[]; // e.g. "{year} {maker} {name} car side profile"
  items: BriefItem[];
}

// ---- Pipeline handoff files (live in data/.tmp/<branch>/<id>/) ----

export interface CandidateInput {
  imageUrl: string; // direct image URL
  sourceUrl: string; // page URL for attribution
  license?: Partial<ImageLicense>;
}

export interface Candidate {
  index: number;
  tempPath: string; // local file Claude will Read
  sourceUrl: string;
  imageUrl: string;
  width: number;
  height: number;
  bytes: number;
  sha256: string;
  license?: Partial<ImageLicense>;
}

export interface CandidateManifest {
  itemId: string;
  candidates: Candidate[];
}

export interface PickDecision {
  itemId: string;
  chosenIndex: number | null; // null => no acceptable candidate
  confidence: CurationConfidence;
  flagged: boolean;
  flagReason?: string;
  score?: number;
  license: ImageLicense; // resolved license for the chosen image
}

export interface CurationLogEntry {
  itemId: string;
  ts: string;
  action: 'prepared' | 'committed' | 'skipped' | 'failed';
  detail: string;
  decision?: PickDecision;
}
