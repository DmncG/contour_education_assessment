export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatTimeString(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function getTodayDateString(): string {
  return formatDateString(new Date());
}

export function toDateTimeParts(iso: string): { date: string; time: string } {
  const parsed = new Date(iso);
  return { date: formatDateString(parsed), time: formatTimeString(parsed) };
}
