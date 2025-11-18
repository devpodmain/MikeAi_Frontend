// AI API Types for Fitness Chat and Supplements Suggestions

// ---- Fitness Chat ----
export interface Attachment {
  kind: "text" | "doc_text" | "image_url";
  content: string;
}

export interface FitnessChatRequest {
  user_message: string;
  user_profile?: Record<string, unknown>;
  attachments?: Attachment[];
}

export interface FitnessChatResponse {
  reply: string;
  disclaimer: string;
}

// ---- Supplements ----
export type BudgetTier = "value" | "mid" | "premium" | string;

export interface SupplementContext {
  goal: string;
  age?: number;
  sex?: "male" | "female" | "other" | string;
  allergies?: string[];
  existing_conditions?: string[];
  current_meds?: string[];
  dietary_prefs?: string[];
  budget_tier?: BudgetTier;
  region?: string;
}

export interface SupplementRequest {
  question: string;
  context: SupplementContext;
}

export interface BrandPick {
  brand: string;
  product_line: string;
  why: string;
}

export interface SupplementSuggestion {
  category: string;
  evidence_summary: string;
  suggested_use_notes: string;
  brand_examples: BrandPick[];
}

export interface SupplementResponse {
  plan_summary: string;
  suggestions: SupplementSuggestion[];
  what_to_avoid: string[];
  interactions_notes: string;
  disclaimer: string;
}
