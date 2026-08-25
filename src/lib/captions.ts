import type { BrandVoice, CampaignBrief, CaptionSet, GeneratedImage } from "../types";
import { getStyle } from "./catalog";

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "for",
  "to",
  "in",
  "on",
  "with",
  "at",
  "from",
  "by",
  "is",
  "its",
  "this",
  "that",
  "into",
  "over",
  "under",
  "near",
  "shot",
  "photo",
  "image",
  "style",
  "like",
  "very",
  "really",
]);

export function extractKeywords(prompt: string, limit = 6): string[] {
  const words = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

  const unique: string[] = [];
  for (const word of words) {
    if (!unique.includes(word)) unique.push(word);
    if (unique.length >= limit) break;
  }
  return unique;
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function brandOrFallback(brief: CampaignBrief): string {
  const brand = brief.brand.trim();
  if (brand) return brand;
  const keywords = extractKeywords(brief.prompt, 2);
  return keywords.length ? titleCase(keywords.join(" ")) : "this drop";
}

function subjectLine(brief: CampaignBrief): string {
  const trimmed = brief.prompt.trim().replace(/[.!?]+$/, "");
  const firstClause = trimmed.split(",")[0]?.trim() || trimmed;
  const scene =
    firstClause.length <= 72 ? firstClause : `${firstClause.slice(0, 69).trim()}…`;
  return scene.replace(/^(A|An|The)\s+/, (match) => match.toLowerCase());
}

function pick<T>(items: T[], seed: number, offset = 0): T {
  return items[Math.abs(seed + offset * 13) % items.length];
}

const HOOKS: Record<BrandVoice, string[]> = {
  professional: [
    "Built for the way you actually work.",
    "A quieter kind of standout.",
    "Details first. Noise last.",
    "Made to look inevitable.",
  ],
  witty: [
    "Main character energy, minus the speech.",
    "Yes, it photographs this well in real life.",
    "Consider this your taste upgrade.",
    "We would also stop scrolling.",
  ],
  luxury: [
    "Soft light. Serious craft.",
    "Not louder. Just rarer.",
    "An object with a point of view.",
    "Elegance that does not need explaining.",
  ],
  bold: [
    "Do not blend in. This will not let you.",
    "The feed just found a new focal point.",
    "Turn the volume up on the visual.",
    "Made to be seen from across the room.",
  ],
  warm: [
    "A little ritual, made beautiful.",
    "For the slow-morning people.",
    "Keep this one close.",
    "Feels like a deep breath you can hold.",
  ],
};

const BODIES: Record<BrandVoice, (args: {
  brand: string;
  subject: string;
  audience: string;
}) => string[]> = {
  professional: ({ brand, subject, audience }) => [
    `${brand} frames ${subject} as a campaign-ready essential${audience ? ` for ${audience}` : ""}. Clean lines, considered styling, nothing extra.`,
    `This is ${brand} at its most useful: ${subject}, shot to sell the feeling as much as the thing itself.`,
  ],
  witty: ({ brand, subject, audience }) => [
    `${brand} took ${subject} and gave it the kind of lighting that makes group chats ask “okay but where.”${audience ? ` ${titleCase(audience)} already know.` : ""}`,
    `If ${subject} had a personality, it would be ${brand}: charming, a little extra, and extremely screenshot-able.`,
  ],
  luxury: ({ brand, subject, audience }) => [
    `${brand} presents ${subject} with editorial restraint — tactile, luminous, and composed for people who notice.${audience ? ` Made with ${audience} in mind.` : ""}`,
    `Every surface is doing something. ${brand} lets ${subject} speak in texture, light, and quiet confidence.`,
  ],
  bold: ({ brand, subject, audience }) => [
    `${brand} puts ${subject} in a visual that refuses to whisper. High energy, high clarity, built to travel.${audience ? ` Tuned for ${audience}.` : ""}`,
    `This is the campaign still you post when you want the room to lean in. ${brand} x ${subject}, no apology.`,
  ],
  warm: ({ brand, subject, audience }) => [
    `${brand} wraps ${subject} in a softer kind of spotlight — the kind that feels like a favorite hour of the day.${audience ? ` For ${audience} who like their brands human.` : ""}`,
    `Consider this a love note in picture form. ${brand} made ${subject} look the way it feels in your hands.`,
  ],
};

function ctaLine(brief: CampaignBrief, voice: BrandVoice): string {
  if (brief.cta.trim()) return brief.cta.trim();
  const brand = brandOrFallback(brief);
  const map: Record<BrandVoice, string> = {
    professional: `Explore ${brand}.`,
    witty: `Go get one before your friends pretend they found it first.`,
    luxury: `Inquire. Or simply want.`,
    bold: `Tap through. Then make it yours.`,
    warm: `Save this, then come say hi.`,
  };
  return map[voice];
}

function hashtagsFor(brief: CampaignBrief): string[] {
  const style = getStyle(brief.styleId);
  const keywords = extractKeywords(`${brief.prompt} ${brief.brand} ${style.name}`, 8);
  const extras = ["campaign", "branddesign", "visualstory", "marketing"];
  const tags = [...keywords, ...extras]
    .map((word) => word.replace(/[^a-z0-9]/g, ""))
    .filter((word) => word.length > 2);
  return [...new Set(tags)].slice(0, 10).map((tag) => `#${tag}`);
}

function overlayLine(brief: CampaignBrief, seed: number): string {
  const brand = brandOrFallback(brief);
  const keywords = extractKeywords(brief.prompt, 3);
  const phrase = keywords.slice(0, 2).map(titleCase).join(" · ") || brand;
  return pick(
    [`${brand}`, `${phrase}`, `${brand} — ${phrase}`, `New from ${brand}`],
    seed,
    4,
  );
}

export function composeCaptions(
  brief: CampaignBrief,
  image: GeneratedImage,
): CaptionSet {
  const voice = brief.voice;
  const brand = brandOrFallback(brief);
  const subject = subjectLine(brief);
  const audience = brief.audience.trim();
  const style = getStyle(brief.styleId);
  const hook = pick(HOOKS[voice], image.seed, 1);
  const body = pick(
    BODIES[voice]({ brand, subject, audience }),
    image.seed,
    2,
  );
  const cta = ctaLine(brief, voice);
  const tags = hashtagsFor(brief);

  const instagram = [hook, "", body, "", cta, "", tags.join(" ")].join("\n");
  const linkedin = [
    hook.replace(/!$/, "."),
    "",
    `${body} Visual direction: ${style.name.toLowerCase()}, crafted as a ready-to-run ${brief.aspectId} asset.`,
    "",
    cta,
  ].join("\n");
  const x = `${hook} ${brand} — ${subject}. ${cta}`
    .replace(/\s+/g, " ")
    .slice(0, 240)
    .trim();

  return {
    imageId: image.id,
    versionLabel: image.versionLabel,
    instagram,
    linkedin,
    x,
    overlay: overlayLine(brief, image.seed),
    hashtags: tags,
  };
}

export function composeCaptionPack(
  brief: CampaignBrief,
  images: GeneratedImage[],
): CaptionSet[] {
  return images.map((image) => composeCaptions(brief, image));
}

interface AiCaptionJson {
  instagram?: string;
  linkedin?: string;
  x?: string;
  overlay?: string;
  hashtags?: string[];
}

function parseAiCaption(raw: string, fallback: CaptionSet): CaptionSet {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return fallback;
  try {
    const parsed = JSON.parse(match[0]) as AiCaptionJson;
    return {
      ...fallback,
      instagram: parsed.instagram?.trim() || fallback.instagram,
      linkedin: parsed.linkedin?.trim() || fallback.linkedin,
      x: parsed.x?.trim() || fallback.x,
      overlay: parsed.overlay?.trim() || fallback.overlay,
      hashtags: Array.isArray(parsed.hashtags)
        ? parsed.hashtags.map(String)
        : fallback.hashtags,
    };
  } catch {
    return fallback;
  }
}

async function requestOpenAiCaptions(
  brief: CampaignBrief,
  image: GeneratedImage,
  apiKey: string,
): Promise<CaptionSet | null> {
  const fallback = composeCaptions(brief, image);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content:
            "You are a senior social copywriter. Return JSON only with keys instagram, linkedin, x, overlay, hashtags (array). No markdown.",
        },
        {
          role: "user",
          content: `Brand: ${brief.brand || "unspecified"}
Audience: ${brief.audience || "general"}
Voice: ${brief.voice}
Style: ${getStyle(brief.styleId).name}
Prompt: ${brief.prompt}
CTA: ${brief.cta || "none"}
Write platform-ready captions. Instagram can use line breaks. X under 240 chars. Overlay is 2-5 words for a story sticker.`,
        },
      ],
    }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;
  return parseAiCaption(content, fallback);
}

async function requestPollinationsCaptions(
  brief: CampaignBrief,
  image: GeneratedImage,
): Promise<CaptionSet | null> {
  const fallback = composeCaptions(brief, image);
  const instruction = `Return JSON only with keys instagram, linkedin, x, overlay, hashtags. Voice=${brief.voice}. Brand=${brief.brand || "none"}. Prompt=${brief.prompt}. Style=${getStyle(brief.styleId).name}. CTA=${brief.cta || "none"}.`;
  const response = await fetch(
    `https://text.pollinations.ai/${encodeURIComponent(instruction)}?json=true`,
    { referrerPolicy: "no-referrer" },
  );
  if (!response.ok) return null;
  const text = await response.text();
  if (text.includes("PAYMENT_REQUIRED") || text.includes("UNAUTHORIZED")) {
    return null;
  }
  return parseAiCaption(text, fallback);
}

export async function generateCaptionsForSelection(
  brief: CampaignBrief,
  images: GeneratedImage[],
  openAiKey?: string,
): Promise<{ captions: CaptionSet[]; source: "ai" | "studio" }> {
  if (openAiKey) {
    const aiPack = await Promise.all(
      images.map((image) => requestOpenAiCaptions(brief, image, openAiKey)),
    );
    if (aiPack.every(Boolean)) {
      return { captions: aiPack as CaptionSet[], source: "ai" };
    }
  }

  try {
    const first = await requestPollinationsCaptions(brief, images[0]);
    if (first) {
      const rest = await Promise.all(
        images.slice(1).map((image) => requestPollinationsCaptions(brief, image)),
      );
      return {
        captions: [first, ...rest.map((item, index) => item ?? composeCaptions(brief, images[index + 1]))],
        source: "ai",
      };
    }
  } catch {
    // Fall through to the on-device studio writer.
  }

  return { captions: composeCaptionPack(brief, images), source: "studio" };
}
