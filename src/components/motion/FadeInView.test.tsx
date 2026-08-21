import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FadeInView } from "./FadeInView";

describe("FadeInView component", () => {
  it("renders children correctly", () => {
    render(
      <FadeInView data-testid="fade-container">
        <h1>Welcome to SHERO Core</h1>
      </FadeInView>
    );

    expect(screen.getByText("Welcome to SHERO Core")).toBeInTheDocument();
  });
});
