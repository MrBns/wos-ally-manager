import { api } from './client.js';

export interface Event {
  id: string;
  name: string;
  description?: string | null;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export async function listEvents() {
  return api.get<Event[]>('/api/events');
}

export async function createEvent(data: {
  name: string; description?: string; dayOfWeek: number;
  startTime: string; durationMinutes?: number; isActive?: boolean;
}) {
  return api.post<Event>('/api/events', data);
}

export async function updateEvent(id: string, data: Partial<{
  name: string; description?: string; dayOfWeek: number;
  startTime: string; durationMinutes: number; isActive: boolean;
}>) {
  return api.patch<Event>(`/api/events/${id}`, data);
}

export async function deleteEvent(id: string) {
  return api.delete(`/api/events/${id}`);
}
