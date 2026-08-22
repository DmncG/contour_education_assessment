import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

describe("ConsultationCard toggle", () => {
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

describe("ConsultationCard reschedule", () => {
  it("shows the Booking Schedule fields for a scheduled consultation, and hides them once the status is changed to Completed", async () => {
    const user = userEvent.setup();
    render(<ConsultationCard consultation={makeConsultation("scheduled")} />);

    await user.click(screen.getByRole("button", { name: "Update" }));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByText("Booking Schedule")).toBeInTheDocument();
    expect(within(dialog).getAllByRole("combobox")).toHaveLength(2);

    const [statusCombobox] = within(dialog).getAllByRole("combobox");
    await user.click(statusCombobox);
    await user.click(await screen.findByRole("option", { name: "Completed" }));

    expect(within(dialog).queryByText("Booking Schedule")).not.toBeInTheDocument();
    expect(within(dialog).getAllByRole("combobox")).toHaveLength(1);
  });

  it("reschedules the date and time and calls the API with the combined dateTime, leaving status unchanged", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ consultation: { id: "consultation-123", status: "scheduled" } }),
    });

    const user = userEvent.setup();
    render(<ConsultationCard consultation={makeConsultation("scheduled")} />);

    await user.click(screen.getByRole("button", { name: "Update" }));
    const dialog = await screen.findByRole("dialog");

    fireEvent.change(within(dialog).getByLabelText("Date"), {
      target: { value: "2026-12-25" },
    });

    const [, timeCombobox] = within(dialog).getAllByRole("combobox");
    await user.click(timeCombobox);
    await user.click(await screen.findByRole("option", { name: "10:00 AM" }));

    const reviewButton = within(dialog).getByRole("button", { name: "Review" });
    expect(reviewButton).toBeEnabled();
    await user.click(reviewButton);

    expect(within(dialog).getByText("Date and Time")).toBeInTheDocument();
    expect(within(dialog).queryByText("Status")).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/consultations/consultation-123/status");
    expect(JSON.parse(options.body)).toEqual({
      status: "scheduled",
      dateTime: "2026-12-25T10:00",
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});

describe("ConsultationCard cancel", () => {
  it("hides the Update and Cancel controls once the consultation is completed", () => {
    render(<ConsultationCard consultation={makeConsultation("completed")} />);

    expect(screen.queryByRole("button", { name: "Update" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("cancels the consultation via the confirmation dialog and calls the API with status cancelled", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ consultation: { id: "consultation-123", status: "cancelled" } }),
    });

    const user = userEvent.setup();
    render(<ConsultationCard consultation={makeConsultation("scheduled")} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText("Are you sure you want to cancel this consultation?"),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("SAT prep planning")).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", { name: "Yes, Cancel this Consultation" }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/consultations/consultation-123/status");
    expect(JSON.parse(options.body)).toEqual({ status: "cancelled" });

    await waitFor(() => {
      expect(screen.getByText("cancelled")).toBeInTheDocument();
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Current behavior: Update/Cancel only hide once a consultation is
    // "completed" — a cancelled row still shows them.
    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });
});
