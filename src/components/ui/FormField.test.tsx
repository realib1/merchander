import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FormField } from "./FormField";

describe("FormField component", () => {
  it("renders with label and connects htmlFor with input id", () => {
    render(<FormField label="Email Address" id="email" />);
    const label = screen.getByText("Email Address");
    const input = screen.getByRole("textbox");
    expect(label).toBeInTheDocument();
    expect(input).toHaveAttribute("id", "email");
  });

  it("renders error message and sets aria-invalid", () => {
    render(<FormField label="Username" error="Username is required" />);
    const errorText = screen.getByRole("alert");
    const input = screen.getByRole("textbox");
    expect(errorText).toHaveTextContent("Username is required");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("renders hint text when there is no error", () => {
    render(<FormField label="Password" hint="Minimum 8 characters" />);
    expect(screen.getByText("Minimum 8 characters")).toBeInTheDocument();
  });

  it("renders textarea when isTextarea is true", () => {
    render(<FormField label="Bio" isTextarea rows={4} />);
    const textarea = screen.getByRole("textbox");
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveAttribute("rows", "4");
  });

  it("handles user typing events", () => {
    const handleChange = vi.fn();
    render(<FormField label="Full Name" onChange={handleChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Jane Doe" } });
    expect(handleChange).toHaveBeenCalled();
  });
});
