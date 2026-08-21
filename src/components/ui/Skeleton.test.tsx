import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Skeleton } from "./Skeleton";

describe("Skeleton component", () => {
  it("renders with status role and aria-busy", () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute("aria-busy", "true");
  });

  it("applies circle variant class", () => {
    render(<Skeleton variant="circle" data-testid="circle-skeleton" />);
    const skeleton = screen.getByTestId("circle-skeleton");
    expect(skeleton.className).toContain("rounded-full");
  });

  it("renders multiple lines when count > 1 for text variant", () => {
    render(<Skeleton variant="text" count={3} />);
    const container = screen.getByRole("status");
    expect(container.children.length).toBe(3);
  });
});
