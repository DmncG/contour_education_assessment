export const CONSULTATION_STATUSES = [
  "scheduled",
  "completed",
  "cancelled",
] as const;

export type ConsultationStatus = (typeof CONSULTATION_STATUSES)[number];

/** Statuses a user can toggle between via the "Update" control. */
export const TOGGLEABLE_STATUSES = ["scheduled", "completed"] as const;

export type ToggleableStatus = (typeof TOGGLEABLE_STATUSES)[number];

export const STATUS_VARIANT: Record<
  ConsultationStatus,
  "default" | "success" | "destructive"
> = {
  scheduled: "default",
  completed: "success",
  cancelled: "destructive",
};

export const STATUS_LABEL: Record<ConsultationStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function isToggleableStatus(
  value: unknown,
): value is ToggleableStatus {
  return TOGGLEABLE_STATUSES.includes(value as ToggleableStatus);
}

export function isConsultationStatus(
  value: unknown,
): value is ConsultationStatus {
  return CONSULTATION_STATUSES.includes(value as ConsultationStatus);
}
