import { describe, expect, it } from "vitest";
import { buildImagePrompt, createVersions, retryVersion } from "./images";
import type { CampaignBrief } from "../types";

const brief: CampaignBrief = {
  prompt: "ceremonial matcha latte in a handmade ceramic cup, morning light",
  brand: "Kima",
  audience: "design-minded coffee drinkers",
  voice: "warm",
  cta: "Shop the morning set.",
  styleId: "lifestyle",
  aspectId: "square",
  versionCount: 4,
};

describe("createVersions", () => {
  it("builds the requested number of unique seeds and urls", () => {
    const images = createVersions(brief, 100);
    expect(images).toHaveLength(4);
    expect(new Set(images.map((image) => image.seed)).size).toBe(4);
    expect(images[0].url).toContain("image.pollinations.ai/prompt/");
    expect(images[0].url).toContain("seed=");
    expect(images[0].url).toContain("safe=true");
    expect(images[0].width).toBe(1024);
  });

  it("varies composition language across versions", () => {
    const first = buildImagePrompt(brief, 0);
    const second = buildImagePrompt(brief, 1);
    expect(first).toContain("Kima");
    expect(first).toContain("lifestyle photography");
    expect(first).toContain("safe for work");
    expect(first).not.toBe(second);
  });

  it("retries a version with a new seed and url", () => {
    const [image] = createVersions(brief, 100);
    const retried = retryVersion(image, 1);
    expect(retried.seed).not.toBe(image.seed);
    expect(retried.url).not.toBe(image.url);
    expect(retried.id).toBe(image.id);
  });
});
