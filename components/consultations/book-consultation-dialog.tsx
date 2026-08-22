"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { CONSULTATION_TIME_SLOTS } from "@/lib/consultations/time-slots";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  reason: "",
  date: "",
  time: "",
};

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function BookConsultationDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isStepOneValid =
    form.firstName.trim() !== "" &&
    form.lastName.trim() !== "" &&
    form.reason.trim() !== "" &&
    form.date !== "" &&
    form.time !== "";

  const dateTime = form.date && form.time ? `${form.date}T${form.time}` : "";

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setStep(1);
      setForm(EMPTY_FORM);
      setError(null);
    }
  }

  function updateField(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleBook() {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          reason: form.reason,
          dateTime,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to book consultation");
      }

      toast.success("Consultation booked", {
        description: new Date(dateTime).toLocaleString(undefined, {
          dateStyle: "long",
          timeStyle: "short",
        }),
      });
      handleOpenChange(false);
      router.refresh();
    } catch {
      setError("Couldn't book your consultation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Book a Consultation</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book a Consultation</DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="reason">Reason for Consultation</Label>
                <Input
                  id="reason"
                  value={form.reason}
                  onChange={(e) => updateField("reason", e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    min={getTodayDateString()}
                    value={form.date}
                    onChange={(e) => updateField("date", e.target.value)}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor="time">Time</Label>
                  <Select
                    value={form.time}
                    onValueChange={(value) => updateField("time", value)}
                  >
                    <SelectTrigger id="time" className="w-full">
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
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button disabled={!isStepOneValid} onClick={() => setStep(2)}>
                Next
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3 rounded-md border p-3 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">
                  {form.firstName} {form.lastName}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Reason</p>
                <p className="font-medium">{form.reason}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date and Time</p>
                <p className="font-medium">
                  {new Date(dateTime).toLocaleString(undefined, {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter className="sm:justify-between">
              <Button
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setStep(1)}
              >
                Previous
              </Button>
              <div className="flex gap-2">
                <DialogClose asChild>
                  <Button variant="outline" disabled={isSubmitting}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button disabled={isSubmitting} onClick={handleBook}>
                  Book
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
