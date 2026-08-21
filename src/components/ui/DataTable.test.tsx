import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DataTable, type Column } from "./DataTable";

interface Invoice {
  id: string;
  customer: string;
  amount: number;
  [key: string]: unknown;
}

const columns: Column<Invoice>[] = [
  { key: "id", header: "Invoice ID", sortable: true },
  { key: "customer", header: "Customer", sortable: true },
  { key: "amount", header: "Amount", render: (item) => `GH₵ ${item.amount}` },
];

const mockData: Invoice[] = [
  { id: "INV-001", customer: "Alice Johnson", amount: 450 },
  { id: "INV-002", customer: "Bob Smith", amount: 1200 },
];

describe("DataTable component", () => {
  it("renders table with headers and data rows", () => {
    render(<DataTable columns={columns} data={mockData} keyExtractor={(item) => item.id} />);

    expect(screen.getByText("Invoice ID")).toBeInTheDocument();
    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    expect(screen.getByText("GH₵ 1200")).toBeInTheDocument();
  });

  it("renders empty state message when data is empty", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        keyExtractor={(item) => item.id}
        emptyMessage="No invoices found"
      />
    );

    expect(screen.getByText("No invoices found")).toBeInTheDocument();
  });

  it("sorts rows when sortable header is clicked", () => {
    render(<DataTable columns={columns} data={mockData} keyExtractor={(item) => item.id} />);

    const customerHeader = screen.getByText("Customer");
    fireEvent.click(customerHeader); // asc: Alice first
    let rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Alice Johnson");

    fireEvent.click(customerHeader); // desc: Bob first
    rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Bob Smith");
  });

  it("handles selectable rows and selection change callbacks", () => {
    const handleSelectionChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={mockData}
        keyExtractor={(item) => item.id}
        selectable
        onSelectionChange={handleSelectionChange}
      />
    );

    const selectAllCheckbox = screen.getByRole("checkbox", { name: /select all rows/i });
    const row1Checkbox = screen.getByRole("checkbox", { name: /select row inv-001/i });
    const row2Checkbox = screen.getByRole("checkbox", { name: /select row inv-002/i });

    expect(selectAllCheckbox).not.toBeChecked();
    expect(row1Checkbox).not.toBeChecked();
    expect(row2Checkbox).not.toBeChecked();

    // Select single row
    fireEvent.click(row1Checkbox);
    expect(handleSelectionChange).toHaveBeenCalledWith(["INV-001"]);

    // Select all rows via header checkbox
    fireEvent.click(selectAllCheckbox);
    expect(handleSelectionChange).toHaveBeenCalledWith(["INV-001", "INV-002"]);
  });
});
