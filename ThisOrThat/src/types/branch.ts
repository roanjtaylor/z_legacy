export interface FacetConfig {
  key: string; // a key in Item.facts, the literal "year", or "tags"
  label: string;
  source: 'fact' | 'tag';
  type: 'enum' | 'range';
  order?: string[];
  bucket?: { size: number; suffix?: string }; // range only, e.g. decade from year
}

export interface CardFact {
  key: string; // a key in Item.facts (or "year"/"maker"/"name")
  label: string;
  format?: 'number' | 'text';
  suffix?: string;
}

export type BranchStatus = 'draft' | 'curating' | 'ready';

// A reason you can attach to a choice — the vocabulary of taste for this domain.
export interface CritiqueDimension {
  key: string;
  label: string;
}

export interface Branch {
  id: string;
  label: string;
  tagline: string;
  status: BranchStatus;
  itemNoun: { singular: string; plural: string };
  titleTemplate?: string; // default "${year} ${maker} ${name}"
  cardFacts: CardFact[];
  filterFacets: FacetConfig[];
  critiqueDimensions?: CritiqueDimension[];
}

export interface BranchRegistryEntry {
  id: string;
  label: string;
  tagline?: string;
  status: BranchStatus;
  itemCount: number;
}
