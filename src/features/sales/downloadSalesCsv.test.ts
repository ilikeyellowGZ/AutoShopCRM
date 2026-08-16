import { describe, expect, it, vi } from "vitest";
import { downloadSalesCsv } from "./downloadSalesCsv";

describe("downloadSalesCsv", () => {
  it("clicks an attached temporary link, removes it, and revokes its URL on the next tick", () => {
    vi.useFakeTimers();
    const link = { href: "", download: "", click: vi.fn(), remove: vi.fn() } as unknown as HTMLAnchorElement;
    const appendChild = vi.fn();
    const createElement = vi.spyOn(document, "createElement").mockReturnValue(link);
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:csv");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL");
    const originalAppend = document.body.appendChild; document.body.appendChild = appendChild as never;
    downloadSalesCsv("Date\n2026-08-16", "sales.csv");
    expect(appendChild).toHaveBeenCalledWith(link); expect(link.click).toHaveBeenCalledOnce(); expect(link.remove).toHaveBeenCalledOnce(); expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.runOnlyPendingTimers(); expect(revokeObjectURL).toHaveBeenCalledWith("blob:csv");
    document.body.appendChild = originalAppend; createElement.mockRestore(); createObjectURL.mockRestore(); revokeObjectURL.mockRestore(); vi.useRealTimers();
  });
});
