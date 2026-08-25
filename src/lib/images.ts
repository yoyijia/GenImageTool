import { getAspect, getStyle, VERSION_ANGLES } from "./catalog";
import type { CampaignBrief, GeneratedImage } from "../types";

export function buildImagePrompt(
  brief: CampaignBrief,
  versionIndex: number,
): string {
  const style = getStyle(brief.styleId);
  const angle = VERSION_ANGLES[versionIndex % VERSION_ANGLES.length];
  const brand = brief.brand.trim();
  const audience = brief.audience.trim();

  return [
    brief.prompt.trim(),
    brand ? `brand world of ${brand}` : "",
    audience ? `designed to appeal to ${audience}` : "",
    style.prompt,
    angle,
    "no watermark, no UI, no captions, no logos unless naturally part of the product, photogenic, high detail, marketing campaign still",
  ]
    .filter(Boolean)
    .join(", ");
}

export function buildImageUrl(
  prompt: string,
  seed: number,
  width: number,
  height: number,
): string {
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    seed: String(seed),
    nologo: "true",
    enhance: "true",
    private: "true",
  });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`;
}

export function createVersions(
  brief: CampaignBrief,
  runSeed = Date.now() % 1_000_000_000,
): GeneratedImage[] {
  const aspect = getAspect(brief.aspectId);
  return Array.from({ length: brief.versionCount }, (_, index) => {
    const seed = runSeed + (index + 1) * 9176;
    const prompt = buildImagePrompt(brief, index);
    return {
      id: `v${index + 1}-${seed}`,
      seed,
      versionLabel: `Version ${index + 1}`,
      prompt,
      url: buildImageUrl(prompt, seed, aspect.width, aspect.height),
      width: aspect.width,
      height: aspect.height,
    };
  });
}

export async function downloadImage(image: GeneratedImage): Promise<void> {
  const response = await fetch(image.url, { referrerPolicy: "no-referrer" });
  if (!response.ok) {
    throw new Error("Could not download this image. Try opening it in a new tab.");
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `${image.versionLabel.replace(/\s+/g, "-").toLowerCase()}.jpg`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
