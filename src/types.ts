export interface Attachment {
  name: string;
  url: string;
}

export type JobStatus = 'Applied' | 'Screening' | 'Technical' | 'Final' | 'Offer' | 'Rejected' | 'Ghosted';

export interface JobApplication {
  id: string;
  userId: string;
  company: string;
  position: string;
  status: JobStatus;
  appliedDate: string; // ISO date string
  nextInterviewDate?: string; // ISO date string
  contactName?: string;
  contactEmail?: string;
  notes?: string;
  salaryRange?: string;
  resumeUrl?: string; // base64 or link
  coverLetterUrl?: string; // base64 or link
  attachments?: Attachment[];
  calendarEventId?: string; // Sync with Google Calendar
  createdAt: number;
  updatedAt: number;
}
