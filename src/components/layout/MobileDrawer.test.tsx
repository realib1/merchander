import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileDrawer } from "./MobileDrawer";

describe("MobileDrawer component", () => {
  it("renders when open and displays title, children, and footer", () => {
    const handleClose = vi.fn();
    render(
      <MobileDrawer
        isOpen={true}
        onClose={handleClose}
        title="Menu Title"
        footer={<button>Logout</button>}
      >
        <p>Drawer Content</p>
      </MobileDrawer>
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Menu Title")).toBeInTheDocument();
    expect(screen.getByText("Drawer Content")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(
      <MobileDrawer isOpen={true} onClose={handleClose}>
        <p>Content</p>
      </MobileDrawer>
    );

    const closeBtn = screen.getByRole("button", { name: /close menu/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("does not render when isOpen is false", () => {
    const handleClose = vi.fn();
    render(
      <MobileDrawer isOpen={false} onClose={handleClose}>
        <p>Hidden Content</p>
      </MobileDrawer>
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
