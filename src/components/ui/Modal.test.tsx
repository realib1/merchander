import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Modal } from "./Modal";

describe("Modal component", () => {
  it("does not render when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <div>Modal Content</div>
      </Modal>
    );
    expect(screen.queryByText("Modal Content")).not.toBeInTheDocument();
  });

  it("renders when isOpen is true and shows title and content", () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal" description="Modal description">
        <div>Modal Content</div>
      </Modal>
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Modal description")).toBeInTheDocument();
    expect(screen.getByText("Modal Content")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Body</div>
      </Modal>
    );
    const closeBtn = screen.getByRole("button", { name: /close dialog/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key is pressed", () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <div>Body</div>
      </Modal>
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("traps focus within the modal dialog when Tab is pressed", () => {
    render(
      <Modal
        isOpen={true}
        onClose={vi.fn()}
        title="Trap Test"
        footer={<button type="button">Confirm</button>}
      >
        <button type="button">Action Inside</button>
      </Modal>
    );

    const closeBtn = screen.getByRole("button", { name: /close dialog/i });
    const actionBtn = screen.getByRole("button", { name: /action inside/i });
    const confirmBtn = screen.getByRole("button", { name: /confirm/i });

    expect(actionBtn).toBeInTheDocument();

    // Close button should receive initial focus or be first element
    closeBtn.focus();
    expect(document.activeElement).toBe(closeBtn);

    // Shift+Tab on first element wraps to last element
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(confirmBtn);

    // Tab on last element wraps back to first element
    fireEvent.keyDown(document, { key: "Tab", shiftKey: false });
    expect(document.activeElement).toBe(closeBtn);
  });
});
