const BLOCKED_PHRASES = [
  "x-rated",
  "x rated",
  "xrated",
  "nsfw",
  "porn",
  "porno",
  "pornographic",
  "onlyfans",
  "18+",
  "xxx",
  "sex tape",
  "sexual",
  "erotic",
  "hentai",
  "nude",
  "nudes",
  "nudity",
  "naked",
  "topless",
  "bottomless",
  "unclothed",
  "undressed",
  "explicit",
];

const NUDE_COLOR_ALLOW = /\bnude\s+(lipstick|lip|heel|heels|shoe|shoes|dress|tone|shade|color|colour|palette|nail|nails|blazer|pump|pumps)\b/;

export const SFW_PROMPT_GUARD =
  "safe for work, family-friendly marketing photography, no nudity, no sexual content, no x-rated, no nsfw";

export const SFW_BLOCK_MESSAGE =
  "This tool is safe for work. X-rated or sexual prompts are blocked.";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[_/\\]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isXRatedPrompt(...parts: string[]): boolean {
  const text = normalize(parts.filter(Boolean).join(" "));
  if (!text) return false;
  if (NUDE_COLOR_ALLOW.test(text) && !/\b(naked|nudity|nudes|nsfw|porn|xxx|x-rated)\b/.test(text)) {
    const withoutColor = text.replace(
      /\bnude\s+(lipstick|lip|heel|heels|shoe|shoes|dress|tone|shade|color|colour|palette|nail|nails|blazer|pump|pumps)\b/g,
      "",
    );
    return BLOCKED_PHRASES.some((phrase) => new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(withoutColor));
  }
  return BLOCKED_PHRASES.some((phrase) => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`).test(text);
  });
}
