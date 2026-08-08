import React, { useState, useEffect } from 'react';
import { JobApplication, JobStatus } from '../types';
import { Wand2, Loader2, X } from 'lucide-react';
import { FileUpload, UploadedFile } from './FileUpload';
import { auth } from '../lib/firebase';
import { toast } from 'sonner';

const STATUSES: JobStatus[] = ['Applied', 'Screening', 'Technical', 'Final', 'Offer', 'Rejected', 'Ghosted'];

interface JobFormProps {
  initialData?: JobApplication;
  onSave: (data: Partial<JobApplication>) => Promise<void>;
  onCancel: () => void;
  onDelete?: (id: string) => Promise<void>;
}

export function JobForm({ initialData, onSave, onCancel, onDelete }: JobFormProps) {
  const [formData, setFormData] = useState<Partial<JobApplication>>(
    initialData || { status: 'Applied', company: '', position: '', appliedDate: new Date().toISOString().split('T')[0] }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!pasteText.trim()) return;
    setIsExtracting(true);
    setExtractError(null);
    try {
      const res = await fetch('/api/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasteText })
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }
      const data = await res.json();
      const extracted = data.application;
      
      setFormData(prev => ({
        ...prev,
        company: extracted.company || prev.company,
        position: extracted.position || prev.position,
        notes: extracted.notes ? (prev.notes ? prev.notes + '\n\n' + extracted.notes : extracted.notes) : prev.notes
      }));
      
      setPasteText(''); // Clear after success
    } catch (err: any) {
      console.error('Extract error:', err);
      setExtractError(err.message || 'Failed to extract data');
    } finally {
      setIsExtracting(false);
    }
  };

  // syncCalendar removed

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAttachmentsChange = (files: UploadedFile[]) => {
    const attachments = files.map(f => ({
      name: f.fileName,
      url: f.base64 || f.url || ''
    })).filter(f => f.url !== '');

    setFormData(prev => ({ ...prev, attachments }));
  };

  const initialFiles = React.useMemo(() => {
    const files: UploadedFile[] = [];
    if (initialData?.attachments && initialData.attachments.length > 0) {
      initialData.attachments.forEach((att, idx) => {
        files.push({
          id: `att-${idx}`,
          fileName: att.name,
          url: att.url,
          progress: 100,
          uploading: false,
        });
      });
    } else {
      if (initialData?.resumeUrl) {
        files.push({
          id: 'old-resume',
          fileName: 'Attached_Resume',
          url: initialData.resumeUrl,
          progress: 100,
          uploading: false,
        });
      }
      if (initialData?.coverLetterUrl) {
        files.push({
          id: 'old-cover',
          fileName: 'Attached_CoverLetter',
          url: initialData.coverLetterUrl,
          progress: 100,
          uploading: false,
        });
      }
    }
    return files;
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting form data", formData);
    
    if (!formData.company?.trim()) {
      setSaveError("Company is required.");
      return;
    }
    if (!formData.position?.trim()) {
      setSaveError("Position is required.");
      return;
    }
    
    setIsSaving(true);
    setSaveError(null);
    try {
      if (formData.reminder && formData.reminder !== 'none' && formData.nextInterviewDate) {
        if (auth.currentUser) {
          const isCustom = formData.reminder === 'custom';
          let reminderMsg = `Reminder set for ${formData.company} interview ${formData.reminder} before.`;
          if (isCustom && formData.customReminderDate && formData.customReminderEndDate) {
            reminderMsg = `Reminder set for ${formData.company} interview from ${formData.customReminderDate} to ${formData.customReminderEndDate}.`;
          } else if (isCustom && formData.customReminderDate) {
            reminderMsg = `Reminder set for ${formData.company} interview on ${formData.customReminderDate}.`;
          } else if (isCustom) {
            reminderMsg = `Reminder set for ${formData.company} interview.`;
          }
          toast.success(reminderMsg);
        }
      }
      await onSave({ ...formData, reminderSent: false });
    } catch (err: any) {
      console.error("Save Error Caught:", err);
      setSaveError(err.message || 'Failed to save application');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 shrink-0">
          <h2 className="text-xl font-bold text-slate-800 m-0">
            {initialData ? 'Edit Application' : 'New Application'}
          </h2>
          <button
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-100 hover:text-slate-900 h-9 w-9 p-0 text-slate-500"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-grow">
          {saveError && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{saveError}</div>}
          
          {!initialData && (
          <div className="mb-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
            <label className="block text-xs font-bold text-blue-800 mb-2">Smart Paste</label>
            <p className="text-xs text-blue-600 mb-3">Paste a job description here to automatically fill out the company, position, and notes.</p>
            <div className="flex flex-col gap-2">
              <textarea 
                value={pasteText} 
                onChange={e => setPasteText(e.target.value)} 
                rows={3} 
                placeholder="Paste job description..."
                className="w-full px-3 py-2 border border-blue-200 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm resize-y"
              />
              {extractError && <div className="text-red-500 text-xs font-medium">{extractError}</div>}
              <button 
                type="button" 
                onClick={handleExtract}
                disabled={isExtracting || !pasteText.trim()}
                className={`self-start gap-2 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 h-9 px-4 py-2 ${(isExtracting || !pasteText.trim()) ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isExtracting ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                {isExtracting ? 'Extracting...' : 'Auto-fill fields'}
              </button>
            </div>
          </div>
        )}
        <form id="job-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Company *</label>
              <input type="text" name="company" value={formData.company || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Position *</label>
              <input type="text" name="position" value={formData.position || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Status</label>
              <select name="status" value={formData.status || 'Applied'} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Applied Date</label>
              <input type="date" name="appliedDate" value={formData.appliedDate?.split('T')[0] || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Next Interview</label>
              <input type="datetime-local" name="nextInterviewDate" value={formData.nextInterviewDate?.slice(0, 16) || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" />
            </div>
            <div className="flex flex-col justify-end relative">
              <label className="block text-xs font-bold text-slate-400 mb-1">Reminder</label>
              <select name="reminder" value={formData.nextInterviewDate ? (formData.reminder || 'none') : 'none'} onChange={handleChange} disabled={!formData.nextInterviewDate} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                <option value="none">None</option>
                <option value="15 mins">15 mins before</option>
                <option value="1 hour">1 hour before</option>
                <option value="2 hours">2 hours before</option>
                <option value="1 day">1 day before</option>
                <option value="2 days">2 days before</option>
                <option value="custom">Custom</option>
              </select>
              {formData.reminder === 'custom' && (
                <div className="mt-2 flex items-center gap-2">
                  <input type="date" name="customReminderDate" value={formData.customReminderDate?.split('T')[0] || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" placeholder="Start Date" />
                  <span className="text-slate-400 text-sm">to</span>
                  <input type="date" name="customReminderEndDate" value={formData.customReminderEndDate?.split('T')[0] || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" placeholder="End Date" />
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Contact Name</label>
              <input type="text" name="contactName" value={formData.contactName || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Contact Email</label>
              <input type="email" name="contactEmail" value={formData.contactEmail || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Notes</label>
            <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"></textarea>
          </div>

          <div className="grid grid-cols-1 gap-4 mt-2">
            <FileUpload 
              label="Attachments" 
              accept=".pdf,.doc,.docx,.xls,.xlsx,image/*,.csv"
              description="Accepted: .pdf,.doc,.docx,excel,image,CSV. Max: 5MB." 
              maxSizeMB={5}
              maxFiles={5}
              initialFiles={initialFiles}
              onFilesChange={handleAttachmentsChange} 
            />
          </div>

          </form>
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-between items-center">
          {initialData && onDelete ? (
              <button type="button" onClick={(e) => { e.preventDefault(); onDelete(initialData.id); }} className="text-red-500 hover:text-red-600 font-bold text-xs">
                Delete
              </button>
          ) : <div></div>}
          
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900 h-9 px-4 py-2">
              Cancel
            </button>
            <button type="submit" form="job-form" disabled={isSaving} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-slate-50 shadow hover:bg-slate-900/90 h-9 px-4 py-2">
              {isSaving ? 'Saving...' : 'Save Application'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
