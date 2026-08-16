import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSeedState } from "../../repository/seed";
import { CommandPalette } from "./CommandPalette";

afterEach(cleanup);

describe("CommandPalette", () => {
  it("names the search, focuses its input, and selects the active exact result with Enter", async () => {
    const onClose = vi.fn();
    const onSelect = vi.fn();
    render(<CommandPalette open state={createSeedState()} onClose={onClose} onSelect={onSelect} />);

    const input = screen.getByRole("combobox", { name: "Search employee records" });
    expect(input).toHaveFocus();
    await userEvent.type(input, "vehicle-01");
    await userEvent.keyboard("{Enter}");

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "vehicle-01", type: "vehicle" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  }, 15_000);

  it("supports Arrow keys, Home/End, no results, Escape, and focus return", async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return <><button onClick={() => setOpen(true)}>Open command search</button><CommandPalette open={open} state={createSeedState()} onClose={() => setOpen(false)} onSelect={() => {}} /></>;
    }
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open command search" });
    await userEvent.click(trigger);
    const input = screen.getByRole("combobox", { name: "Search employee records" });
    await userEvent.type(input, "a");
    await userEvent.keyboard("{End}");
    expect(screen.getAllByRole("option").at(-1)).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{Home}{ArrowDown}");
    expect(screen.getAllByRole("option")[1]).toHaveAttribute("aria-selected", "true");
    await userEvent.clear(input);
    await userEvent.type(input, "nothing connected");
    expect(screen.getByText("No connected records match this search.")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Command search" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  }, 15_000);
});
