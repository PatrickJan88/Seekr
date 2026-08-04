import { getAccessToken } from './firebase';
import { JobApplication } from '../types';

export const createCalendarEvent = async (app: JobApplication): Promise<string | null> => {
  const token = await getAccessToken();
  if (!token) return null;

  if (!app.nextInterviewDate) return null;

  const event = {
    summary: `Interview with ${app.company} - ${app.position}`,
    description: `Contact: ${app.contactName} (${app.contactEmail})\nNotes: ${app.notes}`,
    start: {
      dateTime: new Date(app.nextInterviewDate).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: new Date(new Date(app.nextInterviewDate).getTime() + 60 * 60 * 1000).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };

  try {
    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('Calendar API Error:', err);
      return null;
    }

    const data = await res.json();
    return data.id;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return null;
  }
};
