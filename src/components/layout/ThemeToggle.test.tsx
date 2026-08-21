import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@/context/ThemeContext";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle component", () => {
  it("renders simple toggle button and toggles theme on click", () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole("button", { name: /switch to dark mode/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.getByRole("button", { name: /switch to light mode/i })).toBeInTheDocument();
  });

  it("renders segmented control variant with light, dark, and system options", () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle variant="segmented" showLabel />
      </ThemeProvider>
    );

    expect(screen.getByRole("button", { name: /light/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /dark/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /system/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /dark/i }));
    expect(screen.getByRole("button", { name: /dark/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("renders dropdown variant and allows option selection", () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle variant="dropdown" showLabel />
      </ThemeProvider>
    );

    const trigger = screen.getByRole("button", { name: /theme selector/i });
    expect(trigger).toBeInTheDocument();

    fireEvent.click(trigger);
    const darkOption = screen.getByRole("menuitem", { name: /dark/i });
    expect(darkOption).toBeInTheDocument();

    fireEvent.click(darkOption);
    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
  });
});
