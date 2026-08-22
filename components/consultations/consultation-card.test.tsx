import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConsultationCard } from "@/components/consultations/consultation-card";
import type { ConsultationStatus } from "@/lib/consultations/status";

function makeConsultation(status: ConsultationStatus = "scheduled") {
  return {
    id: "consultation-123",
    consult_reason: "SAT prep planning",
    date_time: "2026-09-05T14:53:00.000Z",
    status,
  };
}

async function toggleStatusToCompleted(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Update" }));

  const dialog = await screen.findByRole("dialog");
  const [statusCombobox] = within(dialog).getAllByRole("combobox");
  await user.click(statusCombobox);
  await user.click(await screen.findByRole("option", { name: "Completed" }));

  const reviewButton = within(dialog).getByRole("button", { name: "Review" });
  expect(reviewButton).toBeEnabled();
  await user.click(reviewButton);

  expect(within(dialog).getByText("Scheduled → Completed")).toBeInTheDocument();
  await user.click(within(dialog).getByRole("button", { name: "Save" }));
}

describe("ConsultationCard toggle", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("calls the API with the toggled status and reflects the new state", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ consultation: { id: "consultation-123", status: "completed" } }),
    });

    const user = userEvent.setup();
    render(<ConsultationCard consultation={makeConsultation("scheduled")} />);

    expect(screen.getByText("scheduled")).toBeInTheDocument();

    await toggleStatusToCompleted(user);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/consultations/consultation-123/status");
    expect(options.method).toBe("PATCH");
    expect(JSON.parse(options.body)).toEqual({ status: "completed" });

    await waitFor(() => {
      expect(screen.getByText("completed")).toBeInTheDocument();
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("reverts to the previous status and shows an error when the request fails", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    const user = userEvent.setup();
    render(<ConsultationCard consultation={makeConsultation("scheduled")} />);

    await toggleStatusToCompleted(user);

    await waitFor(() => {
      expect(
        screen.getByText("Couldn't update the consultation. Please try again."),
      ).toBeInTheDocument();
    });

    // Optimistic change is rolled back and the dialog stays open on failure.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("scheduled")).toBeInTheDocument();
    expect(screen.queryByText("completed")).not.toBeInTheDocument();
  });
});
