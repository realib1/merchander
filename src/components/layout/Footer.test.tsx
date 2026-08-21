import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";

describe("Footer component", () => {
  it("renders brand name, tagline, and link groups", () => {
    const linkGroups = [
      {
        title: "Product",
        items: [
          { label: "Features", href: "#features" },
          { label: "Pricing", href: "#pricing" },
        ],
      },
    ];

    render(<Footer brandName="TestApp" tagline="A test tagline" linkGroups={linkGroups} />);

    expect(screen.getByText("TestApp")).toBeInTheDocument();
    expect(screen.getByText("A test tagline")).toBeInTheDocument();
    expect(screen.getByText("Product")).toBeInTheDocument();
    expect(screen.getByText("Features")).toBeInTheDocument();
  });

  it("renders custom copyright and extra bottom content", () => {
    render(<Footer copyright="Custom Copyright 2026" extraBottom={<span>System Normal</span>} />);

    expect(screen.getByText("Custom Copyright 2026")).toBeInTheDocument();
    expect(screen.getByText("System Normal")).toBeInTheDocument();
  });
});
