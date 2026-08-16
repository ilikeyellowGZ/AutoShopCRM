import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Dialog } from "./Dialog";
import { Drawer } from "./Drawer";
import { MediaViewer } from "./MediaViewer";

beforeEach(cleanup);
afterEach(cleanup);

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

  it("traps tab focus, closes from the backdrop, and gives initial focus to its close control", async () => {
    const close = vi.fn();
    render(<Dialog open title="Vehicle intake" onClose={close}><button>Save draft</button></Dialog>);
    const closeButton = screen.getByRole("button", { name: "Close Vehicle intake" });
    expect(closeButton).toHaveFocus();
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    expect(screen.getByRole("button", { name: "Save draft" })).toHaveFocus();
    await userEvent.keyboard("{Tab}");
    expect(closeButton).toHaveFocus();
    await userEvent.pointer({ keys: "[MouseLeft]", target: document.querySelector(".overlay-backdrop")! });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("only closes the topmost nested overlay and keeps scroll lock until the outer overlay closes", async () => {
    function Harness() {
      const [inner, setInner] = useState(true);
      const [outer, setOuter] = useState(true);
      return <>{outer && <Dialog open title="Outer" onClose={() => setOuter(false)}><button>Outer action</button>{inner && <Drawer open title="Inner" onClose={() => setInner(false)}><button>Inner action</button></Drawer>}</Dialog>}</>;
    }
    render(<Harness />);
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "Outer" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Inner" })).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });

  it("supports drawer focus and media viewer arrow navigation", async () => {
    const close = vi.fn();
    const change = vi.fn();
    const images = [{ id: "1", angle: "front", label: "Front", src: "/front.webp", alt: "Front" }, { id: "2", angle: "rear", label: "Rear", src: "/rear.webp", alt: "Rear" }] as const;
    const { rerender } = render(<Drawer open title="Filters" onClose={close}><button>Apply filters</button></Drawer>);
    expect(screen.getByRole("button", { name: "Close Filters" })).toHaveFocus();
    rerender(<MediaViewer images={[...images]} activeIndex={0} onIndexChange={change} onClose={close} />);
    await userEvent.keyboard("{ArrowRight}");
    expect(change).toHaveBeenCalledWith(1);
  });

  it("does not move an obscured media viewer until the top overlay closes", async () => {
    const change = vi.fn();
    const images = [{ id: "1", angle: "front", label: "Front", src: "/front.webp", alt: "Front" }, { id: "2", angle: "rear", label: "Rear", src: "/rear.webp", alt: "Rear" }] as const;
    function Harness() {
      const [drawerOpen, setDrawerOpen] = useState(true);
      return <><MediaViewer images={[...images]} activeIndex={0} onIndexChange={change} onClose={() => {}} />{drawerOpen && <Drawer open title="Filters" onClose={() => setDrawerOpen(false)}><button>Apply filters</button></Drawer>}</>;
    }
    render(<Harness />);
    await userEvent.keyboard("{ArrowRight}");
    expect(change).not.toHaveBeenCalled();
    await userEvent.keyboard("{Escape}");
    await userEvent.keyboard("{ArrowRight}");
    expect(change).toHaveBeenCalledWith(1);
  });
});
