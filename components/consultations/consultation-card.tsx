"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STATUS_LABEL,
  STATUS_VARIANT,
  TOGGLEABLE_STATUSES,
  type ConsultationStatus,
  type ToggleableStatus,
} from "@/lib/consultations/status";

type Consultation = {
  id: string;
  consult_reason: string | null;
  date_time: string;
  status: ConsultationStatus;
};

export function ConsultationCard({
  consultation,
}: {
  consultation: Consultation;
}) {
  const [status, setStatus] = useState(consultation.status);
  const [pendingStatus, setPendingStatus] = useState<ToggleableStatus>(
    status === "cancelled" ? "scheduled" : status,
  );
  const [updateOpen, setUpdateOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStatusChange(
    nextStatus: ConsultationStatus,
  ): Promise<boolean> {
    if (nextStatus === status) return true;

    const previousStatus = status;
    setIsUpdating(true);
    setError(null);
    setStatus(nextStatus);

    try {
      const response = await fetch(
        `/api/consultations/${consultation.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }
      return true;
    } catch {
      setStatus(previousStatus);
      setError("Couldn't update status. Please try again.");
      return false;
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleCancel() {
    const succeeded = await handleStatusChange("cancelled");
    if (succeeded) {
      setCancelOpen(false);
    }
  }

  function openUpdateDialog() {
    setPendingStatus(status === "cancelled" ? "scheduled" : status);
    setError(null);
    setUpdateOpen(true);
  }

  async function handleSave() {
    const succeeded = await handleStatusChange(pendingStatus);
    if (succeeded) {
      setUpdateOpen(false);
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
              <Button
                variant="link"
                className="h-auto p-0 text-xs"
                onClick={openUpdateDialog}
              >
                Update
              </Button>
          { status !== "completed" && (
              <Button
                variant="link"
                className="h-auto p-0 text-xs text-muted-foreground hover:text-destructive"
                onClick={() => setCancelOpen(true)}
              >
                Cancel
              </Button>
)}
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {new Date(consultation.date_time).toLocaleString(undefined, {
            dateStyle: "long",
            timeStyle: "short",
          })}
        </p>
      </CardContent>

      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Consultation Status</DialogTitle>
          </DialogHeader>
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
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isUpdating}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              disabled={isUpdating || pendingStatus === status}
              onClick={handleSave}
            >
              Save
            </Button>
          </DialogFooter>
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
            <p className="text-muted-foreground">
              {new Date(consultation.date_time).toLocaleString(undefined, {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </p>
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
