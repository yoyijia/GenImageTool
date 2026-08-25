export type BrandVoice = "professional" | "witty" | "luxury" | "bold" | "warm";

export type AspectId = "square" | "portrait" | "story" | "landscape";

export type StyleId =
  | "product-studio"
  | "lifestyle"
  | "cinematic"
  | "luxury"
  | "minimal"
  | "bold-pop"
  | "illustrated"
  | "vintage"
  | "urban"
  | "organic";

export interface CampaignBrief {
  prompt: string;
  brand: string;
  audience: string;
  voice: BrandVoice;
  cta: string;
  styleId: StyleId;
  aspectId: AspectId;
  versionCount: 2 | 4 | 6;
}

export interface VisualStyle {
  id: StyleId;
  name: string;
  hint: string;
  prompt: string;
  swatch: string;
}

export interface AspectRatio {
  id: AspectId;
  name: string;
  label: string;
  width: number;
  height: number;
}

export interface GeneratedImage {
  id: string;
  seed: number;
  versionLabel: string;
  prompt: string;
  url: string;
  width: number;
  height: number;
}

export interface CaptionSet {
  imageId: string;
  versionLabel: string;
  instagram: string;
  linkedin: string;
  x: string;
  overlay: string;
  hashtags: string[];
}
