import { describe, expect, it } from "vitest";
import { composeCaptions, extractKeywords } from "./captions";
import type { CampaignBrief, GeneratedImage } from "../types";

const brief: CampaignBrief = {
  prompt: "ceremonial matcha latte in a handmade ceramic cup",
  brand: "Kima",
  audience: "slow-morning people",
  voice: "warm",
  cta: "Save this for Sunday.",
  styleId: "organic",
  aspectId: "portrait",
  versionCount: 2,
};

const image: GeneratedImage = {
  id: "v1-9",
  seed: 42,
  versionLabel: "Version 1",
  prompt: "test",
  url: "https://example.com/img.jpg",
  width: 832,
  height: 1040,
};

describe("captions", () => {
  it("extracts prompt keywords for hashtags", () => {
    expect(extractKeywords(brief.prompt)).toEqual([
      "ceremonial",
      "matcha",
      "latte",
      "handmade",
      "ceramic",
      "cup",
    ]);
  });

  it("writes platform captions from the brief", () => {
    const pack = composeCaptions(brief, image);
    expect(pack.instagram).toContain("Save this for Sunday.");
    expect(pack.instagram).toContain("#matcha");
    expect(pack.linkedin).toContain("Kima");
    expect(pack.x.length).toBeLessThanOrEqual(240);
    expect(pack.overlay.length).toBeGreaterThan(0);
  });
});
