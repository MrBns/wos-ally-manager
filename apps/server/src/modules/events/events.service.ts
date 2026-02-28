import { eq } from 'drizzle-orm';
import { getDb } from '../../shared/db.js';
import { events, type Event, type NewEvent } from '../../shared/schema.js';
import { generateId } from '../../shared/id.js';
import { notFound } from '../../shared/errors.js';

export class EventsService {
  private get db() { return getDb(); }

  async listEvents(): Promise<Event[]> {
    return this.db.select().from(events).orderBy(events.dayOfWeek, events.startTime);
  }

  async getEvent(id: string): Promise<Event> {
    const [event] = await this.db.select().from(events).where(eq(events.id, id));
    if (!event) throw notFound('Event not found');
    return event;
  }

  async createEvent(data: Omit<NewEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    const id = generateId();
    const now = new Date().toISOString();
    const [event] = await this.db.insert(events).values({ ...data, id, createdAt: now, updatedAt: now }).returning();
    return event;
  }

  async updateEvent(id: string, data: Partial<Omit<NewEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>): Promise<Event> {
    const now = new Date().toISOString();
    const [updated] = await this.db.update(events).set({ ...data, updatedAt: now }).where(eq(events.id, id)).returning();
    if (!updated) throw notFound('Event not found');
    return updated;
  }

  async deleteEvent(id: string): Promise<void> {
    await this.db.delete(events).where(eq(events.id, id));
  }
}
