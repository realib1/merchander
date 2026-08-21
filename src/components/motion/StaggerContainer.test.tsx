import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StaggerContainer } from "./StaggerContainer";
import { StaggerItem } from "./StaggerItem";

describe("StaggerContainer and StaggerItem components", () => {
  it("renders container and children items", () => {
    render(
      <StaggerContainer data-testid="stagger-box">
        <StaggerItem>Item 1</StaggerItem>
        <StaggerItem>Item 2</StaggerItem>
        <StaggerItem>Item 3</StaggerItem>
      </StaggerContainer>
    );

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("Item 3")).toBeInTheDocument();
  });
});
