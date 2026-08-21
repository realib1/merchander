import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ToastProvider, useToast } from "./Toast";

const ToastTrigger: React.FC = () => {
  const { toast } = useToast();
  return (
    <div>
      <button onClick={() => toast.success("Payment received", "Success")}>Trigger Success</button>
      <button onClick={() => toast.error("Card declined", "Error")}>Trigger Error</button>
    </div>
  );
};

describe("Toast component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows toast when triggered and auto-dismisses after duration", () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Trigger Success"));

    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("Payment received")).toBeInTheDocument();

    // Fast-forward 5000ms
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText("Payment received")).not.toBeInTheDocument();
  });

  it("dismisses toast when manual close button is clicked", () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Trigger Error"));
    expect(screen.getByText("Card declined")).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: /close notification/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByText("Card declined")).not.toBeInTheDocument();
  });
});
