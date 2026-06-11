import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatPanel } from "./chat-panel";

describe("ChatPanel", () => {
  it("renders the empty state prompt", () => {
    render(<ChatPanel />);
    expect(
      screen.getByText(/Send a message to test the AI endpoint/i),
    ).toBeInTheDocument();
  });
});
