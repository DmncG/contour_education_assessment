"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTodayDateString, toDateTimeParts } from "@/lib/consultations/datetime";
import {
  STATUS_LABEL,
  STATUS_VARIANT,
  TOGGLEABLE_STATUSES,
  type ConsultationStatus,
  type ToggleableStatus,
} from "@/lib/consultations/status";
import { CONSULTATION_TIME_SLOTS } from "@/lib/consultations/time-slots";

type Consultation = {
  id: string;
  consult_reason: string | null;
  date_time: string;
  status: ConsultationStatus;
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export function ConsultationCard({
  consultation,
}: {
  consultation: Consultation;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(consultation.status);
  const [dateTimeValue, setDateTimeValue] = useState(consultation.date_time);

  const [pendingStatus, setPendingStatus] = useState<ToggleableStatus>(
    status === "cancelled" ? "scheduled" : status,
  );
  const [pendingDate, setPendingDate] = useState("");
  const [pendingTime, setPendingTime] = useState("");
  const [updateStep, setUpdateStep] = useState<1 | 2>(1);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingDateTime =
    pendingStatus === "scheduled" && pendingDate && pendingTime
      ? `${pendingDate}T${pendingTime}`
      : "";

  const hasStatusChange = pendingStatus !== status;
  const hasScheduleChange =
    pendingStatus === "scheduled" &&
    pendingDateTime !== "" &&
    new Date(pendingDateTime).getTime() !== new Date(dateTimeValue).getTime();
  const hasChanges = hasStatusChange || hasScheduleChange;

  async function submitConsultationUpdate(payload: {
    status: ConsultationStatus;
    dateTime?: string;
  }): Promise<boolean> {
    const previousStatus = status;
    const previousDateTime = dateTimeValue;

    setIsUpdating(true);
    setError(null);
    setStatus(payload.status);
    if (payload.dateTime) {
      setDateTimeValue(new Date(payload.dateTime).toISOString());
    }

    try {
      const response = await fetch(
        `/api/consultations/${consultation.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update consultation");
      }
      router.refresh();
      return true;
    } catch {
      setStatus(previousStatus);
      setDateTimeValue(previousDateTime);
      setError("Couldn't update the consultation. Please try again.");
      return false;
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleCancel() {
    const succeeded = await submitConsultationUpdate({ status: "cancelled" });
    if (succeeded) {
      setCancelOpen(false);
    }
  }

  function openUpdateDialog() {
    const initialStatus = status === "cancelled" ? "scheduled" : status;
    const parts = toDateTimeParts(dateTimeValue);
    setPendingStatus(initialStatus);
    setPendingDate(parts.date);
    setPendingTime(parts.time);
    setUpdateStep(1);
    setError(null);
    setUpdateOpen(true);
  }

  function handleUpdateOpenChange(nextOpen: boolean) {
    setUpdateOpen(nextOpen);
    if (!nextOpen) {
      setUpdateStep(1);
      setError(null);
    }
  }

  async function handleSaveUpdate() {
    const succeeded = await submitConsultationUpdate({
      status: pendingStatus,
      ...(hasScheduleChange ? { dateTime: pendingDateTime } : {}),
    });
    if (succeeded) {
      handleUpdateOpenChange(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="text-base">
          {consultation.consult_reason || "Consultation"}
        </CardTitle>
        <div className="flex flex-col items-end gap-1">
          <Badge className="capitalize" variant={STATUS_VARIANT[status]}>
            {status}
          </Badge>
            <div className="flex items-center gap-2 pt-1">
            { status !== "completed" && (
              <>
              <Button
                variant="link"
                className="h-auto p-0 text-xs"
                onClick={openUpdateDialog}
              >
                Update
              </Button>
              <Button
                variant="link"
                className="h-auto p-0 text-xs text-muted-foreground hover:text-destructive"
                onClick={() => setCancelOpen(true)}
              >
                Cancel
              </Button>
              </>
)}
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {formatDateTime(dateTimeValue)}
        </p>
      </CardContent>

      <Dialog open={updateOpen} onOpenChange={handleUpdateOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Consultation</DialogTitle>
          </DialogHeader>

          {updateStep === 1 ? (
            <>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">Consultation Status</p>
                  <Select
                    value={pendingStatus}
                    disabled={isUpdating}
                    onValueChange={(value) =>
                      setPendingStatus(value as ToggleableStatus)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      {TOGGLEABLE_STATUSES.map((option) => (
                        <SelectItem key={option} value={option}>
                          {STATUS_LABEL[option]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {pendingStatus === "scheduled" && (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium">Booking Schedule</p>
                    <div className="flex gap-4">
                      <div className="flex flex-1 flex-col gap-2">
                        <Label htmlFor="reschedule-date">Date</Label>
                        <Input
                          id="reschedule-date"
                          type="date"
                          min={getTodayDateString()}
                          disabled={isUpdating}
                          value={pendingDate}
                          onChange={(e) => setPendingDate(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-2">
                        <Label htmlFor="reschedule-time">Time</Label>
                        <Select
                          value={pendingTime}
                          disabled={isUpdating}
                          onValueChange={setPendingTime}
                        >
                          <SelectTrigger id="reschedule-time" className="w-full">
                            <SelectValue placeholder="Select a time" />
                          </SelectTrigger>
                          <SelectContent>
                            {CONSULTATION_TIME_SLOTS.map((slot) => (
                              <SelectItem key={slot.value} value={slot.value}>
                                {slot.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" disabled={isUpdating}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  disabled={isUpdating || !hasChanges}
                  onClick={() => setUpdateStep(2)}
                >
                  Review
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-3 rounded-md border p-3 text-sm">
                {hasStatusChange && (
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium">
                      {STATUS_LABEL[status]} → {STATUS_LABEL[pendingStatus]}
                    </p>
                  </div>
                )}
                {hasScheduleChange && (
                  <div>
                    <p className="text-muted-foreground">Date and Time</p>
                    <p className="font-medium">
                      {formatDateTime(dateTimeValue)} →{" "}
                      {formatDateTime(pendingDateTime)}
                    </p>
                  </div>
                )}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" disabled={isUpdating}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button disabled={isUpdating} onClick={handleSaveUpdate}>
                  Save
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Are you sure you want to cancel this consultation?
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-md border p-3 text-sm">
            <p className="font-medium">
              {consultation.consult_reason || "Consultation"}
            </p>
            <p className="text-muted-foreground">{formatDateTime(dateTimeValue)}</p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isUpdating}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={isUpdating}
              onClick={handleCancel}
            >
              Yes, Cancel this Consultation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
