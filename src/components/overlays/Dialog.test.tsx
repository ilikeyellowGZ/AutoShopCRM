import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Dialog } from "./Dialog";

describe("Dialog", () => {
  it("closes on Escape and returns focus to the trigger", async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return <><button onClick={() => setOpen(true)}>Open intake</button><Dialog open={open} title="Vehicle intake" onClose={() => setOpen(false)}><button>Save draft</button></Dialog></>;
    }

    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open intake" });
    await userEvent.click(trigger);
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
