import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from "./Card";

describe("Card component", () => {
  it("renders card with all compound subcomponents", () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Invoice Summary</CardTitle>
          <CardDescription>Details for payment reference</CardDescription>
        </CardHeader>
        <CardBody>
          <p>GH₵ 2,500.00</p>
        </CardBody>
        <CardFooter>
          <button>Pay Now</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByTestId("card")).toBeInTheDocument();
    expect(screen.getByText("Invoice Summary")).toBeInTheDocument();
    expect(screen.getByText("Details for payment reference")).toBeInTheDocument();
    expect(screen.getByText("GH₵ 2,500.00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pay Now" })).toBeInTheDocument();
  });

  it("applies interactive variant class", () => {
    render(<Card variant="interactive" data-testid="interactive-card" />);
    expect(screen.getByTestId("interactive-card").className).toContain("hover:-translate-y-0.5");
  });
});
