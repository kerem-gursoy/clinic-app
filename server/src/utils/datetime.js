export function formatAppointmentTime(date) {
  if (!date) {
    return null;
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function calculateDuration(start, end) {
  if (!start || !end) {
    return null;
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }
  const diffMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
  return Math.max(0, diffMinutes);
}

