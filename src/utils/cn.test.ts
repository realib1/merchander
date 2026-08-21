import { describe, it, expect } from "vitest";
import { cn } from "./cn";

describe("cn utility", () => {
  it("merges simple class names", () => {
    expect(cn("class-a", "class-b")).toBe("class-a class-b");
  });

  it("handles conditional classes", () => {
    expect(cn("base", true && "is-active", false && "is-hidden")).toBe("base is-active");
  });

  it("resolves Tailwind conflicts correctly", () => {
    expect(cn("px-4 py-2", "px-6")).toBe("py-2 px-6");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    expect(cn("bg-white", "bg-transparent")).toBe("bg-transparent");
  });

  it("handles arrays and object notation", () => {
    expect(cn(["btn", "btn-primary"], { "opacity-50": true, hidden: false })).toBe(
      "btn btn-primary opacity-50"
    );
  });

  it("handles undefined, null, and empty inputs gracefully", () => {
    expect(cn(undefined, null, false, "")).toBe("");
  });
});
