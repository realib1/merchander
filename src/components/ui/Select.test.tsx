import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Select } from "./Select";

const mockOptions = [
  { label: "Ghana", value: "gh" },
  { label: "Nigeria", value: "ng" },
  { label: "Kenya", value: "ke", disabled: true },
];

describe("Select component", () => {
  it("renders with placeholder when no value is selected", () => {
    render(<Select options={mockOptions} placeholder="Select country" />);
    expect(screen.getByText("Select country")).toBeInTheDocument();
  });

  it("opens options list when clicked and selects an option", () => {
    const handleChange = vi.fn();
    render(<Select options={mockOptions} onChange={handleChange} />);

    const combobox = screen.getByRole("combobox");
    fireEvent.click(combobox);

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    const option = screen.getByText("Ghana");
    fireEvent.click(option);

    expect(handleChange).toHaveBeenCalledWith("gh");
  });

  it("does not select disabled options", () => {
    const handleChange = vi.fn();
    render(<Select options={mockOptions} onChange={handleChange} />);

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByText("Kenya"));

    expect(handleChange).not.toHaveBeenCalled();
  });

  it("filters options when searchable is enabled", () => {
    render(<Select options={mockOptions} searchable />);
    fireEvent.click(screen.getByRole("combobox"));

    const searchInput = screen.getByPlaceholderText("Search...");
    fireEvent.change(searchInput, { target: { value: "Nig" } });

    expect(screen.getByText("Nigeria")).toBeInTheDocument();
    expect(screen.queryByText("Ghana")).not.toBeInTheDocument();
  });

  it("clears selection when clear button is clicked", () => {
    const handleChange = vi.fn();
    render(<Select options={mockOptions} value="gh" clearable onChange={handleChange} />);

    const clearBtn = screen.getByRole("button", { name: /clear selection/i });
    fireEvent.click(clearBtn);

    expect(handleChange).toHaveBeenCalledWith("");
  });
});
