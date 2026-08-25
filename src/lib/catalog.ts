import type { AspectRatio, VisualStyle } from "../types";

export const STYLES: VisualStyle[] = [
  {
    id: "product-studio",
    name: "Product studio",
    hint: "Clean catalog hero",
    prompt:
      "professional studio product photography, seamless backdrop, softbox lighting, sharp focus, commercial advertising quality, centered hero object",
    swatch: "linear-gradient(135deg, #d9d4cc, #8f877c)",
  },
  {
    id: "lifestyle",
    name: "Lifestyle",
    hint: "In the real world",
    prompt:
      "candid lifestyle photography, natural window light, lived-in environment, authentic moment, magazine campaign, shallow depth of field",
    swatch: "linear-gradient(135deg, #e8cbb0, #7d9aa8)",
  },
  {
    id: "cinematic",
    name: "Cinematic",
    hint: "Film-still drama",
    prompt:
      "cinematic film still, anamorphic look, dramatic lighting, rich contrast, movie production design, atmospheric haze, storytelling composition",
    swatch: "linear-gradient(135deg, #1d2430, #c45c3e)",
  },
  {
    id: "luxury",
    name: "Luxury editorial",
    hint: "High-fashion gloss",
    prompt:
      "luxury editorial campaign, glossy magazine aesthetic, refined materials, gold and cream palette, high fashion lighting, opulent but tasteful",
    swatch: "linear-gradient(135deg, #111111, #d4b483)",
  },
  {
    id: "minimal",
    name: "Minimal",
    hint: "Quiet negative space",
    prompt:
      "minimalist photography, generous negative space, muted palette, quiet composition, Scandinavian design, soft shadows, premium simplicity",
    swatch: "linear-gradient(135deg, #f3efe8, #c5c0b6)",
  },
  {
    id: "bold-pop",
    name: "Social pop",
    hint: "Scroll-stopping color",
    prompt:
      "bold social media advertisement, saturated colors, high contrast, graphic pop art energy, punchy campaign visual, crisp commercial lighting",
    swatch: "linear-gradient(135deg, #ff5a36, #5b4dff)",
  },
  {
    id: "illustrated",
    name: "Illustrated",
    hint: "Artful 3D / draw",
    prompt:
      "refined campaign illustration mixed with stylized 3D render, art-directed, tactile materials, contemporary brand design, clean composition",
    swatch: "linear-gradient(135deg, #f2d2c2, #86b7c8)",
  },
  {
    id: "vintage",
    name: "Vintage film",
    hint: "35mm nostalgia",
    prompt:
      "analog 35mm film photography, nostalgic grain, warm halation, vintage campaign, slightly faded colors, timeless editorial mood",
    swatch: "linear-gradient(135deg, #c9a66b, #6b3f32)",
  },
  {
    id: "urban",
    name: "Urban street",
    hint: "City culture",
    prompt:
      "contemporary street style photography, city environment, natural daylight, cultural energy, fashion-forward campaign, documentary realism",
    swatch: "linear-gradient(135deg, #2c2c2c, #9aa4b0)",
  },
  {
    id: "organic",
    name: "Organic nature",
    hint: "Earth and light",
    prompt:
      "earthy natural photography, organic textures, sunlight through leaves, sustainable brand mood, raw materials, gentle outdoor light",
    swatch: "linear-gradient(135deg, #cdd9b8, #5d6b3f)",
  },
];

export const ASPECTS: AspectRatio[] = [
  { id: "square", name: "Square", label: "Feed 1:1", width: 1024, height: 1024 },
  { id: "portrait", name: "Portrait", label: "Post 4:5", width: 832, height: 1040 },
  { id: "story", name: "Story / Reel", label: "9:16", width: 768, height: 1344 },
  { id: "landscape", name: "Landscape", label: "16:9", width: 1280, height: 720 },
];

export const VOICES = [
  { id: "professional", name: "Professional" },
  { id: "witty", name: "Witty" },
  { id: "luxury", name: "Luxury" },
  { id: "bold", name: "Bold" },
  { id: "warm", name: "Warm" },
] as const;

export const VERSION_ANGLES = [
  "hero centered composition, front three-quarter view, campaign key visual",
  "dynamic 45-degree angle, environmental context, storytelling crop",
  "intimate close-up, shallow depth of field, tactile material detail",
  "styled overhead flat lay, art-directed props, balanced negative space",
  "wide establishing shot, atmosphere and setting, cinematic scale",
  "macro texture study, craftsmanship details, premium still-life lighting",
];

export function getStyle(id: string): VisualStyle {
  return STYLES.find((style) => style.id === id) ?? STYLES[0];
}

export function getAspect(id: string): AspectRatio {
  return ASPECTS.find((aspect) => aspect.id === id) ?? ASPECTS[0];
}
