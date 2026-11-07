export type FactValue = string | number | boolean;
export type Facts = Record<string, FactValue>;
export type CurationConfidence = 'high' | 'medium' | 'low';

export interface ImageLicense {
  license: string;
  attribution: string;
  sourceUrl: string;
  author?: string;
  licenseUrl?: string;
}

export interface Curation {
  confidence: CurationConfidence;
  flagged: boolean;
  flagReason?: string;
  model: string;
  judgedAt: string;
  candidatesConsidered: number;
  score?: number;
  reviewedBy?: 'human';
  reviewedAt?: string;
}

export interface Item {
  id: string;
  branch: string;
  name: string;
  maker: string;
  year: number;
  imageUrl: string;
  thumbUrl: string;
  license: ImageLicense;
  tags: string[];
  facts: Facts;
  curation: Curation;
}
