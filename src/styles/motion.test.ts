import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const componentStyles = readFileSync("src/styles/components.css", "utf8");
const motionStyles = readFileSync("src/styles/motion.css", "utf8");

describe("shell motion contract", () => {
  it("limits shell motion to transform and opacity and supplies a reduced-motion override", () => {
    expect(componentStyles).not.toMatch(/transition:\s*[^;]*(?:color|background-color)/);
    expect(motionStyles).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(motionStyles).toMatch(/opacity/);
    expect(motionStyles).toMatch(/transform/);
  });
});
