import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Tabs } from "./Tabs";

describe("Tabs", () => {
  it("uses roving focus and connects the selected tab to its panel", async () => {
    function Harness() {
      const [activeId, setActiveId] = useState<"details" | "history">("details");
      return <Tabs label="Vehicle record" activeId={activeId} onChange={setActiveId} items={[{ id: "details", label: "Details", panel: <p>Vehicle details</p> }, { id: "history", label: "History", panel: <p>Vehicle history</p> }] as any} />;
    }
    render(<Harness />);
    const details = screen.getByRole("tab", { name: "Details" });
    const history = screen.getByRole("tab", { name: "History" });
    expect(details).toHaveAttribute("aria-controls");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Vehicle details");
    await userEvent.click(details);
    await userEvent.keyboard("{ArrowRight}");
    expect(history).toHaveFocus();
    expect(history).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{Home}");
    expect(details).toHaveFocus();
  });
});
