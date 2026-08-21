import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Badge } from "./Badge";

describe("Badge component", () => {
  it("renders badge content correctly", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders status dot when dot prop is enabled", () => {
    render(
      <Badge dot variant="success">
        Online
      </Badge>
    );
    expect(screen.getByTestId("badge-dot")).toBeInTheDocument();
  });

  it("applies variant styling", () => {
    const { rerender } = render(<Badge variant="destructive">Error</Badge>);
    let badge = screen.getByText("Error");
    expect(badge.className).toContain("text-[var(--color-destructive)]");

    rerender(<Badge variant="warning">Pending</Badge>);
    badge = screen.getByText("Pending");
    expect(badge.className).toContain("text-[var(--color-warning)]");
  });
});
