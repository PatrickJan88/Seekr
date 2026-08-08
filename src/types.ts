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
  reminder?: string;
  customReminderDate?: string;
  customReminderEndDate?: string;
  reminderSent?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  timestamp: number;
  unread: boolean;
}
