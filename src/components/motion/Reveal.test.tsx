import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Reveal } from "./Reveal";

describe("Reveal component", () => {
  it("renders children correctly with directional props", () => {
    render(
      <Reveal direction="left" distance={30}>
        <div>Slide from Left</div>
      </Reveal>
    );

    expect(screen.getByText("Slide from Left")).toBeInTheDocument();
  });
});
