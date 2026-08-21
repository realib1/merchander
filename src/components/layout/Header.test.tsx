import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/context/ThemeContext";
import { Header } from "./Header";

describe("Header component", () => {
  const navItems = [
    { label: "Home", href: "/", active: true },
    { label: "Docs", href: "/docs" },
  ];

  it("renders default brand and nav items", () => {
    render(
      <ThemeProvider>
        <Header navItems={navItems} />
      </ThemeProvider>
    );

    expect(screen.getByText("SHERO")).toBeInTheDocument();
    expect(screen.getAllByText("Home")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Docs")[0]).toBeInTheDocument();
  });

  it("renders actions slot and custom logo", () => {
    render(
      <ThemeProvider>
        <Header
          logo={<span data-testid="custom-logo">My App</span>}
          actions={<button>Login</button>}
        />
      </ThemeProvider>
    );

    expect(screen.getByTestId("custom-logo")).toBeInTheDocument();
    expect(screen.getAllByText("Login")[0]).toBeInTheDocument();
  });
});
