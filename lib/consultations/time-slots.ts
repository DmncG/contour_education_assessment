const BUSINESS_HOURS_START_MINUTES = 9 * 60 + 30; // 9:30 AM
const BUSINESS_HOURS_END_MINUTES = 21 * 60 + 30; // 9:30 PM
const TIME_SLOT_INTERVAL_MINUTES = 30;

export type TimeSlot = { value: string; label: string };

function formatTimeSlot(totalMinutes: number): TimeSlot {
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const value = `${String(hours24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const label = `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;

  return { value, label };
}

/** 30-minute time slots covering business hours, 9:30 AM to 9:30 PM. */
export const CONSULTATION_TIME_SLOTS: TimeSlot[] = Array.from(
  {
    length:
      (BUSINESS_HOURS_END_MINUTES - BUSINESS_HOURS_START_MINUTES) /
        TIME_SLOT_INTERVAL_MINUTES +
      1,
  },
  (_, i) =>
    formatTimeSlot(BUSINESS_HOURS_START_MINUTES + i * TIME_SLOT_INTERVAL_MINUTES),
);
