import Papa from 'papaparse';
import { JobApplication, JobStatus } from '../types';

export const exportCsv = (applications: JobApplication[]) => {
  const csv = Papa.unparse(applications.map(app => ({
    Company: app.company,
    Position: app.position,
    Location: app.location || '',
    Work_Type: app.workType || '',
    Status: app.status,
    Applied_Date: app.appliedDate,
    Next_Interview: app.nextInterviewDate || '',
    Contact_Name: app.contactName || '',
    Contact_Email: app.contactEmail || '',
    Links: (app.links && app.links.length > 0) 
      ? app.links.map(l => `${l.title ? l.title + ': ' : ''}${l.url}`).join(' | ') 
      : (app.linkUrl || ''),
    Notes: app.notes || ''
  })));

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'job_applications.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
