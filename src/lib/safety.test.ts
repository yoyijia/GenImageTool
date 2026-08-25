import { describe, expect, it } from "vitest";
import { isXRatedPrompt } from "./safety";

describe("isXRatedPrompt", () => {
  it("allows normal marketing briefs", () => {
    expect(
      isXRatedPrompt(
        "sunlit bottle of citrus tonic on marble",
        "Lumen",
        "summer cafe drinkers",
      ),
    ).toBe(false);
  });

  it("allows nude as a fashion color", () => {
    expect(isXRatedPrompt("nude lipstick still life on beige linen")).toBe(false);
  });

  it("blocks x-rated and sexual prompts", () => {
    expect(isXRatedPrompt("x-rated photoshoot")).toBe(true);
    expect(isXRatedPrompt("nsfw campaign")).toBe(true);
    expect(isXRatedPrompt("naked portrait")).toBe(true);
  });
});
