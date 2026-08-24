export interface Attachment {
  name: string;
  url: string;
}

export type JobStatus = 'Wishlist' | 'Applied' | 'Screening' | 'Technical' | 'Final' | 'Offer' | 'Rejected' | 'Ghosted';

export type WorkType = 'On-site' | 'Hybrid' | 'Remote';

export const getWorkTypeBadgeStyle = (workType?: WorkType | string) => {
  switch (workType) {
    case 'On-site':
      return 'bg-amber-50 text-amber-700 border-amber-200/80';
    case 'Hybrid':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
    case 'Remote':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

export interface JobApplication {
  id: string;
  userId: string;
  company: string;
  position: string;
  location?: string;
  workType?: WorkType;
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
  trackingSystem?: 'industry' | 'academic';
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

export interface CVEvaluation {
  id: string;
  userId: string;
  role: string;
  jobDescription: string;
  result: any; // MatchResult
  createdAt: number;
}
