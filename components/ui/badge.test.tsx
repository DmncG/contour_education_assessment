import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>Scheduled</Badge>);
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
  });
});
