import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { WeeleeLogo } from "./WeeleeLogo";

describe("WeeleeLogo", () => {
  it("uses the approved asset's intrinsic dimensions", () => {
    render(<WeeleeLogo className="weelee-logo" />);

    expect(screen.getByRole("img", { name: "Weelee" })).toHaveAttribute("width", "2172");
    expect(screen.getByRole("img", { name: "Weelee" })).toHaveAttribute("height", "724");
  });

  it("keeps responsive sizing width-only so the intrinsic aspect ratio is preserved", () => {
    const componentStyles = readFileSync("src/styles/components.css", "utf8");
    const responsiveStyles = readFileSync("src/styles/responsive.css", "utf8");

    expect(componentStyles).toMatch(/\.weelee-logo\s*\{[^}]*width:\s*168px;[^}]*height:\s*auto;/s);
    expect(responsiveStyles).toMatch(/min-width:\s*768px[^}]+max-width:\s*1023px[\s\S]*?\.weelee-logo\s*\{\s*width:\s*136px;\s*height:\s*auto;/);
    expect(responsiveStyles).toMatch(/max-width:\s*767px[\s\S]*?\.weelee-logo\s*\{\s*width:\s*124px;\s*height:\s*auto;/);
    const responsiveLogoRules = [...responsiveStyles.matchAll(/\.weelee-logo\s*\{([^}]*)\}/g)].map((match) => match[1]);
    expect(responsiveLogoRules).toHaveLength(2);
    expect(responsiveLogoRules.every((rule) => /height:\s*auto;/.test(rule))).toBe(true);
  });
});
