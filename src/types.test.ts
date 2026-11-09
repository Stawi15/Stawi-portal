import { describe, expect, it } from "vitest";
import {
  formatDate,
  joinParagraphs,
  mediaLabel,
  slugify,
  splitParagraphs,
  type MediaAsset,
} from "./types";

describe("slugify", () => {
  it("converts titles to URL-safe slugs", () => {
    expect(slugify("Cipla Synergy Summit & Gala Dinner")).toBe(
      "cipla-synergy-summit-gala-dinner",
    );
  });
  it("trims leading and trailing separators", () => {
    expect(slugify("  ¡Hola!  ")).toBe("hola");
  });
  it("returns an empty string for symbol-only input", () => {
    expect(slugify("!!!")).toBe("");
  });
});

describe("paragraph helpers", () => {
  it("splits on blank lines and trims", () => {
    expect(splitParagraphs("First.\n\n  Second. \n\n\nThird.")).toEqual([
      "First.",
      "Second.",
      "Third.",
    ]);
  });
  it("round-trips through join", () => {
    const paragraphs = ["One", "Two"];
    expect(splitParagraphs(joinParagraphs(paragraphs))).toEqual(paragraphs);
  });
  it("ignores empty input", () => {
    expect(splitParagraphs("  \n\n ")).toEqual([]);
  });
});

describe("formatDate", () => {
  it("formats ISO dates", () => {
    expect(formatDate("2026-05-04T10:00:00Z")).toMatch(/4 May 2026/);
  });
  it("falls back for missing or invalid values", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate("not-a-date")).toBe("—");
  });
});

describe("mediaLabel", () => {
  const base: MediaAsset = {
    id: "1",
    media_type: "image",
    storage_provider: "insforge",
    bucket: "website-media",
    object_key: "stawi/2026/06/photo.webp",
    url: "https://example.com/photo.webp",
    alt_text: "An event photo",
    title: null,
    description: null,
    mime_type: "image/webp",
    width: 100,
    height: 100,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
  it("prefers the title", () => {
    expect(mediaLabel({ ...base, title: "Summit cover" })).toBe("Summit cover");
  });
  it("falls back to the file name", () => {
    expect(mediaLabel(base)).toBe("photo.webp");
  });
  it("falls back to alt text, then a default", () => {
    expect(mediaLabel({ ...base, object_key: null })).toBe("An event photo");
    expect(mediaLabel({ ...base, object_key: null, alt_text: "" })).toBe(
      "Untitled image",
    );
  });
});
