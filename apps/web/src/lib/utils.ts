type ClassValue = string | boolean | null | undefined | Record<string, boolean>;

export function cn(...classes: ClassValue[]): string {
  return classes
    .flatMap(cls => {
      if (!cls) return [];
      if (typeof cls === 'string') return [cls];
      if (typeof cls === 'object') {
        return Object.entries(cls)
          .filter(([, v]) => v)
          .map(([k]) => k);
      }
      return [];
    })
    .join(' ');
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm} UTC`;
}

export function timeUntil(dayOfWeek: number, startTime: string): string {
  const now = new Date();
  const [hours, minutes] = startTime.split(':').map(Number);
  const currentDay = now.getUTCDay();
  let daysUntil = dayOfWeek - currentDay;
  if (daysUntil < 0) daysUntil += 7;

  const eventDate = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(),
    now.getUTCDate() + daysUntil, hours, minutes
  ));

  const diff = eventDate.getTime() - now.getTime();
  if (diff < 0) return 'Happening now or past';

  const totalMinutes = Math.floor(diff / 60000);
  const diffDays = Math.floor(totalMinutes / 1440);
  const diffHours = Math.floor((totalMinutes % 1440) / 60);
  const diffMins = totalMinutes % 60;

  if (diffDays > 0) return `${diffDays}d ${diffHours}h`;
  if (diffHours > 0) return `${diffHours}h ${diffMins}m`;
  return `${diffMins}m`;
}
